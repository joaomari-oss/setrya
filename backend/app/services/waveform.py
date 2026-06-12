"""Generate normalized waveform peaks for visual rendering."""
import librosa
import numpy as np


def generate_peaks(file_path: str, n_peaks: int = 800) -> list[float]:
    """Return n_peaks normalized amplitude values in [0, 1].

    Downsamples the audio envelope into n_peaks buckets — enough resolution
    for a crisp canvas waveform without shipping raw samples to the client.
    """
    y, sr = librosa.load(file_path, sr=22050, mono=True)
    if len(y) == 0:
        return [0.0] * n_peaks

    # Bucket the absolute amplitude into n_peaks windows, take peak per window
    hop = max(1, len(y) // n_peaks)
    peaks = []
    for i in range(0, len(y), hop):
        window = y[i:i + hop]
        if len(window):
            peaks.append(float(np.max(np.abs(window))))
        if len(peaks) >= n_peaks:
            break

    arr = np.array(peaks)
    peak_max = arr.max() if arr.size else 1.0
    if peak_max > 0:
        arr = arr / peak_max

    # Pad to fixed length
    if len(arr) < n_peaks:
        arr = np.pad(arr, (0, n_peaks - len(arr)))
    return [round(float(p), 4) for p in arr[:n_peaks]]
