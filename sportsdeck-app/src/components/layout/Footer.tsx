"use client";

import Link from "next/link";
import Logo from "../ui/Logo";
import { Globe, MessageCircle, Share2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-border-subtle bg-bg-surface/60 backdrop-blur-xl">

      {/* subtle gradient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow opacity-30" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* ===== LEFT (Brand) ===== */}
        <div>
          <Logo variant="compact" />

          <p className="text-text-secondary text-sm mt-4 max-w-xs leading-relaxed">
            Your personalized sports hub. Follow teams, track matches, and stay ahead with real-time insights.
          </p>
        </div>

        {/* ===== CENTER (Navigation) ===== */}
        <div className="md:mx-auto">
          <h3 className="text-sm font-semibold mb-4 text-text-primary tracking-wide">
            Explore
          </h3>

          <div className="space-y-2 text-sm">
            <Link
              href="/"
              className="block text-text-secondary hover:text-white transition"
            >
              Home
            </Link>

            <Link
              href="/community"
              className="block text-text-secondary hover:text-white transition"
            >
              Community
            </Link>

            <Link
              href="/matches"
              className="block text-text-secondary hover:text-white transition"
            >
              Matches
            </Link>

            <Link
              href="/teams"
              className="block text-text-secondary hover:text-white transition"
            >
              Teams
            </Link>

            <Link
              href="/standings"
              className="block text-text-secondary hover:text-white transition"
            >
              Standings
            </Link>
          </div>
        </div>

        {/* ===== RIGHT (Social + Meta) ===== */}
        <div className="md:text-right flex flex-col justify-between">

          <div>
            <h3 className="text-sm font-semibold mb-4 text-text-primary tracking-wide">
              Connect
            </h3>

            <div className="flex md:justify-end gap-3">
              {[Globe, MessageCircle, Share2].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="
                    w-9 h-9 rounded-xl
                    bg-bg-card border border-border-subtle
                    flex items-center justify-center
                    text-text-secondary
                    hover:text-white hover:bg-bg-elevated
                    transition
                  "
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <p className="text-xs text-text-muted mt-6">
            © {new Date().getFullYear()} SportsDeck. All rights reserved.
          </p>
        </div>
      </div>

      {/* ===== Bottom Strip ===== */}
      <div className="border-t border-border-subtle py-4 text-center text-xs text-text-muted">
        Built for sports fans, powered by real-time data
      </div>
    </footer>
  );
}