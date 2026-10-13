/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          maroon: '#5b0000',
          dark: '#430000',
        },
      },
      fontFamily: {
        brand: ['Patrick Hand', 'cursive', 'system-ui', 'sans-serif'],
        tech: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
