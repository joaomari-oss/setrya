from app.models.track import Track
from app.schemas.track import TransitionSuggestion
from app.services.recommendation import camelot_compatible


def suggest_transition(track_a: Track, track_b: Track) -> TransitionSuggestion:
    bpm_a = track_a.bpm or 128.0
    bpm_b = track_b.bpm or 128.0
    bpm_diff = abs(bpm_a - bpm_b)

    key_compat, camelot_dist = camelot_compatible(track_a.key or "8B", track_b.key or "8B")
    energy_diff = abs((track_a.energy or 0.7) - (track_b.energy or 0.7))

    mix_out = track_a.mix_out_point or (track_a.duration_ms * 0.85 if track_a.duration_ms else 180000)
    mix_in = track_b.mix_in_point or 4000.0

    # Classify transition type
    if bpm_diff <= 2 and key_compat and energy_diff <= 0.1:
        transition_type = "harmonic_mix"
        crossfade = 32000  # 32 bars
        technique = "Beatmatch at mix-out, blend chords, gradual crossfade over 32 bars"
        confidence = 0.95
    elif bpm_diff <= 5 and key_compat:
        transition_type = "smooth_blend"
        crossfade = 16000
        technique = "Beatmatch, EQ transition (low swap), 16-bar crossfade"
        confidence = 0.85
    elif bpm_diff <= 10:
        transition_type = "quick_cut"
        crossfade = 4000
        technique = "Cut at downbeat after 4 bars, use FX to mask BPM shift"
        confidence = 0.75
    elif energy_diff >= 0.3:
        transition_type = "energy_drop"
        crossfade = 8000
        technique = "High-pass filter sweep, drop at chorus of track B"
        confidence = 0.70
    else:
        transition_type = "creative_mix"
        crossfade = 12000
        technique = "Use reverb tail / filter out track A, introduce track B via FX"
        confidence = 0.60

    notes = (
        f"BPM: {bpm_a} → {bpm_b} (diff: {bpm_diff:.1f}). "
        f"Key: {track_a.key or '?'} → {track_b.key or '?'} ({'✓ compatible' if key_compat else '✗ clash'}). "
        f"Energy: {track_a.energy:.2f} → {track_b.energy:.2f}."
    )

    return TransitionSuggestion(
        transition_type=transition_type,
        mix_in_ms=float(mix_in),
        mix_out_ms=float(mix_out),
        crossfade_duration_ms=float(crossfade),
        technique=technique,
        notes=notes,
        confidence=confidence,
    )
