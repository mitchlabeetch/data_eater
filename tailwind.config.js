/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'robertet-green': '#006B3F',
        'glouton-green': '#39FF14',
        'glouton-red': '#FF073A',
        'background-dark': '#111813',
        'surface-dark': '#1c2a21',
        'surface-active': '#28392e',
        'border-dark': '#28392e',
        'primary': '#13ec5b',
        'primary-dim': '#0fa640',
        'text-muted': '#9db9a6',
        'subtle': '#55695e',
      },
      fontFamily: {
        'display': ['Inter', 'sans-serif'],
        'retro': ['"Press Start 2P"', 'cursive'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
