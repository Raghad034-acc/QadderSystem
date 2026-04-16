import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        qadder: {
          black: "#000000",
          light: "#FCFFE4",
          primary: "#274B2C",
          secondary: "#ADC893",
          dark: "#102F15",
          accent: "#fcffc4",

          /* Future UI Colors */
          background: "#FCFFE4",
          card: "#FFFFFF",
          border: "#ADC893",

          /* Status Colors */
          success: "#2E7D32",
          warning: "#F9A825",
          error: "#D32F2F",
          info: "#0288D1",

        },
      },

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