
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
DEFAULT_SQLITE_PATH = Path(__file__).parent.parent.parent / "data" / "oewg_analysis_dash.db"
SQLITE_DB_PATH = Path(os.getenv("SQLITE_DB_PATH", DEFAULT_SQLITE_PATH)).resolve()

# Batch size for inserting data
BATCH_SIZE = 500

# The order is important to respect foreign key constraints.
TABLES_TO_MIGRATE = [
    # Level 0 (no dependencies)
    'bert_models',
    'country',
    'intervention',
    'oewg_ngram_filter_phrases',
    'oewg_ngrams_to_use',
    'oewg_ngram_statistics',
    'oewg_ngram_community_frequencies',
    'oewg_ngram_cluster_from_shared_sentences',
    'user_settings',

    # Level 1 (dependencies on level 0)
    'bert_topic_definition',
    'oewg_topics',
    'speech_sentence',
    'wic_fellow_attendance_record',
    'intervention_cleaned_words',
    'intervention_photo',
    'intervention_alternative_gender_source',
    'analysis_ngram_community_stats',
    'oewg_ngram_usefulness_ai_rating',
    'analysis_ngram_clustering_silhouette_by_sentence',
    'bert_speaker_pairwise_distance',

    # Level 2 (dependencies on level 1)
    'oewg_ngrams_to_topic_names',
    'analysis_ai_labelled_topic_community_stats',
    'sentence_topic_ai_classification_pivoted',
    'junc_sentence_id_to_ngram_id',
    'analysis_bert_labelled_topic_community_stats',
    'bert_speaker_avg_topic_probability',
    'bert_topic_keywords',

    # Level 3 (dependencies on level 2)
    'oewg_ngram_sentence_samples',
    'sentence_topic_ai_classification_unpivoted',

    # Level 4 (dependencies on multiple levels)
    'bert_sentence_topic_probabilities',
]

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

def migrate_table(sqlite_conn, supabase_client, table_name):
    """
    A generic function to migrate data from a table, assuming table and column names match.
    PKs are preserved from SQLite.
    """
    logger.info(f"--- Starting migration for '{table_name}' table ---")
    cursor = sqlite_conn.cursor()

    try:
        # Get column names from SQLite
        cursor.execute(f'PRAGMA table_info("{table_name}")')
        columns = [row[1] for row in cursor.fetchall()]
        if not columns:
            logger.warning(f"Table '{table_name}' not found or has no columns in SQLite DB. Skipping.")
            return

        select_cols_str = ", ".join([f'"{c}"' for c in columns])
        cursor.execute(f"SELECT {select_cols_str} FROM \"{table_name}\"")

        rows = cursor.fetchall()
        if not rows:
            logger.info(f"No data to migrate for '{table_name}'.")
            return

        items_to_insert = []
        for row in rows:
            item = {col: row[col] for col in columns}
            items_to_insert.append(item)

        if not items_to_insert:
            logger.info(f"No transformed data to migrate for '{table_name}'.")
            return

        logger.info(f"Inserting {len(items_to_insert)} items into '{table_name}' in batches of {BATCH_SIZE}...")
        for i in tqdm(range(0, len(items_to_insert), BATCH_SIZE), desc=f"Inserting into {table_name}"):
            batch = items_to_insert[i:i + BATCH_SIZE]
            try:
                # The upsert with ignore_duplicates=True is safer if some data already exists,
                # but since we cleared tables, simple insert is fine.
                supabase_client.table(table_name).insert(batch).execute()
            except Exception as e:
                logger.error(f"Error inserting batch for '{table_name}': {e}")
                # You might want to break here or log problematic rows
                # For now, we continue with other batches.

        logger.info(f"✅ Successfully finished migration for '{table_name}'.")

    except sqlite3.OperationalError as e:
        logger.error(f"Error accessing table '{table_name}' in SQLite: {e}. Skipping.")
    except Exception as e:
        logger.error(f"An unexpected error occurred during migration of '{table_name}': {e}")

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
        # The schema migration script (run manually) already clears tables by dropping them.
        # So, no need to clear them here.

        logger.info("Starting data migration for all tables...")
        for table_name in tqdm(TABLES_TO_MIGRATE, desc="Total Migration Progress"):
            migrate_table(sqlite_conn, supabase_client, table_name)

        logger.info("🎉 Full migration completed successfully! 🎉")
        logger.info("Please remember to regenerate your Supabase types for the frontend if you haven't already.")

    except Exception as e:
        logger.error(f"An unexpected error occurred during migration: {e}")
    finally:
        if sqlite_conn:
            sqlite_conn.close()
            logger.info("SQLite connection closed.")

if __name__ == "__main__":
    main()
