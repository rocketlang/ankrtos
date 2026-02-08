/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // NCERT brand colors
        ncert: {
          blue: '#1e40af',
          orange: '#f97316',
        },
      },
    },
  },
  plugins: [],
}
