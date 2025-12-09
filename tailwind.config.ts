// tailwind.config.ts - Configurazione Tailwind con tema rosso SnipeDeal
// Timestamp: 2024-12-09

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Rosso Vivace stile Duolingo
        primary: {
          DEFAULT: '#E53935',
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#E53935',
          600: '#E53935',
          700: '#C62828',
          800: '#B71C1C',
          900: '#8B0000',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#FF7043',
          50: '#FBE9E7',
          100: '#FFCCBC',
          200: '#FFAB91',
          300: '#FF8A65',
          400: '#FF7043',
          500: '#FF5722',
          600: '#F4511E',
          700: '#E64A19',
          800: '#D84315',
          900: '#BF360C',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#43A047',
          50: '#E8F5E9',
          100: '#C8E6C9',
          200: '#A5D6A7',
          300: '#81C784',
          400: '#66BB6A',
          500: '#43A047',
          600: '#388E3C',
          700: '#2E7D32',
          800: '#1B5E20',
          900: '#1B5E20',
        },
        warning: {
          DEFAULT: '#FFA726',
          50: '#FFF3E0',
          100: '#FFE0B2',
          200: '#FFCC80',
          300: '#FFB74D',
          400: '#FFA726',
          500: '#FF9800',
          600: '#FB8C00',
          700: '#F57C00',
          800: '#EF6C00',
          900: '#E65100',
        },
        danger: {
          DEFAULT: '#D32F2F',
          foreground: '#FFFFFF',
        },
        // UI Colors
        background: '#FAFAFA',
        foreground: '#1A1A1A',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A',
        },
        muted: {
          DEFAULT: '#F5F5F5',
          foreground: '#737373',
        },
        accent: {
          DEFAULT: '#FFF3E0',
          foreground: '#E65100',
        },
        border: '#E5E5E5',
        input: '#E5E5E5',
        ring: '#E53935',
      },
      borderRadius: {
        lg: '16px',
        md: '12px',
        sm: '8px',
        xl: '20px',
        '2xl': '24px',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
        'fab': '0 4px 12px rgba(229, 57, 53, 0.4)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};

export default config;


