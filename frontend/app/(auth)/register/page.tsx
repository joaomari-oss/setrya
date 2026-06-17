"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Disc3 } from "lucide-react";
import { authAPI, getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const res = await authAPI.register(form);
      setAuth(res.data.user, res.data.access_token);
      toast.success("Welcome to Setrya!");
      router.push("/dashboard");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-setrya-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-setrya-accent flex items-center justify-center mx-auto mb-4">
            <Disc3 size={22} className="text-setrya-black" />
          </div>
          <h1 className="text-2xl font-bold text-setrya-white">Create account</h1>
          <p className="text-setrya-text text-sm mt-1">Start building better DJ sets</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          {(["name", "email", "password"] as const).map((field) => (
            <div key={field}>
              <label className="text-xs text-setrya-muted block mb-1.5 capitalize">{field}</label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                required
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-setrya-surface border border-setrya-border text-setrya-white text-sm focus:outline-none focus:border-setrya-accent transition-colors placeholder:text-setrya-muted"
                placeholder={field === "name" ? "DJ Havana" : field === "email" ? "you@example.com" : "min. 8 characters"}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 rounded-full border-2 border-setrya-black/30 border-t-setrya-black animate-spin" />
            ) : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-setrya-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-setrya-accent hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
