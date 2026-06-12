import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Setrya — AI DJ Assistant",
  description: "Analyze music, generate perfect DJ sets, and learn your style with AI.",
  keywords: ["DJ", "music", "AI", "playlist", "set generator", "BPM", "Rekordbox"],
  openGraph: {
    title: "Setrya — AI DJ Assistant",
    description: "The professional DJ tool powered by AI",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
