/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aarogya: {
          50: '#f0f9f6',
          100: '#d7f0e6',
          200: '#b2e2d0',
          300: '#82ceb4',
          400: '#4fb694',
          500: '#149575',
          600: '#0c7c61',
          700: '#0a634e',
          800: '#0b4f3f',
          900: '#0c4235',
          950: '#04261f',
        },
        mint: {
          light: '#f2fbf7',
          DEFAULT: '#e6f7f1',
          dark: '#cceee2',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(12, 107, 88, 0.08)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
