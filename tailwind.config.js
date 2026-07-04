/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // Typography
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          primary: '#2563EB', // Blue-600
          secondary: '#1D4ED8', // Blue-700
          border: '#E2E8F0', // Slate-200
          muted: '#64748B', // Slate-500
          DEFAULT: '#2563EB', // Primary Blue
          hover: '#1D4ED8',   // Primary Dark (Standard Blue-700)
          deep: '#0F172A',    // Brand Black / Header
          soft: '#EFF6FF',    // Light Blue Accents
        },
        pos: {
          bg: '#F8FAFC',      // Background Surface
          success: '#22C55E', // Success/Online
          danger: 'EF4444',  // Error/Void
          warning: '#F97316', // Warning/Action
          highlight: '#FACC15', // Discount/Highlight
          text: '#0F172A',    // Primary Text
          muted: '#94A3B8',   // Muted Text
        }
      },
      animation: {
        'button-scale': 'buttonScale 0.2s ease-out',
        'button-pulse': 'buttonPulse 0.6s ease-in-out',
        'button-glow': 'buttonGlow 0.3s ease-out forwards',
        'modal-blur': 'modalBlur 0.3s ease-out forwards',
      },
      keyframes: {
        buttonScale: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(0.98)' },
        },
        buttonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        buttonGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.4)' },
          '100%': { boxShadow: '0 0 0 6px rgba(37, 99, 235, 0)' },
        },
        modalBlur: {
          '0%': { backdropFilter: 'blur(0px)' },
          '100%': { backdropFilter: 'blur(8px)' },
        },
      },
    },
  },
  plugins: [],
}
