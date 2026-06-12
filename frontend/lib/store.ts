import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Track, Playlist } from "./api";

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem("setrya_token", token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("setrya_token");
        set({ user: null, token: null });
      },
    }),
    { name: "setrya-auth", partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

interface PlayerStore {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  setTrack: (track: Track) => void;
  setQueue: (tracks: Track[]) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  queue: [],
  isPlaying: false,
  setTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  setQueue: (tracks) => set({ queue: tracks, currentTrack: tracks[0] || null }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  nextTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || !queue.length) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx < queue.length - 1) set({ currentTrack: queue[idx + 1], isPlaying: true });
  },
  prevTrack: () => {
    const { queue, currentTrack } = get();
    if (!currentTrack || !queue.length) return;
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx > 0) set({ currentTrack: queue[idx - 1], isPlaying: true });
  },
}));
