import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: { 
        display: ['var(--font-syne)', 'sans-serif'], 
        mono: ['var(--font-dm-mono)', 'monospace'], 
      }
    },
  },
  plugins: [],
} satisfies Config;
