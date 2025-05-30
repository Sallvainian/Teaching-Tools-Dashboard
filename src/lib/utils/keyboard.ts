import { onMount, onDestroy } from 'svelte';

export interface KeyboardShortcut {
	key: string;
	ctrl?: boolean;
	alt?: boolean;
	shift?: boolean;
	meta?: boolean;
	action: () => void;
	description?: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
	function handleKeyDown(event: KeyboardEvent) {
		for (const shortcut of shortcuts) {
			const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
			const ctrlMatch = !shortcut.ctrl || event.ctrlKey === shortcut.ctrl;
			const altMatch = !shortcut.alt || event.altKey === shortcut.alt;
			const shiftMatch = !shortcut.shift || event.shiftKey === shortcut.shift;
			const metaMatch = !shortcut.meta || event.metaKey === shortcut.meta;

			if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
				event.preventDefault();
				shortcut.action();
				break;
			}
		}
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
	});
}

// Common keyboard shortcuts
export const commonShortcuts = {
	search: { key: '/', description: 'Focus search' },
	save: { key: 's', ctrl: true, description: 'Save' },
	new: { key: 'n', ctrl: true, description: 'Create new' },
	close: { key: 'Escape', description: 'Close/Cancel' },
	submit: { key: 'Enter', ctrl: true, description: 'Submit form' },
	help: { key: '?', shift: true, description: 'Show help' }
};

// Focus management utilities
export function focusFirstElement(container: HTMLElement) {
	const focusable = container.querySelectorAll<HTMLElement>(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);
	if (focusable.length > 0) {
		focusable[0].focus();
	}
}

export function trapFocus(container: HTMLElement) {
	const focusable = container.querySelectorAll<HTMLElement>(
		'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
	);

	if (focusable.length === 0) return;

	const firstFocusable = focusable[0];
	const lastFocusable = focusable[focusable.length - 1];

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;

		if (event.shiftKey) {
			if (document.activeElement === firstFocusable) {
				event.preventDefault();
				lastFocusable.focus();
			}
		} else {
			if (document.activeElement === lastFocusable) {
				event.preventDefault();
				firstFocusable.focus();
			}
		}
	}

	container.addEventListener('keydown', handleKeyDown);

	return () => {
		container.removeEventListener('keydown', handleKeyDown);
	};
}
