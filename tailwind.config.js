/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./templates/**/*.html", "./assets/js/*.js"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography"), require("daisyui")],
  daisyui: {
    themes: ["dark"],
  },
};
