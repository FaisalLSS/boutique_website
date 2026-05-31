import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171313",
        ivory: "#fffaf2",
        silk: "#f6efe4",
        champagne: "#d7b56d",
        rosewood: "#7b2f3d",
        jade: "#164b43",
        plum: "#3c1735"
      },
      fontFamily: {
        display: ["Georgia", "Cormorant Garamond", "serif"],
        sans: ["Inter", "Segoe UI", "Arial", "sans-serif"]
      },
      boxShadow: {
        luxury: "0 24px 80px rgba(23, 19, 19, 0.18)",
        glow: "0 0 44px rgba(215, 181, 109, 0.24)"
      },
      backgroundImage: {
        "silk-radial": "radial-gradient(circle at 20% 20%, rgba(215,181,109,.22), transparent 30%), radial-gradient(circle at 80% 0%, rgba(123,47,61,.2), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
