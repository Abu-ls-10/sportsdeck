import path from "path";
import { fileURLToPath } from "url";

/** App root (folder that contains package.json + node_modules). Fixes resolution when Next runs PostCSS with a parent cwd (e.g. PP2/PP2). */
const appDir = path.dirname(fileURLToPath(import.meta.url));

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      base: appDir,
    },
  },
};

export default config;
