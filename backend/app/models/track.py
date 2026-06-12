from sqlalchemy import Column, String, Float, Integer, DateTime, Enum as SAEnum, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base


class ExternalSource(str, enum.Enum):
    local = "local"
    spotify = "spotify"
    soundcloud = "soundcloud"
    beatport = "beatport"


class Track(Base):
    __tablename__ = "tracks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    artist = Column(String(500), nullable=False)
    album = Column(String(500), nullable=True)
    duration_ms = Column(Integer, nullable=True)

    # Audio analysis
    bpm = Column(Float, nullable=True)
    key = Column(String(10), nullable=True)          # e.g. "8A" (Camelot)
    key_standard = Column(String(10), nullable=True) # e.g. "Am"
    energy = Column(Float, nullable=True)            # 0.0 - 1.0
    danceability = Column(Float, nullable=True)      # 0.0 - 1.0
    valence = Column(Float, nullable=True)           # 0.0 - 1.0
    loudness = Column(Float, nullable=True)          # dB
    genre = Column(String(100), nullable=True)
    subgenre = Column(String(100), nullable=True)

    # Cue points (JSON array of ms positions)
    cue_points = Column(ARRAY(Float), nullable=True)
    mix_in_point = Column(Float, nullable=True)      # ms
    mix_out_point = Column(Float, nullable=True)     # ms

    # Storage (Supabase Storage)
    file_path = Column(String(1000), nullable=True)      # local fallback path
    storage_key = Column(String(1000), nullable=True)    # object key in audio bucket
    audio_url = Column(String(1000), nullable=True)       # signed/public URL for playback
    waveform_path = Column(String(1000), nullable=True)
    waveform_url = Column(String(1000), nullable=True)    # waveform JSON public URL
    waveform_peaks = Column(JSON, nullable=True)          # inline peak array [0..1]
    cover_url = Column(String(1000), nullable=True)

    # External
    external_source = Column(SAEnum(ExternalSource), default=ExternalSource.local)
    external_id = Column(String(255), nullable=True)
    preview_url = Column(String(1000), nullable=True)

    # Meta
    is_analyzed = Column(Integer, default=0)  # 0=pending, 1=done, 2=failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    playlist_tracks = relationship("PlaylistTrack", back_populates="track")
    embedding = relationship("TrackEmbedding", back_populates="track", uselist=False, cascade="all, delete-orphan")
    listening_history = relationship("ListeningHistory", back_populates="track")
