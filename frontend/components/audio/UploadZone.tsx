"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Music, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { tracksAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface UploadedFile {
  name: string;
  status: "uploading" | "done" | "error";
}

interface Props {
  onUploadComplete?: () => void;
}

export default function UploadZone({ onUploadComplete }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const newFiles: UploadedFile[] = accepted.map((f) => ({ name: f.name, status: "uploading" }));
    setFiles((prev) => [...prev, ...newFiles]);

    for (const file of accepted) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await tracksAPI.upload(formData);
        setFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: "done" } : f))
        );
      } catch {
        setFiles((prev) =>
          prev.map((f) => (f.name === file.name ? { ...f, status: "error" } : f))
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    onUploadComplete?.();
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/mpeg": [".mp3"],
      "audio/wav": [".wav"],
      "audio/flac": [".flac"],
      "audio/aiff": [".aiff", ".aif"],
      "audio/mp4": [".m4a"],
    },
    multiple: true,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300",
          isDragActive
            ? "border-setrya-accent bg-setrya-accent/5 scale-[1.01]"
            : "border-setrya-border hover:border-setrya-muted hover:bg-setrya-surface/50"
        )}
      >
        <input {...getInputProps()} />
        <motion.div
          animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
            isDragActive ? "bg-setrya-accent/20" : "bg-setrya-surface"
          )}>
            <Upload size={24} className={isDragActive ? "text-setrya-accent" : "text-setrya-muted"} />
          </div>
          <div>
            <p className="font-semibold text-setrya-white">
              {isDragActive ? "Drop tracks here" : "Upload your music"}
            </p>
            <p className="text-sm text-setrya-muted mt-1">
              MP3, WAV, FLAC, AIFF, M4A — up to {500}MB each
            </p>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5"
          >
            {files.map((f) => (
              <div key={f.name} className="flex items-center gap-3 p-3 glass rounded-xl">
                <Music size={14} className="text-setrya-muted shrink-0" />
                <span className="text-sm text-setrya-text truncate flex-1">{f.name}</span>
                {f.status === "uploading" && <Loader2 size={14} className="animate-spin text-setrya-accent shrink-0" />}
                {f.status === "done" && <CheckCircle2 size={14} className="text-setrya-accent shrink-0" />}
                {f.status === "error" && <XCircle size={14} className="text-setrya-red shrink-0" />}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
