from collections import Counter
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.preferences import UserPreferences, ListeningHistory
from app.models.track import Track
from app.models.playlist import Playlist, PlaylistTrack
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


async def update_user_preferences(db: AsyncSession, user_id: UUID) -> UserPreferences:
    prefs_q = select(UserPreferences).where(UserPreferences.user_id == user_id)
    result = await db.execute(prefs_q)
    prefs = result.scalar_one_or_none()

    if not prefs:
        prefs = UserPreferences(user_id=user_id)
        db.add(prefs)

    # Get user's playlists and their tracks
    playlist_q = (
        select(Track)
        .join(PlaylistTrack, Track.id == PlaylistTrack.track_id)
        .join(Playlist, PlaylistTrack.playlist_id == Playlist.id)
        .where(Playlist.user_id == user_id)
    )
    result = await db.execute(playlist_q)
    tracks: List[Track] = result.scalars().all()

    if not tracks:
        await db.flush()
        return prefs

    # Compute preferred BPM range
    bpms = [t.bpm for t in tracks if t.bpm]
    if bpms:
        bpms_sorted = sorted(bpms)
        p10 = bpms_sorted[int(len(bpms_sorted) * 0.1)]
        p90 = bpms_sorted[int(len(bpms_sorted) * 0.9)]
        prefs.preferred_bpm_min = round(p10, 1)
        prefs.preferred_bpm_max = round(p90, 1)

    # Preferred genres
    genres = [t.genre for t in tracks if t.genre]
    if genres:
        genre_counts = Counter(genres)
        prefs.preferred_genres = [g for g, _ in genre_counts.most_common(5)]

    # Preferred keys
    keys = [t.key for t in tracks if t.key]
    if keys:
        key_counts = Counter(keys)
        prefs.preferred_keys = [k for k, _ in key_counts.most_common(6)]

    # Energy preferences
    energies = [t.energy for t in tracks if t.energy is not None]
    if energies:
        prefs.preferred_energy_min = round(min(energies), 2)
        prefs.preferred_energy_max = round(max(energies), 2)

    # Transition patterns from playlists
    patterns = await _analyze_transition_patterns(db, user_id)
    prefs.transition_patterns = patterns

    # Mixing style
    avg_bpm = sum(bpms) / len(bpms) if bpms else 128.0
    avg_energy = sum(energies) / len(energies) if energies else 0.7
    if avg_bpm >= 140:
        prefs.mixing_style = "peak_time"
    elif avg_bpm >= 128 and avg_energy >= 0.7:
        prefs.mixing_style = "driving"
    elif avg_energy <= 0.5:
        prefs.mixing_style = "deep"
    else:
        prefs.mixing_style = "versatile"

    await db.flush()
    return prefs


async def _analyze_transition_patterns(db: AsyncSession, user_id: UUID) -> dict:
    q = (
        select(PlaylistTrack)
        .join(Playlist, PlaylistTrack.playlist_id == Playlist.id)
        .where(Playlist.user_id == user_id)
        .order_by(PlaylistTrack.playlist_id, PlaylistTrack.position)
    )
    result = await db.execute(q)
    playlist_tracks = result.scalars().all()

    transition_types = [pt.transition_type for pt in playlist_tracks if pt.transition_type]
    if not transition_types:
        return {}

    counts = Counter(transition_types)
    total = sum(counts.values())
    return {t: round(c / total, 2) for t, c in counts.most_common()}


async def log_listening_event(
    db: AsyncSession,
    user_id: UUID,
    track_id: UUID,
    play_duration_ms: int,
    context: str = "preview",
) -> None:
    event = ListeningHistory(
        user_id=user_id,
        track_id=track_id,
        play_duration_ms=play_duration_ms,
        context=context,
    )
    db.add(event)
    await db.flush()
