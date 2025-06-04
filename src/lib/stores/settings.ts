import { writable, derived, get } from 'svelte/store';
import { gradebookStore } from './gradebook';
import { browser } from '$app/environment';

// Settings state
const darkMode = writable(true);
const useSupabase = writable(true);
const initialized = writable(false);

// Theme management
function applyTheme(isDark: boolean): void {
	if (!browser) return;
	
	if (isDark) {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
	
	// Set AG Grid theme mode
	document.documentElement.setAttribute('data-ag-theme-mode', isDark ? 'dark' : 'light');
}

// Storage helpers
function getStoredValue<T>(key: string, defaultValue: T): T {
	if (!browser) return defaultValue;
	
	try {
		const stored = localStorage.getItem(key);
		return stored !== null ? JSON.parse(stored) : defaultValue;
	} catch (error) {
		console.error(`Error reading ${key} from localStorage:`, error);
		return defaultValue;
	}
}

function setStoredValue<T>(key: string, value: T): void {
	if (!browser) return;
	
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error(`Error writing ${key} to localStorage:`, error);
	}
}

// Store actions
function initialize(): void {
	if (!browser || get(initialized)) return;
	
	// Load dark mode setting
	const storedDarkMode = getStoredValue('darkMode', true);
	darkMode.set(storedDarkMode);
	applyTheme(storedDarkMode);
	
	// Load Supabase setting
	const storedUseSupabase = getStoredValue('useSupabase', true);
	useSupabase.set(storedUseSupabase);
	
	// Update gradebook store with current setting
	gradebookStore.setUseSupabase(storedUseSupabase);
	
	initialized.set(true);
}

function toggleDarkMode(): void {
	const current = get(darkMode);
	const newValue = !current;
	
	darkMode.set(newValue);
	setStoredValue('darkMode', newValue);
	applyTheme(newValue);
}

function toggleDataStorage(): void {
	const current = get(useSupabase);
	const newValue = !current;
	
	useSupabase.set(newValue);
	setStoredValue('useSupabase', newValue);
	
	// Update the gradebook store
	gradebookStore.setUseSupabase(newValue);
	
	// Prompt for reload to apply changes
	if (browser && confirm('Storage setting changed. Reload page to apply changes?')) {
		window.location.reload();
	}
}

function clearAllData(): void {
	if (!browser) return;
	
	const confirmed = confirm(
		'Are you sure you want to clear all local data? This action cannot be undone.'
	);
	
	if (confirmed) {
		try {
			// Clear localStorage except settings
			const keysToKeep = ['darkMode', 'useSupabase'];
			const allKeys = Object.keys(localStorage);
			
			allKeys.forEach(key => {
				if (!keysToKeep.includes(key)) {
					localStorage.removeItem(key);
				}
			});
			
			// Clear sessionStorage
			sessionStorage.clear();
			
			// Reset stores to default state
			gradebookStore.clearAllData();
			
			alert('All data cleared successfully. Page will reload.');
			window.location.reload();
		} catch (error) {
			console.error('Error clearing data:', error);
			alert('Error clearing data. Please try again.');
		}
	}
}

// Derived store for theme class
const themeClass = derived(darkMode, ($darkMode) => 
	$darkMode ? 'dark' : 'light'
);

// Export the settings store
export const settingsStore = {
	// State subscriptions
	darkMode: { subscribe: darkMode.subscribe },
	useSupabase: { subscribe: useSupabase.subscribe },
	themeClass: { subscribe: themeClass.subscribe },
	initialized: { subscribe: initialized.subscribe },
	
	// Actions
	initialize,
	toggleDarkMode,
	toggleDataStorage,
	clearAllData,
	
	// Direct setters (for programmatic updates)
	setDarkMode: (value: boolean) => {
		darkMode.set(value);
		setStoredValue('darkMode', value);
		applyTheme(value);
	},
	
	setUseSupabase: (value: boolean) => {
		useSupabase.set(value);
		setStoredValue('useSupabase', value);
		gradebookStore.setUseSupabase(value);
	}
};

// Initialize on module load
if (browser) {
	initialize();
}