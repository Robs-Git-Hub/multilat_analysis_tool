
"""
Tests for database models.
Tests model creation, relationships, and validation functions.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Country, NgramStatistics, Intervention, SpeechSentence
from models import validate_session_id, validate_search_query, validate_keyword
import datetime

class TestDatabaseModels:
    """Test database model creation and relationships."""
    
    @pytest.fixture
    def db_session(self):
        """Create an in-memory SQLite database for testing."""
        engine = create_engine('sqlite:///:memory:', echo=False)
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
        session.close()
    
    def test_country_model_creation(self, db_session):
        """Test Country model creation and basic operations."""
        country = Country(
            country_name="United States",
            country_code="US",
            region="North America"
        )
        
        db_session.add(country)
        db_session.commit()
        
        # Test retrieval
        retrieved = db_session.query(Country).filter_by(country_name="United States").first()
        assert retrieved is not None
        assert retrieved.country_name == "United States"
        assert retrieved.country_code == "US"
        assert retrieved.region == "North America"
    
    def test_ngram_statistics_model(self, db_session):
        """Test NgramStatistics model creation."""
        ngram_stat = NgramStatistics(
            country_name="Germany",
            session_id="OEWG-2023-1",
            ngram_term="climate change",
            x_coord=0.3,
            y_coord=0.4,
            z_coord=0.3,
            marker_size=15.0,
            marker_color="red",
            text_content="Germany's statement on climate change",
            mention_count=5,
            relevance_score=0.95
        )
        
        db_session.add(ngram_stat)
        db_session.commit()
        
        retrieved = db_session.query(NgramStatistics).filter_by(country_name="Germany").first()
        assert retrieved is not None
        assert retrieved.ngram_term == "climate change"
        assert retrieved.x_coord == 0.3
        assert retrieved.y_coord == 0.4
        assert retrieved.z_coord == 0.3
        assert retrieved.mention_count == 5
        assert retrieved.relevance_score == 0.95
    
    def test_intervention_model(self, db_session):
        """Test Intervention model and relationship with Country."""
        # Create country first
        country = Country(country_name="France", country_code="FR")
        db_session.add(country)
        db_session.commit()
        
        # Create intervention
        intervention = Intervention(
            country_id=country.id,
            session_id="OEWG-2023-1",
            intervention_text="France supports sustainable development goals.",
            intervention_date=datetime.datetime(2023, 6, 15, 10, 30),
            speaker_name="Ambassador Pierre Dubois"
        )
        
        db_session.add(intervention)
        db_session.commit()
        
        # Test retrieval and relationship
        retrieved = db_session.query(Intervention).filter_by(country_id=country.id).first()
        assert retrieved is not None
        assert retrieved.session_id == "OEWG-2023-1"
        assert retrieved.country.country_name == "France"
        assert retrieved.speaker_name == "Ambassador Pierre Dubois"
    
    def test_speech_sentence_model(self, db_session):
        """Test SpeechSentence model and relationship with Intervention."""
        # Create country and intervention first
        country = Country(country_name="Japan", country_code="JP")
        db_session.add(country)
        db_session.commit()
        
        intervention = Intervention(
            country_id=country.id,
            session_id="OEWG-2023-2",
            intervention_text="Japan's comprehensive statement.",
            speaker_name="Ambassador Yamamoto"
        )
        db_session.add(intervention)
        db_session.commit()
        
        # Create speech sentence
        sentence = SpeechSentence(
            intervention_id=intervention.id,
            sentence_text="We believe in multilateral cooperation for peace.",
            sentence_order=1,
            snippet_id="JP-OEWG-2023-2-001",
            relevance_score=0.87
        )
        
        db_session.add(sentence)
        db_session.commit()
        
        # Test retrieval and relationships
        retrieved = db_session.query(SpeechSentence).filter_by(intervention_id=intervention.id).first()
        assert retrieved is not None
        assert retrieved.sentence_text == "We believe in multilateral cooperation for peace."
        assert retrieved.sentence_order == 1
        assert retrieved.relevance_score == 0.87
        assert retrieved.intervention.country.country_name == "Japan"
    
    def test_model_relationships(self, db_session):
        """Test that all model relationships work correctly."""
        # Create a complete chain: Country -> Intervention -> SpeechSentence
        country = Country(country_name="Brazil", country_code="BR")
        db_session.add(country)
        db_session.commit()
        
        intervention = Intervention(
            country_id=country.id,
            session_id="OEWG-2023-3",
            intervention_text="Brazil's environmental position.",
            speaker_name="Minister Silva"
        )
        db_session.add(intervention)
        db_session.commit()
        
        sentence1 = SpeechSentence(
            intervention_id=intervention.id,
            sentence_text="Environmental protection is our priority.",
            sentence_order=1
        )
        sentence2 = SpeechSentence(
            intervention_id=intervention.id,
            sentence_text="We support the Paris Agreement.",
            sentence_order=2
        )
        
        db_session.add_all([sentence1, sentence2])
        db_session.commit()
        
        # Test forward relationships
        assert len(country.interventions) == 1
        assert len(intervention.sentences) == 2
        
        # Test backward relationships
        assert sentence1.intervention.country.country_name == "Brazil"
        assert sentence2.intervention.speaker_name == "Minister Silva"

class TestValidationFunctions:
    """Test validation helper functions."""
    
    def test_validate_session_id(self):
        """Test session ID validation."""
        # Valid session IDs
        assert validate_session_id("OEWG-2023-1") == True
        assert validate_session_id("session123") == True
        assert validate_session_id("TEST_SESSION") == True
        
        # Invalid session IDs
        assert validate_session_id("") == False
        assert validate_session_id("   ") == False
        assert validate_session_id(None) == False
    
    def test_validate_search_query(self):
        """Test search query validation."""
        # Valid queries
        assert validate_search_query("climate") == True
        assert validate_search_query("sustainable development") == True
        assert validate_search_query("UN") == True
        
        # Invalid queries
        assert validate_search_query("") == False
        assert validate_search_query(" ") == False
        assert validate_search_query("a") == False  # Too short
        assert validate_search_query(None) == False
    
    def test_validate_keyword(self):
        """Test keyword validation."""
        # Valid keywords
        assert validate_keyword("peace") == True
        assert validate_keyword("security") == True
        assert validate_keyword("multilateral") == True
        
        # Invalid keywords
        assert validate_keyword("") == False
        assert validate_keyword("  ") == False
        assert validate_keyword("x") == False  # Too short
        assert validate_keyword(None) == False

class TestModelDefaults:
    """Test model default values and edge cases."""
    
    @pytest.fixture
    def db_session(self):
        """Create an in-memory SQLite database for testing."""
        engine = create_engine('sqlite:///:memory:', echo=False)
        Base.metadata.create_all(engine)
        Session = sessionmaker(bind=engine)
        session = Session()
        yield session
        session.close()
    
    def test_ngram_statistics_defaults(self, db_session):
        """Test NgramStatistics model with default values."""
        ngram_stat = NgramStatistics(
            country_name="Canada",
            session_id="OEWG-2023-4",
            ngram_term="human rights"
            # Testing default values for other fields
        )
        
        db_session.add(ngram_stat)
        db_session.commit()
        
        retrieved = db_session.query(NgramStatistics).filter_by(country_name="Canada").first()
        assert retrieved.x_coord == 0.0
        assert retrieved.y_coord == 0.0
        assert retrieved.z_coord == 0.0
        assert retrieved.marker_size == 10.0
        assert retrieved.marker_color == 'blue'
        assert retrieved.mention_count == 0
        assert retrieved.relevance_score == 0.0
    
    def test_speech_sentence_defaults(self, db_session):
        """Test SpeechSentence model with default values."""
        # Create country and intervention first
        country = Country(country_name="Australia", country_code="AU")
        db_session.add(country)
        db_session.commit()
        
        intervention = Intervention(
            country_id=country.id,
            session_id="OEWG-2023-5",
            intervention_text="Australia's statement."
        )
        db_session.add(intervention)
        db_session.commit()
        
        sentence = SpeechSentence(
            intervention_id=intervention.id,
            sentence_text="We support international cooperation."
            # Testing default values
        )
        
        db_session.add(sentence)
        db_session.commit()
        
        retrieved = db_session.query(SpeechSentence).filter_by(intervention_id=intervention.id).first()
        assert retrieved.sentence_order == 0
        assert retrieved.relevance_score == 0.0

if __name__ == "__main__":
    pytest.main(["-v", "test_models.py"])
