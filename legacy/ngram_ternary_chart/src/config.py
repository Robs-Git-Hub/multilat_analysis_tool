# ngram_ternary_chart/src/config.py
import os
from pathlib import Path

class AppConfig: # Renamed class for clarity, as it's for the app now
    # Resolve the path to the directory containing this config.py file (src/)
    # Then, go one level up to get the project's base directory (ngram_ternary_chart/)
    PROJECT_ROOT_DIR = Path(__file__).resolve().parent.parent
    
    # Path to your SQLite database file within the 'data' directory at the project root
    # Updated database filename
    DB_FILE = PROJECT_ROOT_DIR / 'data' / 'oewg_analysis_dash.db'

    # You can add other app-specific configurations here if needed in the future.
    # For example:
    # DEFAULT_DATA_SOURCE_KEY = 'ngrams'
    # LOG_LEVEL = "INFO"

# Example of how to use it (optional, for testing within config.py itself)
if __name__ == '__main__':
    print(f"Project Root Directory: {AppConfig.PROJECT_ROOT_DIR}")
    print(f"Database File Path: {AppConfig.DB_FILE}")
    print(f"Is DB_FILE an absolute path? {AppConfig.DB_FILE.is_absolute()}")
    # To check if the file exists (useful during development):
    # if AppConfig.DB_FILE.exists():
    #     print(f"Database file found at: {AppConfig.DB_FILE}")
    # else:
    #     print(f"WARNING: Database file NOT found at: {AppConfig.DB_FILE}")