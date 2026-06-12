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
          950: 'rgb(var(--ink-950) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          850: 'rgb(var(--ink-850) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
        },
        ember: {
          600: 'rgb(var(--ember-600) / <alpha-value>)',
          500: 'rgb(var(--ember-500) / <alpha-value>)',
          400: 'rgb(var(--ember-400) / <alpha-value>)',
          300: 'rgb(var(--ember-300) / <alpha-value>)',
        },
        tide: {
          500: 'rgb(var(--tide-500) / <alpha-value>)',
          400: 'rgb(var(--tide-400) / <alpha-value>)',
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
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) rotate(540deg)', opacity: '0.7' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s linear infinite',
        'pulse-bar': 'pulse-bar 0.9s ease-in-out infinite',
        'fade-up': 'fade-up 0.25s ease-out both',
        marquee: 'marquee 12s linear infinite',
        confetti: 'confetti 2.4s linear both',
      },
    },
  },
  plugins: [],
} satisfies Config;
