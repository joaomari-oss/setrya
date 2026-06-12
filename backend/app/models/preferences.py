from sqlalchemy import Column, Float, Integer, DateTime, ForeignKey, JSON, String
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
import uuid
from app.database import Base
from app.config import settings


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    preferred_bpm_min = Column(Float, default=120.0)
    preferred_bpm_max = Column(Float, default=145.0)
    preferred_genres = Column(ARRAY(String), default=list)
    preferred_keys = Column(ARRAY(String), default=list)    # Camelot keys
    preferred_energy_min = Column(Float, default=0.5)
    preferred_energy_max = Column(Float, default=1.0)

    # Learned patterns (JSON)
    transition_patterns = Column(JSON, default=dict)
    set_structure_pattern = Column(JSON, default=dict)
    mixing_style = Column(String(50), nullable=True)

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="preferences")


class TrackEmbedding(Base):
    __tablename__ = "track_embeddings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    track_id = Column(UUID(as_uuid=True), ForeignKey("tracks.id", ondelete="CASCADE"), unique=True, nullable=False)
    # pgvector column — native cosine/L2 similarity search in Supabase Postgres
    vector = Column(Vector(settings.embedding_dim), nullable=False)
    model_version = Column(String(50), default="v1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    track = relationship("Track", back_populates="embedding")


class ListeningHistory(Base):
    __tablename__ = "listening_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    track_id = Column(UUID(as_uuid=True), ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    played_at = Column(DateTime(timezone=True), server_default=func.now())
    play_duration_ms = Column(Integer, nullable=True)
    context = Column(String(50), nullable=True)  # "set", "preview", "analysis"

    user = relationship("User", back_populates="listening_history")
    track = relationship("Track", back_populates="listening_history")
