import type { Config } from 'tailwindcss';

/**
 * Tarang design tokens.
 * Dark-first. "Ink" surfaces, warm amber "ember" accent, teal "tide" support.
 * Spacing follows a 4px base grid via Tailwind defaults.
 */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090f',
          900: '#0b0e14',
          850: '#10141d',
          800: '#151a26',
          700: '#1e2433',
          600: '#2a3245',
          400: '#5b667d',
          300: '#8b95aa',
          200: '#b9c0d0',
          100: '#e6e9f0',
        },
        ember: {
          600: '#d97a1f',
          500: '#f0922e',
          400: '#f7a94f',
          300: '#ffc97e',
        },
        tide: {
          500: '#2dd4bf',
          400: '#5eead4',
        },
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Noto Sans', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'pulse-bar': {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-bar': 'pulse-bar 0.9s ease-in-out infinite',
        'fade-up': 'fade-up 0.25s ease-out both',
        marquee: 'marquee 12s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
