/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pos: {
          bg: '#0A0A0A',
          card: '#141414',
          cardHover: '#1E1E1E',
          border: '#2A2A2A',
          yellow: '#FACC15',       // Octopizza Brand Gold Yellow
          yellowHover: '#EAB308',
          yellowDark: '#CA8A04',
          yellowLight: 'rgba(250, 204, 21, 0.15)',
          white: '#FFFFFF',
          dark: '#000000',
        }
      }
    },
  },
  plugins: [],
}
