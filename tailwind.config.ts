import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ramboow: {
          navy: {
            50: "#f0f4f9",
            100: "#e0e9f3",
            200: "#c2d4e7",
            300: "#95b6d7",
            400: "#6193c2",
            500: "#3d76ae",
            600: "#2d5e92",
            700: "#244b76",
            800: "#1b3554",
            900: "#0b1728",
            950: "#070e1b",
          },
          red: {
            50: "#fdf3f3",
            100: "#fce4e4",
            200: "#f9cece",
            300: "#f3a9a9",
            400: "#e97474",
            500: "#d94242",
            600: "#be2626",
            700: "#9e1c1c",
            800: "#841919",
            900: "#701a1a",
            950: "#400808",
          },
          sand: "#fdfbf9",
        },
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(15, 23, 42, 0.06)",
        "soft-lg": "0 10px 30px -4px rgba(15, 23, 42, 0.08)",
        "red-glow": "0 6px 20px -4px rgba(158, 28, 28, 0.35)",
        "blue-glow": "0 6px 20px -4px rgba(45, 94, 146, 0.25)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;

