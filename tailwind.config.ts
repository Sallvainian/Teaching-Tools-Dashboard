import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

import daisyui from 'daisyui';

const config: Config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class', // or 'media' if you prefer OS-based
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Sophisticated dark theme inspired by UI dropdown design
        'dark-bg': 'rgb(36, 40, 50)', // Main background - deep charcoal
        'dark-bg-gradient': 'rgb(37, 28, 40)', // Gradient end - slight purple tint
        'dark-card': 'rgb(36, 40, 50)', // Card base color
        'dark-surface': 'rgb(24, 26, 32)', // Darker surface for sidebar
        'dark-accent': 'rgba(83, 83, 255, 0.1)', // Primary accent background
        'dark-accent-hover': '#5353ff', // Primary blue hover
        'dark-purple': '#8e57d1', // Main purple color 
        'dark-purple-light': '#bd89ff', // Light purple accent
        'dark-purple-bg': 'rgba(142, 87, 209, 0.1)', // Purple background
        'dark-purple-hover': '#7a4bb8', // Purple hover state
        'dark-error': '#8e2a2a', // Destructive red
        'dark-error-hover': '#b84242', // Destructive hover
        'dark-text': '#7e8590', // Default text color
        'dark-text-hover': '#ffffff', // Hover text color
        'dark-highlight': '#ffffff', // Primary text/highlights
        'dark-muted': '#4a4d56', // Muted text
        'dark-border': '#42434a', // Border color
        'dark-separator': '#42434a', // Separator lines
        'dark-shadow': 'rgba(0, 0, 0, 0.5)', // Shadow color
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 10px 0 rgba(0, 0, 0, 0.05)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dark-card': '0 4px 8px rgba(0, 0, 0, 0.5)',
        'dark-dropdown': '0 8px 16px rgba(0, 0, 0, 0.6)',
        'dark-glow': '0 0 20px rgba(83, 83, 255, 0.3)',
      },
    },
  },
  plugins: [typography, forms, daisyui],
  daisyui: {
    themes: ["dark", "light"],
    darkTheme: "dark",
    base: false, // Don't apply DaisyUI's base styles
    styled: true, // Include DaisyUI's component styles
    utils: true, // Include DaisyUI's utility classes
    logs: false, // Disable console logs
  },
};

export default config;
