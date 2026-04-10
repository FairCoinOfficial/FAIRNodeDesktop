/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./packages/ui/index.html",
    "./packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "./packages/common/src/**/*.{js,ts,jsx,tsx}",
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../common/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        fair: {
          dark: "#1b1e09",
          green: "#9ffb50",
          white: "#ffffff",
          "dark-light": "#2a2e14",
          "green-dim": "#7cc940",
          muted: "#6b7280",
          border: "#3a3f1e",
        },
      },
      fontFamily: {
        body: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
