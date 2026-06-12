"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ListMusic, Wand2, Radio, User, LogOut, Disc3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Library" },
  { href: "/sets", icon: Wand2, label: "Set Generator" },
  { href: "/playlists", icon: ListMusic, label: "Playlists" },
  { href: "/simulator", icon: Radio, label: "Simulator" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside className="w-16 lg:w-56 h-screen sticky top-0 flex flex-col border-r border-setrya-border bg-setrya-dark shrink-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-4 py-5 border-b border-setrya-border">
        <div className="w-8 h-8 rounded-xl bg-setrya-accent flex items-center justify-center shrink-0">
          <Disc3 size={16} className="text-setrya-black" />
        </div>
        <span className="hidden lg:block font-bold text-lg tracking-tight text-setrya-white">
          setrya
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group",
                active
                  ? "text-setrya-accent bg-setrya-accent/10"
                  : "text-setrya-text hover:text-setrya-white hover:bg-setrya-surface"
              )}
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-setrya-accent rounded-full"
                />
              )}
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:block">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-2 py-3 border-t border-setrya-border">
        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-setrya-accent/20 flex items-center justify-center shrink-0">
              <span className="text-setrya-accent text-xs font-bold">
                {user.name[0].toUpperCase()}
              </span>
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <p className="text-xs font-medium text-setrya-white truncate">{user.name}</p>
            </div>
            <button onClick={logout} className="hidden lg:block p-1 rounded-lg hover:bg-setrya-surface transition-colors">
              <LogOut size={14} className="text-setrya-muted" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
