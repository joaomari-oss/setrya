"use client";

import { motion } from "framer-motion";
import { Play, Music, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import { cn, formatDuration, camelotColor, energyLabel } from "@/lib/utils";
import type { Track } from "@/lib/api";
import { usePlayerStore } from "@/lib/store";

interface Props {
  track: Track;
  index?: number;
  onPlay?: (track: Track) => void;
  onMore?: (track: Track) => void;
  isActive?: boolean;
  showIndex?: boolean;
}

export default function TrackRow({ track, index, onPlay, onMore, isActive, showIndex = true }: Props) {
  const keyColor = track.key ? camelotColor(track.key) : "#6b7280";
  const setTrack = usePlayerStore((s) => s.setTrack);
  const handlePlay = (t: Track) => (onPlay ? onPlay(t) : setTrack(t));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.03 }}
      className={cn(
        "track-row group",
        isActive && "bg-setrya-accent/5 border border-setrya-accent/20"
      )}
      onClick={() => handlePlay(track)}
    >
      {/* Index / play button */}
      {showIndex && (
        <div className="w-8 text-center shrink-0">
          <span className="text-setrya-muted text-sm group-hover:hidden">
            {index !== undefined ? index + 1 : "—"}
          </span>
          <Play size={14} className="hidden group-hover:block text-setrya-accent mx-auto" fill="currentColor" />
        </div>
      )}

      {/* Cover */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-setrya-surface shrink-0 relative">
        {track.cover_url ? (
          <Image src={track.cover_url} alt={track.title} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music size={16} className="text-setrya-muted" />
          </div>
        )}
      </div>

      {/* Title / artist */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isActive ? "text-setrya-accent" : "text-setrya-white")}>
          {track.title}
        </p>
        <p className="text-xs text-setrya-text truncate">{track.artist}</p>
      </div>

      {/* BPM */}
      {track.bpm && (
        <div className="hidden sm:block text-right shrink-0 w-14">
          <p className="text-sm font-mono font-semibold text-setrya-white">{Math.round(track.bpm)}</p>
          <p className="text-[10px] text-setrya-muted">BPM</p>
        </div>
      )}

      {/* Camelot key */}
      {track.key && (
        <div className="hidden md:flex shrink-0">
          <span
            className="camelot-badge px-2 py-0.5 rounded text-xs font-mono font-bold text-black"
            style={{ backgroundColor: keyColor }}
          >
            {track.key}
          </span>
        </div>
      )}

      {/* Energy bar */}
      {track.energy !== undefined && (
        <div className="hidden lg:block w-20 shrink-0">
          <div className="energy-bar">
            <div className="energy-fill" style={{ width: `${track.energy * 100}%` }} />
          </div>
          <p className="text-[10px] text-setrya-muted mt-0.5 text-right">
            {energyLabel(track.energy)}
          </p>
        </div>
      )}

      {/* Duration */}
      {track.duration_ms && (
        <div className="hidden sm:block text-right shrink-0 w-12">
          <p className="text-sm text-setrya-text font-mono">{formatDuration(track.duration_ms)}</p>
        </div>
      )}

      {/* Genre */}
      {track.genre && (
        <div className="hidden xl:block shrink-0">
          <span className="px-2 py-0.5 rounded bg-setrya-surface text-setrya-text text-xs">
            {track.genre}
          </span>
        </div>
      )}

      {/* More */}
      <button
        onClick={(e) => { e.stopPropagation(); onMore?.(track); }}
        className="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-setrya-surface transition-all"
      >
        <MoreHorizontal size={16} className="text-setrya-text" />
      </button>
    </motion.div>
  );
}
