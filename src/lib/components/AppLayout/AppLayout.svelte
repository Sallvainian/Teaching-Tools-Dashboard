<script lang="ts">
	import { navigating } from '$app/stores';
	import LoadingBounce from '$components/LoadingBounce.svelte';
	import { isInitialized } from '$stores/auth';
	import { gradebookStore } from '$stores/gradebook';
	import { debounce } from '$utils/performanceOptimized';
	import AppHeader from './AppHeader.svelte';
	import AppSidebar from './AppSidebar.svelte';
	import ImportWizard from '$components/ImportWizard.svelte';

	// Get children prop
	let { children } = $props();

	// Local state
	let sidebarCollapsed = $state(false);
	let userMenuOpen = $state(false);
	let classesDropdownOpen = $state(false);
	let showImportWizard = $state(false);

	// Debounced data loading to not block initial render
	const debouncedDataLoad = debounce(() => {
		gradebookStore.ensureDataLoaded().catch(console.error);
	}, 100);

	// Close dropdowns when clicking outside
	$effect(() => {
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (userMenuOpen && !target.closest('.user-menu')) {
				userMenuOpen = false;
			}
			if (classesDropdownOpen && !target.closest('.classes-dropdown')) {
				classesDropdownOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => document.removeEventListener('click', handleClickOutside);
	});

	// Load data after initial render
	$effect(() => {
		debouncedDataLoad();
	});
</script>

<!-- Loading state while auth initializes -->
{#if !$isInitialized}
	<div class="min-h-screen bg-bg-base flex items-center justify-center">
		<div class="text-center">
			<LoadingBounce />
			<p class="text-muted mt-4">Initializing...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-bg-base text-text-base flex flex-col transition-colors">
		<!-- Header -->
		<AppHeader bind:userMenuOpen bind:classesDropdownOpen />

		<div class="flex flex-grow relative">
			<!-- Sidebar -->
			<AppSidebar bind:sidebarCollapsed />

			<!-- Main content -->
			<main class="flex-grow p-6 overflow-y-auto relative z-0">
				{#if $navigating}
					<div
						class="absolute inset-0 bg-bg-base backdrop-blur-sm flex items-center justify-center z-50"
					>
						<LoadingBounce />
					</div>
				{/if}
				{@render children?.()}
			</main>
		</div>

		<!-- Footer -->
		<footer
			class="bg-card backdrop-blur-sm text-center text-muted text-xs py-4 border-t border border-border/50 px-6"
		>
			Teacher Dashboard • {new Date().getFullYear()}
		</footer>
	</div>

	<!-- Import Wizard Modal -->
	{#if showImportWizard}
		<ImportWizard
			onClose={() => (showImportWizard = false)}
			onComplete={() => {
				showImportWizard = false;
				void gradebookStore.loadAllData();
			}}
		/>
	{/if}
{/if}
