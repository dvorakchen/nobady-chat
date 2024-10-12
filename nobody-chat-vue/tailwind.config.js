/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.vue', './index.html'],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/typography'), require('daisyui')],
  daisyui: {
    themes: ['dark']
  }
}
