/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#FAF8F4',
          base: '#FAF8F4',
          surface: '#FFFFFF',
          surface2: '#F2EFE9',
          panel: '#F7F4EE',
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
        glow: '0 0 0 1px rgba(124, 92, 255, 0.25), 0 6px 20px -10px rgba(124, 92, 255, 0.35)',
        'glow-cyan': '0 0 0 1px rgba(34, 211, 238, 0.25), 0 6px 20px -10px rgba(34, 211, 238, 0.35)',
        'glow-coral': '0 0 0 1px rgba(255, 122, 89, 0.25), 0 6px 20px -10px rgba(255, 122, 89, 0.35)',
        'glow-green': '0 0 0 1px rgba(52, 211, 153, 0.25), 0 6px 20px -10px rgba(52, 211, 153, 0.35)',
        card: '0 1px 0 0 rgba(255,255,255,1) inset, 0 14px 36px -20px rgba(60,50,90,0.22)',
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
