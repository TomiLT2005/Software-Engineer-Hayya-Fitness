/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0c0c0c',
          900: '#141414', // fondo general neutro
          850: '#222222', // fondo del sidebar
          800: '#1a1a1a', // tarjetas y contenedores
          750: '#242424', // inputs y elementos secundarios
          700: '#2f2f2f', // hovers
        },
        line: {
          DEFAULT: '#2a2a2a',
          strong: '#363636',
        },
        brand: {
          DEFAULT: '#E85D26', // naranja cálido y suave, no chillón
          300: '#F4956B',
          400: '#EE743F',
          500: '#E85D26',
          600: '#CC4C1A',
        },
        muted: '#9CA3AF',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: 'none',
        'glow-sm': 'none',
        card: '0 1px 2px 0 rgba(0,0,0,0.3)',
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
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
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
