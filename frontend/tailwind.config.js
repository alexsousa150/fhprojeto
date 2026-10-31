/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Cinzel', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'serif'],
        script: ['"Alex Brush"', '"Great Vibes"', 'cursive'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        creme: {
          50: '#FAF8F5',
          100: '#F5EFEB',
          200: '#EBDDCF',
          300: '#DFC8B0',
          400: '#D3A25D',
          500: '#B88438',
          600: '#8C5E20',
          700: '#543A14',
          800: '#3B270C',
          900: '#261907',
        },
        wood: {
          50: '#fdf8f4',
          100: '#f9eee4',
          200: '#f1d8c4',
          500: '#c07b46',
          700: '#8c4e23',
          900: '#4e270e',
        }
      }
    },
  },
  plugins: [],
}
