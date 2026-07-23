export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sokol: {
          red: "#D32F2F",
          blue: "#1976D2",
          navy: "#111827",
          ink: "#1F2937",
          paper: "#FBF7F2",
          peach: "#F0B383",
        },
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "system-ui", "sans-serif"],
        display: ["Impact", "Arial Narrow", "Haettenschweiler", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 14px 35px rgba(31, 41, 55, 0.10)",
      },
    },
  },
  plugins: [],
};
