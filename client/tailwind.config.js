/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F3F6F5",
        surface: "#FFFFFF",
        ink: "#16231F",
        "ink-muted": "#5B6B65",
        border: "#DDE5E1",
        brand: { DEFAULT: "#1F6F54", deep: "#14503C", tint: "#E4F0EA" },
        slate: { DEFAULT: "#3E5C76", tint: "#E7ECF1" },
        valid: { DEFAULT: "#2F8F5B", tint: "#E6F3EC" },
        expiring: { DEFAULT: "#C97C1F", tint: "#FBEDDC" },
        expired: { DEFAULT: "#B23A2E", tint: "#FAE6E4" },
        paidc: { DEFAULT: "#6B7280", tint: "#EEF0F1" },
      },
      fontFamily: {
        sans: ["'Public Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Courier New'", "monospace"],
      },
    },
  },
  plugins: [],
};
