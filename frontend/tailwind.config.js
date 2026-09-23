/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF6B00",
          "orange-hover": "#E56000",
          "orange-light": "#FFF7ED",
          "orange-border": "#FFD6B3",
          navy: "#0F172A",
          dark: "#181F2A",
          card: "#FFFFFF",
          bg: "#F8FAFC",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
