/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#22C55E", // green-500
          light: "#4ADE80", // green-400
          dark: "#16A34A", // green-600
        },
        background: {
          DEFAULT: "#F9FAFB", // gray-50
          light: "#FFFFFF", // white
          lighter: "#F3F4F6", // gray-100
        },
        surface: {
          DEFAULT: "#FFFFFF", // white
          light: "#F9FAFB", // gray-50
        },
        text: {
          primary: "#1F2937", // gray-800
          secondary: "#6B7280", // gray-500
          tertiary: "#9CA3AF", // gray-400
        },
        accent: {
          DEFAULT: "#22C55E", // green-500
          red: "#EF4444",
          yellow: "#F59E0B",
        },
      },
    },
  },
  plugins: [],
};
