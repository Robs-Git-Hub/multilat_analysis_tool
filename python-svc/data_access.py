
"""
Data access layer for the Multilat Analysis API.
Provides functions to query and retrieve data from the database.
"""

from sqlalchemy.orm import Session
from sqlalchemy import text, func
from typing import List, Dict, Any, Optional, Tuple
import logging

from models import Country, NgramStatistics, Intervention, SpeechSentence
from database import get_db, db_manager

logger = logging.getLogger(__name__)

class DataAccessLayer:
    """Data access layer for database operations."""
    
    def __init__(self, session: Session):
        """Initialize with database session."""
        self.session = session
    
    # Country operations
    def get_all_countries(self, limit: Optional[int] = None) -> List[Country]:
        """Get all countries, optionally limited."""
        query = self.session.query(Country)
        if limit:
            query = query.limit(limit)
        return query.all()
    
    def get_country_by_name(self, name: str) -> Optional[Country]:
        """Get country by name."""
        return self.session.query(Country).filter(Country.country_name == name).first()
    
    def get_countries_by_region(self, region: str) -> List[Country]:
        """Get countries by region."""
        return self.session.query(Country).filter(Country.region == region).all()
    
    # N-gram statistics operations
    def get_ngram_stats_by_session(self, session_id: str, limit: Optional[int] = None) -> List[NgramStatistics]:
        """Get n-gram statistics for a specific session."""
        query = self.session.query(NgramStatistics).filter(NgramStatistics.session_id == session_id)
        if limit:
            query = query.limit(limit)
        return query.all()
    
    def get_ngram_stats_by_country(self, country_name: str, limit: Optional[int] = None) -> List[NgramStatistics]:
        """Get n-gram statistics for a specific country."""
        query = self.session.query(NgramStatistics).filter(NgramStatistics.country_name == country_name)
        if limit:
            query = query.limit(limit)
        return query.all()
    
    def get_top_ngrams_by_mentions(self, limit: int = 10) -> List[NgramStatistics]:
        """Get top n-grams by mention count."""
        return (self.session.query(NgramStatistics)
                .order_by(NgramStatistics.mention_count.desc())
                .limit(limit)
                .all())
    
    # Intervention operations
    def get_interventions_by_session(self, session_id: str, limit: Optional[int] = None) -> List[Intervention]:
        """Get interventions for a specific session."""
        query = self.session.query(Intervention).filter(Intervention.session_id == session_id)
        if limit:
            query = query.limit(limit)
        return query.all()
    
    def get_interventions_by_country(self, country_id: int, limit: Optional[int] = None) -> List[Intervention]:
        """Get interventions for a specific country."""
        query = self.session.query(Intervention).filter(Intervention.country_id == country_id)
        if limit:
            query = query.limit(limit)
        return query.all()
    
    def get_intervention_with_country(self, intervention_id: int) -> Optional[Tuple[Intervention, Country]]:
        """Get intervention with its associated country."""
        result = (self.session.query(Intervention, Country)
                 .join(Country, Intervention.country_id == Country.id)
                 .filter(Intervention.id == intervention_id)
                 .first())
        return result
    
    # Speech sentence operations
    def search_sentences(self, search_term: str, limit: int = 50) -> List[SpeechSentence]:
        """Search sentences containing a specific term."""
        return (self.session.query(SpeechSentence)
                .filter(SpeechSentence.sentence_text.contains(search_term))
                .order_by(SpeechSentence.relevance_score.desc())
                .limit(limit)
                .all())
    
    def get_sentences_by_intervention(self, intervention_id: int) -> List[SpeechSentence]:
        """Get all sentences for a specific intervention."""
        return (self.session.query(SpeechSentence)
                .filter(SpeechSentence.intervention_id == intervention_id)
                .order_by(SpeechSentence.sentence_order)
                .all())
    
    # Aggregate operations
    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """Get summary statistics for a session."""
        intervention_count = (self.session.query(func.count(Intervention.id))
                            .filter(Intervention.session_id == session_id)
                            .scalar())
        
        country_count = (self.session.query(func.count(func.distinct(Intervention.country_id)))
                        .filter(Intervention.session_id == session_id)
                        .scalar())
        
        ngram_count = (self.session.query(func.count(NgramStatistics.id))
                      .filter(NgramStatistics.session_id == session_id)
                      .scalar())
        
        return {
            "session_id": session_id,
            "intervention_count": intervention_count or 0,
            "country_count": country_count or 0,
            "ngram_count": ngram_count or 0
        }
    
    def get_database_overview(self) -> Dict[str, Any]:
        """Get overview of entire database."""
        country_count = self.session.query(func.count(Country.id)).scalar()
        intervention_count = self.session.query(func.count(Intervention.id)).scalar()
        ngram_count = self.session.query(func.count(NgramStatistics.id)).scalar()
        sentence_count = self.session.query(func.count(SpeechSentence.id)).scalar()
        
        # Get unique sessions
        unique_sessions = (self.session.query(func.distinct(Intervention.session_id))
                          .all())
        session_list = [session[0] for session in unique_sessions if session[0]]
        
        return {
            "total_countries": country_count or 0,
            "total_interventions": intervention_count or 0,
            "total_ngrams": ngram_count or 0,
            "total_sentences": sentence_count or 0,
            "unique_sessions": len(session_list),
            "session_ids": session_list[:10]  # First 10 sessions
        }

# Convenience functions for direct use
def get_sample_data(limit: int = 5) -> Dict[str, Any]:
    """Get sample data from all tables for testing/preview."""
    session_gen = db_manager.get_session()
    session = next(session_gen)
    
    try:
        dal = DataAccessLayer(session)
        
        sample_data = {
            "countries": [
                {
                    "id": c.id,
                    "name": c.country_name,
                    "code": c.country_code,
                    "region": c.region
                }
                for c in dal.get_all_countries(limit=limit)
            ],
            "ngram_statistics": [
                {
                    "id": n.id,
                    "country": n.country_name,
                    "session": n.session_id,
                    "term": n.ngram_term,
                    "mentions": n.mention_count,
                    "coordinates": (n.x_coord, n.y_coord, n.z_coord)
                }
                for n in dal.session.query(NgramStatistics).limit(limit).all()
            ],
            "interventions": [
                {
                    "id": i.id,
                    "country_id": i.country_id,
                    "session": i.session_id,
                    "speaker": i.speaker_name,
                    "text_preview": i.intervention_text[:100] + "..." if len(i.intervention_text) > 100 else i.intervention_text
                }
                for i in dal.session.query(Intervention).limit(limit).all()
            ],
            "speech_sentences": [
                {
                    "id": s.id,
                    "intervention_id": s.intervention_id,
                    "order": s.sentence_order,
                    "text": s.sentence_text[:100] + "..." if len(s.sentence_text) > 100 else s.sentence_text
                }
                for s in dal.session.query(SpeechSentence).limit(limit).all()
            ]
        }
        
        return sample_data
        
    finally:
        session.close()

def get_quick_stats() -> Dict[str, Any]:
    """Get quick database statistics."""
    session_gen = db_manager.get_session()
    session = next(session_gen)
    
    try:
        dal = DataAccessLayer(session)
        return dal.get_database_overview()
    finally:
        session.close()
