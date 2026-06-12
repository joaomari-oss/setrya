"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, ArrowRight, Loader2, Music2, Zap, AlertTriangle } from "lucide-react";
import { tracksAPI, type Track } from "@/lib/api";
import { camelotColor, formatDuration } from "@/lib/utils";
import Waveform from "@/components/audio/Waveform";

interface TransitionResult {
  transition_type: string;
  mix_in_ms: number;
  mix_out_ms: number;
  crossfade_duration_ms: number;
  technique: string;
  notes: string;
  confidence: number;
}

function TrackSelector({
  label,
  selected,
  onSelect,
  tracks,
}: {
  label: string;
  selected: Track | null;
  onSelect: (t: Track) => void;
  tracks: Track[];
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1">
      <p className="text-xs text-setrya-muted mb-2 uppercase tracking-wider">{label}</p>
      {selected ? (
        <div className="glass-hover rounded-2xl p-4">
          <div onClick={() => setOpen(true)} className="cursor-pointer">
            <p className="font-semibold text-setrya-white truncate">{selected.title}</p>
            <p className="text-sm text-setrya-text">{selected.artist}</p>
            <div className="flex items-center gap-3 mt-3">
              {selected.bpm && (
                <span className="text-xs font-mono text-setrya-accent">{Math.round(selected.bpm)} BPM</span>
              )}
              {selected.key && (
                <span
                  className="camelot-badge"
                  style={{ background: camelotColor(selected.key), color: "#000" }}
                >
                  {selected.key}
                </span>
              )}
              {selected.energy !== undefined && (
                <div className="flex-1 energy-bar">
                  <div className="energy-fill" style={{ width: `${selected.energy * 100}%` }} />
                </div>
              )}
            </div>
          </div>
          <div className="mt-3">
            <Waveform trackId={selected.id} height={48} />
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full glass-hover rounded-2xl p-6 flex flex-col items-center gap-2 text-setrya-muted"
        >
          <Music2 size={24} />
          <span className="text-sm">Select track</span>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-setrya-dark border border-setrya-border rounded-2xl w-full max-w-md p-4 max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tracks..."
                className="w-full px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent placeholder:text-setrya-muted mb-3"
              />
              <div className="overflow-y-auto space-y-1">
                {filtered.slice(0, 30).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { onSelect(t); setOpen(false); setSearch(""); }}
                    className="w-full text-left flex items-center gap-3 p-2.5 rounded-xl hover:bg-setrya-surface transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-setrya-white truncate">{t.title}</p>
                      <p className="text-xs text-setrya-text truncate">{t.artist}</p>
                    </div>
                    {t.bpm && <span className="text-xs font-mono text-setrya-accent shrink-0">{Math.round(t.bpm)}</span>}
                    {t.key && (
                      <span className="camelot-badge shrink-0" style={{ background: camelotColor(t.key), color: "#000" }}>
                        {t.key}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SimulatorPage() {
  const [trackA, setTrackA] = useState<Track | null>(null);
  const [trackB, setTrackB] = useState<Track | null>(null);
  const [transition, setTransition] = useState<TransitionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: tracks } = useQuery<Track[]>({
    queryKey: ["tracks", "analyzed"],
    queryFn: async () => (await tracksAPI.list({ analyzed_only: true, limit: 200 })).data,
  });

  async function analyze() {
    if (!trackA || !trackB) return;
    setLoading(true);
    try {
      const res = await tracksAPI.getTransition(trackA.id, trackB.id);
      setTransition(res.data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }

  const confidenceColor = transition
    ? transition.confidence >= 0.85
      ? "#b4f47a"
      : transition.confidence >= 0.7
      ? "#eab308"
      : "#f43f5e"
    : "#6b7280";

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-setrya-white tracking-tight">Transition Simulator</h1>
        <p className="text-setrya-text mt-1">Analyze any track pair for mix compatibility</p>
      </motion.div>

      <div className="flex items-stretch gap-4 mb-6">
        <TrackSelector
          label="Track A — Out"
          selected={trackA}
          onSelect={setTrackA}
          tracks={tracks || []}
        />

        <div className="flex items-center justify-center shrink-0 pt-6">
          <div className="p-2 glass rounded-xl">
            <ArrowRight size={20} className="text-setrya-accent" />
          </div>
        </div>

        <TrackSelector
          label="Track B — In"
          selected={trackB}
          onSelect={setTrackB}
          tracks={tracks || []}
        />
      </div>

      <button
        onClick={analyze}
        disabled={!trackA || !trackB || loading}
        className="btn-primary inline-flex items-center gap-2 mb-8 disabled:opacity-40"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
        Analyze transition
      </button>

      <AnimatePresence>
        {transition && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Type + confidence */}
            <div className="glass rounded-2xl p-6 flex items-center gap-6">
              <div>
                <p className="text-xs text-setrya-muted mb-1">Transition type</p>
                <p className="text-xl font-bold text-setrya-white capitalize">
                  {transition.transition_type.replace(/_/g, " ")}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-setrya-muted mb-1">Confidence</p>
                <p className="text-2xl font-black font-mono" style={{ color: confidenceColor }}>
                  {Math.round(transition.confidence * 100)}%
                </p>
              </div>
            </div>

            {/* Mix points */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Mix Out", value: formatDuration(transition.mix_out_ms), icon: Zap },
                { label: "Crossfade", value: `${(transition.crossfade_duration_ms / 1000).toFixed(0)}s`, icon: Radio },
                { label: "Mix In", value: formatDuration(transition.mix_in_ms), icon: Zap },
              ].map((item) => (
                <div key={item.label} className="glass rounded-xl p-4 text-center">
                  <item.icon size={16} className="text-setrya-accent mx-auto mb-2" />
                  <p className="text-lg font-black font-mono text-setrya-white">{item.value}</p>
                  <p className="text-xs text-setrya-muted mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Technique */}
            <div className="glass rounded-2xl p-5">
              <p className="text-xs text-setrya-muted mb-2 uppercase tracking-wider">Technique</p>
              <p className="text-setrya-white font-medium">{transition.technique}</p>
            </div>

            {/* Notes */}
            <div className="glass rounded-2xl p-5">
              <p className="text-xs text-setrya-muted mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={11} />
                Analysis
              </p>
              <p className="text-setrya-text text-sm leading-relaxed">{transition.notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
