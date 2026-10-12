/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0D12',
          900: '#0F1117', // fondo general
          850: '#12141B', // sidebar
          800: '#161922', // tarjetas
          750: '#1B1F2A',
          700: '#20242F',
        },
        line: {
          DEFAULT: '#262A36',
          strong: '#333847',
        },
        brand: {
          DEFAULT: '#FF5500',
          300: '#FF8A4C',
          400: '#FF6600',
          500: '#FF5500',
          600: '#E04B00',
        },
        muted: '#9CA3AF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,85,0,.45), 0 10px 30px -8px rgba(255,85,0,.55)',
        'glow-sm': '0 6px 20px -6px rgba(255,85,0,.6)',
        card: '0 1px 0 0 rgba(255,255,255,.03) inset, 0 20px 40px -24px rgba(0,0,0,.6)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(.96) translateY(8px)' },
          to: { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(34,197,94,.55)' },
          '70%': { boxShadow: '0 0 0 8px rgba(34,197,94,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-8px)' },
          '40%,80%': { transform: 'translateX(8px)' },
        },
        shrink: { from: { transform: 'scaleX(1)' }, to: { transform: 'scaleX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in .2s ease-out both',
        'scale-in': 'scale-in .25s cubic-bezier(.2,.8,.2,1) both',
        'slide-up': 'slide-up .35s cubic-bezier(.2,.8,.2,1) both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        shake: 'shake .45s ease-in-out',
        shrink: 'shrink linear forwards',
      },
    },
  },
  plugins: [],
};
