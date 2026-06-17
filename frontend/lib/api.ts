import axios, { AxiosError } from "axios";

// Turn any thrown request error into a human-readable message.
// Distinguishes: backend down / unreachable, 5xx server/DB errors, and
// normal validation errors — so users see *why* it failed, not "failed".
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  const ax = err as AxiosError<{ detail?: string }>;
  if (ax?.response) {
    const detail = ax.response.data?.detail;
    if (detail) return detail;
    if (ax.response.status >= 500)
      return "Server error — the database may be unreachable. Try again shortly.";
    return `Request failed (${ax.response.status})`;
  }
  // No response object => never reached the server (CORS, DNS, offline, proxy down)
  if (ax?.request) return "Cannot reach the server. Check your connection or try again.";
  return fallback;
}

// Use relative base URL so all API calls go through the Next.js server.
// next.config.ts rewrites /api/* → backend (server-side proxy).
// This works identically in local dev, Docker Compose and Railway/Vercel.
const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("setrya_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("setrya_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Tracks
export const tracksAPI = {
  list: (params?: Record<string, unknown>) => api.get("/tracks", { params }),
  get: (id: string) => api.get(`/tracks/${id}`),
  upload: (formData: FormData) =>
    api.post("/tracks/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getAnalysis: (id: string) => api.get(`/tracks/${id}/analysis`),
  getWaveform: (id: string) => api.get(`/tracks/${id}/waveform`),
  checkCompatibility: (aId: string, bId: string) =>
    api.get(`/tracks/compatibility/${aId}/${bId}`),
  getTransition: (aId: string, bId: string) =>
    api.get(`/tracks/transition/${aId}/${bId}`),
  delete: (id: string) => api.delete(`/tracks/${id}`),
};

// Preferences (learned DJ style)
export const preferencesAPI = {
  get: () => api.get("/preferences"),
  refresh: () => api.post("/preferences/refresh"),
};

// Playlists
export const playlistsAPI = {
  list: () => api.get("/playlists"),
  get: (id: string) => api.get(`/playlists/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post("/playlists", data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch(`/playlists/${id}`, data),
  delete: (id: string) => api.delete(`/playlists/${id}`),
  addTrack: (playlistId: string, trackId: string, position?: number) =>
    api.post(`/playlists/${playlistId}/tracks/${trackId}`, null, {
      params: { position },
    }),
  removeTrack: (playlistId: string, trackId: string) =>
    api.delete(`/playlists/${playlistId}/tracks/${trackId}`),
  exportRekordbox: (id: string) =>
    api.get(`/playlists/${id}/export/rekordbox`, { responseType: "blob" }),
};

// Set generator
export const setsAPI = {
  generate: (data: {
    track_count?: number;
    target_bpm_min?: number;
    target_bpm_max?: number;
    target_genres?: string[];
    energy_curve?: string;
    seed_track_ids?: string[];
    name?: string;
  }) => api.post("/sets/generate", data),
  // Build a set from the internet (Deezer + any configured sources)
  generateOnline: (data: {
    query: string;
    track_count?: number;
    energy_curve?: string;
    sources?: string[];
    name?: string;
  }) => api.post("/sets/generate-online", data),
  sources: () => api.get<{ available: string[] }>("/sets/sources"),
};

// Recommendations
export const recommendationsAPI = {
  forTrack: (trackId: string, limit?: number) =>
    api.get(`/recommendations/for-track/${trackId}`, { params: { limit } }),
  similar: (trackId: string) =>
    api.get(`/recommendations/similar/${trackId}`),
  searchSpotify: (q: string) =>
    api.get("/recommendations/search/spotify", { params: { q } }),
  searchSoundcloud: (q: string) =>
    api.get("/recommendations/search/soundcloud", { params: { q } }),
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  bpm?: number;
  key?: string;
  energy?: number;
  danceability?: number;
  genre?: string;
  cover_url?: string;
  preview_url?: string;
  audio_url?: string;
  waveform_url?: string;
  duration_ms?: number;
  is_analyzed: number;
  external_source: string;
  created_at: string;
};

export type Waveform = {
  track_id: string;
  peaks: number[];
  audio_url?: string;
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_auto_generated: boolean;
  track_count: number;
  created_at: string;
  tracks?: PlaylistTrackItem[];
};

export type PlaylistTrackItem = {
  track: Track;
  position: number;
  transition_type?: string;
  transition_notes?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
};
