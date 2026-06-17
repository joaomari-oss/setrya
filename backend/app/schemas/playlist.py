from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.schemas.track import TrackResponse


class PlaylistTrackItem(BaseModel):
    track: TrackResponse
    position: int
    transition_type: Optional[str] = None
    transition_notes: Optional[str] = None

    model_config = {"from_attributes": True}


class PlaylistCreate(BaseModel):
    name: str
    description: Optional[str] = None
    target_duration_min: Optional[int] = 120


class PlaylistUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class PlaylistResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    cover_url: Optional[str] = None
    is_auto_generated: bool
    track_count: int = 0
    created_at: datetime
    tracks: Optional[List[PlaylistTrackItem]] = None

    model_config = {"from_attributes": True}


class SetGeneratorRequest(BaseModel):
    track_count: int = 20
    target_bpm_min: Optional[float] = None
    target_bpm_max: Optional[float] = None
    target_genres: Optional[List[str]] = None
    energy_curve: str = "standard"   # standard | dark | euphoric | warm
    seed_track_ids: Optional[List[UUID]] = None
    name: Optional[str] = None


class OnlineSetRequest(BaseModel):
    query: str                       # search seed, e.g. "melodic techno", an artist, a vibe
    track_count: int = 10
    energy_curve: str = "standard"   # standard | dark | euphoric | warm
    sources: Optional[List[str]] = None  # subset of available; None = all available
    name: Optional[str] = None


class SetGeneratorResponse(BaseModel):
    playlist: PlaylistResponse
    energy_curve: List[float]
    bpm_progression: List[float]
    key_progression: List[str]
    generation_notes: str
