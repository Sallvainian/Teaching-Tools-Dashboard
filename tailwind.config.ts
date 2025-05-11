import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class', // or 'media' if you prefer OS-based
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Custom dark monochrome theme inspired by the Dribbble design
        'dark-bg': '#121212', // Main content area - dark but not pure black
        'dark-card': '#1E1E1E', // Card backgrounds - slightly lighter than bg
        'dark-accent': '#2A2A2A', // Hover/accent background
        'dark-purple': '#404040', // Button/accent elements
        'dark-lavender': '#A0A0A0', // Secondary text
        'dark-highlight': '#E0E0E0', // Primary text/highlights
        'dark-muted': '#6E6E6E', // Muted text
        'dark-border': '#333333', // Border color
        'dark-surface': '#0A0A0A', // Sidebar background - very dark
        'slate-750': '#282828', // Additional dark accent
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 10px 0 rgba(0, 0, 0, 0.05)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dark-card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [typography, forms],
};

export default config;
