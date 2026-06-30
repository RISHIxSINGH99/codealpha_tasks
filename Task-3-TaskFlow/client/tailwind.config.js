/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core dark-theme palette - named tokens used consistently across the app
        surface: {
          DEFAULT: "#0F1115", // app background
          raised: "#161A21",  // cards, panels
          overlay: "#1E2330", // modals, dropdowns
          border: "#2A2F3A",
        },
        accent: {
          DEFAULT: "#6E56F8", // primary actions - violet
          hover: "#8170FA",
          muted: "#3A3160",
        },
        success: "#3DD68C",
        warning: "#F5A623",
        danger: "#F25757",
        info: "#4DA3FF",
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.4), 0 8px 24px -8px rgba(0,0,0,0.5)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-out",
        slideUp: "slideUp 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
