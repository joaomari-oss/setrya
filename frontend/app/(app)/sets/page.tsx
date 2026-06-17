"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Wand2, Loader2, Music2, Globe, Library } from "lucide-react";
import { setsAPI, type Playlist } from "@/lib/api";
import TrackRow from "@/components/ui/TrackRow";
import EnergyCurve from "@/components/ui/EnergyCurve";
import toast from "react-hot-toast";

const ENERGY_CURVES = [
  { id: "standard", label: "Standard", desc: "Classic warm-up → peak → closing arc" },
  { id: "dark", label: "Dark", desc: "Slow build, sustained darkness, late drop" },
  { id: "euphoric", label: "Euphoric", desc: "Multiple peaks, emotional highs" },
  { id: "warm", label: "Warm", desc: "Gradual progression, underground feel" },
];

type SetResult = {
  playlist: Playlist;
  energy_curve: number[];
  bpm_progression: number[];
  key_progression: string[];
  generation_notes: string;
};

export default function SetGeneratorPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"online" | "library">("online");
  const [result, setResult] = useState<SetResult | null>(null);

  // Online (internet) config
  const [online, setOnline] = useState({ query: "", track_count: 10, energy_curve: "standard", name: "" });
  // Library config
  const [config, setConfig] = useState({
    track_count: 20, target_bpm_min: 125, target_bpm_max: 140, energy_curve: "standard", name: "",
  });

  const { data: sourcesRes } = useQuery({
    queryKey: ["set-sources"],
    queryFn: () => setsAPI.sources().then((r) => r.data),
  });
  const sources = sourcesRes?.available ?? [];

  const onDone = (res: { data: SetResult }) => {
    setResult(res.data);
    qc.invalidateQueries({ queryKey: ["playlists"] });
    toast.success(`Generated: ${res.data.playlist.name}`);
  };

  const { mutate: genOnline, isPending: onlinePending } = useMutation({
    mutationFn: () => setsAPI.generateOnline(online),
    onSuccess: onDone,
    onError: (e: unknown) =>
      toast.error(
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Could not build a set from the internet."
      ),
  });

  const { mutate: genLibrary, isPending: libPending } = useMutation({
    mutationFn: () => setsAPI.generate(config),
    onSuccess: onDone,
    onError: () => toast.error("No tracks found matching criteria. Upload more music first."),
  });

  const isPending = onlinePending || libPending;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-black text-setrya-white tracking-tight">Set Generator</h1>
        <p className="text-setrya-text mt-1">AI builds a complete, harmonically-mixed DJ set</p>
      </motion.div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode("online")}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
            mode === "online"
              ? "border-setrya-accent bg-setrya-accent/10 text-setrya-accent"
              : "border-setrya-border text-setrya-text hover:border-setrya-muted"
          }`}
        >
          <Globe size={16} /> From the internet
        </button>
        <button
          onClick={() => setMode("library")}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
            mode === "library"
              ? "border-setrya-accent bg-setrya-accent/10 text-setrya-accent"
              : "border-setrya-border text-setrya-text hover:border-setrya-muted"
          }`}
        >
          <Library size={16} /> From my library
        </button>
      </div>

      {/* Config panel */}
      <div className="glass rounded-2xl p-6 mb-6 space-y-6">
        {mode === "online" ? (
          <>
            <div>
              <label className="text-xs text-setrya-muted block mb-1.5">
                Search the internet — artist, genre, or vibe
              </label>
              <input
                value={online.query}
                onChange={(e) => setOnline((c) => ({ ...c, query: e.target.value }))}
                placeholder="e.g. melodic techno, Tale Of Us, sunset house"
                className="w-full px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent placeholder:text-setrya-muted"
              />
              <p className="text-[11px] text-setrya-muted mt-1.5">
                Sources: {sources.length ? sources.join(", ") : "deezer"} — analyzed live for BPM, key & energy.
              </p>
            </div>
            <div>
              <label className="text-xs text-setrya-muted block mb-1.5">Track count</label>
              <input
                type="number" min={3} max={24}
                value={online.track_count}
                onChange={(e) => setOnline((c) => ({ ...c, track_count: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent"
              />
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-setrya-muted block mb-1.5">Track count</label>
              <input
                type="number" min={5} max={50}
                value={config.track_count}
                onChange={(e) => setConfig((c) => ({ ...c, track_count: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent"
              />
            </div>
            <div>
              <label className="text-xs text-setrya-muted block mb-1.5">BPM min</label>
              <input
                type="number"
                value={config.target_bpm_min}
                onChange={(e) => setConfig((c) => ({ ...c, target_bpm_min: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent"
              />
            </div>
            <div>
              <label className="text-xs text-setrya-muted block mb-1.5">BPM max</label>
              <input
                type="number"
                value={config.target_bpm_max}
                onChange={(e) => setConfig((c) => ({ ...c, target_bpm_max: +e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-xs text-setrya-muted block mb-2">Energy curve</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ENERGY_CURVES.map((curve) => {
              const active = mode === "online" ? online.energy_curve : config.energy_curve;
              const set = (id: string) =>
                mode === "online"
                  ? setOnline((c) => ({ ...c, energy_curve: id }))
                  : setConfig((c) => ({ ...c, energy_curve: id }));
              return (
                <button
                  key={curve.id}
                  onClick={() => set(curve.id)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                    active === curve.id
                      ? "border-setrya-accent bg-setrya-accent/10 text-setrya-accent"
                      : "border-setrya-border text-setrya-text hover:border-setrya-muted"
                  }`}
                >
                  <p className="font-semibold text-sm">{curve.label}</p>
                  <p className="text-xs opacity-70 mt-0.5 leading-tight">{curve.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="text-xs text-setrya-muted block mb-1.5">Set name (optional)</label>
          <input
            value={mode === "online" ? online.name : config.name}
            onChange={(e) =>
              mode === "online"
                ? setOnline((c) => ({ ...c, name: e.target.value }))
                : setConfig((c) => ({ ...c, name: e.target.value }))
            }
            placeholder="Leave blank for auto-name"
            className="w-full px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent placeholder:text-setrya-muted"
          />
        </div>

        <button
          onClick={() => (mode === "online" ? genOnline() : genLibrary())}
          disabled={isPending || (mode === "online" && online.query.trim().length < 2)}
          className="btn-primary inline-flex items-center gap-2 w-full justify-center disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {mode === "online" ? "Searching & analyzing the internet…" : "Generating set…"}
            </>
          ) : (
            <>
              {mode === "online" ? <Globe size={16} /> : <Wand2 size={16} />}
              {mode === "online" ? "Build set from the internet" : "Generate DJ Set"}
            </>
          )}
        </button>
        {mode === "online" && isPending && (
          <p className="text-[11px] text-setrya-muted text-center -mt-2">
            Downloading & analyzing track previews — this takes ~1s per track.
          </p>
        )}
      </div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="glass rounded-2xl p-6">
              <h2 className="font-bold text-setrya-white text-lg mb-1">{result.playlist.name}</h2>
              <p className="text-xs text-setrya-muted mb-4">{result.generation_notes}</p>
              <div className="mb-2">
                <p className="text-xs text-setrya-muted mb-2">Energy progression</p>
                <EnergyCurve
                  energyValues={result.energy_curve}
                  bpmValues={result.bpm_progression}
                  keyValues={result.key_progression}
                />
              </div>
            </div>

            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-setrya-white mb-3 flex items-center gap-2">
                <Music2 size={14} /> {result.playlist.track_count} tracks
              </h3>
              <div className="space-y-1">
                {result.playlist.tracks?.map((item, i) => (
                  <TrackRow key={item.track.id} track={item.track} index={i} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
