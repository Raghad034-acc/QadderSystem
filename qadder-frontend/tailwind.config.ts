import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },

      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        "3xl": "24px",
      },

      boxShadow: {
        card: "0 4px 20px rgba(0,0,0,0.05)",
        soft: "0 2px 10px rgba(0,0,0,0.08)",
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },

  plugins: [],
};

export default config;