/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./packages/ui/index.html",
    "./packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "./packages/electron/src/**/*.{js,ts,jsx,tsx}",
    "./packages/common/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
