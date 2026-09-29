import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#EFF6FF",
        },
        navy: {
          DEFAULT: "#111827",
          dark: "#0F172A",
          muted: "#334155",
        },
        sidebar: {
          DEFAULT: "#F4F8FC",
          border: "#E2E8F0",
        },
        rail: {
          DEFAULT: "#F4F4F4",
          border: "#E2E8F0",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F8FAFC",
        },
        border: {
          subtle: "#E2E8F0",
          strong: "#CBD5E1",
        },
        text: {
          primary: "#111827",
          secondary: "#334155",
          muted: "#64748B",
          light: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        card: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        card: "16px",
        pill: "9999px",
        search: "22px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
