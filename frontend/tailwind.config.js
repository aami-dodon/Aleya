/** @type {import('tailwindcss').Config} */
const heavenlyBluePalette = {
  50: "#f1f7ff",
  100: "#dcecff",
  200: "#b7d8ff",
  300: "#8fc1ff",
  400: "#65a7ff",
  500: "#3c8cff",
  600: "#1f74e6",
  700: "#1559bc",
  800: "#124596",
  900: "#0f3677",
  950: "#081f4d",
};

module.exports = {
  content: ["./public/index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "Poppins",
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      colors: {
        emerald: heavenlyBluePalette,
      },
    },
  },
  plugins: [],
};
