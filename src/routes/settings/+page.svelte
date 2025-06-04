<script lang="ts">
	import { settingsStore } from '$lib/stores/settings';
	
	// Get reactive settings from store
	const { darkMode, useSupabase } = settingsStore;
</script>

<div class="max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold text-highlight mb-8">Settings</h1>

	<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card mb-8">
		<h2 class="text-xl font-semibold text-highlight mb-4">Display Settings</h2>

		<div class="flex items-center mb-6">
			<span class="mr-4 text-muted">Dark Mode:</span>
			<div class="relative inline-block w-12 mr-2 align-middle select-none">
				<input
					type="checkbox"
					id="toggle-dark-mode"
					checked={$darkMode}
					onchange={settingsStore.toggleDarkMode}
					class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-card border-4 appearance-none cursor-pointer"
				/>
				<label
					for="toggle-dark-mode"
					class="toggle-label block overflow-hidden h-6 rounded-full bg-surface cursor-pointer"
				></label>
			</div>
			<span class="text-muted">{$darkMode ? 'On' : 'Off'}</span>
		</div>

		<p class="text-dark-muted mb-6">
			Dark mode reduces eye strain in low-light environments and can help save battery on OLED
			displays.
		</p>
	</div>

	<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card mb-8">
		<h2 class="text-xl font-semibold text-highlight mb-4">Storage Settings</h2>

		<div class="flex items-center mb-6">
			<span class="mr-4 text-muted">Use Supabase Database:</span>
			<div class="relative inline-block w-12 mr-2 align-middle select-none">
				<input
					type="checkbox"
					id="toggle-storage"
					checked={$useSupabase}
					onchange={settingsStore.toggleDataStorage}
					class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-card border-4 appearance-none cursor-pointer"
				/>
				<label
					for="toggle-storage"
					class="toggle-label block overflow-hidden h-6 rounded-full bg-surface cursor-pointer"
				></label>
			</div>
			<span class="text-muted">{$useSupabase ? 'On' : 'Off'}</span>
		</div>

		<p class="text-dark-muted mb-6">
			When enabled, data is stored in Supabase cloud database, making it accessible across devices.
			When disabled, data is stored only in your browser's local storage.
		</p>
	</div>

	<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card">
		<h2 class="text-xl font-semibold text-highlight mb-4">Data Management</h2>

		<div class="space-y-4">
			<button
				onclick={settingsStore.clearAllData}
				class="py-2 px-4 bg-error text-highlight font-medium rounded-lg hover:bg-error-hover transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
			>
				Clear All Data
			</button>
		</div>

		<div class="mt-6 text-xs text-dark-muted">
			<p>Warning: Clearing data will remove all your data. This action cannot be undone.</p>
		</div>
	</div>

	<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card mt-8">
		<h2 class="text-xl font-semibold text-highlight mb-4">About</h2>

		<p class="text-dark-muted mb-2">Teacher Dashboard v1.0.0</p>

		<p class="text-dark-muted mb-6">
			An all-in-one educational tool for teachers with gradebook, jeopardy, lesson planning, and
			classroom management features.
		</p>

		<div class="mt-6 text-xs text-dark-muted">
			<p>Current Storage: {$useSupabase ? 'Supabase Database' : 'LocalStorage (Browser-based)'}</p>
			<p class="mt-1">
				{#if $useSupabase}
					Data is stored in Supabase cloud database with browser localStorage as fallback. This
					makes your data accessible across devices when you're logged in.
				{:else}
					Data is stored in your browser. It will persist until you clear browser data or use the
					clear data button above.
				{/if}
			</p>
		</div>
	</div>
</div>

<style>
	.toggle-checkbox:checked {
		right: 0;
		border-color: #8b5cf6;
	}
	.toggle-checkbox:checked + .toggle-label {
		background-color: #8b5cf6;
	}
	.toggle-checkbox:focus + .toggle-label {
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.5);
	}
	.toggle-label {
		transition: background-color 0.2s;
	}
</style>
