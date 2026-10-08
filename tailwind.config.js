/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#FF7900",
          hover: "#E65F00",
          light: "#FFF0E2",
        },
        ink: "#171717",
        income: "#2F9E44",
        expense: "#D9622B",
        danger: "#E03131",
        warning: "#F59E0B",
      },
    },
  },
  plugins: [],
};
