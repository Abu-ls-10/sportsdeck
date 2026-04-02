import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
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

        /* ===== THEME TOKENS VIA CSS VARIABLES ===== */
        bg: {
          main: "var(--bg-main)",
          surface: "var(--bg-surface)",
          card: "var(--bg-card)",
          elevated: "var(--bg-elevated)",
          glass: "var(--bg-glass)",
        },

        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          dim: "var(--text-dim)",
        },

        border: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
        },
      },

      /* ===== GRADIENTS ===== */
      backgroundImage: {
        "gradient-primary":
          "linear-gradient(135deg, #0EA5E9 0%, #06B6D4 100%)",

        "gradient-card":
          "linear-gradient(180deg, var(--gradient-card-from), var(--gradient-card-to))",

        "gradient-glow":
          "radial-gradient(circle at top, var(--gradient-glow), transparent 70%)",

        "gradient-border":
          "linear-gradient(120deg, var(--gradient-border-start), var(--gradient-border-mid), transparent)",

        /** Start discussion card on community (avoid arbitrary bg-[linear-gradient(...)] — breaks LightningCSS) */
        "gradient-discussion-cta":
          "linear-gradient(180deg, rgba(14, 165, 233, 0.07), rgba(14, 165, 233, 0.02))",
      },

      /* ===== SHADOWS ===== */
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
        soft: "var(--shadow-soft)",
        inner: "var(--shadow-inner)",
      },

      /* ===== BORDER RADIUS ===== */
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },

      /* ===== SPACING ===== */
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