
"""
Database connection and session management for the Multilat Analysis API.
Provides SQLAlchemy engine and session factory for database operations.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
from pathlib import Path
from typing import Generator, Optional, List, Dict, Any
import logging

from models import Base, Country, NgramStatistics, Intervention, SpeechSentence

logger = logging.getLogger(__name__)

# Database path - relative to the python-svc directory
DB_PATH = Path(__file__).parent.parent / "data" / "oewg_analysis_dash.db"

class DatabaseManager:
    """Manages database connections and sessions."""
    
    def __init__(self, db_path: Optional[Path] = None):
        """Initialize database manager with optional custom path."""
        self.db_path = db_path or DB_PATH
        self.engine = None
        self.SessionLocal = None
        self._initialize_engine()
    
    def _initialize_engine(self):
        """Initialize SQLAlchemy engine and session factory."""
        try:
            # Create engine with SQLite-specific options
            database_url = f"sqlite:///{self.db_path}"
            self.engine = create_engine(
                database_url,
                echo=False,  # Set to True for SQL logging
                connect_args={"check_same_thread": False}  # SQLite specific
            )
            
            # Create session factory
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            logger.info(f"Database engine initialized: {self.db_path}")
            
        except Exception as e:
            logger.error(f"Failed to initialize database engine: {e}")
            raise
    
    def get_session(self) -> Generator[Session, None, None]:
        """
        Dependency to get database session.
        Yields a session and ensures it's closed after use.
        """
        session = self.SessionLocal()
        try:
            yield session
        except Exception as e:
            session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            session.close()
    
    def test_connection(self) -> bool:
        """Test database connection and return success status."""
        try:
            with self.engine.connect() as connection:
                result = connection.execute(text("SELECT 1"))
                result.fetchone()
            logger.info("Database connection test successful")
            return True
        except Exception as e:
            logger.error(f"Database connection test failed: {e}")
            return False
    
    def get_table_info(self) -> Dict[str, Any]:
        """Get information about database tables."""
        try:
            with self.engine.connect() as connection:
                # Get table names
                tables_result = connection.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
                tables = [row[0] for row in tables_result.fetchall()]
                
                table_info = {}
                for table in tables:
                    # Get row count for each table
                    count_result = connection.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = count_result.fetchone()[0]
                    table_info[table] = {"row_count": count}
                
                return table_info
        except Exception as e:
            logger.error(f"Failed to get table info: {e}")
            return {}

# Global database manager instance
db_manager = DatabaseManager()

def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for database sessions."""
    yield from db_manager.get_session()

def get_database_stats() -> Dict[str, Any]:
    """Get basic database statistics."""
    return db_manager.get_table_info()

def test_database_connection() -> bool:
    """Test database connection."""
    return db_manager.test_connection()
