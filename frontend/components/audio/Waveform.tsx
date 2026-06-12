"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { tracksAPI, type Waveform as WaveformData } from "@/lib/api";

interface Props {
  trackId?: string;
  peaks?: number[];
  progress?: number;          // 0..1 playback position
  height?: number;
  color?: string;
  progressColor?: string;
  onSeek?: (ratio: number) => void;
}

export default function Waveform({
  trackId,
  peaks: peaksProp,
  progress = 0,
  height = 64,
  color = "#333333",
  progressColor = "#b4f47a",
  onSeek,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(600);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery<WaveformData>({
    queryKey: ["waveform", trackId],
    queryFn: async () => (await tracksAPI.getWaveform(trackId!)).data,
    enabled: !!trackId && !peaksProp,
    retry: 3,
    retryDelay: 2000,
  });

  const peaks = peaksProp || data?.peaks || [];

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks.length) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const barCount = Math.min(peaks.length, Math.floor(width / 3));
    const step = peaks.length / barCount;
    const barWidth = width / barCount;
    const mid = height / 2;
    const progressX = width * progress;

    for (let i = 0; i < barCount; i++) {
      const peak = peaks[Math.floor(i * step)] || 0;
      const barHeight = Math.max(2, peak * height * 0.9);
      const x = i * barWidth;
      ctx.fillStyle = x <= progressX ? progressColor : color;
      ctx.fillRect(x, mid - barHeight / 2, barWidth * 0.7, barHeight);
    }
  }, [peaks, width, height, progress, color, progressColor]);

  function handleClick(e: React.MouseEvent) {
    if (!onSeek || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    onSeek((e.clientX - rect.left) / rect.width);
  }

  return (
    <div
      ref={wrapRef}
      onClick={handleClick}
      className={onSeek ? "cursor-pointer w-full" : "w-full"}
      style={{ height }}
    >
      {peaks.length ? (
        <canvas ref={canvasRef} style={{ width: "100%", height }} />
      ) : (
        <div className="w-full flex items-center justify-center" style={{ height }}>
          <div className="flex gap-0.5 items-end h-8">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-setrya-muted/40 rounded-full animate-pulse"
                style={{ height: `${20 + Math.sin(i) * 15 + 15}%`, animationDelay: `${i * 30}ms` }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
