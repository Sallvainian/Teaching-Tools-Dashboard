/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const colorMappings = {
	// Gray colors
	'text-gray-300': 'text-muted',
	'text-gray-400': 'text-muted',
	'text-gray-500': 'text-text-base',
	'text-gray-600': 'text-text-base',
	'bg-gray-50': 'bg-surface',
	'bg-gray-100': 'bg-surface',
	'bg-gray-200': 'bg-surface',
	'border-gray-200': 'border-border',
	'border-gray-300': 'border-border',

	// White/black
	'text-white': 'text-highlight',
	'bg-white': 'bg-card',

	// Dark theme colors (should use CSS variables)
	'text-dark-highlight': 'text-purple',
	'bg-dark-bg': 'bg-bg-base',

	// Yellow colors (development warnings)
	'text-yellow-400': 'text-muted',
	'bg-yellow-900': 'bg-surface',
	'border-yellow-900': 'border-border'
};

const files = [
	'src/routes/+layout.svelte',
	'src/routes/auth/login/+page.svelte',
	'src/routes/auth/signup/+page.svelte',
	'src/routes/auth/reset-password/+page.svelte',
	'src/lib/components/auth/RoleSignupForm.svelte'
];

files.forEach((filePath) => {
	try {
		let content = fs.readFileSync(filePath, 'utf8');
		let modified = false;

		// Apply color mappings
		Object.entries(colorMappings).forEach(([oldColor, newColor]) => {
			const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
			if (content.includes(oldColor)) {
				content = content.replace(regex, newColor);
				modified = true;
				console.log(`${filePath}: ${oldColor} → ${newColor}`);
			}
		});

		// Fix opacity modifiers
		content = content.replace(/bg-(\w+)\/(\d+)/g, (match, color, opacity) => {
			modified = true;
			console.log(`${filePath}: ${match} → bg-${color} (with opacity: 0.${opacity})`);
			return `bg-${color}`;
		});

		// Fix border classes missing the border prefix
		content = content.replace(/class="([^"]*)\bborder-border\b/g, (match, beforeBorder) => {
			if (!beforeBorder.includes('border ')) {
				modified = true;
				console.log(`${filePath}: Adding missing 'border' class`);
				return match.replace('border-border', 'border border-border');
			}
			return match;
		});

		if (modified) {
			fs.writeFileSync(filePath, content, 'utf8');
			console.log(`✓ Updated ${filePath}`);
		}
	} catch (error) {
		console.error(`Error processing ${filePath}:`, error.message);
	}
});

console.log('✓ All color fixes complete!');
