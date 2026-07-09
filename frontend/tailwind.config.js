/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta corporativa de La Quinta (tomada del logo): azul cielo como
        // color de acción primario, azul marino profundo para énfasis/marca.
        brand: {
          50: "#eaf6fd",
          100: "#cdebfb",
          200: "#9bd8f7",
          300: "#69c4f2",
          400: "#3ab0ea",
          500: "#1ca3e0",
          600: "#1584b9",
          700: "#0f6491",
          800: "#0b4c8c",
          900: "#073561",
        },
      },
    },
  },
  plugins: [],
};
