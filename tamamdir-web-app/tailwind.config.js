/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          primary: '#1B5E3B',
          dark: '#14472D',
          medium: '#2E7D52',
          light: '#4CAF82',
          pale: '#E8F5EE',
          badge: '#D1FAE5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
