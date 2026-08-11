/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rn: { red: 'var(--rn-red)', 'red-dark': 'var(--rn-red-dark)', 'red-soft': 'var(--rn-red-soft)' },
      },
    },
  },
  plugins: [],
};
