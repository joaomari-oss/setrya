import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export function camelotColor(key: string): string {
  const num = parseInt(key?.slice(0, -1) || "0", 10);
  const colors: Record<number, string> = {
    1: "#f97316", 2: "#f59e0b", 3: "#eab308", 4: "#84cc16",
    5: "#22c55e", 6: "#10b981", 7: "#06b6d4", 8: "#3b82f6",
    9: "#6366f1", 10: "#8b5cf6", 11: "#a855f7", 12: "#ec4899",
  };
  return colors[num] || "#6b7280";
}

export function energyLabel(energy: number): string {
  if (energy >= 0.85) return "Peak";
  if (energy >= 0.7) return "High";
  if (energy >= 0.5) return "Mid";
  if (energy >= 0.3) return "Low";
  return "Chill";
}

export function bpmColor(bpm: number): string {
  if (bpm >= 150) return "text-setrya-red";
  if (bpm >= 135) return "text-setrya-accent";
  if (bpm >= 120) return "text-setrya-cyan";
  return "text-setrya-text";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
