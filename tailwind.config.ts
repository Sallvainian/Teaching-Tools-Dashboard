import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

const config: Config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class', // or 'media' if you prefer OS-based
	theme: {
		extend: {
			colors: {
				// Custom dark theme inspired by Edu.Link design
				'dark-bg': '#030206',
				'dark-card': '#16141C',
				'dark-accent': '#4B3A49',
				'dark-purple': '#5D4A6D',
				'dark-lavender': '#B0A6CB',
				'dark-highlight': '#E7D4FF',
				'dark-muted': '#6E6A7C',
				'dark-border': '#2B2830',
				'dark-surface': '#1E1B24',
				'slate-750': '#283A4E',
			},
			borderRadius: {
				'xl': '1rem',
				'2xl': '1.5rem',
			},
			boxShadow: {
				'soft': '0 2px 10px 0 rgba(0, 0, 0, 0.05)',
				'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
				'dark-card': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
			}
		}
	},
	plugins: [typography, forms]
};

export default config;
