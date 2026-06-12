"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Download, ChevronRight, ListMusic, Loader2 } from "lucide-react";
import { playlistsAPI, type Playlist } from "@/lib/api";
import TrackRow from "@/components/ui/TrackRow";
import { downloadBlob } from "@/lib/utils";
import toast from "react-hot-toast";

export default function PlaylistsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: playlists, isLoading } = useQuery<Playlist[]>({
    queryKey: ["playlists"],
    queryFn: async () => (await playlistsAPI.list()).data,
  });

  const { data: detail } = useQuery<Playlist>({
    queryKey: ["playlist", selected],
    queryFn: async () => (await playlistsAPI.get(selected!)).data,
    enabled: !!selected,
  });

  const createMutation = useMutation({
    mutationFn: () => playlistsAPI.create({ name: newName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlists"] });
      setNewName("");
      setCreating(false);
      toast.success("Playlist created");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => playlistsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playlists"] });
      setSelected(null);
      toast.success("Deleted");
    },
  });

  async function exportRekordbox(playlist: Playlist) {
    try {
      const res = await playlistsAPI.exportRekordbox(playlist.id);
      downloadBlob(res.data, `${playlist.name}.xml`);
      toast.success("Exported to Rekordbox XML");
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <div className="p-6 lg:p-8 flex gap-6 h-full">
      {/* Sidebar list */}
      <div className="w-72 shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black text-setrya-white tracking-tight">Playlists</h1>
          <button onClick={() => setCreating(true)} className="p-2 rounded-xl glass-hover">
            <Plus size={16} className="text-setrya-accent" />
          </button>
        </div>

        {creating && (
          <div className="glass rounded-xl p-3 space-y-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName && createMutation.mutate()}
              placeholder="Playlist name..."
              className="w-full px-3 py-2 rounded-lg bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent placeholder:text-setrya-muted"
            />
            <div className="flex gap-2">
              <button onClick={() => newName && createMutation.mutate()} className="btn-primary text-xs px-3 py-1.5 flex-1">
                Create
              </button>
              <button onClick={() => setCreating(false)} className="btn-ghost text-xs px-3 py-1.5">
                Cancel
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-setrya-accent" />
          </div>
        ) : playlists?.length === 0 ? (
          <div className="text-center py-8">
            <ListMusic size={28} className="text-setrya-muted mx-auto mb-2" />
            <p className="text-xs text-setrya-muted">No playlists yet</p>
          </div>
        ) : (
          playlists?.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 group ${
                selected === p.id
                  ? "bg-setrya-accent/10 border border-setrya-accent/30"
                  : "glass-hover"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                p.is_auto_generated ? "bg-setrya-accent/20" : "bg-setrya-surface"
              }`}>
                <ListMusic size={14} className={p.is_auto_generated ? "text-setrya-accent" : "text-setrya-muted"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-setrya-white truncate">{p.name}</p>
                <p className="text-xs text-setrya-muted">{p.track_count} tracks</p>
              </div>
              <ChevronRight size={14} className="text-setrya-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))
        )}
      </div>

      {/* Detail panel */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          {detail ? (
            <motion.div
              key={detail.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-setrya-white tracking-tight">{detail.name}</h2>
                  <p className="text-setrya-muted text-sm mt-1">
                    {detail.track_count} tracks
                    {detail.is_auto_generated && " · AI Generated"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportRekordbox(detail)}
                    className="btn-ghost inline-flex items-center gap-2 text-sm px-4 py-2"
                  >
                    <Download size={14} />
                    Rekordbox
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(detail.id)}
                    className="p-2 rounded-xl glass-hover text-setrya-red"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                {detail.tracks?.map((item, i) => (
                  <TrackRow key={item.track.id} track={item.track} index={i} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <ListMusic size={48} className="text-setrya-muted mb-4" />
              <p className="text-setrya-text font-medium">Select a playlist</p>
              <p className="text-setrya-muted text-sm mt-1">or create a new one</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
