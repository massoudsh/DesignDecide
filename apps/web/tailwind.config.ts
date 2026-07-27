import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6f4f1",
          100: "#ece6dd",
          400: "#b99b6b",
          500: "#a1824f",
          600: "#856a3d",
          900: "#2c2318",
        },
      },
      fontFamily: {
        vazir: ["Vazirmatn", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
