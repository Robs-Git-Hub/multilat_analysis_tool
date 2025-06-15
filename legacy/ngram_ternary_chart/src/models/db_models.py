# models.db_models.py
from sqlalchemy import create_engine, Column, String, Integer, Boolean, JSON, ForeignKey, Time, Float, PrimaryKeyConstraint, event, DDL, CheckConstraint, DateTime, Index 
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from src.config import AppConfig
import shortuuid
import datetime

Base = declarative_base()

class Intervention(Base):
    __tablename__ = 'intervention'
    
    id = Column(Integer, primary_key=True)  # formerly intervention_id
    meeting = Column(String, nullable=True)
    session_number = Column(Integer, nullable=True)
    meeting_number = Column(Integer, nullable=True)
    within_meeting_index = Column(Integer, nullable=True)
    agenda_item = Column(String, nullable=True)
    speaker = Column(String, nullable=True)  # cannot be a foreign key to Country because not all speakers are countries
    speaker_type = Column(String, nullable=True)
    timestamp_start_hhmmss = Column(Time, nullable=True)
    timestamp_end_hhmmss = Column(Time, nullable=True)  
    url_for_video = Column(String, nullable=True)        
    speech = Column(String, nullable=True)
    apr_negotiation_round = Column(String, nullable=True)

    def __repr__(self):
        return f"<Intervention(id={self.id}, speaker='{self.speaker}', meeting='{self.meeting}')>"

class InterventionCleanedWords(Base):
    __tablename__ = 'intervention_cleaned_words'

    intervention_id = Column(Integer, ForeignKey('intervention.id'), primary_key=True)
    cleaned_words_only_text = Column(String, nullable=True)

    intervention = relationship("Intervention", backref="cleaned_words")

class InterventionPhoto(Base):
    """Stores information related to photos taken for interventions.
       Each photo record has its own unique ID. No direct back-reference
       from Intervention is defined here as it may be a one-to-many relationship."""
    __tablename__ = 'intervention_photo'

    # Primary key using standard shortuuid (22 characters)
    id = Column(String(22), primary_key=True, default=lambda: shortuuid.uuid())

    # Foreign key to Intervention - mandatory and indexed for query performance
    intervention_id = Column(Integer, ForeignKey('intervention.id'), nullable=False, index=True)

    # Photo capture/analysis status and results
    able_to_take_photo = Column(Boolean, nullable=True) # True if successful gender found, False otherwise
    photo_filename = Column(String, nullable=True)      # Filename if successful, NULL otherwise
    gender_from_photo = Column(String, nullable=True)   # 'male' or 'female' if successful, NULL otherwise
    url_video_at_photo = Column(String, nullable=True)  # <<< New Field Added: URL used for successful snapshot

    # Optional: Define the index explicitly if needed outside the Column definition
    # __table_args__ = (Index('ix_intervention_photo_intervention_id', 'intervention_id'), )
    
    def __repr__(self):
        return f"<InterventionPhoto(id='{self.id}', intervention_id={self.intervention_id}, able_to_take_photo={self.able_to_take_photo}, gender_from_photo='{self.gender_from_photo}')>"

class InterventionAlternativeGenderSource(Base):
    """Stores gender information derived from sources other than a photo,
       along with explanatory notes."""
    __tablename__ = 'intervention_alternative_gender_source'

    # Use intervention's id as the primary key, creating a one-to-one relationship
    intervention_id = Column(Integer, ForeignKey('intervention.id'), primary_key=True)
    gender_not_from_photo = Column(String, nullable=True) # e.g., 'male', 'female'
    notes = Column(String, nullable=True)                 # Explanation for the gender source/label

    # Establish relationship back to the Intervention model
    intervention = relationship("Intervention", backref="alternative_gender_source")

    def __repr__(self):
        return f"<InterventionAlternativeGenderSource(intervention_id={self.intervention_id}, gender_not_from_photo='{self.gender_not_from_photo}')>"

class WicFellowAttendanceRecord(Base):
    """
    Represents attendance records for Women in International Security
    and Cyberspace (WIC) fellows at OEWG events.
    Corresponds to the 'wic_fellow_attendance_record' resource in the datapackage.
    """
    __tablename__ = 'wic_fellow_attendance_record'

    record_id = Column(Integer, primary_key=True, nullable=False, unique=False, 
                       comment="Unique identifier for each attendance record.")
    fellow_iso = Column(String(3), ForeignKey('country.id'), nullable=False, index=True,
                 comment="ISO 3-letter country code for the WIC fellow.")
    standardised_name = Column(String, nullable=True,
                               comment="Standardised name of the WIC fellow, if known.")
    oewg_session = Column(Integer, nullable=False,
                          comment="OEWG Session number for this attendance record.")
    sponsor_iso = Column(String(3), ForeignKey('country.id'), nullable=True, index=True,
                         comment="ISO 3-letter country code of the sponsor, if applicable.")
    attendance_at = Column(String, nullable=False,
                           comment="Type of event attended (e.g., 'session', 'training').")
    attendance_status = Column(String, nullable=False,
                               comment="Indicates if the fellow attended ('Yes', 'No').")

    def __repr__(self):
        return f"<WicFellowAttendanceRecord(id={self.record_id}, fellow_iso='{self.fellow_iso}', session={self.oewg_session}, status={self.attendance_status})>"

class Country(Base):
    __tablename__ = 'country'
    id = Column(String, primary_key=True)
    merge_name = Column(String)
    morgus_30_swing_states = Column(String)
    cpm_cluster_after_10_res_0_53 = Column(Integer)
    cpm_community_after_10_CPM_0_53 = Column(String)
    merge_name_with_pat_10 = Column(String)
    pat_10 = Column(Integer)

    def __repr__(self):
        return f"<Country(id='{self.id}', cpm_community_after_10_CPM_0_53='{self.cpm_community_after_10_CPM_0_53}')>"

class OewgNgramFilterPhrase(Base):
    __tablename__ = 'oewg_ngram_filter_phrases'
    filter_phrase = Column(String, primary_key=True)
    reason = Column(String)
    number_of_words = Column(Integer)  # Mapped from "number of words"
    from_which_round = Column(String)

    def __repr__(self):
        return f"<OewgNgramFilterPhrase(filter_phrase='{self.filter_phrase}', reason='{self.reason}')>"

class SpeechSentence(Base):
    __tablename__ = 'speech_sentence'
    id = Column(Integer, primary_key=True, autoincrement=True)
    intervention_id = Column(Integer, ForeignKey("intervention.id"), nullable=False)
    sentence_full = Column(String, nullable=False)
    sentence_cleaned = Column(String, nullable=False)

    def __repr__(self):
        # Corrected __repr__ to use existing attributes
        return f"<SpeechSentence(id={self.id}, intervention_id={self.intervention_id})>"

class OewgNgramFrequencyByCommunity(Base):
    __tablename__ = 'oewg_ngram_community_frequencies'
    ngram = Column(String, nullable=False)
    community = Column(String, nullable=False)
    frequency = Column(Integer, nullable=False)
    
    __table_args__ = (
        PrimaryKeyConstraint('ngram', 'community'),
    )


class NgramStatistics(Base):
    __tablename__ = 'oewg_ngram_statistics'
    
    # Primary key: the n-gram text itself
    ngram = Column(String, primary_key=True)
    
    # Raw count columns for communities A, BCDE, F, and G
    count_A = Column(Integer, nullable=False, default=0)
    count_BCDE = Column(Integer, nullable=False, default=0)
    count_F = Column(Integer, nullable=False, default=0)
    count_G = Column(Integer, nullable=False, default=0)
    count_all_communities = Column(Integer, nullable=False, default=0)
    
    # Relative frequency columns for communities A, BCDE, F, and G
    relative_frequency_A = Column(Float, nullable=False, default=0.0)
    relative_frequency_BCDE = Column(Float, nullable=False, default=0.0)
    relative_frequency_F = Column(Float, nullable=False, default=0.0)
    relative_frequency_G = Column(Float, nullable=False, default=0.0)
    
    # Normalized frequency columns for communities A, BCDE, F, and G
    normalized_frequency_A = Column(Float, nullable=False, default=0.0)
    normalized_frequency_BCDE = Column(Float, nullable=False, default=0.0)
    normalized_frequency_F = Column(Float, nullable=False, default=0.0)
    normalized_frequency_G = Column(Float, nullable=False, default=0.0)
    
    # Derived statistics
    lor_polarization_score = Column(Float)
    p_value = Column(Float)
    p_value_ag_below_05 = Column(String)  # e.g., "Yes" or "No"
    bcde_raised_more = Column(String)      # e.g., "Yes" or "No"

    def __repr__(self):
        return f"<NgramStatistics(ngram_id={self.ngram_id}, count_all_communities={self.count_all_communities})>"

class OewgNgramsToUse(Base):
    __tablename__ = 'oewg_ngrams_to_use'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    ngram = Column(String, nullable=False)
    p_value_ag_below_05 = Column(String, nullable=True)
    bcde_raised_more = Column(String, nullable=True)
    link_to_community_by_freq = Column(String, nullable=True)
    is_filtered_out = Column(Boolean, default=False)  
    

class OewgNgramSentenceSamples(Base):
    __tablename__ = 'oewg_ngram_sentence_samples'
    
    ngram_id = Column(Integer, ForeignKey("oewg_ngrams_to_use.id"), nullable=False)
    sentence_id = Column(Integer, ForeignKey("speech_sentence.id"), nullable=False)
    
    __table_args__ = (
        PrimaryKeyConstraint('ngram_id', 'sentence_id'),
    )

    def __repr__(self):
        return f"<OewgNgramSentenceSamples(ngram_id={self.ngram_id}, sentence_id={self.sentence_id})>"

class OewgNgramsToTopicNames(Base):
    __tablename__ = 'oewg_ngrams_to_topic_names'
    
    ngram = Column(String, nullable=False)  # Phrase extracted from transcripts
    topic_name = Column(String, ForeignKey("oewg_topics.topic_name"), nullable=False)
    coder = Column(String, nullable=False)    # Annotator assigning the topic label

    __table_args__ = (
        PrimaryKeyConstraint('ngram', 'topic_name'),
    )

    def __repr__(self):
        return f"<OewgNgramsToTopicNames(ngram='{self.ngram}', topic_name='{self.topic_name}', coder='{self.coder}')>"

class OewgTopics(Base):
    __tablename__ = 'oewg_topics'

    topic_id                = Column(String, primary_key=True, comment="Topic ID")
    topic_short_description = Column(String, nullable=False, comment="Short description")
    topic_name              = Column(String, nullable=False, unique=True, comment="Topic label")
    topic_group             = Column(String, nullable=False, comment="Topic group")
    bert_topic_num          = Column(Integer, nullable=True, comment="BERTopic index")
    bert_model_id           = Column(Integer, ForeignKey('bert_models.id'), nullable=True, index=True, comment="FK to the specific BERTopic model run")
    include                 = Column(String, nullable=True, comment="Pipe-separated include rules")
    exclude                 = Column(String, nullable=True, comment="Pipe-separated exclude rules")

    model                   = relationship("BertModel", backref="topics")

    @property
    def include_list(self):
        if not self.include:
            return []
        return [rule.strip() for rule in self.include.split('|')]

    @property
    def exclude_list(self):
        if not self.exclude:
            return []
        return [rule.strip() for rule in self.exclude.split('|')]

    def __repr__(self): return f"<OewgTopics(id={self.topic_id!r}, name={self.topic_name!r}, model_id={self.bert_model_id})>"
        
class UserSettings(Base):
    __tablename__ = 'user_settings'
    
    id = Column(Integer, primary_key=True, default=1, nullable=False)
    interventions_in_scope = Column(String, nullable=True)
    ngram_frequency_cut_off = Column(Integer, nullable=True)
    ngram_length = Column(Integer, nullable=True)
    label_for_ngram_filtering_round = Column(String, nullable=True)
    
    __table_args__ = (
        CheckConstraint('id = 1', name='only_one_row'),
    )

class JuncSentenceToNgram(Base):
    __tablename__ = 'junc_sentence_id_to_ngram_id'
    
    sentence_id = Column(Integer, ForeignKey("speech_sentence.id"), primary_key=True)
    ngram_id = Column(Integer, ForeignKey("oewg_ngrams_to_use.id"), primary_key=True)

class OewgNgramUsefulnessAiRating(Base):
    __tablename__ = 'oewg_ngram_usefulness_ai_rating'
    
    rating_id = Column(Integer, primary_key=True, autoincrement=True)
    ngram_id = Column(Integer, ForeignKey('oewg_ngrams_to_use.id'), nullable=False)
    rating = Column(Integer, nullable=False)
    reason = Column(String, nullable=True)
    api_call_round = Column(Integer, nullable=True)
    source = Column(String, nullable=False)  # e.g., LLM model name or human coder name

    def __repr__(self):
        return f"<OewgNgramUsefulnessAiRating(rating_id={self.rating_id}, ngram_id={self.ngram_id}, rating={self.rating})>"

class OewgNgramClusterFromSS(Base):
    __tablename__ = 'oewg_ngram_cluster_from_shared_sentences'
    
    ngram_id = Column(Integer, primary_key=True, nullable=False)  # Unique identifier for the ngram
    ngram_cluster_from_ss = Column(Integer, nullable=False)       # Cluster label based on shared sentence occurrences

    def __repr__(self):
        return f"<OewgNgramClusterFromSS(ngram_id={self.ngram_id}, ngram_cluster_from_ss={self.ngram_cluster_from_ss})>"

class AnalysisNgramClusteringSilhouetteBySentence(Base):
    __tablename__ = 'analysis_ngram_clustering_silhouette_by_sentence'

    id = Column(Integer, primary_key=True, autoincrement=True) # Unique ID for each record
    ngram_id = Column(Integer, ForeignKey('oewg_ngrams_to_use.id'), nullable=False, index=True) # Foreign Key to oewg_ngrams_to_use.id
    ngram = Column(String, nullable=True) # NEW: ngram text column
    cluster = Column(Integer, nullable=False)
    optimal_clusters = Column(Integer, nullable=True)
    optimal_silhouette_score = Column(Float, nullable=True)

    # Define relationship (optional, but good for ORM usage)
    ngram_ref = relationship("OewgNgramsToUse", backref="clustering_analyses") # Changed name to avoid conflict

    def __repr__(self):
        return f"<AnalysisNgramClusteringSilhouetteBySentence(id={self.id}, ngram_id={self.ngram_id}', ngram='{self.ngram}', cluster={self.cluster}, optimal_clusters={self.optimal_clusters}, optimal_silhouette_score={self.optimal_silhouette_score})>"

class AILabelledTopicCommunityStats(Base):
    # Renamed table to include 'analysis_' prefix
    __tablename__ = 'analysis_ai_labelled_topic_community_stats'

    # Topic Information (kept as requested, topic_id is PK/FK)
    topic_id = Column(String, ForeignKey('oewg_topics.topic_id'), primary_key=True)
    topic_short_description = Column(String, nullable=True) # Storing for direct access

    # Raw Counts
    count_A = Column(Integer, nullable=False, default=0)
    count_BCDE = Column(Integer, nullable=False, default=0)
    count_F = Column(Integer, nullable=False, default=0)
    count_G = Column(Integer, nullable=False, default=0)
    count_all_communities = Column(Integer, nullable=False, default=0) # Total counts from communities A,BCDE,F,G

    # Relative Frequencies
    relative_frequency_A = Column(Float, nullable=False, default=0.0)
    relative_frequency_BCDE = Column(Float, nullable=False, default=0.0)
    relative_frequency_F = Column(Float, nullable=False, default=0.0)
    relative_frequency_G = Column(Float, nullable=False, default=0.0)

    # Normalized Frequencies
    normalized_frequency_A = Column(Float, nullable=False, default=0.0)
    normalized_frequency_BCDE = Column(Float, nullable=False, default=0.0)
    normalized_frequency_F = Column(Float, nullable=False, default=0.0)
    normalized_frequency_G = Column(Float, nullable=False, default=0.0)

    # BCDE Difference Metrics
    dif_bcde_to_highest_polar = Column(Float, nullable=True)
    dif_bcde_to_mid_polar_point = Column(Float, nullable=True)
    
    # Polarization Scores
    lor_polarization_score = Column(Float, nullable=True)
    focus_polarization_score = Column(Float, nullable=True)

    # P-value & Derived Flags
    p_value_ag = Column(Float, nullable=True)
    
    # Likely to remove:
    # p_value_ag_below_05 = Column(String, nullable=True) # 'True' or 'False'
    # bcde_raised_more = Column(String, nullable=True)    # 'True' or 'False'
    # is_FPS_polarised_in_1st_or_4th_quartile = Column(String, nullable=True) # 'True' or 'False'
    # meets_min_relative_frequency = Column(String, nullable=True) # 'True' or 'False'
    # either_polarised_or_bcde_raised_more = Column(String, nullable=True) # 'True' or 'False'
    # is_polarised_or_bcde_raise_more_and_meets_min_rel_freq = Column(String, nullable=True) # 'True' or 'False'

    # Relationship back to the main topic table (optional but recommended)
    topic = relationship("OewgTopics", backref="ai_community_stats")

    def __repr__(self):
        return f"<AILabelledTopicCommunityStats(topic_id='{self.topic_id}', desc='{self.topic_short_description}', count_all={self.count_all_communities})>"

class BertLabelledTopicCommunityStats(Base):
    __tablename__ = 'analysis_bert_labelled_topic_community_stats'

    # Topic Information
    topic_id = Column(Integer, ForeignKey('bert_topic_definition.bert_topic_id'), primary_key=True) # BERT Topic ID
    bert_model_id = Column(Integer, ForeignKey('bert_models.id'), primary_key=True) # Model that generated this topic
    
    topic_short_description = Column(String, nullable=True) # Will store BERT topic name

    # Raw Counts
    count_A = Column(Integer, nullable=False, default=0)
    count_BCDE = Column(Integer, nullable=False, default=0) # Assuming BCDE is still a valid combined community
    count_F = Column(Integer, nullable=False, default=0)
    count_G = Column(Integer, nullable=False, default=0)
    count_all_communities = Column(Integer, nullable=False, default=0)

    # Relative Frequencies
    relative_frequency_A = Column(Float, nullable=False, default=0.0)
    relative_frequency_BCDE = Column(Float, nullable=False, default=0.0)
    relative_frequency_F = Column(Float, nullable=False, default=0.0)
    relative_frequency_G = Column(Float, nullable=False, default=0.0)

    # Normalized Frequencies
    normalized_frequency_A = Column(Float, nullable=False, default=0.0)
    normalized_frequency_BCDE = Column(Float, nullable=False, default=0.0)
    normalized_frequency_F = Column(Float, nullable=False, default=0.0)
    normalized_frequency_G = Column(Float, nullable=False, default=0.0)

    # BCDE Difference Metrics
    dif_bcde_to_highest_polar = Column(Float, nullable=True)
    dif_bcde_to_mid_polar_point = Column(Float, nullable=True)
    
    # Polarization Scores
    lor_polarization_score = Column(Float, nullable=True)
    focus_polarization_score = Column(Float, nullable=True)

    # P-value & Derived Flags
    p_value_ag = Column(Float, nullable=True)
    
    # Likely to remove:
    # p_value_ag_below_05 = Column(String, nullable=True) # 'True' or 'False'
    # bcde_raised_more = Column(String, nullable=True)    # 'True' or 'False'
    # is_FPS_polarised_in_1st_or_4th_quartile = Column(String, nullable=True) # 'True' or 'False'
    # meets_min_relative_frequency = Column(String, nullable=True) # 'True' or 'False'
    # either_polarised_or_bcde_raised_more = Column(String, nullable=True) # 'True' or 'False'
    # is_polarised_or_bcde_raise_more_and_meets_min_rel_freq = Column(String, nullable=True) # 'True' or 'False'

    __table_args__ = (
        PrimaryKeyConstraint('topic_id', 'bert_model_id'),
        # You might also want a ForeignKeyConstraint to ensure the combination
        # of topic_id and bert_model_id exists in bert_topic_definition,
        # if bert_topic_definition itself doesn't have a composite PK.
        # ForeignKeyConstraint(['topic_id', 'bert_model_id'], ['bert_topic_definition.bert_topic_id', 'bert_topic_definition.bert_model_id'])
        # However, BertTopicDefinition's PK is just bert_topic_id.
        # So, individual FKs on topic_id and bert_model_id are appropriate.
    )

    # Relationship to BertTopicDefinition
    # This links based on topic_id (which is bert_topic_id).
    # When using this relationship, you'd typically filter by self.bert_model_id as well
    # if you need the specific definition for this stat's model.
    bert_topic_definition_rel = relationship(
        "BertTopicDefinition",
        foreign_keys=[topic_id], # This table's topic_id column
        primaryjoin="BertLabelledTopicCommunityStats.topic_id == BertTopicDefinition.bert_topic_id",
        # Ensure backref name is unique on BertTopicDefinition model
        backref="bert_labelled_community_stats" 
    )
    
    # Relationship to BertModel (if needed for direct access to model details)
    bert_model_rel = relationship(
        "BertModel",
        foreign_keys=[bert_model_id],
        backref="bert_labelled_topic_stats"
    )

    def __repr__(self):
        return (f"<BertLabelledTopicCommunityStats(topic_id={self.topic_id}, "
                f"bert_model_id={self.bert_model_id}, "
                f"desc='{self.topic_short_description}', count_all={self.count_all_communities})>")

class AnalysisNgramCommunityStats(Base):
    __tablename__ = 'analysis_ngram_community_stats' # Table name for ngram stats

    # Ngram Information
    ngram_id = Column(Integer, ForeignKey('oewg_ngrams_to_use.id'), primary_key=True)
    ngram = Column(String, nullable=True) # Storing ngram text for direct access

    # Raw Counts
    count_A = Column(Integer, nullable=False, default=0)
    count_BCDE = Column(Integer, nullable=False, default=0)
    count_F = Column(Integer, nullable=False, default=0)
    count_G = Column(Integer, nullable=False, default=0)
    count_all_communities = Column(Integer, nullable=False, default=0)

    # Relative Frequencies
    relative_frequency_A = Column(Float, nullable=False, default=0.0)
    relative_frequency_BCDE = Column(Float, nullable=False, default=0.0)
    relative_frequency_F = Column(Float, nullable=False, default=0.0)
    relative_frequency_G = Column(Float, nullable=False, default=0.0)

    # Normalized Frequencies
    normalized_frequency_A = Column(Float, nullable=False, default=0.0)
    normalized_frequency_BCDE = Column(Float, nullable=False, default=0.0)
    normalized_frequency_F = Column(Float, nullable=False, default=0.0)
    normalized_frequency_G = Column(Float, nullable=False, default=0.0)

    # BCDE Difference Metrics
    dif_bcde_to_highest_polar = Column(Float, nullable=True)
    dif_bcde_to_mid_polar_point = Column(Float, nullable=True)
    
    # Polarization Scores
    lor_polarization_score = Column(Float, nullable=True)
    focus_polarization_score = Column(Float, nullable=True)

    # P-value & Derived Flags (using 'True'/'False' strings)
    p_value_ag = Column(Float, nullable=True)
    
    # Likely to remove:
    # p_value_ag_below_05 = Column(String, nullable=True) # 'True' or 'False'
    # bcde_raised_more = Column(String, nullable=True)
    # is_FPS_polarised_in_1st_or_4th_quartile = Column(String, nullable=True)
    # meets_min_relative_frequency = Column(String, nullable=True)
    # either_polarised_or_bcde_raised_more = Column(String, nullable=True)
    # is_polarised_or_bcde_raise_more_and_meets_min_rel_freq = Column(String, nullable=True)

    # Relationship back to the ngram table (optional but recommended)
    ngram_ref = relationship("OewgNgramsToUse", backref="community_stats")

    def __repr__(self):
        return f"<AnalysisNgramCommunityStats(ngram_id={self.ngram_id}, ngram='{self.ngram}', count_all={self.count_all_communities})>"
        
class SentenceTopicAIClassificationPivoted(Base):
    __tablename__ = 'sentence_topic_ai_classification_pivoted'

    id = Column(Integer, primary_key=True, autoincrement=True)  # Unique ID for each classification run/record
    sentence_id = Column(Integer, ForeignKey('speech_sentence.id'), nullable=False, unique=True, index=True)  # Foreign Key to SpeechSentence, unique ensures one classification record per sentence
    topic_ids_json = Column(String, nullable=True)  # Stores the list of topic IDs from Gemini as a JSON string (e.g., '["T-01-01", "T-03-04"]')
    # Optional: Add columns for model name, timestamp, run_id etc. if needed

    # Relationship to SpeechSentence (optional, for ORM access)
    speech_sentence = relationship("SpeechSentence", backref="ai_topic_classification_pivoted")

    def __repr__(self):
        return f"<SentenceTopicAIClassificationPivoted(id={self.id}, sentence_id={self.sentence_id}, topics={self.topic_ids_json})>"

class SentenceTopicAIClassificationUnpivoted(Base):
    __tablename__ = 'sentence_topic_ai_classification_unpivoted'

    # Composite primary key: ensures each sentence-topic pair is unique per classification run
    sentence_id = Column(Integer, ForeignKey('speech_sentence.id'), primary_key=True)
    topic_id = Column(String, ForeignKey('oewg_topics.topic_id'), primary_key=True) # Assuming OewgTopics.topic_id is String based on previous schema
    # Optional: Add column for AI confidence score if available
    # Optional: Add column for model name, timestamp, run_id etc. if needed (might be redundant if pivoted table exists)

    # Relationships (optional, for ORM access)
    speech_sentence = relationship("SpeechSentence", backref="ai_topic_links_unpivoted")
    topic = relationship("OewgTopics", backref="sentence_links_unpivoted")

    __table_args__ = (
        PrimaryKeyConstraint('sentence_id', 'topic_id'),
    )

    def __repr__(self):
        return f"<SentenceTopicAIClassificationUnpivoted(sentence_id={self.sentence_id}, topic_id='{self.topic_id}')>"

class BertModel(Base):
    """
    Stores information about distinct BERTopic model runs used in the analysis.
    Helps normalize model identifiers referenced in other BERTopic-related tables.
    """
    __tablename__ = 'bert_models'

    id = Column(Integer, primary_key=True, autoincrement=True, comment="Unique integer ID for the model run.")
    # Consider making length explicit, e.g., String(512) if paths can be long
    model_identifier = Column(String, nullable=False, unique=True, index=True, comment="Unique identifier for the model (e.g., file path or custom name).")
    description = Column(String, nullable=True, comment="Optional description or notes about the model.")
    # creation_timestamp removed as requested

    def __repr__(self):
        return f"<BertModel(id={self.id}, identifier='{self.model_identifier}')>"

class BertSpeakerAvgTopicProbability(Base):
    """
    Stores the calculated average topic probability distribution for each speaker,
    based on a specific BERTopic model run. Represents the speaker's average topical focus.
    """
    __tablename__ = 'bert_speaker_avg_topic_probability'

    # Composite Primary Key
    speaker = Column(String, primary_key=True, index=True, comment="Identifier of the speaker.")
    bert_model_id = Column(Integer, ForeignKey('bert_models.id'), primary_key=True, index=True, comment="FK to the specific BERTopic model run.")
    bert_topic_id = Column(Integer, ForeignKey('bert_topic_definition.bert_topic_id'), primary_key=True, index=True, comment="FK to the specific BERTopic topic definition.")

    # Calculated Value
    average_probability = Column(Float, nullable=False, comment="Average probability of this topic across all documents for the speaker.")

    # Provenance
    # calculation_timestamp removed as requested

    # Explicitly define the composite primary key and foreign keys
    __table_args__ = (
        PrimaryKeyConstraint('speaker', 'bert_model_id', 'bert_topic_id'),
        # Note: The FK to bert_topic_definition only uses bert_topic_id based on its current PK.
        # If bert_topic_definition PK becomes composite (topic_id, model_id), update FK using ForeignKeyConstraint.
    )

    # Relationships (optional, for ORM convenience)
    bert_model = relationship("BertModel", backref="speaker_avg_probabilities")
    bert_topic_definition = relationship("BertTopicDefinition", backref="speaker_avg_probabilities") # Relationship via bert_topic_id

    def __repr__(self):
        return f"<BertSpeakerAvgTopicProbability(speaker='{self.speaker}', model_id={self.bert_model_id}, topic_id={self.bert_topic_id}, avg_prob={self.average_probability:.4f})>"

class BertSpeakerPairwiseDistance(Base):
    """
    Stores the calculated pairwise distance (similarity) between speakers based on
    their average topic probability vectors derived from a specific BERTopic model run.
    """
    __tablename__ = 'bert_speaker_pairwise_distance'

    # Composite Primary Key components
    # Ensure speaker_1 < speaker_2 lexicographically to store each pair only once
    speaker_1 = Column(String, primary_key=True, index=True, comment="Identifier of the first speaker in the pair.")
    speaker_2 = Column(String, primary_key=True, index=True, comment="Identifier of the second speaker in the pair.")
    bert_model_id = Column(Integer, ForeignKey('bert_models.id'), primary_key=True, index=True, comment="FK to the specific BERTopic model run used for calculation.")
    distance_metric = Column(String, primary_key=True, comment="Name of the distance metric used (e.g., 'JSD', 'Cosine').") # Consider String(50)

    # Calculated Value
    distance_value = Column(Float, nullable=False, comment="Calculated distance between speaker_1 and speaker_2.")

    # Provenance
    # calculation_timestamp removed as requested

    # Explicitly define the composite primary key and add CHECK constraint
    __table_args__ = (
        PrimaryKeyConstraint('speaker_1', 'speaker_2', 'bert_model_id', 'distance_metric'),
        CheckConstraint('speaker_1 < speaker_2', name='ck_speaker_order'),
        # Add index for common filtering/joining
        Index('ix_speaker_pairwise_dist_model_metric', 'bert_model_id', 'distance_metric'),
    )

    # Relationships (optional, for ORM convenience)
    bert_model = relationship("BertModel", backref="speaker_pairwise_distances")

    def __repr__(self):
        return f"<BertSpeakerPairwiseDistance(s1='{self.speaker_1}', s2='{self.speaker_2}', model_id={self.bert_model_id}, metric='{self.distance_metric}', dist={self.distance_value:.4f})>"


class BertTopicDefinition(Base):
    """
    Stores the definition of topics identified by a BERTopic model run.
    Each topic ID (-1 for outliers, 0+ for actual topics) has associated names
    and is linked to the specific model run that generated it.
    """
    __tablename__ = 'bert_topic_definition'

    # ToDo: If we include multiple topic sets from different runs then we will need to ammend the PK as Topic IDs will not be unique at that point.
    bert_topic_id           = Column(Integer, primary_key=True, comment="Topic ID")
    bert_model_id           = Column(Integer, ForeignKey('bert_models.id'), nullable=False, index=True, comment="Model FK")
    bert_topic_name_default = Column(String, nullable=True, comment="Default name")
    bert_topic_name_custom  = Column(String, nullable=True, comment="Custom name")

    model                   = relationship("BertModel", backref="topic_definitions")

    # If tracking definitions across multiple runs of the same model is needed,
    # consider adding a model run timestamp/ID and making the PK composite.
    
    def __repr__(self): return f"<BertTopicDefinition(id={self.bert_topic_id}, model_id={self.bert_model_id}, name={self.bert_topic_name_default!r})>"


class BertTopicKeyword(Base):
    """
    Stores the top N keywords associated with each topic defined by a specific
    BERTopic model run, along with their relevance scores (e.g., c-TF-IDF).
    """
    __tablename__ = 'bert_topic_keywords'

    bert_topic_id      = Column(Integer, ForeignKey('bert_topic_definition.bert_topic_id'), primary_key=True, comment="FK to the BERTopic definition.")
    bert_keyword_rank  = Column(Integer, primary_key=True, comment="Rank of the keyword within the topic (1 = most relevant, 2 = second most, etc.).")
    bert_keyword       = Column(String, nullable=False, comment="The keyword text.")
    bert_keyword_score = Column(Float, nullable=False, comment="Relevance score (e.g., c-TF-IDF) of the keyword for the topic.")
    bert_model_id      = Column(Integer, ForeignKey('bert_models.id'), nullable=False, index=True, comment="FK to the specific BERTopic model run.")

    __table_args__ = (
        PrimaryKeyConstraint('bert_topic_id', 'bert_keyword_rank'),
        Index('ix_bert_topic_keywords_model_id', 'bert_model_id'),
    )

    # Relationships for ORM convenience (optional but recommended)
    bert_topic_definition = relationship("BertTopicDefinition", backref="keywords")

    def __repr__(self):
        return f"<BertTopicKeyword(topic_id={self.bert_topic_id}, rank={self.bert_keyword_rank}, keyword='{self.bert_keyword}', score={self.bert_keyword_score:.4f})>"

class BertSentenceTopicProbability(Base):  # <<< Renamed class and table
    """
    Stores the top N topic probabilities assigned to each sentence by a specific
    BERTopic model run. This uses a 'long' format where each row represents
    one topic assignment rank for a given sentence.

    !! WARNING !! Bert provides the probabilities only for non-outlier topics (i.e. not -1).
    So for docs whose primary topic is Outlier (-1) the top ranked keyword in this table will *not* be Outlier it will be the closest 'normal' topic.
    """
    __tablename__ = 'bert_sentence_topic_probabilities'  # <<< Renamed table

    # Composite Primary Key ensures uniqueness per sentence and rank
    sentence_id             = Column(Integer, ForeignKey('speech_sentence.id'), primary_key=True, comment="FK to the specific sentence.")
    bert_topic_rank         = Column(Integer, primary_key=True, comment="Rank of the topic for this sentence (1 = highest probability, 2 = second highest, etc.).")

    # Context and Foreign Keys
    intervention_id         = Column(Integer, ForeignKey('intervention.id'), nullable=False, index=True, comment="FK to the intervention containing the sentence.")
    bert_topic_id           = Column(Integer, ForeignKey('bert_topic_definition.bert_topic_id'), nullable=False, index=True, comment="FK to the BERTopic definition for this rank.")
    bert_probability_score  = Column(Float, nullable=False, comment="Probability or score assigned by BERTopic for this topic rank.")

    # Provenance Information
    bert_model_id           = Column(Integer, ForeignKey('bert_models.id'), nullable=False, index=True, comment="FK to the specific BERTopic model run")
    prediction_timestamp    = Column(DateTime, nullable=False, default=datetime.datetime.utcnow, comment="Timestamp when this probability was calculated.")

    # Explicitly define the composite primary key constraint
    __table_args__ = (
        PrimaryKeyConstraint('sentence_id', 'bert_topic_rank'),
    )

    # Relationships for ORM convenience (optional but recommended)
    speech_sentence            = relationship("SpeechSentence", backref="bert_topic_probabilities")
    intervention               = relationship("Intervention", backref="bert_topic_sentence_probabilities")
    bert_topic_definition      = relationship("BertTopicDefinition", backref="sentence_probabilities")

    def __repr__(self):
        return f"<BertSentenceTopicProbability(sent_id={self.sentence_id}, rank={self.bert_topic_rank}, topic_id={self.bert_topic_id}, score={self.bert_probability_score:.4f})>"



# Create the engine for ORM operations
DATABASE_URL = f"sqlite:///{AppConfig.DB_FILE}" # Explicitly define DATABASE_URL for clarity
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}) # Added connect_args

# Create the SessionLocal class (this is the session factory)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create the DDL statement for the new view
frequency_distribution_of_ngrams = DDL(
    """
    CREATE VIEW IF NOT EXISTS FrequencyDistributionOfNgrams AS
    WITH freq_counts AS (
        SELECT s.count_all_communities AS frequency
        FROM oewg_ngram_statistics AS s
    ),
    summaries AS (
        SELECT
            frequency,
            COUNT(*) AS number_of_ngrams
        FROM freq_counts
        GROUP BY frequency
    ),
    grand_total AS (
        SELECT SUM(number_of_ngrams) AS sum_ngrams
        FROM summaries
    ),
    cumulative_calc AS (
        SELECT
            s1.frequency,
            s1.number_of_ngrams,
            (
                SELECT SUM(s2.number_of_ngrams)
                FROM summaries s2
                WHERE s2.frequency >= s1.frequency
            ) AS cumulative_total
        FROM summaries s1
    )
    SELECT
        c.frequency,
        c.number_of_ngrams,
        c.cumulative_total,
        CAST(c.cumulative_total AS FLOAT)/gt.sum_ngrams*100 AS cumulative_percentage
    FROM cumulative_calc c
    CROSS JOIN grand_total gt
    ORDER BY frequency DESC;
    """
)

create_vw_ngram_sentence_samples = DDL("""
CREATE VIEW IF NOT EXISTS vw_ngram_sentence_samples AS
SELECT
    s.ngram_id,
    s.sentence_id,
    n.ngram,
    ss.sentence_full
FROM oewg_ngram_sentence_samples s
JOIN oewg_ngrams_to_use n ON s.ngram_id = n.id
JOIN speech_sentence ss ON s.sentence_id = ss.id;
"""
)

create_vw_ngram_usefulness_rating = DDL("""
CREATE VIEW IF NOT EXISTS vw_ngram_usefulness_rating AS
SELECT 
    r.rating_id,
    r.ngram_id,
    n.ngram,
    r.rating,
    r.reason,
    r.api_call_round,
    r.source
FROM oewg_ngram_usefulness_ai_rating r
JOIN oewg_ngrams_to_use n ON r.ngram_id = n.id;
"""
)

create_vw_lowest_rated_ngrams_for_review = DDL("""
CREATE VIEW IF NOT EXISTS vw_lowest_rated_ngrams_for_review AS
SELECT
    r.ngram_id,
    n.ngram,
    ROUND(AVG(r.rating), 2) AS average_rating,
    (
        SELECT group_concat(sentence_full, '|||')
        FROM vw_ngram_sentence_samples
        WHERE ngram_id = r.ngram_id
    ) AS list_of_examples,
    group_concat(r.reason, '|||') AS list_of_reasons
FROM oewg_ngram_usefulness_ai_rating r
JOIN oewg_ngrams_to_use n ON n.id = r.ngram_id
GROUP BY r.ngram_id, n.ngram
HAVING SUM(CASE WHEN r.rating <= 3 THEN 1 ELSE 0 END) >= 2
"""
)

create_vw_ngrams_to_already_matched_topics = DDL("""
CREATE VIEW IF NOT EXISTS vw_ngrams_to_already_matched_topics AS
SELECT
    n.id AS ngram_id,
    ca.ngram_cluster_from_ss AS cluster,
    n.ngram,
    t.topic_name,
    t.topic_group,
    (
        SELECT GROUP_CONCAT(ss.sentence_full, ' | ')
        FROM oewg_ngram_sentence_samples ognss
        JOIN speech_sentence ss ON ognss.sentence_id = ss.id
        WHERE ognss.ngram_id = n.id
    ) AS sample_sentences_concatenated
FROM
    oewg_ngrams_to_use n
LEFT JOIN
    oewg_ngram_cluster_from_shared_sentences ca ON ca.ngram_id = n.id
LEFT JOIN
    oewg_ngrams_to_topic_names j ON n.ngram = j.ngram
LEFT JOIN
    oewg_topics t ON j.topic_name = t.topic_name
WHERE
    n.is_filtered_out = 0;
"""
)

create_country_speaker_gender = DDL("""
CREATE VIEW IF NOT EXISTS vw_country_speaker_gender AS
SELECT
    i.id AS intervention_id,
    i.speaker,
    i.speaker_type,
    -- Add other relevant intervention columns if needed for context
    -- i.meeting,
    -- i.session_number,
    COALESCE(
        ip.gender_from_photo,             -- Priority 1: Gender from photo
        iags.gender_not_from_photo,       -- Priority 2: Gender from alternative source
        '*** GENDER DATA MISSING ***'     -- Fallback if neither exists
    ) AS gender
FROM
    intervention i
LEFT JOIN
    intervention_photo ip ON i.id = ip.intervention_id
LEFT JOIN
    intervention_alternative_gender_source iags ON i.id = iags.intervention_id
WHERE
    i.speaker_type = 'country'; -- <<< Hardcoded filter added here
"""
)

create_vw_country_photos_to_take = DDL("""
CREATE VIEW IF NOT EXISTS vw_country_photos_to_take AS
SELECT
    i.id AS intervention_id,
    i.speaker,
    i.speaker_type
    -- Add other relevant intervention columns if needed for context
FROM
    intervention i
LEFT JOIN
    intervention_photo ip ON i.id = ip.intervention_id
WHERE
    ip.intervention_id IS NULL -- Select interventions NOT present in intervention_photo
    AND i.speaker_type = 'country'; -- <<< Hardcoded filter added here (combined with AND)
"""
)

create_vw_interventions_to_wic_fellow_or_not = DDL("""
CREATE VIEW IF NOT EXISTS vw_interventions_to_wic_fellow_or_not AS
SELECT
    i.id AS intervention_id,
    CASE
        WHEN i.speaker_type != 'country' THEN 0  -- Rule 1: Not country speaker_type, definitely not WIC
        WHEN csg.gender = 'female' AND EXISTS (  -- Rule 2: Country speaker, female gender, and attendance record
            SELECT 1
            FROM wic_fellow_attendance_record wfar
            WHERE wfar.fellow_iso = i.speaker
              AND wfar.oewg_session = i.session_number
              AND wfar.attendance_at = 'session'
              AND wfar.attendance_status = 'Yes'
        ) THEN 1
        ELSE 0  -- Rule 3: Otherwise, not likely WIC fellow
    END AS likely_wic_fellow
FROM
    intervention i
LEFT JOIN
    vw_country_speaker_gender csg ON i.id = csg.intervention_id; -- Join with vw_country_speaker_gender
""")

create_vw_ngram_sentence_unpivoted = DDL("""
CREATE VIEW IF NOT EXISTS vw_ngram_sentence_unpivoted AS
SELECT
    j.ngram_id AS ngram_id,
    n.ngram AS ngram,
    j.sentence_id AS sentence_id,
    s.intervention_id AS intervention_id,
    s.sentence_full AS sentence_full,
    s.sentence_cleaned AS cleaned_sentence,
    (LENGTH(TRIM(s.sentence_cleaned)) - LENGTH(REPLACE(TRIM(s.sentence_cleaned), ' ', '')) + 1) AS word_count
FROM
    junc_sentence_id_to_ngram_id j
JOIN
    oewg_ngrams_to_use n ON j.ngram_id = n.id
JOIN
    speech_sentence s ON j.sentence_id = s.id;
""")

# Add this DDL statement to your db_models.py

create_vw_analysis_ai_labelled_topic_freq_by_community = DDL("""
CREATE VIEW IF NOT EXISTS vw_analysis_ai_labelled_topic_freq_by_community AS -- Renamed View
WITH SentenceCommunityTopics AS (
    -- Link unpivoted sentence-topic classifications to the speaker's community
    SELECT
        stacu.topic_id,
        c.cpm_community_after_10_CPM_0_53 AS community
    FROM sentence_topic_ai_classification_unpivoted stacu
    JOIN speech_sentence ss ON stacu.sentence_id = ss.id
    JOIN intervention i ON ss.intervention_id = i.id
    -- Join intervention speaker to country table ON country.id to get community
    JOIN country c ON i.speaker = c.id
    WHERE i.speaker_type = 'country' -- Ensure we only count sentences from country speakers
),
TopicCommunityCounts AS (
    -- Aggregate the counts per topic for each community
    SELECT
        sct.topic_id,
        SUM(CASE WHEN sct.community = 'A' THEN 1 ELSE 0 END) AS count_A,
        SUM(CASE WHEN sct.community = 'B' THEN 1 ELSE 0 END) AS count_B,
        SUM(CASE WHEN sct.community = 'C' THEN 1 ELSE 0 END) AS count_C,
        SUM(CASE WHEN sct.community = 'D' THEN 1 ELSE 0 END) AS count_D,
        SUM(CASE WHEN sct.community = 'E' THEN 1 ELSE 0 END) AS count_E,
        SUM(CASE WHEN sct.community = 'F' THEN 1 ELSE 0 END) AS count_F,
        SUM(CASE WHEN sct.community = 'G' THEN 1 ELSE 0 END) AS count_G,
        COUNT(*) AS count_all -- Total sentences counted for this topic (from countries)
    FROM SentenceCommunityTopics sct
    GROUP BY sct.topic_id
)
-- Final selection: Left join all topics with their community counts
SELECT
    t.topic_id,
    t.topic_name,
    t.topic_short_description, -- Equivalent to old 'topic'
    t.topic_group,             -- New field from OewgTopics
    -- t.topic_name AS topic_as_given_to_ai_labeller, -- If topic_name matches the old field, use it. Adjust if needed.
    COALESCE(tcc.count_A, 0) AS A,
    COALESCE(tcc.count_B, 0) AS B,
    COALESCE(tcc.count_C, 0) AS C,
    COALESCE(tcc.count_D, 0) AS D,
    COALESCE(tcc.count_E, 0) AS E,
    COALESCE(tcc.count_F, 0) AS F,
    COALESCE(tcc.count_G, 0) AS G,
    COALESCE(tcc.count_all, 0) AS all_communities
FROM oewg_topics t
LEFT JOIN TopicCommunityCounts tcc ON t.topic_id = tcc.topic_id
ORDER BY all_communities DESC;
""")

create_vw_analysis_ai_labelled_topic_freq_by_community = DDL("""
CREATE VIEW IF NOT EXISTS vw_analysis_ai_labelled_topic_freq_by_community AS -- Renamed View
WITH SentenceCommunityTopics AS (
    -- Link unpivoted sentence-topic classifications to the speaker's community
    SELECT
        stacu.topic_id,
        c.cpm_community_after_10_CPM_0_53 AS community
    FROM sentence_topic_ai_classification_unpivoted stacu
    JOIN speech_sentence ss ON stacu.sentence_id = ss.id
    JOIN intervention i ON ss.intervention_id = i.id
    -- Join intervention speaker to country table ON country.id to get community
    JOIN country c ON i.speaker = c.id
    WHERE i.speaker_type = 'country' -- Ensure we only count sentences from country speakers
),
TopicCommunityCounts AS (
    -- Aggregate the counts per topic for each community
    SELECT
        sct.topic_id,
        SUM(CASE WHEN sct.community = 'A' THEN 1 ELSE 0 END) AS count_A,
        SUM(CASE WHEN sct.community = 'B' THEN 1 ELSE 0 END) AS count_B,
        SUM(CASE WHEN sct.community = 'C' THEN 1 ELSE 0 END) AS count_C,
        SUM(CASE WHEN sct.community = 'D' THEN 1 ELSE 0 END) AS count_D,
        SUM(CASE WHEN sct.community = 'E' THEN 1 ELSE 0 END) AS count_E,
        SUM(CASE WHEN sct.community = 'F' THEN 1 ELSE 0 END) AS count_F,
        SUM(CASE WHEN sct.community = 'G' THEN 1 ELSE 0 END) AS count_G,
        COUNT(*) AS count_all -- Total sentences counted for this topic (from countries)
    FROM SentenceCommunityTopics sct
    GROUP BY sct.topic_id
)
-- Final selection: Left join all topics with their community counts
SELECT
    t.topic_id,
    t.topic_name,
    t.topic_short_description, -- Equivalent to old 'topic'
    t.topic_group,             -- New field from OewgTopics
    COALESCE(tcc.count_A, 0) AS A,
    COALESCE(tcc.count_B, 0) AS B,
    COALESCE(tcc.count_C, 0) AS C,
    COALESCE(tcc.count_D, 0) AS D,
    COALESCE(tcc.count_E, 0) AS E,
    COALESCE(tcc.count_F, 0) AS F,
    COALESCE(tcc.count_G, 0) AS G,
    COALESCE(tcc.count_all, 0) AS all_communities
FROM oewg_topics t
LEFT JOIN TopicCommunityCounts tcc ON t.topic_id = tcc.topic_id
ORDER BY all_communities DESC;
""")

# --- NEW VIEW DEFINITION ---
create_vw_analysis_bert_labelled_topic_freq_by_community = DDL("""
CREATE VIEW IF NOT EXISTS vw_analysis_bert_labelled_topic_freq_by_community AS
WITH SentenceCommunityBertTopics AS (
    -- Link sentences with their primary, non-outlier, high-confidence BERTopic
    -- to the speaker's community
    SELECT
        bstp.bert_topic_id AS topic_id, -- This is the BERTopic ID
        c.cpm_community_after_10_CPM_0_53 AS community,
        bstp.bert_model_id -- Keep model_id for potential use in topic_group
    FROM bert_sentence_topic_probabilities bstp
    JOIN speech_sentence ss ON bstp.sentence_id = ss.id
    JOIN intervention i ON ss.intervention_id = i.id
    JOIN country c ON i.speaker = c.id
    WHERE i.speaker_type = 'country'            -- Only country speakers
      AND bstp.bert_topic_rank = 1              -- Primary topic for the sentence
      AND bstp.bert_topic_id != -1              -- Not an outlier topic
      AND bstp.bert_probability_score >= 0.3    -- Confidence threshold
),
BertTopicCommunityCounts AS (
    -- Aggregate the counts per BERTopic for each community
    SELECT
        sct.topic_id,
        sct.bert_model_id, -- Pass model_id through
        SUM(CASE WHEN sct.community = 'A' THEN 1 ELSE 0 END) AS count_A,
        SUM(CASE WHEN sct.community = 'B' THEN 1 ELSE 0 END) AS count_B,
        SUM(CASE WHEN sct.community = 'C' THEN 1 ELSE 0 END) AS count_C,
        SUM(CASE WHEN sct.community = 'D' THEN 1 ELSE 0 END) AS count_D,
        SUM(CASE WHEN sct.community = 'E' THEN 1 ELSE 0 END) AS count_E,
        SUM(CASE WHEN sct.community = 'F' THEN 1 ELSE 0 END) AS count_F,
        SUM(CASE WHEN sct.community = 'G' THEN 1 ELSE 0 END) AS count_G,
        COUNT(*) AS count_all -- Total sentences counted for this BERTopic
    FROM SentenceCommunityBertTopics sct
    GROUP BY sct.topic_id, sct.bert_model_id
)
-- Final selection: Left join all BERTopic definitions with their community counts
SELECT
    btd.bert_topic_id AS topic_id,
    -- Use custom name if available, otherwise default. This matches OewgTopics more closely.
    COALESCE(btd.bert_topic_name_custom, btd.bert_topic_name_default) AS topic_name,
    -- For structural similarity, use the topic name again as short description
    COALESCE(btd.bert_topic_name_custom, btd.bert_topic_name_default) AS topic_short_description,
    -- Use the bert_model_id as the 'topic_group' for structural similarity
    CAST(btd.bert_model_id AS TEXT) AS topic_group,
    COALESCE(btcc.count_A, 0) AS A,
    COALESCE(btcc.count_B, 0) AS B,
    COALESCE(btcc.count_C, 0) AS C,
    COALESCE(btcc.count_D, 0) AS D,
    COALESCE(btcc.count_E, 0) AS E,
    COALESCE(btcc.count_F, 0) AS F,
    COALESCE(btcc.count_G, 0) AS G,
    COALESCE(btcc.count_all, 0) AS all_communities
FROM bert_topic_definition btd
LEFT JOIN BertTopicCommunityCounts btcc ON btd.bert_topic_id = btcc.topic_id AND btd.bert_model_id = btcc.bert_model_id
WHERE btd.bert_topic_id != -1 -- Exclude the outlier topic definition itself from the final list
ORDER BY all_communities DESC;
""")

create_vw_ngram_ai_topic_exclusive_match_count = DDL("""
CREATE VIEW IF NOT EXISTS vw_ngram_ai_topic_exclusive_match_count AS
WITH cte_single_ngram_sentences AS (
    -- Find sentences linked to exactly one ngram
    SELECT
        sentence_id,
        ngram_id
    FROM junc_sentence_id_to_ngram_id -- Use actual table name
    GROUP BY
        sentence_id
    HAVING
        COUNT(ngram_id) = 1
),
cte_single_topic_sentences AS (
    -- Find sentences linked to exactly one topic
    SELECT
        sentence_id,
        topic_id
    FROM sentence_topic_ai_classification_unpivoted -- Use actual table name
    GROUP BY
        sentence_id
    HAVING
        COUNT(topic_id) = 1
),
cte_exclusive_matches AS (
    -- Find sentences linked to exactly one ngram AND exactly one topic
    SELECT
        s_ngram.sentence_id,
        s_ngram.ngram_id,
        s_topic.topic_id
    FROM
        cte_single_ngram_sentences s_ngram
    INNER JOIN
        cte_single_topic_sentences s_topic ON s_ngram.sentence_id = s_topic.sentence_id
),
cte_match_counts AS (
    -- Count the number of exclusive sentence matches per (ngram, topic) pair
    SELECT
        ngram_id,
        topic_id,
        COUNT(sentence_id) AS match_count
    FROM
        cte_exclusive_matches
    GROUP BY
        ngram_id,
        topic_id
)
-- Final selection joining all ngrams with their potential exclusive matches and topic details
SELECT
    ng.id AS ngram_id, -- Use ng.id and alias it
    ng.ngram,
    mc.topic_id AS matched_topic_id,
    ts.topic_short_description AS matched_topic_name,
    topics.topic_group AS matched_topic_group, -- Added topic_group from oewg_topics
    -- The match count (will be NULL if no exclusive match found)
    mc.match_count
    -- Removed: matched_topic_quartile_flag, matched_topic_p_value_flag, matched_topic_fps
FROM
    oewg_ngrams_to_use ng -- Start with all ngrams to use
LEFT JOIN
    cte_match_counts mc ON ng.id = mc.ngram_id -- Join using ng.id
LEFT JOIN
    analysis_ai_labelled_topic_community_stats ts ON mc.topic_id = ts.topic_id -- Get topic description
LEFT JOIN
    oewg_topics topics ON mc.topic_id = topics.topic_id -- Join to get topic_group
WHERE
    ng.is_filtered_out = 0; -- Only include ngrams marked for use
""")

create_vw_bert_topic_to_ai_topic_exclusive_match_count = DDL("""
    CREATE VIEW IF NOT EXISTS vw_bert_topic_to_ai_topic_exclusive_match_count AS
    WITH cte_single_ai_topic_sentences AS (
        -- Find sentences linked to exactly one AI topic
        SELECT
            sentence_id,
            topic_id -- This is the AI topic ID from the unpivoted table
        FROM sentence_topic_ai_classification_unpivoted
        GROUP BY
            sentence_id
        HAVING
            COUNT(topic_id) = 1
    ),
    cte_single_bert_topic_sentences AS (
        -- Find sentences whose primary BERTopic (Rank 1) is not an outlier
        SELECT
            sentence_id,
            bert_topic_id,
            bert_model_id -- Keep track of which bert model assigned it
        FROM bert_sentence_topic_probabilities
        WHERE
            bert_topic_rank = 1
            AND bert_topic_id != -1
    ),
    cte_exclusive_matches AS (
        -- Find sentences linked exclusively to one AI topic AND one BERTopic (for a specific model run)
        SELECT
            s_bert.sentence_id,
            s_bert.bert_topic_id,
            s_ai.topic_id AS ai_topic_id, -- Rename AI topic ID for clarity
            s_bert.bert_model_id
        FROM
            cte_single_bert_topic_sentences s_bert
        INNER JOIN
            cte_single_ai_topic_sentences s_ai ON s_bert.sentence_id = s_ai.sentence_id
    ),
    cte_match_counts AS (
        -- Count the number of exclusive sentence matches per (BERTopic, AI Topic, Model) triplet
        SELECT
            bert_topic_id,
            ai_topic_id,
            bert_model_id,
            COUNT(sentence_id) AS match_count
        FROM
            cte_exclusive_matches
        GROUP BY
            bert_topic_id,
            ai_topic_id,
            bert_model_id
    )
    -- Final selection: Output the counts per BERTopic/AI Topic pair for each model
    SELECT
        bert_topic_id,
        ai_topic_id,
        match_count,
        bert_model_id -- Include model name to know which BERTopic run this relates to
    FROM
        cte_match_counts;
    """)

create_vw_avg_topic_prob_network_nodes = DDL("""
    CREATE VIEW IF NOT EXISTS vw_avg_topic_prob_network_nodes AS
    SELECT
        speaker_1 AS speaker, -- Alias speaker_1 as speaker
        bert_model_id         -- Keep track of the model
    FROM bert_speaker_pairwise_distance
    UNION -- Combines results from speaker_1 and speaker_2, ensuring distinct speakers
    SELECT
        speaker_2 AS speaker, -- Alias speaker_2 as speaker
        bert_model_id         -- Keep track of the model
    FROM bert_speaker_pairwise_distance;
    """)

create_vw_avg_topic_prob_network_edges = DDL("""
    CREATE VIEW IF NOT EXISTS vw_avg_topic_prob_network_edges AS
    SELECT
        speaker_1,                  -- Source node
        speaker_2,                  -- Target node
        bert_model_id,              -- Model identifier
        distance_metric,            -- Metric used (e.g., 'JSD')
        distance_value,             -- Original distance (lower = more similar)
        (1.0 - distance_value) AS similarity_weight -- Calculated weight (higher = more similar)
    FROM bert_speaker_pairwise_distance;
    """)

create_vw_country_ngram_sentence_counts = DDL("""
CREATE VIEW IF NOT EXISTS vw_country_ngram_sentence_counts AS
SELECT
    i.speaker AS country_speaker,
    ntu.id AS ngram_id,         -- ID from oewg_ngrams_to_use
    ntu.ngram AS ngram_text,    -- Ngram text from oewg_ngrams_to_use
    COUNT(DISTINCT j.sentence_id) AS count_sentences_for_ngram_by_country
FROM
    intervention i
JOIN
    speech_sentence ss ON i.id = ss.intervention_id
JOIN
    junc_sentence_id_to_ngram_id j ON ss.id = j.sentence_id
JOIN
    oewg_ngrams_to_use ntu ON j.ngram_id = ntu.id
WHERE
    i.speaker_type = 'country'
    AND i.speaker != 'PSE'        -- Your specific filter for non-PSE speakers
    AND ntu.is_filtered_out = 0   -- Only use ngrams not filtered out
GROUP BY
    i.speaker,
    ntu.id,
    ntu.ngram;
""")

# --- Register Event Listeners for ALL Views ---

event.listen(NgramStatistics.__table__, 'after_create', frequency_distribution_of_ngrams)
event.listen(OewgNgramSentenceSamples.__table__, 'after_create', create_vw_ngram_sentence_samples)
event.listen(OewgNgramUsefulnessAiRating.__table__, 'after_create', create_vw_ngram_usefulness_rating)
event.listen(OewgNgramUsefulnessAiRating.__table__, 'after_create', create_vw_lowest_rated_ngrams_for_review)
event.listen(OewgTopics.__table__, 'after_create', create_vw_ngrams_to_already_matched_topics)
event.listen(InterventionPhoto.__table__, 'after_create', create_vw_country_photos_to_take)
event.listen(InterventionAlternativeGenderSource.__table__, 'after_create', create_country_speaker_gender)
event.listen(WicFellowAttendanceRecord.__table__, 'after_create', create_vw_interventions_to_wic_fellow_or_not)
event.listen(JuncSentenceToNgram.__table__, 'after_create', create_vw_ngram_sentence_unpivoted)
event.listen(JuncSentenceToNgram.__table__, 'after_create', create_vw_country_ngram_sentence_counts)
event.listen(SentenceTopicAIClassificationUnpivoted.__table__, 'after_create', create_vw_analysis_ai_labelled_topic_freq_by_community)
event.listen(BertSentenceTopicProbability.__table__, 'after_create', create_vw_analysis_bert_labelled_topic_freq_by_community)
event.listen(SentenceTopicAIClassificationUnpivoted.__table__, 'after_create', create_vw_ngram_ai_topic_exclusive_match_count)
event.listen(BertSentenceTopicProbability.__table__, 'after_create', create_vw_bert_topic_to_ai_topic_exclusive_match_count)
event.listen(BertSpeakerPairwiseDistance.__table__, 'after_create', create_vw_avg_topic_prob_network_nodes)
event.listen(BertSpeakerPairwiseDistance.__table__, 'after_create', create_vw_avg_topic_prob_network_edges)

if __name__ == "__main__":
    Base.metadata.create_all(engine)
    print("Tables created successfully.")