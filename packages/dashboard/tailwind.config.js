/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aura-black': '#000000',
        'aura-gray': '#1c1c1e',
        'aura-blue': '#0071e3',
        'aura-green': '#32d74b'
      },
      boxShadow: {
        'aura-blue': '0 0 20px rgba(0, 113, 227, 0.35)'
      },
      keyframes: {
        'aura-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.06)', opacity: '1' }
        }
      },
      animation: {
        'aura-pulse': 'aura-pulse 2.5s ease-in-out infinite'
      }
    }
  },
  plugins: [],
  darkMode: 'class'
}