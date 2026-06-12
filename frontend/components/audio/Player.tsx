"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, Music } from "lucide-react";
import Image from "next/image";
import { usePlayerStore } from "@/lib/store";
import Waveform from "./Waveform";
import { formatDuration, camelotColor } from "@/lib/utils";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function resolveUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.startsWith("/") ? `${API_BASE}${url}` : url;
}

export default function Player() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack } = usePlayerStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const src = resolveUrl(currentTrack?.audio_url);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, src, currentTrack?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  function onTimeUpdate() {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress(audio.currentTime / audio.duration);
    setCurrent(audio.currentTime * 1000);
  }

  function seek(ratio: number) {
    const audio = audioRef.current;
    if (audio && audio.duration) audio.currentTime = ratio * audio.duration;
  }

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-setrya-border bg-setrya-dark/95 backdrop-blur-xl"
        >
          <audio
            ref={audioRef}
            src={src}
            onTimeUpdate={onTimeUpdate}
            onEnded={nextTrack}
          />
          <div className="flex items-center gap-4 px-4 py-3 max-w-[1600px] mx-auto">
            {/* Track info */}
            <div className="flex items-center gap-3 w-56 shrink-0">
              <div className="w-11 h-11 rounded-lg overflow-hidden bg-setrya-surface relative shrink-0">
                {currentTrack.cover_url ? (
                  <Image src={currentTrack.cover_url} alt={currentTrack.title} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={16} className="text-setrya-muted" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-setrya-white truncate">{currentTrack.title}</p>
                <p className="text-xs text-setrya-text truncate">{currentTrack.artist}</p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={prevTrack} className="p-2 text-setrya-text hover:text-setrya-white transition-colors">
                <SkipBack size={16} fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-setrya-accent flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause size={16} className="text-setrya-black" fill="currentColor" />
                ) : (
                  <Play size={16} className="text-setrya-black ml-0.5" fill="currentColor" />
                )}
              </button>
              <button onClick={nextTrack} className="p-2 text-setrya-text hover:text-setrya-white transition-colors">
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>

            {/* Waveform + time */}
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <span className="text-xs font-mono text-setrya-muted w-10 text-right shrink-0">
                {formatDuration(current)}
              </span>
              <div className="flex-1 min-w-0">
                <Waveform trackId={currentTrack.id} progress={progress} height={40} onSeek={seek} />
              </div>
              <span className="text-xs font-mono text-setrya-muted w-10 shrink-0">
                {currentTrack.duration_ms ? formatDuration(currentTrack.duration_ms) : "--:--"}
              </span>
            </div>

            {/* BPM / key / volume */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              {currentTrack.bpm && (
                <span className="text-xs font-mono text-setrya-accent">{Math.round(currentTrack.bpm)} BPM</span>
              )}
              {currentTrack.key && (
                <span className="camelot-badge" style={{ background: camelotColor(currentTrack.key), color: "#000" }}>
                  {currentTrack.key}
                </span>
              )}
              <div className="flex items-center gap-2 w-28">
                <Volume2 size={14} className="text-setrya-muted shrink-0" />
                <input
                  type="range"
                  min={0} max={1} step={0.01}
                  value={volume}
                  onChange={(e) => setVolume(+e.target.value)}
                  className="w-full accent-setrya-accent h-1"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
