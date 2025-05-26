<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import ClassList from '$lib/components/ClassList.svelte';
	import StudentRoster from '$lib/components/StudentRoster.svelte';
	import ImportWizard from '$lib/components/ImportWizard.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { isAuthenticated } from '$lib/stores/auth';

	// State variables with $state
	let showImportWizard = $state(false);
	let selectedClassId = $state<string | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Reactive values with $derived
	let selectedClass = $derived(
		selectedClassId ? $gradebookStore.categories.find((c) => c.id === selectedClassId) : null
	);

	$effect(() => {
		const initializeData = async () => {
			try {
				await gradebookStore.ensureDataLoaded();
				isLoading = false;
			} catch (e) {
				error = e instanceof Error ? e.message : 'An error occurred';
				isLoading = false;
			}
		};

		initializeData();
	});

	function handleClassSelect(classId: string | null) {
		selectedClassId = classId;
	}

	function handleImportComplete() {
		showImportWizard = false;
	}

	async function handleLogin() {
		await goto('/auth/login?redirect=/classes');
	}
</script>

<div class="container mx-auto px-4 py-8">
	{#if isLoading}
		<div class="flex justify-center items-center h-64">
			<div class="text-gray-400">Loading classes...</div>
		</div>
	{:else if !$isAuthenticated}
		<div class="flex justify-center items-center flex-col h-64">
			<div class="bg-gray-800 border border-gray-700 rounded-lg p-8 max-w-md text-center">
				<h2 class="text-xl font-bold text-gray-100 mb-4">Authentication Required</h2>
				<p class="text-gray-400 mb-6">
					You need to be logged in to access classes. Row Level Security (RLS) policies require
					authentication to view and create classes.
				</p>
				<button
					onclick={handleLogin}
					class="px-4 py-2 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-all duration-200"
				>
					Sign In
				</button>
			</div>
		</div>
	{:else if error}
		<div class="flex justify-center items-center h-64 flex-col">
			<div class="bg-gray-800 border border-red-800 rounded-lg p-8 max-w-lg">
				<h2 class="text-xl font-bold text-red-400 mb-4">Error Loading Classes</h2>
				<p class="text-gray-300 mb-6">{error}</p>
				<div class="flex justify-end">
					<button
						onclick={() => location.reload()}
						class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
					>
						Retry
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex justify-between items-center mb-8">
			<h1 class="text-3xl font-bold text-gray-100">Classes</h1>
			{#if $isAuthenticated}
				<button
					onclick={() => (showImportWizard = true)}
					class="px-4 py-2 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-all duration-200"
				>
					Import New Class
				</button>
			{:else}
				<button
					onclick={handleLogin}
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
				>
					Sign In to Create Classes
				</button>
			{/if}
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-1">
				{#if $gradebookStore.categories.length > 0}
					<ClassList
						classes={$gradebookStore.categories}
						{selectedClassId}
						onSelectClass={handleClassSelect}
					/>
				{:else}
					<div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
						<p class="text-gray-400 text-center">No classes found</p>
						{#if $isAuthenticated}
							<p class="text-gray-500 text-center mt-2 text-sm">
								Use the "Import New Class" button to create your first class
							</p>
						{:else}
							<p class="text-gray-500 text-center mt-2 text-sm">
								Sign in to create and manage classes
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="lg:col-span-2">
				{#if selectedClass}
					<StudentRoster {selectedClass} />
				{:else}
					<div class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
						<p class="text-gray-400">Select a class to view its students</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if showImportWizard}
		<ImportWizard onClose={() => (showImportWizard = false)} onComplete={handleImportComplete} />
	{/if}
</div>
