import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#2A1E4E",
        surface: "#372A63",
        elevated: "#453576",
        line: "#4A3D77",
        "line-strong": "#5D4E90",
        foreground: "#FBFAFF",
        muted: "#D6CEF3",
        subtle: "#AEA3D6",
        accent: {
          DEFAULT: "#2FC259",
          hover: "#3AD267",
          soft: "rgba(47,194,89,0.18)",
        },
        success: "#43CE7A",
        warning: "#FFB43D",
        danger: "#FF5C6B",
        gold: "#FFC24B",
        "gold-edge": "#E8961C",
        xp: "#FFC24B",
        badge: "#9B7BF5",
        emerald: "#2E9E63",
      },
      fontFamily: {
        sans: ["'Nunito'", "system-ui", "sans-serif"],
        mono: ["'Baloo 2'", "system-ui", "sans-serif"],
        display: ["'Baloo 2'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.4)",
        elevated:
          "0 8px 30px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.03) inset",
        glow: "0 0 0 1px rgba(47,194,89,0.4), 0 0 40px -8px rgba(47,194,89,0.5)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "message-in": {
          from: { opacity: "0", transform: "translateY(6px) scale(0.99)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "timer-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "count-pop": {
          "0%": { opacity: "0", transform: "scale(0.6)" },
          "45%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "player-in": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        sweep: {
          from: { transform: "scaleX(0)", opacity: "0.8" },
          to: { transform: "scaleX(1)", opacity: "0.35" },
        },
        shake: {
          "0%,100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-5px)" },
          "40%": { transform: "translateX(5px)" },
          "60%": { transform: "translateX(-3px)" },
          "80%": { transform: "translateX(3px)" },
        },
        "success-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(76,183,130,0.5)" },
          "100%": { boxShadow: "0 0 0 8px rgba(76,183,130,0)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(16px) scale(0.98)" },
          to: { opacity: "1", transform: "translateX(0) scale(1)" },
        },
        "avatar-glow": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(242,201,76,0.0)" },
          "50%": { boxShadow: "0 0 18px 2px rgba(242,201,76,0.45)" },
        },
        "letter-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.8)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "points-float": {
          from: { opacity: "1", transform: "translateY(2px)" },
          to: { opacity: "0", transform: "translateY(-14px)" },
        },
        "letter-fall": {
          "0%": { transform: "translateY(-24px) rotate(var(--rot,0deg))", opacity: "0" },
          "12%": { opacity: "0.16" },
          "86%": { opacity: "0.16" },
          "100%": { transform: "translateY(150px) rotate(calc(var(--rot,0deg) + 14deg))", opacity: "0" },
        },
        "cloud-drift": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(60px)" },
        },
        "join-pop": {
          "0%": { opacity: "0", transform: "translateX(-12px) scale(0.9)" },
          "60%": { opacity: "1", transform: "translateX(0) scale(1.04)" },
          "100%": { opacity: "1", transform: "translateX(0) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "message-in": "message-in 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "timer-pulse": "timer-pulse 2s ease-in-out infinite",
        "count-pop": "count-pop 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "player-in": "player-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
        sweep: "sweep 0.25s cubic-bezier(0.16,1,0.3,1) both",
        shake: "shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97) both",
        "success-pulse": "success-pulse 0.5s ease-out both",
        "toast-in": "toast-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "avatar-glow": "avatar-glow 2.4s ease-in-out infinite",
        "letter-in": "letter-in 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "points-float": "points-float 1.2s ease-out forwards",
        "letter-fall": "letter-fall 12s linear infinite",
        "cloud-drift": "cloud-drift 30s ease-in-out infinite alternate",
        "join-pop": "join-pop 0.42s cubic-bezier(0.34,1.56,0.5,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
