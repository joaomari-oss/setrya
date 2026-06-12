"use client";

import { useRef, Suspense, lazy } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Zap, Music2, Brain, Layers, Download, Sparkles, Disc3 } from "lucide-react";

const DJConsole = lazy(() => import("@/components/three/DJConsole"));

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Analysis",
    desc: "BPM, key, energy, genre — extracted automatically via librosa AI pipeline in seconds.",
    color: "#b4f47a",
  },
  {
    icon: Brain,
    title: "Smart Recommendations",
    desc: "Harmonic mixing + cosine similarity embeddings find the perfect next track every time.",
    color: "#4af4f4",
  },
  {
    icon: Layers,
    title: "Set Generator",
    desc: "20-track sets with warm-up, groove, peak, and closing energy curves. One click.",
    color: "#a855f7",
  },
  {
    icon: Music2,
    title: "Transition AI",
    desc: "Cue points, mix in/out suggestions, crossfade timing — optimized per track pair.",
    color: "#f97316",
  },
  {
    icon: Sparkles,
    title: "Learns Your Style",
    desc: "Tracks your preferences, genres, BPM range, and mixing patterns to personalize everything.",
    color: "#ec4899",
  },
  {
    icon: Download,
    title: "Rekordbox Export",
    desc: "Export any set directly to Rekordbox XML with cue points and hot cues intact.",
    color: "#eab308",
  },
];

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />

      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-setrya-accent/5 blur-[120px]" />

      <motion.div style={{ y, opacity }} className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-setrya-accent/30 text-setrya-accent text-sm font-medium mb-8">
            <Sparkles size={14} />
            AI-Powered DJ Assistant
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9]">
            <span className="text-setrya-white">Mix smarter.</span>
            <br />
            <span className="text-gradient">Play better.</span>
          </h1>

          <p className="text-xl text-setrya-text max-w-2xl mx-auto mb-10 leading-relaxed">
            Setrya analyzes your music, builds perfect DJ sets, and learns your style — so you can focus on the crowd.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-base">
              Start for free
              <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn-ghost inline-flex items-center gap-2 text-base">
              Sign in
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* 3D Console */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
        className="relative z-10 w-full max-w-4xl mx-auto mt-16 h-[400px]"
      >
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-setrya-accent/30 border-t-setrya-accent animate-spin" />
          </div>
        }>
          <DJConsole isPlaying interactive />
        </Suspense>
        {/* Floor reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-setrya-black to-transparent" />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-setrya-muted"
      >
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-setrya-muted to-transparent" />
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="py-32 px-4 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="text-center mb-20"
      >
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-setrya-white mb-4">
          Everything a DJ needs.
          <br />
          <span className="text-gradient">Powered by AI.</span>
        </h2>
        <p className="text-setrya-text text-lg max-w-2xl mx-auto">
          From upload to Rekordbox in seconds. Built for working DJs who demand precision.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            className="glass-hover rounded-2xl p-6 group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{ background: `${f.color}18` }}
            >
              <f.icon size={20} style={{ color: f.color }} />
            </div>
            <h3 className="font-bold text-setrya-white mb-2">{f.title}</h3>
            <p className="text-sm text-setrya-text leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 px-4 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(180,244,122,0.06)_0%,transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative max-w-3xl mx-auto"
      >
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-setrya-white mb-6">
          Ready to elevate
          <br />
          your sets?
        </h2>
        <Link href="/register" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4">
          Get started — it&apos;s free
          <ArrowRight size={18} />
        </Link>
      </motion.div>
    </section>
  );
}

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between rounded-b-2xl glass">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-setrya-accent flex items-center justify-center">
            <Disc3 size={16} className="text-setrya-black" />
          </div>
          <span className="font-bold text-lg tracking-tight text-setrya-white">setrya</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-setrya-text hover:text-setrya-white transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-semibold bg-setrya-accent text-setrya-black rounded-xl hover:bg-setrya-accent-dim transition-colors">
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-setrya-border py-10 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-setrya-accent flex items-center justify-center">
            <Disc3 size={14} className="text-setrya-black" />
          </div>
          <span className="font-bold text-setrya-white">setrya</span>
        </div>
        <p className="text-xs text-setrya-muted">
          © {new Date().getFullYear()} Setrya — AI DJ Assistant. Mix smarter, play better.
        </p>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-setrya-black">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
