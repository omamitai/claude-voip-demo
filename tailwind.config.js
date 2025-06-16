/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#111111',
        'surface-1': '#181818',
        'surface-2': '#222222',
        'primary': '#7F56D9',
        'primary-hover': '#6941C6',
        'accent': '#A586E5',
        'text-primary': '#F5F5F7',
        'text-secondary': '#A8A8A8',
        'border-default': '#2D2D2D',
        'success': '#079455',
        'danger': '#D92D20',
      },
      boxShadow: {
        'glow-primary': '0 0 16px 4px rgba(127, 86, 217, 0.4)',
      },
    },
  },
  plugins: [],
}
