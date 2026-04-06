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
        display: ['var(--font-display)', 'serif'], // Cormorant Garamond
        body: ['var(--font-body)', 'sans-serif'],  // Manrope
        mono: ['var(--font-mono)', 'monospace'],   // JetBrains Mono
      }
    },
  },
  plugins: [],
} satisfies Config;