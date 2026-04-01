"use client";

import { Goal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "full" | "compact" | "icon";
  size?: "sm" | "md" | "lg";
  href?: string;
  className?: string;
}

export default function Logo({
  variant = "compact",
  size = "md",
  href = "/",
  className = "",
}: LogoProps) {
  const sizeMap = {
    sm: {
      container: "gap-2",
      icon: "w-8 h-8 text-xs",
      text: "text-base",
      image: "h-10 w-auto",
    },
    md: {
      container: "gap-2.5",
      icon: "w-9 h-9 text-sm",
      text: "text-lg",
      image: "h-18 w-auto",
    },
    lg: {
      container: "gap-3",
      icon: "w-11 h-11 text-base",
      text: "text-xl",
      image: "h-30 w-auto",
    },
  };

  const styles = sizeMap[size];

  const content = (
    <div
      className={`flex items-center select-none transition-transform duration-300 hover:scale-[1.02] ${styles.container} ${className}`}
    >
      {/* ================= FULL LOGO (Auth / Landing) ================= */}
      {variant === "full" && (
        <Image
          src="/logo-ui.png"
          alt="SportsDeck"
          width={180}
          height={60}
          className={styles.image}
          priority
        />
      )}

      {/* ================= ICON (System) ================= */}
      {(variant === "compact" || variant === "icon") && (
        <div
          className={`
            ${styles.icon}
            rounded-xl flex items-center justify-center
            shadow-glow
            relative overflow-hidden
            transition-all duration-300
            hover:scale-[1.05]
          `}
          style={{
            background:
              "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 50%, #F97316 100%)",
          }}
        >
          {/* subtle glow overlay */}
          <div className="absolute inset-0 bg-gradient-glow opacity-40" />

          {/* inner border for premium feel */}
          <div className="absolute inset-[1.5px] rounded-lg border border-white/10" />

          {/* ICON */}
          <Goal
            className="w-[60%] h-[60%] text-primary relative z-10"
            strokeWidth={2}
          />
        </div>
      )}

      {/* ================= TEXT (System) ================= */}
      {variant === "compact" && (
        <span
          className={`
            ${styles.text}
            font-heading font-semibold tracking-wide
            text-text-primary
          `}
        >
          SportsDeck
        </span>
      )}
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}