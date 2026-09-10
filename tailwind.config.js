/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0D0F14',
          surface: '#161A22',
          surface2: '#1D2230',
        },
        brand: {
          violet: '#7C5CFF',
          cyan: '#22D3EE',
          coral: '#FF7A59',
          green: '#34D399',
          amber: '#FBBF24',
          orange: '#FB923C',
          blue: '#60A5FA',
          slate: '#94A3B8',
        },
        status: {
          nouveau: '#22D3EE',
          comprendre: '#60A5FA',
          echange: '#7C5CFF',
          proposition: '#FBBF24',
          attente: '#FB923C',
          confirmee: '#34D399',
          sanssuite: '#64748B',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(124, 92, 255, 0.3), 0 4px 24px -8px rgba(124, 92, 255, 0.4)',
        'glow-cyan': '0 0 0 1px rgba(34, 211, 238, 0.3), 0 4px 24px -8px rgba(34, 211, 238, 0.4)',
        'glow-coral': '0 0 0 1px rgba(255, 122, 89, 0.3), 0 4px 24px -8px rgba(255, 122, 89, 0.4)',
        'glow-green': '0 0 0 1px rgba(52, 211, 153, 0.3), 0 4px 24px -8px rgba(52, 211, 153, 0.4)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.6)',
      },
      transitionTimingFunction: {
        snap: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 250ms ease-out',
        slideInRight: 'slideInRight 300ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
