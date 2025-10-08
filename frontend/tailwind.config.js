/** @type {import('tailwindcss').Config} */
const forestPalette = {
  50: "#f3f6f2",
  100: "#e4ede2",
  200: "#c8dcc7",
  300: "#a9c9ab",
  400: "#82b28a",
  500: "#5c976a",
  600: "#477956",
  700: "#385c42",
  800: "#274030",
  900: "#1a2b21",
  950: "#0f1b14",
};

const earthPalette = {
  50: "#f6f1eb",
  100: "#eadfcd",
  200: "#d3c1a0",
  300: "#bb9f74",
  400: "#a17f51",
  500: "#85653a",
  600: "#6b4f2e",
  700: "#513b24",
  800: "#38281a",
  900: "#22180f",
  950: "#120c07",
};

module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Quicksand",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Playfair Display",
          "Quicksand",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        emerald: forestPalette,
        earth: earthPalette,
      },
    },
  },
  plugins: [],
};
