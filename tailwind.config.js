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
          bg: '#F8FAFC',
          canvas: '#F1F5F9',
          card: '#FFFFFF',
          border: '#E2E8F0',
          borderDark: '#CBD5E1',
          yellow: '#FACC15',       // Primary Yellow Accent replacing Orange
          yellowHover: '#EAB308',
          yellowDark: '#CA8A04',
          yellowLight: '#FEF9C3',
          yellowSubtle: 'rgba(250, 204, 21, 0.15)',
          dark: '#0F172A',
          charcoal: '#1E293B',
          muted: '#64748B',
        }
      }
    },
  },
  plugins: [],
}
