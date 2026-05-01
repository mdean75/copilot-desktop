import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        sidebar: "hsl(var(--sidebar))",
        "sidebar-foreground": "hsl(var(--sidebar-foreground))",
        "sidebar-border": "hsl(var(--sidebar-border))",
      },
    },
  },
  plugins: [],
} satisfies Config;
