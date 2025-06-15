
# SQLite to Supabase Migration

This directory contains scripts to migrate data from the local SQLite database (`/data/oewg_analysis_dash.db`) to a Supabase project.

## Prerequisites

1.  A Supabase project.
2.  Python 3.8+ installed.
3.  The local SQLite database file present at `/data/oewg_analysis_dash.db`.

## Steps

### 1. Set up Supabase Tables

- Go to your Supabase project's SQL Editor.
- Copy the content of `setup_supabase_tables.sql` and run it. This will create the necessary tables (`countries`, `interventions`, `ngram_statistics`, `speech_sentences`).

### 2. Configure Environment Variables

- Make a copy of the `.env.example` file and name it `.env`.
- Open the new `.env` file and fill in your Supabase project URL and your `service_role` key. You can find these in your Supabase project settings under `Project Settings > API`.

```
# .env file content
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
SQLITE_DB_PATH="../../data/oewg_analysis_dash.db" # This should be correct by default
```

**IMPORTANT**: The `service_role` key bypasses all Row Level Security policies. Keep it secret and do not expose it on the client-side.

### 3. Install Dependencies

Navigate to this directory in your terminal and install the required Python packages:

```bash
cd python-svc/migration
pip install -r requirements.txt
```

### 4. Run the Migration Script

Once the dependencies are installed and your `.env` file is configured, run the migration script from within the `python-svc/migration` directory:

```bash
python migrate_to_supabase.py
```

The script will show progress bars for each table being migrated. Check the console output for any errors.

## After Migration

- Verify the data in your Supabase tables using the Table Editor in the Supabase dashboard.
- Consider setting up Row Level Security (RLS) policies on your tables for production use. The `setup_supabase_tables.sql` script includes some commented-out examples.

