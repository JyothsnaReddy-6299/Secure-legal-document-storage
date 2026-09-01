/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e3a8a",
        secondary: "#0d9488",
        danger: "#dc2626",
        warning: "#d97706",
        success: "#16a34a"
      }
    },
  },
  plugins: [],
}
