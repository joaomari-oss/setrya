from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Playlist(Base):
    __tablename__ = "playlists"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    cover_url = Column(String(1000), nullable=True)
    is_auto_generated = Column(Boolean, default=False)
    target_duration_min = Column(Integer, default=120)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="playlists")
    tracks = relationship("PlaylistTrack", back_populates="playlist", order_by="PlaylistTrack.position", cascade="all, delete-orphan")


class PlaylistTrack(Base):
    __tablename__ = "playlist_tracks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    playlist_id = Column(UUID(as_uuid=True), ForeignKey("playlists.id", ondelete="CASCADE"), nullable=False)
    track_id = Column(UUID(as_uuid=True), ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    position = Column(Integer, nullable=False)

    # Transition metadata
    transition_type = Column(String(50), nullable=True)   # e.g. "quick_cut", "long_fade", "drop"
    mix_in_offset = Column(Integer, nullable=True)        # ms override
    mix_out_offset = Column(Integer, nullable=True)       # ms override
    transition_notes = Column(Text, nullable=True)

    playlist = relationship("Playlist", back_populates="tracks")
    track = relationship("Track", back_populates="playlist_tracks")
