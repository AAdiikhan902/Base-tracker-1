import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "base-blue": "#0052FF",
        "blueprint": "#0A1F44",
        "blueprint-line": "#1E3A6E",
        "paper": "#EDF2FB",
        "ink": "#0B1220",
        "alert-amber": "#FFB020",
        "alert-red": "#FF4D4D",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      backgroundImage: {
        "grid-blueprint":
          "linear-gradient(rgba(30,58,110,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(30,58,110,0.35) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
