<script lang="ts">
	import { settingsStore } from '$lib/stores/settings';
	import { themeStore, themeActions, ACCENT_COLORS, type AccentColorKey } from '$lib/stores/theme';
	import { deleteAccount } from '$lib/stores/auth/authActions';
	import ThemeSettings from '$lib/components/ThemeSettings.svelte';
	
	// Get reactive settings from store
	const { darkMode, useSupabase } = settingsStore;
	const theme = $derived($themeStore);
	
	let showThemeSettings = $state(false);
	let showDeleteConfirmation = $state(false);
	let deleteConfirmationText = $state('');
	let isDeleting = $state(false);

	async function handleDeleteAccount() {
		if (deleteConfirmationText !== 'DELETE') {
			return;
		}

		isDeleting = true;
		try {
			const success = await deleteAccount();
			if (!success) {
				// Error handling is done in the deleteAccount function
				isDeleting = false;
			}
			// If successful, user will be redirected to login page
		} catch (error) {
			console.error('Error deleting account:', error);
			isDeleting = false;
		}
	}

	function resetDeleteModal() {
		showDeleteConfirmation = false;
		deleteConfirmationText = '';
		isDeleting = false;
	}
</script>

<div class="max-w-4xl mx-auto">
	<h1 class="text-2xl font-bold text-highlight mb-8">Settings</h1>

	<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card mb-8">
		<h2 class="text-xl font-semibold text-highlight mb-4">Display Settings</h2>

		<!-- Theme Settings Card -->
		<div class="bg-card border border-border p-6 rounded-lg mb-6">
			<h3 class="text-lg font-semibold text-highlight mb-4">Theme & Appearance</h3>
			
			<div class="space-y-4">
				<!-- Current theme display -->
				<div class="flex items-center justify-between">
					<div>
						<div class="font-medium text-text-hover">Current Theme</div>
						<div class="text-sm text-text-base">
							{theme.mode === 'auto' ? 'Auto (follows system)' : theme.mode === 'dark' ? 'Dark Mode' : 'Light Mode'} 
							• {ACCENT_COLORS[theme.accentColor].name}
						</div>
					</div>
					<div class="flex items-center gap-3">
						<!-- Accent color preview -->
						<div 
							class="w-8 h-8 rounded-full border-2 border-border"
							style="background-color: {ACCENT_COLORS[theme.accentColor].primary}"
							title="{ACCENT_COLORS[theme.accentColor].name} accent"
						></div>
						
						<!-- Theme mode icon -->
						<div class="text-purple">
							{#if theme.mode === 'dark'}
								🌙
							{:else if theme.mode === 'light'}
								☀️
							{:else}
								⚡
							{/if}
						</div>
					</div>
				</div>
				
				<!-- Customize button -->
				<button
					onclick={() => showThemeSettings = true}
					class="w-full btn btn-secondary"
				>
					Customize Theme & Colors
				</button>
			</div>
		</div>

		<!-- Legacy dark mode toggle (deprecated) -->
		<div class="flex items-center mb-6 opacity-50">
			<span class="mr-4 text-muted">Legacy Dark Mode:</span>
			<div class="relative inline-block w-12 mr-2 align-middle select-none">
				<input
					type="checkbox"
					id="toggle-dark-mode"
					checked={$darkMode}
					onchange={settingsStore.toggleDarkMode}
					class="toggle-checkbox absolute block w-6 h-6 rounded-full bg-card border-4 appearance-none cursor-pointer"
					disabled
				/>
				<label
					for="toggle-dark-mode"
					class="toggle-label block overflow-hidden h-6 rounded-full bg-surface cursor-pointer"
				></label>
			</div>
			<span class="text-muted text-sm">Use "Customize Theme" above instead</span>
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


	<!-- Account & Privacy Settings -->
	<div class="bg-dark-card border border-dark-border p-6 rounded-xl shadow-dark-card mt-8">
		<h2 class="text-xl font-semibold text-highlight mb-4">Account & Privacy</h2>

		<div class="space-y-6">
			<!-- Delete Account Section -->
			<div class="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
				<h3 class="text-lg font-medium text-red-400 mb-2">Danger Zone</h3>
				<p class="text-sm text-dark-muted mb-4">
					Permanently delete your account and all associated data. This action cannot be undone.
				</p>
				<button
					onclick={() => showDeleteConfirmation = true}
					class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
				>
					Delete Account
				</button>
			</div>
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

<!-- Delete Account Confirmation Modal -->
{#if showDeleteConfirmation}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-card border border-border rounded-lg p-6 max-w-md w-full">
			<h3 class="text-xl font-bold text-highlight mb-4">Delete Account</h3>
			
			<div class="mb-6">
				<p class="text-text-base mb-4">
					Are you sure you want to delete your account? This will permanently remove:
				</p>
				<ul class="text-sm text-muted space-y-1 mb-4">
					<li>• Your profile and account data</li>
					<li>• All classes and student records</li>
					<li>• Gradebook entries and assignments</li>
					<li>• All uploaded files</li>
					<li>• Jeopardy games and questions</li>
					<li>• Chat messages and conversations</li>
				</ul>
				<p class="text-red-400 font-medium">
					This action cannot be undone.
				</p>
			</div>

			<div class="mb-6">
				<label for="delete-confirmation" class="block text-sm font-medium text-text-base mb-2">
					Type <span class="font-bold text-red-400">DELETE</span> to confirm:
				</label>
				<input
					id="delete-confirmation"
					type="text"
					bind:value={deleteConfirmationText}
					placeholder="Type DELETE to confirm"
					class="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-base focus:outline-none focus:ring-2 focus:ring-purple"
					autocomplete="off"
				/>
			</div>

			<div class="flex gap-3">
				<button
					onclick={resetDeleteModal}
					disabled={isDeleting}
					class="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					onclick={handleDeleteAccount}
					disabled={deleteConfirmationText !== 'DELETE' || isDeleting}
					class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
				>
					{#if isDeleting}
						Deleting...
					{:else}
						Delete Account
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Theme Settings Modal -->
<ThemeSettings bind:open={showThemeSettings} />

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
