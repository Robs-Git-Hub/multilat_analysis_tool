
# migrate_to_supabase.py

import os
import logging
from dotenv import load_dotenv
from pathlib import Path
import sqlite3
from supabase import create_client, Client
from tqdm import tqdm

# --- Configuration & Setup ---

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables from .env file in the current directory
load_dotenv()

# Get Supabase credentials from environment
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Get local SQLite DB path from environment or use default
# Assumes the script is run from the `python-svc/migration` directory
DEFAULT_SQLITE_PATH = Path(__file__).parent.parent.parent / "data" / "oewg_analysis_dash.db"
SQLITE_DB_PATH = Path(os.getenv("SQLITE_DB_PATH", DEFAULT_SQLITE_PATH)).resolve()

# Batch size for inserting data
BATCH_SIZE = 500

# --- Validation ---

def validate_config():
    """Validate that all necessary configurations are set."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        logger.error("Supabase URL and Key must be set in the .env file.")
        logger.error("Please copy .env.example to .env and fill in your credentials.")
        return False
    if not SQLITE_DB_PATH.exists():
        logger.error(f"SQLite database not found at: {SQLITE_DB_PATH}")
        logger.error("Please check the SQLITE_DB_PATH in your .env file or the script's default path.")
        return False
    logger.info("Configuration validated successfully.")
    return True

# --- Database Operations ---

def get_sqlite_connection():
    """Establish a connection to the SQLite database."""
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row  # Access columns by name
        logger.info(f"Successfully connected to SQLite database: {SQLITE_DB_PATH}")
        return conn
    except sqlite3.Error as e:
        logger.error(f"Error connecting to SQLite database: {e}")
        return None

def get_supabase_client() -> Client:
    """Initialize and return the Supabase client."""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Successfully connected to Supabase.")
        return supabase
    except Exception as e:
        logger.error(f"Error initializing Supabase client: {e}")
        return None

# --- Data Migration Functions ---

def migrate_countries(sqlite_conn, supabase_client):
    """Migrate data from the 'country' table in SQLite to 'countries' in Supabase."""
    logger.info("Starting migration for 'countries' table...")
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT id, country_name, country_code, region, sub_region FROM country")
    
    countries_to_insert = []
    for row in cursor.fetchall():
        countries_to_insert.append({
            # 'id' is intentionally omitted to let Supabase auto-generate it
            "country_name": row["country_name"],
            "country_code": row["country_code"],
            "region": row["region"],
            "sub_region": row["sub_region"]
        })

    if not countries_to_insert:
        logger.info("No countries found to migrate.")
        return
        
    try:
        # We need to get the inserted countries back to create a mapping
        # from old SQLite IDs to new Supabase IDs for foreign key relationships.
        data, count = supabase_client.table("countries").insert(countries_to_insert).execute()
        
        logger.info(f"Successfully inserted {len(data[1])} countries.")
        
        # Create mapping from country name to new Supabase ID
        country_name_to_new_id = {c['country_name']: c['id'] for c in data[1]}
        
        # We also need old ID to new ID for the 'interventions' table
        old_id_to_new_id = {}
        cursor.execute("SELECT id, country_name FROM country")
        for row in cursor.fetchall():
            if row["country_name"] in country_name_to_new_id:
                old_id_to_new_id[row["id"]] = country_name_to_new_id[row["country_name"]]
        
        return old_id_to_new_id
        
    except Exception as e:
        logger.error(f"Error migrating countries: {e}")
        return None

def migrate_interventions(sqlite_conn, supabase_client, country_id_map):
    """Migrate data from 'intervention' to 'interventions' using the country ID map."""
    logger.info("Starting migration for 'interventions' table...")
    if not country_id_map:
        logger.error("Country ID map is missing. Cannot migrate interventions.")
        return
        
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT id, country_id, session_id, speaker_name, intervention_text FROM intervention")
    
    rows = cursor.fetchall()
    interventions_to_insert = []
    
    for row in tqdm(rows, desc="Preparing interventions"):
        new_country_id = country_id_map.get(row["country_id"])
        if new_country_id:
            interventions_to_insert.append({
                "country_id": new_country_id,
                "session_id": row["session_id"],
                "speaker_name": row["speaker_name"],
                "intervention_text": row["intervention_text"]
            })
        else:
            logger.warning(f"Skipping intervention {row['id']} due to missing country_id mapping for old ID {row['country_id']}.")
            
    if not interventions_to_insert:
        logger.info("No interventions to migrate.")
        return {}

    logger.info(f"Inserting {len(interventions_to_insert)} interventions in batches of {BATCH_SIZE}...")
    
    newly_inserted_interventions = []
    for i in tqdm(range(0, len(interventions_to_insert), BATCH_SIZE), desc="Inserting interventions"):
        batch = interventions_to_insert[i:i + BATCH_SIZE]
        try:
            data, count = supabase_client.table("interventions").insert(batch).execute()
            newly_inserted_interventions.extend(data[1])
        except Exception as e:
            logger.error(f"Error inserting intervention batch: {e}")

    logger.info(f"Successfully inserted {len(newly_inserted_interventions)} interventions.")
    
    # Re-fetch from sqlite to create the ID map
    cursor.execute("SELECT id, country_id, session_id, speaker_name FROM intervention ORDER BY id")
    old_interventions = cursor.fetchall()
    
    # Build a lookup for new interventions for robust mapping
    new_intervention_lookup = {}
    for interv in newly_inserted_interventions:
        key = (interv['country_id'], interv['session_id'], interv['speaker_name'])
        if key not in new_intervention_lookup:
            new_intervention_lookup[key] = []
        new_intervention_lookup[key].append(interv['id'])
        
    # Map old to new
    final_intervention_id_map = {}
    for old_interv in old_interventions:
        new_country_id = country_id_map.get(old_interv['country_id'])
        if new_country_id:
            key = (new_country_id, old_interv['session_id'], old_interv['speaker_name'])
            if key in new_intervention_lookup and new_intervention_lookup[key]:
                # Pop the first available new ID for this unique key combination
                final_intervention_id_map[old_interv['id']] = new_intervention_lookup[key].pop(0)

    logger.info(f"Created mapping for {len(final_intervention_id_map)} intervention IDs.")
    return final_intervention_id_map


def migrate_generic_table(sqlite_conn, supabase_client, sqlite_table, supabase_table, column_map, description):
    """A generic function to migrate data from a simple table."""
    logger.info(f"Starting migration for '{supabase_table}' table...")
    cursor = sqlite_conn.cursor()
    
    select_cols = ", ".join(column_map.keys())
    cursor.execute(f"SELECT {select_cols} FROM {sqlite_table}")
    
    rows = cursor.fetchall()
    items_to_insert = []
    
    for row in tqdm(rows, desc=f"Preparing {description}"):
        item = {supabase_col: row[sqlite_col] for sqlite_col, supabase_col in column_map.items()}
        items_to_insert.append(item)
        
    if not items_to_insert:
        logger.info(f"No data to migrate for '{supabase_table}'.")
        return

    logger.info(f"Inserting {len(items_to_insert)} {description} in batches of {BATCH_SIZE}...")
    for i in tqdm(range(0, len(items_to_insert), BATCH_SIZE), desc=f"Inserting {description}"):
        batch = items_to_insert[i:i + BATCH_SIZE]
        try:
            supabase_client.table(supabase_table).insert(batch).execute()
        except Exception as e:
            logger.error(f"Error inserting batch for '{supabase_table}': {e}")
            
    logger.info(f"Successfully migrated data to '{supabase_table}'.")


def migrate_speech_sentences(sqlite_conn, supabase_client, intervention_id_map):
    """Migrate speech_sentence data, mapping intervention_id."""
    logger.info("Starting migration for 'speech_sentences' table...")
    if not intervention_id_map:
        logger.error("Intervention ID map is missing. Cannot migrate sentences.")
        return
        
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT intervention_id, sentence_order, sentence_text, relevance_score FROM speech_sentence")
    
    rows = cursor.fetchall()
    sentences_to_insert = []

    for row in tqdm(rows, desc="Preparing sentences"):
        new_intervention_id = intervention_id_map.get(row["intervention_id"])
        if new_intervention_id:
            sentences_to_insert.append({
                "intervention_id": new_intervention_id,
                "sentence_order": row["sentence_order"],
                "sentence_text": row["sentence_text"],
                "relevance_score": row["relevance_score"]
            })
        else:
            logger.warning(f"Skipping sentence due to missing intervention_id mapping for old ID {row['intervention_id']}.")

    if not sentences_to_insert:
        logger.info("No sentences to migrate.")
        return
        
    logger.info(f"Inserting {len(sentences_to_insert)} sentences in batches of {BATCH_SIZE}...")
    for i in tqdm(range(0, len(sentences_to_insert), BATCH_SIZE), desc="Inserting sentences"):
        batch = sentences_to_insert[i:i + BATCH_SIZE]
        try:
            supabase_client.table("speech_sentences").insert(batch).execute()
        except Exception as e:
            logger.error(f"Error inserting sentence batch: {e}")
            
    logger.info("Successfully migrated 'speech_sentences'.")


# --- Main Execution ---

def main():
    """Main function to orchestrate the migration process."""
    if not validate_config():
        return
        
    sqlite_conn = get_sqlite_connection()
    supabase_client = get_supabase_client()
    
    if not sqlite_conn or not supabase_client:
        logger.error("Aborting migration due to connection errors.")
        return

    try:
        # Step 1: Migrate countries and get the ID mapping
        country_id_map = migrate_countries(sqlite_conn, supabase_client)
        if country_id_map is None:
            raise Exception("Failed to migrate countries. Aborting.")
        
        # Step 2: Migrate interventions and get new ID mapping
        intervention_id_map = migrate_interventions(sqlite_conn, supabase_client, country_id_map)
        if intervention_id_map is None:
            raise Exception("Failed to migrate interventions. Aborting.")
            
        # Step 3: Migrate n-gram statistics (simple mapping)
        ngram_column_map = {
            "country_name": "country_name",
            "session_id": "session_id",
            "ngram_term": "ngram_term",
            "mention_count": "mention_count",
            "x_coord": "x_coord",
            "y_coord": "y_coord",
            "z_coord": "z_coord"
        }
        migrate_generic_table(
            sqlite_conn, supabase_client,
            "oewg_ngram_statistics", "ngram_statistics",
            ngram_column_map, "n-gram statistics"
        )
        
        # Step 4: Migrate speech sentences using the intervention ID map
        migrate_speech_sentences(sqlite_conn, supabase_client, intervention_id_map)

        logger.info("🎉 Migration completed successfully! 🎉")
        
    except Exception as e:
        logger.error(f"An unexpected error occurred during migration: {e}")
    finally:
        if sqlite_conn:
            sqlite_conn.close()
            logger.info("SQLite connection closed.")

if __name__ == "__main__":
    main()

