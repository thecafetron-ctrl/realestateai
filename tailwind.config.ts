import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
      colors: {
        border: "rgba(139, 92, 246, 0.2)",
        input: "rgba(38, 38, 48, 0.8)",
        ring: "rgb(139, 92, 246)",
        background: "#0A0A0F",
        foreground: "#E5E7EB",
        primary: {
          DEFAULT: "#8B5CF6",
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
          deep: "#6B21A8",
          light: "#A855F7",
        },
        accent: {
          gold: "#F5C518",
          platinum: "#E5E7EB",
          emerald: "#10B981",
        },
        surface: {
          dark: "#1A1A24",
          medium: "#252530",
          light: "#2A2A35",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#E5E7EB",
          tertiary: "#9CA3AF",
        },
        purple: {
          50: "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
          800: "#6b21a8",
          900: "#581c87",
          950: "#3b0764",
        },
        luxe: {
          background: {
            light: "#FAFAFA",
            dark: "#0A0A0F",
          },
          surface: {
            light: "rgba(255,255,255,0.9)",
            dark: "rgba(26,26,36,0.85)",
          },
          accent: {
            gold: "#F5C518",
            platinum: "#E5E7EB",
            purple: "#8B5CF6",
            purpleDeep: "#6B21A8",
            purpleLight: "#A855F7",
            emerald: "#10B981",
          },
        },
      },
      boxShadow: {
        card: "0 20px 50px -30px rgba(107, 33, 168, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.1)",
        glow: "0 30px 60px -20px rgba(139, 92, 246, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.2)",
        "purple-glow": "0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)",
        "purple-glow-sm": "0 0 20px rgba(139, 92, 246, 0.4)",
        "ambient": "0 0 100px rgba(139, 92, 246, 0.1)",
        "elevation-1": "0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.1)",
        "elevation-2": "0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(139, 92, 246, 0.15)",
        "elevation-3": "0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.2)",
      },
      backgroundImage: {
        "purple-gradient": "linear-gradient(135deg, #8B5CF6 0%, #6B21A8 50%, #7C3AED 100%)",
        "purple-gold": "linear-gradient(135deg, #8B5CF6 0%, #F5C518 100%)",
        "purple-radial": "radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
        "glass-dark": "linear-gradient(135deg, rgba(26, 26, 36, 0.9) 0%, rgba(20, 20, 30, 0.85) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
