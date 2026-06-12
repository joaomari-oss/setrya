"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity, Music2, Zap, TrendingUp } from "lucide-react";
import { preferencesAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

interface Preferences {
  preferred_bpm_min: number;
  preferred_bpm_max: number;
  preferred_genres: string[];
  preferred_keys: string[];
  mixing_style: string;
  transition_patterns: Record<string, number>;
}

export default function ProfilePage() {
  const { user } = useAuthStore();

  const { data: prefs } = useQuery<Preferences>({
    queryKey: ["preferences"],
    queryFn: async () => (await preferencesAPI.get()).data,
  });

  const stats = [
    { label: "Preferred BPM", value: prefs ? `${Math.round(prefs.preferred_bpm_min)}–${Math.round(prefs.preferred_bpm_max)}` : "—", icon: Activity },
    { label: "Mixing style", value: prefs?.mixing_style || "Learning...", icon: TrendingUp },
    { label: "Top genres", value: prefs?.preferred_genres?.slice(0, 2).join(", ") || "—", icon: Music2 },
    { label: "Fav keys", value: prefs?.preferred_keys?.slice(0, 3).join(" ") || "—", icon: Zap },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-black text-setrya-white tracking-tight">Profile</h1>
        <p className="text-setrya-text mt-1">Your learned DJ style</p>
      </motion.div>

      {/* Avatar card */}
      <div className="glass rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-setrya-accent/20 flex items-center justify-center shrink-0">
          <span className="text-setrya-accent text-2xl font-black">
            {user?.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-setrya-white">{user?.name}</h2>
          <p className="text-setrya-muted text-sm">{user?.email}</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl p-5"
          >
            <stat.icon size={16} className="text-setrya-accent mb-3" />
            <p className="text-lg font-bold text-setrya-white capitalize">{stat.value}</p>
            <p className="text-xs text-setrya-muted mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Transition patterns */}
      {prefs?.transition_patterns && Object.keys(prefs.transition_patterns).length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold text-setrya-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-setrya-accent" />
            Transition patterns
          </h3>
          <div className="space-y-3">
            {Object.entries(prefs.transition_patterns)
              .sort(([, a], [, b]) => b - a)
              .map(([type, freq]) => (
                <div key={type} className="flex items-center gap-3">
                  <p className="text-sm text-setrya-text capitalize w-32 shrink-0">
                    {type.replace(/_/g, " ")}
                  </p>
                  <div className="flex-1 energy-bar">
                    <div
                      className="energy-fill"
                      style={{ width: `${freq * 100}%` }}
                    />
                  </div>
                  <p className="text-xs font-mono text-setrya-muted w-10 text-right">
                    {Math.round(freq * 100)}%
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {!prefs?.transition_patterns && (
        <div className="glass rounded-2xl p-6 text-center">
          <TrendingUp size={28} className="text-setrya-muted mx-auto mb-3" />
          <p className="text-setrya-text font-medium">Learning your style</p>
          <p className="text-setrya-muted text-sm mt-1">
            Create more sets and playlists so Setrya can learn your preferences
          </p>
        </div>
      )}
    </div>
  );
}
