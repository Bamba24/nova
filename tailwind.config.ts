/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    // Assure-toi que tous tes dossiers sont bien listés ici
  ],
  theme: {
    extend: {
      colors: {
        // Tes couleurs exactes du fichier CSS
        primary: "#3498db",
        secondary: "#2196F3",
        success: "#4CAF50",
        danger: "#f44336",
        warning: "#ff9800",
        background: "#f8f9fa",
      },
    },
  },
  plugins: [],
}