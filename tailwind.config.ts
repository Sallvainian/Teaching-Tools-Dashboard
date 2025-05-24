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
        // Enhanced dark theme with more sophisticated colors
        'bg-base': '#171923', // Darker, richer background
        'bg-gradient': '#1A1B26', // Subtle gradient end
        'card': '#1E2028', // Slightly lighter card background
        'surface': '#12141C', // Darker surface for contrast
        'accent': 'rgba(99, 102, 241, 0.1)', // Indigo accent
        'accent-hover': '#6366F1', // Indigo hover
        'purple': '#8B5CF6', // Vibrant purple
        'purple-light': '#A78BFA', // Light purple accent
        'purple-bg': 'rgba(139, 92, 246, 0.08)', // Subtle purple background
        'purple-hover': '#7C3AED', // Deeper purple hover
        'error': '#EF4444', // Brighter error red
        'error-hover': '#DC2626', // Darker error hover
        'text-base': '#A0AEC0', // Softer default text
        'text-hover': '#F7FAFC', // Brighter hover text
        'highlight': '#F9FAFB', // Crisp white highlights
        'muted': '#4A5568', // Muted text
        'border': '#2D3748', // Subtle borders
        'separator': '#2D3748', // Matching separator
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
        'themed-card': '0 8px 16px rgba(0, 0, 0, 0.3), 0 4px 6px rgba(0, 0, 0, 0.2)',
        'dropdown': '0 10px 20px rgba(0, 0, 0, 0.4), 0 6px 8px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.15)',
        'button': '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
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