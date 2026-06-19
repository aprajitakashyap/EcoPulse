/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eco: {
          light: '#f0fdf4',
          DEFAULT: '#22c55e',
          dark: '#166534',
        }
      }
    },
  },
  plugins: [],
}
