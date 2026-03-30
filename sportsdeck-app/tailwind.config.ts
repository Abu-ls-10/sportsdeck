import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ===== PRIMARY (BLUE SYSTEM) ===== */
        primary: {
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
        },

        /* ===== ACCENT (CYAN GLOW) ===== */
        accent: {
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
          600: "#0891B2",
        },

        /* ===== BRAND (ORANGE HIGHLIGHT) ===== */
        brand: {
          300: "#FDBA74",
          400: "#FB923C",
          500: "#F97316",
          600: "#EA580C",
        },

        /* ===== BACKGROUND SYSTEM (IMPROVED DEPTH) ===== */
        bg: {
          main: "rgb(var(--color-bg-main) / <alpha-value>)",
          surface: "rgb(var(--color-bg-surface) / <alpha-value>)",
          card: "rgb(var(--color-bg-card) / <alpha-value>)",
          elevated: "rgb(var(--color-bg-elevated) / <alpha-value>)",
          glass: "var(--color-bg-glass)",
        },

        /* ===== TEXT SYSTEM ===== */
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
          dim: "rgb(var(--color-text-dim) / <alpha-value>)",
        },

        /* ===== BORDER SYSTEM ===== */
        border: {
          DEFAULT: "rgb(var(--color-border-default) / <alpha-value>)",
          subtle: "var(--color-border-subtle)",
          strong: "rgb(var(--color-border-strong) / <alpha-value>)",
        },
      },

      /* ===== GRADIENTS ===== */
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",

        "gradient-card":
          "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0))",

        "gradient-glow":
          "radial-gradient(circle at top, rgba(34,211,238,0.18), transparent 70%)",

        "gradient-border":
          "linear-gradient(120deg, rgba(14,165,233,0.4), rgba(6,182,212,0.2), transparent)",
      },

      /* ===== SHADOWS ===== */
      boxShadow: {
        card: "0 10px 35px rgba(0,0,0,0.35)",
        glow: "0 0 30px rgba(14,165,233,0.18)",
        soft: "0 6px 20px rgba(0,0,0,0.25)",
        inner: "inset 0 1px 0 rgba(255,255,255,0.05)",
      },

      /* ===== BORDER RADIUS ===== */
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem", // NEW (for hero cards)
      },

      /* ===== SPACING (UX POLISH) ===== */
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },

      /* ===== TRANSITIONS ===== */
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      /* ===== BACKDROP BLUR ===== */
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
}

export default config