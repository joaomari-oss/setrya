from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class TrackBase(BaseModel):
    title: str
    artist: str
    album: Optional[str] = None


class TrackCreate(TrackBase):
    external_source: Optional[str] = "local"
    external_id: Optional[str] = None
    preview_url: Optional[str] = None
    cover_url: Optional[str] = None


class TrackAnalysis(BaseModel):
    bpm: Optional[float] = None
    key: Optional[str] = None
    key_standard: Optional[str] = None
    energy: Optional[float] = None
    danceability: Optional[float] = None
    valence: Optional[float] = None
    loudness: Optional[float] = None
    genre: Optional[str] = None
    subgenre: Optional[str] = None
    cue_points: Optional[List[float]] = None
    mix_in_point: Optional[float] = None
    mix_out_point: Optional[float] = None


class TrackResponse(TrackBase):
    id: UUID
    bpm: Optional[float] = None
    key: Optional[str] = None
    energy: Optional[float] = None
    danceability: Optional[float] = None
    genre: Optional[str] = None
    cover_url: Optional[str] = None
    preview_url: Optional[str] = None
    audio_url: Optional[str] = None
    waveform_url: Optional[str] = None
    duration_ms: Optional[int] = None
    is_analyzed: int = 0
    external_source: str = "local"
    created_at: datetime

    model_config = {"from_attributes": True}


class TrackWaveform(BaseModel):
    track_id: UUID
    peaks: List[float]
    audio_url: Optional[str] = None


class TrackCompatibility(BaseModel):
    track_a_id: UUID
    track_b_id: UUID
    bpm_diff: float
    key_compatible: bool
    camelot_distance: int
    energy_diff: float
    overall_score: float  # 0-1


class TransitionSuggestion(BaseModel):
    transition_type: str
    mix_in_ms: float
    mix_out_ms: float
    crossfade_duration_ms: float
    technique: str
    notes: str
    confidence: float
