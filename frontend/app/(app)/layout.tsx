"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Player from "@/components/audio/Player";
import { useAuthStore } from "@/lib/store";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();
  // Wait for zustand persist to rehydrate from localStorage before deciding auth
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-setrya-black">
        <div className="w-10 h-10 rounded-full border-2 border-setrya-accent/30 border-t-setrya-accent animate-spin" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="flex h-screen bg-setrya-black overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>
      <Player />
    </div>
  );
}
