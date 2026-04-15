/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        navy: '#0f172a',
      },
      opacity: {
        8: '0.08',
        12: '0.12',
        15: '0.15',
        25: '0.25',
        35: '0.35',
      },
      backgroundOpacity: {
        8: '0.08',
        12: '0.12',
      },
    },
  },
  plugins: [],
}
