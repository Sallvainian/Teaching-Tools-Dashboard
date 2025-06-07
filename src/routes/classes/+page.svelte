<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import ClassList from '$lib/components/ClassList.svelte';
	import StudentRoster from '$lib/components/StudentRoster.svelte';
	import ImportWizard from '$lib/components/ImportWizard.svelte';
	import { goto } from '$app/navigation';
	import { isAuthenticated, authStore } from '$lib/stores/auth';

	// State variables with $state
	let showImportWizard = $state(false);
	let selectedClassId = $state<string | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	// Reactive values with $derived
	let selectedClass = $derived(
		selectedClassId ? $gradebookStore.classes.find((c: any) => c.id === selectedClassId) : null
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

	// Check if user has permission to access this page
	let hasPermission = $derived($authStore.role === 'teacher');

	// Redirect students to their dashboard
	$effect(() => {
		if ($authStore.isInitialized && $isAuthenticated && $authStore.role === 'student') {
			goto('/student/dashboard');
		}
	});
</script>

<div class="container mx-auto px-4 py-8">
	{#if $authStore.user && !hasPermission}
		<div class="flex justify-center items-center h-64">
			<div class="bg-card border border-border rounded-lg p-8 max-w-md text-center">
				<h2 class="text-xl font-bold text-text-base mb-4">Access Restricted</h2>
				<p class="text-muted mb-6">
					The classes page is only available to teachers. Students can view their enrolled classes through their dashboard.
				</p>
				<button
					onclick={() => goto('/student/dashboard')}
					class="btn btn-primary"
				>
					Go to Student Dashboard
				</button>
			</div>
		</div>
	{:else if isLoading}
		<div class="flex justify-center items-center h-64">
			<div class="text-muted">Loading classes...</div>
		</div>
	{:else if !$isAuthenticated}
		<div class="flex justify-center items-center flex-col h-64">
			<div class="bg-card border border-border rounded-lg p-8 max-w-md text-center">
				<h2 class="text-xl font-bold text-text-base mb-4">Authentication Required</h2>
				<p class="text-muted mb-6">
					You need to be logged in to access classes. Row Level Security (RLS) policies require
					authentication to view and create classes.
				</p>
				<button
					onclick={handleLogin}
					class="px-4 py-2 bg-purple text-highlight rounded-lg hover:bg-purple-hover transition-all duration-200"
				>
					Sign In
				</button>
			</div>
		</div>
	{:else if error}
		<div class="flex justify-center items-center h-64 flex-col">
			<div class="bg-card border border-error rounded-lg p-8 max-w-lg">
				<h2 class="text-xl font-bold text-error mb-4">Error Loading Classes</h2>
				<p class="text-text-hover mb-6">{error}</p>
				<div class="flex justify-end">
					<button
						onclick={() => location.reload()}
						class="px-4 py-2 bg-error text-highlight rounded-lg hover:bg-error/80 transition-all duration-200"
					>
						Retry
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="flex justify-between items-center mb-8">
			<h1 class="text-3xl font-bold text-text-base">Classes</h1>
			{#if $isAuthenticated}
				<button
					onclick={() => (showImportWizard = true)}
					class="px-4 py-2 bg-purple text-highlight rounded-lg hover:bg-purple-hover transition-all duration-200"
				>
					Import New Class
				</button>
			{:else}
				<button
					onclick={handleLogin}
					class="px-4 py-2 bg-surface text-text-hover rounded-lg hover:bg-accent/20 transition-all duration-200"
				>
					Sign In to Create Classes
				</button>
			{/if}
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<div class="lg:col-span-1">
				{#if $gradebookStore.classes.length > 0}
					<ClassList
						classes={$gradebookStore.classes}
						{selectedClassId}
						onSelectClass={handleClassSelect}
					/>
				{:else}
					<div class="bg-card border border-border rounded-lg p-6">
						<p class="text-muted text-center">No classes found</p>
						{#if $isAuthenticated}
							<p class="text-muted/80 text-center mt-2 text-sm">
								Use the "Import New Class" button to create your first class
							</p>
						{:else}
							<p class="text-muted/80 text-center mt-2 text-sm">
								Sign in to create and manage classes
							</p>
						{/if}
					</div>
				{/if}
			</div>

			<div class="lg:col-span-2">
				{#if selectedClass}
					{#key selectedClass.id}
						<StudentRoster {selectedClass} />
					{/key}
				{:else}
					<div class="bg-card border border-border rounded-lg p-8 text-center">
						<p class="text-muted">Select a class to view its students</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if showImportWizard}
		<ImportWizard onClose={() => (showImportWizard = false)} onComplete={handleImportComplete} />
	{/if}
</div>
