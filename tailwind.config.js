/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Nunito', 'sans-serif'],
      },
      colors: {
        primary: '#f97316', // Naranja que usamos en los botones
      }
    },
  },
  plugins: [],
}