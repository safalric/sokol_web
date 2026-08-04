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
          paper: "#F4F5F7",
          peach: "#F0B383",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)"],
        display: ["var(--font-display)"],
      },
      boxShadow: {
        soft: "0 14px 35px rgba(31, 41, 55, 0.10)",
      },
    },
  },
  plugins: [],
};
