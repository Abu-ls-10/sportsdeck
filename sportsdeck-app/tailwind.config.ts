import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          500: "#0EA5E9",
        },
        accent: {
          500: "#06B6D4",
        },
        brand: {
          500: "#F97316",
        },
        bg: {
          main: "#0B1220",
          surface: "#111827",
          card: "#1F2937",
        },
        text: {
          primary: "#E5E7EB",
          secondary: "#9CA3AF",
        },
      },
    },
  },
  plugins: [],
}

export default config