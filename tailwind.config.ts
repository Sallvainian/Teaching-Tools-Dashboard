import type { Config } from 'tailwindcss';
import typographyPlugin from '@tailwindcss/typography';
import formsPlugin from '@tailwindcss/forms';

const config: Config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	// Ensure CSS purging is aggressive in production
	safelist: [
		// Keep essential classes that might be added dynamically
		'opacity-0', 'opacity-100', 'translate-x-0', 'translate-x-full'
	],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
			},
			colors: {
				// Dark mode colors (default)
				'bg-base': 'var(--bg-base)',
				'bg-gradient': 'var(--bg-gradient)',
				card: 'var(--card)',
				surface: 'var(--surface)',
				accent: 'var(--accent)',
				'accent-hover': 'var(--accent-hover)',
				purple: 'var(--purple)',
				'purple-light': 'var(--purple-light)',
				'purple-bg': 'var(--purple-bg)',
				'purple-hover': 'var(--purple-hover)',
				success: 'var(--success)',
				warning: 'var(--warning)',
				info: 'var(--info)',
				error: 'var(--error)',
				'error-hover': 'var(--error-hover)',
				'text-base': 'var(--text-base)',
				'text-hover': 'var(--text-hover)',
				highlight: 'var(--highlight)',
				muted: 'var(--muted)',
				border: 'var(--border)',
				separator: 'var(--separator)'
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(50% 50% at 50% 50%, var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
			},
			boxShadow: {
				card: 'var(--shadow-card)',
				'themed-card': 'var(--shadow-themed-card)',
				dropdown: 'var(--shadow-dropdown)',
				glow: 'var(--shadow-glow)',
				button: 'var(--shadow-button)'
			},
			animation: {
				gradient: 'gradient 8s ease infinite',
				float: 'float 3s ease-in-out infinite',
				'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite'
			},
			keyframes: {
				gradient: {
					'0%, 100%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' }
				},
				float: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-5px)' }
				},
				'pulse-subtle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.8' }
				}
			}
		}
	},
	plugins: [typographyPlugin, formsPlugin],
	future: {
		// Enable future features for better CSS output
		hoverOnlyWhenSupported: true
	},
	experimental: {
		// Optimize for modern browsers
		optimizeUniversalDefaults: true
	}
};

export default config;
