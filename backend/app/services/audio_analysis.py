import librosa
import numpy as np
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Camelot wheel mapping: standard key -> Camelot notation
CAMELOT_MAP = {
    "C major": "8B",  "A minor": "8A",
    "G major": "9B",  "E minor": "9A",
    "D major": "10B", "B minor": "10A",
    "A major": "11B", "F# minor": "11A",
    "E major": "12B", "C# minor": "12A",
    "B major": "1B",  "G# minor": "1A",
    "F# major": "2B", "D# minor": "2A",
    "C# major": "3B", "A# minor": "3A",
    "G# major": "4B", "F minor": "4A",
    "D# major": "5B", "C minor": "5A",
    "A# major": "6B", "G minor": "6A",
    "F major": "7B",  "D minor": "7A",
}

REVERSE_CAMELOT = {v: k for k, v in CAMELOT_MAP.items()}

KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def detect_bpm(y: np.ndarray, sr: int) -> float:
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    if hasattr(tempo, '__len__'):
        tempo = float(tempo[0]) if len(tempo) > 0 else 120.0
    return round(float(tempo), 1)


def detect_key(y: np.ndarray, sr: int) -> tuple[str, str]:
    chromagram = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_mean = chromagram.mean(axis=1)

    major_profile = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
    minor_profile = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])

    major_cors = [np.corrcoef(np.roll(major_profile, i), chroma_mean)[0, 1] for i in range(12)]
    minor_cors = [np.corrcoef(np.roll(minor_profile, i), chroma_mean)[0, 1] for i in range(12)]

    best_major = int(np.argmax(major_cors))
    best_minor = int(np.argmax(minor_cors))

    if max(major_cors) >= max(minor_cors):
        key_standard = f"{KEY_NAMES[best_major]} major"
    else:
        key_standard = f"{KEY_NAMES[best_minor]} minor"

    key_camelot = CAMELOT_MAP.get(key_standard, "8B")
    return key_camelot, key_standard


def compute_energy(y: np.ndarray, sr: int) -> float:
    rms = librosa.feature.rms(y=y)
    energy = float(np.mean(rms))
    # Normalize 0-1 (typical RMS range 0.0 - 0.3)
    return min(1.0, energy / 0.15)


def compute_danceability(y: np.ndarray, sr: int) -> float:
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    if len(beats) < 4:
        return 0.5
    beat_times = librosa.frames_to_time(beats, sr=sr)
    inter_beat = np.diff(beat_times)
    regularity = 1.0 - min(1.0, float(np.std(inter_beat)) / (float(np.mean(inter_beat)) + 1e-6))
    return round(regularity, 3)


def compute_loudness(y: np.ndarray) -> float:
    rms = np.sqrt(np.mean(y ** 2))
    if rms == 0:
        return -60.0
    return round(float(20 * np.log10(rms + 1e-9)), 2)


def detect_cue_points(y: np.ndarray, sr: int) -> list[float]:
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    boundaries = librosa.segment.agglomerative(onset_env.reshape(1, -1), k=8)
    times = librosa.frames_to_time(boundaries, sr=sr) * 1000  # ms
    return [round(float(t), 0) for t in times]


def estimate_mix_points(y: np.ndarray, sr: int, duration_ms: float) -> tuple[float, float]:
    # Mix in: first 32 bars (~8 seconds at 128 BPM)
    mix_in = min(8000.0, duration_ms * 0.05)
    # Mix out: last 32 bars
    mix_out = max(duration_ms - 8000.0, duration_ms * 0.85)
    return round(mix_in, 0), round(mix_out, 0)


def classify_genre(y: np.ndarray, sr: int, bpm: float, energy: float) -> tuple[str, str]:
    spectral_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
    zero_crossing = float(np.mean(librosa.feature.zero_crossing_rate(y)))

    # Heuristic genre classification
    if bpm >= 140 and energy > 0.7:
        if spectral_centroid > 3000:
            return "Techno", "Industrial Techno"
        return "Techno", "Peak Time Techno"
    elif 128 <= bpm < 140:
        if energy > 0.75:
            return "Techno", "Driving Techno"
        return "House", "Tech House"
    elif 120 <= bpm < 128:
        if zero_crossing > 0.1:
            return "House", "Melodic House"
        return "House", "Deep House"
    elif 100 <= bpm < 120:
        return "Downtempo", "Melodic Techno"
    elif bpm >= 160:
        return "Hardcore", "Hard Techno"
    else:
        return "Electronic", "Electronic"


async def analyze_track(file_path: str) -> dict:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    try:
        y, sr = librosa.load(str(path), sr=44100, mono=True, duration=180)
    except Exception as e:
        logger.error(f"Failed to load audio {file_path}: {e}")
        raise

    duration_ms = float(len(y) / sr * 1000)

    bpm = detect_bpm(y, sr)
    key_camelot, key_standard = detect_key(y, sr)
    energy = compute_energy(y, sr)
    danceability = compute_danceability(y, sr)
    loudness = compute_loudness(y)
    cue_points = detect_cue_points(y, sr)
    mix_in, mix_out = estimate_mix_points(y, sr, duration_ms)
    genre, subgenre = classify_genre(y, sr, bpm, energy)

    return {
        "bpm": bpm,
        "key": key_camelot,
        "key_standard": key_standard,
        "energy": round(energy, 3),
        "danceability": round(danceability, 3),
        "loudness": loudness,
        "genre": genre,
        "subgenre": subgenre,
        "duration_ms": int(duration_ms),
        "cue_points": cue_points,
        "mix_in_point": mix_in,
        "mix_out_point": mix_out,
    }


def compute_audio_embedding(y: np.ndarray, sr: int) -> list[float]:
    features = []
    # MFCCs (13 coefficients, mean + std)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    features.extend(np.mean(mfccs, axis=1).tolist())
    features.extend(np.std(mfccs, axis=1).tolist())
    # Chroma
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    features.extend(np.mean(chroma, axis=1).tolist())
    # Spectral features
    features.append(float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))))
    features.append(float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))))
    features.append(float(np.mean(librosa.feature.spectral_bandwidth(y=y, sr=sr))))
    features.append(float(np.mean(librosa.feature.zero_crossing_rate(y))))
    return features


async def compute_track_embedding(file_path: str) -> list[float]:
    y, sr = librosa.load(file_path, sr=22050, mono=True, duration=60)
    return compute_audio_embedding(y, sr)
