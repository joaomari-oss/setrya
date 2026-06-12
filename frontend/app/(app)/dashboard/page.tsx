"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Upload, Search, Filter, Music2, Loader2 } from "lucide-react";
import { tracksAPI, type Track } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import TrackRow from "@/components/ui/TrackRow";
import UploadZone from "@/components/audio/UploadZone";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [genre, setGenre] = useState("");

  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ["tracks", search, genre],
    queryFn: async () => {
      const res = await tracksAPI.list({ search: search || undefined, genre: genre || undefined });
      return res.data;
    },
  });

  const genres = Array.from(new Set((tracks || []).map((t) => t.genre).filter(Boolean)));

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-black text-setrya-white tracking-tight">
            Library
          </h1>
          <p className="text-setrya-text mt-1">
            {tracks?.length ?? 0} tracks · {user?.name}
          </p>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-setrya-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracks..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent transition-colors placeholder:text-setrya-muted"
          />
        </div>

        {genres.length > 0 && (
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent"
          >
            <option value="">All genres</option>
            {genres.map((g) => <option key={g} value={g!}>{g}</option>)}
          </select>
        )}

        <button
          onClick={() => setShowUpload((v) => !v)}
          className={showUpload ? "btn-primary inline-flex items-center gap-2" : "btn-ghost inline-flex items-center gap-2"}
        >
          <Upload size={16} />
          Upload
        </button>
      </div>

      {/* Upload zone */}
      {showUpload && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <UploadZone onUploadComplete={() => {
            qc.invalidateQueries({ queryKey: ["tracks"] });
            setTimeout(() => qc.invalidateQueries({ queryKey: ["tracks"] }), 3000);
          }} />
        </motion.div>
      )}

      {/* Track list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-setrya-accent" />
        </div>
      ) : tracks?.length === 0 ? (
        <div className="text-center py-20">
          <Music2 size={40} className="text-setrya-muted mx-auto mb-4" />
          <p className="text-setrya-text font-medium">No tracks yet</p>
          <p className="text-setrya-muted text-sm mt-1">Upload your music to get started</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Upload size={16} /> Upload tracks
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Header row */}
          <div className="flex items-center gap-4 px-3 pb-2 text-xs text-setrya-muted border-b border-setrya-border">
            <div className="w-8 text-center">#</div>
            <div className="w-10 shrink-0" />
            <div className="flex-1">TITLE</div>
            <div className="hidden sm:block w-14 text-right">BPM</div>
            <div className="hidden md:block w-16 text-center">KEY</div>
            <div className="hidden lg:block w-20 text-center">ENERGY</div>
            <div className="hidden sm:block w-12 text-right">TIME</div>
            <div className="hidden xl:block w-20 text-center">GENRE</div>
            <div className="w-8" />
          </div>
          {tracks?.map((track, i) => (
            <TrackRow key={track.id} track={track} index={i} showIndex />
          ))}
        </div>
      )}
    </div>
  );
}
