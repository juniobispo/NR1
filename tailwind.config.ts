import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#80abff",
          400: "#4d82ff",
          500: "#2657f5",
          600: "#1a3fc7",
          700: "#152f96",
          800: "#132669",
          900: "#0f1c4a",
        },
        risk: {
          low: "#2f9e44",
          medium: "#f08c00",
          high: "#e8590c",
          critical: "#c92a2a",
        },
      },
    },
  },
  plugins: [],
};

export default config;
