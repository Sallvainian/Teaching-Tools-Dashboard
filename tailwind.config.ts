import type { Config } from 'tailwindcss';
import typographyPlugin from '@tailwindcss/typography';
import formsPlugin from '@tailwindcss/forms';
import daisyuiPlugin from 'daisyui';

const config: Config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-base': '#0B0F19', // Darker background
        'bg-gradient': '#0D1120', // Gradient end
        'card': '#111827', // Card background
        'surface': '#1F2937', // Surface elements
        'accent': 'rgba(99, 102, 241, 0.1)', // Indigo accent
        'accent-hover': '#6366F1', // Indigo hover
        'purple': '#8B5CF6', // Primary purple
        'purple-light': '#A78BFA', // Light purple
        'purple-bg': 'rgba(139, 92, 246, 0.08)', // Purple background
        'purple-hover': '#7C3AED', // Purple hover
        'error': '#EF4444', // Error red
        'error-hover': '#DC2626', // Error hover
        'text-base': '#9CA3AF', // Base text
        'text-hover': '#F9FAFB', // Text hover
        'highlight': '#F9FAFB', // Highlights
        'muted': '#4B5563', // Muted text
        'border': '#1F2937', // Borders
        'separator': '#374151', // Separators
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(50% 50% at 50% 50%, var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
        'themed-card': '0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)',
        'dropdown': '0 10px 20px rgba(0, 0, 0, 0.5), 0 6px 8px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.15)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [daisyuiPlugin, typographyPlugin, formsPlugin],
  daisyui: {
    themes: ["dark", "light"],
    darkTheme: "dark",
    base: false,
    styled: true,
    utils: false,
    logs: false,
    rtl: false,
    prefix: "d-",
  },
};

export default config;