import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        setrya: {
          black: "#080808",
          dark: "#0f0f0f",
          surface: "#161616",
          border: "#222222",
          muted: "#333333",
          text: "#a0a0a0",
          white: "#f5f5f5",
          accent: "#b4f47a",       // lime green — the brand pop color
          "accent-dim": "#8acc4a",
          cyan: "#4af4f4",
          purple: "#a855f7",
          red: "#f43f5e",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow": "spin 8s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(180,244,122,0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(180,244,122,0.5), 0 0 80px rgba(180,244,122,0.2)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
