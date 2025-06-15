
"""
Database models for the Multilat Analysis API.
Based on the legacy schema but simplified for core functionality.
"""

from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from typing import Optional
import datetime

Base = declarative_base()

class Country(Base):
    """Country/Speaker information."""
    __tablename__ = 'country'
    
    id = Column(Integer, primary_key=True)
    country_name = Column(String(100), nullable=False, unique=True)
    country_code = Column(String(10), nullable=True)
    region = Column(String(50), nullable=True)
    
    # Relationships
    interventions = relationship("Intervention", back_populates="country")
    
    def __repr__(self):
        return f"<Country(name='{self.country_name}', code='{self.country_code}')>"

class NgramStatistics(Base):
    """N-gram statistics for ternary plot coordinates."""
    __tablename__ = 'oewg_ngram_statistics'
    
    id = Column(Integer, primary_key=True)
    country_name = Column(String(100), nullable=False)
    session_id = Column(String(50), nullable=False)
    ngram_term = Column(String(200), nullable=False)
    
    # Ternary coordinates
    x_coord = Column(Float, nullable=False, default=0.0)
    y_coord = Column(Float, nullable=False, default=0.0) 
    z_coord = Column(Float, nullable=False, default=0.0)
    
    # Additional plot data
    marker_size = Column(Float, nullable=True, default=10.0)
    marker_color = Column(String(20), nullable=True, default='blue')
    text_content = Column(Text, nullable=True)
    
    # Statistics
    mention_count = Column(Integer, nullable=False, default=0)
    relevance_score = Column(Float, nullable=True, default=0.0)
    
    def __repr__(self):
        return f"<NgramStatistics(country='{self.country_name}', term='{self.ngram_term}', session='{self.session_id}')>"

class Intervention(Base):
    """Speaker interventions/speeches."""
    __tablename__ = 'intervention'
    
    id = Column(Integer, primary_key=True)
    country_id = Column(Integer, ForeignKey('country.id'), nullable=False)
    session_id = Column(String(50), nullable=False)
    intervention_text = Column(Text, nullable=False)
    intervention_date = Column(DateTime, nullable=True)
    speaker_name = Column(String(200), nullable=True)
    
    # Relationships
    country = relationship("Country", back_populates="interventions")
    sentences = relationship("SpeechSentence", back_populates="intervention")
    
    def __repr__(self):
        return f"<Intervention(id={self.id}, country_id={self.country_id}, session='{self.session_id}')>"

class SpeechSentence(Base):
    """Individual sentences from speeches for search functionality."""
    __tablename__ = 'speech_sentence'
    
    id = Column(Integer, primary_key=True)
    intervention_id = Column(Integer, ForeignKey('intervention.id'), nullable=False)
    sentence_text = Column(Text, nullable=False)
    sentence_order = Column(Integer, nullable=False, default=0)
    
    # Search-related fields
    snippet_id = Column(String(50), nullable=True)
    relevance_score = Column(Float, nullable=True, default=0.0)
    
    # Relationships
    intervention = relationship("Intervention", back_populates="sentences")
    
    def __repr__(self):
        return f"<SpeechSentence(id={self.id}, intervention_id={self.intervention_id})>"

# Helper functions for database operations
def validate_session_id(session_id: str) -> bool:
    """Validate session ID format."""
    return bool(session_id and len(session_id.strip()) > 0)

def validate_search_query(query: str) -> bool:
    """Validate search query."""
    return bool(query and len(query.strip()) >= 2)

def validate_keyword(keyword: str) -> bool:
    """Validate keyword format."""
    return bool(keyword and len(keyword.strip()) >= 2)
