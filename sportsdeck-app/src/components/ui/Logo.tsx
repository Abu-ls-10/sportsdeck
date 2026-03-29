"use client";

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
            bg-gradient-primary
            shadow-glow
            font-bold text-white
          `}
        >
          SD
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