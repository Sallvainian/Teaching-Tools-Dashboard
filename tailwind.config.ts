import type { Config } from 'tailwindcss';
import typographyPlugin from '@tailwindcss/typography';
import formsPlugin from '@tailwindcss/forms';
import daisyuiPlugin from 'daisyui';

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
        'bg-base': 'rgb(36, 40, 50)', // Main background - deep charcoal
        'bg-gradient': 'rgb(37, 28, 40)', // Gradient end - slight purple tint
        'card': 'rgb(36, 40, 50)', // Card base color
        'surface': 'rgb(24, 26, 32)', // Darker surface for sidebar
        'accent': 'rgba(83, 83, 255, 0.1)', // Primary accent background
        'accent-hover': '#5353ff', // Primary blue hover
        'purple': '#8e57d1', // Main purple color 
        'purple-light': '#bd89ff', // Light purple accent
        'purple-bg': 'rgba(142, 87, 209, 0.1)', // Purple background
        'purple-hover': '#7a4bb8', // Purple hover state
        'error': '#8e2a2a', // Destructive red
        'error-hover': '#b84242', // Destructive hover
        'text-base': '#7e8590', // Default text color
        'text-hover': '#ffffff', // Hover text color
        'highlight': '#ffffff', // Primary text/highlights
        'muted': '#4a4d56', // Muted text
        'border': '#42434a', // Border color
        'separator': '#42434a', // Separator lines
        'shadow': 'rgba(0, 0, 0, 0.5)', // Shadow color
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 10px 0 rgba(0, 0, 0, 0.05)',
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'themed-card': '0 4px 8px rgba(0, 0, 0, 0.5)',
        'dropdown': '0 8px 16px rgba(0, 0, 0, 0.6)',
        'glow': '0 0 20px rgba(83, 83, 255, 0.3)',
      },
    },
  },
  plugins: [daisyuiPlugin, typographyPlugin, formsPlugin],
  daisyui: {
    themes: ["dark", "light"],
    darkTheme: "dark",
    base: false, // Don't apply DaisyUI's base styles
    styled: true, // Include DaisyUI's component styles
    utils: false, // Disable utility classes that might overlap with Tailwind
    logs: false, // Disable console logs
    rtl: false, // Disable RTL support if not needed
    prefix: "d-", // Add prefix to DaisyUI classes to avoid conflicts
  },
};

export default config;
