<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { jeopardyStore } from '$lib/stores/jeopardy';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
	import { typedAuthStore, getUser } from '$lib/utils/storeHelpers';

	let studentGames = $state<any[]>([]);
	let sharedGames = $state<any[]>([]);
	let enrolledClasses = $state<any[]>([]);
	let isLoading = $state(true);

	onMount(async () => {
		await loadStudentData();
	});

	async function loadStudentData() {
		isLoading = true;
		try {
			const { supabase } = await import('$lib/supabaseClient');
			const user = getUser($authStore);

			if (!user) return;

			// Load student's own games
			const { data: ownGames } = await supabase
				.from('games')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (ownGames) studentGames = ownGames;

			// Load games shared with student
			const { data: shared } = await supabase
				.from('shared_games')
				.select('*, games(*)')
				.eq('shared_with_id', user.id);

			if (shared) sharedGames = shared.map((s) => s.games);

			// Load enrolled classes
			const { data: studentRecord } = await supabase
				.from('students')
				.select('id')
				.eq('user_id', user.id)
				.single();

			if (studentRecord) {
				const { data: classes } = await supabase
					.from('class_students')
					.select('*, classes(*)')
					.eq('student_id', studentRecord.id);

				if (classes) enrolledClasses = classes.map((c) => c.classes);
			}
		} catch (error) {
			console.error('Error loading student data:', error);
		} finally {
			isLoading = false;
		}
	}

	async function createNewGame() {
		await goto('/jeopardy/editor/new');
	}

	async function playGame(gameId: string) {
		await goto(`/jeopardy/play/${gameId}`);
	}

	async function editGame(gameId: string) {
		await goto(`/jeopardy/editor/${gameId}`);
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-dark-highlight mb-2">Student Dashboard</h1>
		<p class="text-dark-text">Welcome back, {getUser($authStore)?.email}!</p>
	</div>

	{#if isLoading}
		<!-- Classes Section Skeleton -->
		<div class="mb-12">
			<h2 class="text-2xl font-semibold text-dark-text mb-4">My Classes</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each Array(3) as _}
					<SkeletonLoader type="card" />
				{/each}
			</div>
		</div>

		<!-- My Games Section Skeleton -->
		<div class="mb-12">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-2xl font-semibold text-dark-text">My Jeopardy Games</h2>
				<SkeletonLoader type="button" />
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each Array(3) as _}
					<SkeletonLoader type="card" />
				{/each}
			</div>
		</div>

		<!-- Shared Games Section Skeleton -->
		<div class="mb-12">
			<h2 class="text-2xl font-semibold text-dark-text mb-4">Games Shared With Me</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each Array(2) as _}
					<SkeletonLoader type="card" />
				{/each}
			</div>
		</div>
	{:else}
		<!-- Classes Section -->
		<div class="mb-12">
			<h2 class="text-2xl font-semibold text-dark-text mb-4">My Classes</h2>
			{#if enrolledClasses.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each enrolledClasses as cls (cls.id)}
						<div class="card-dark">
							<h3 class="text-lg font-medium text-dark-highlight">{cls.name}</h3>
							<p class="text-sm text-muted mt-1">{cls.description || 'No description'}</p>
							<div class="mt-4">
								<span class="text-xs text-muted">
									{cls.grade_level} • {cls.subject}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 bg-dark-surface rounded-lg">
					<p class="text-muted">You're not enrolled in any classes yet.</p>
					<p class="text-sm text-muted mt-2">Ask your teacher for a join code!</p>
				</div>
			{/if}
		</div>

		<!-- My Games Section -->
		<div class="mb-12">
			<div class="flex justify-between items-center mb-4">
				<h2 class="text-2xl font-semibold text-dark-text">My Jeopardy Games</h2>
				<button onclick={createNewGame} class="btn btn-primary"> Create New Game </button>
			</div>

			{#if studentGames.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each studentGames as game (game.id)}
						<div class="card-dark">
							<h3 class="text-lg font-medium text-dark-highlight">{game.name}</h3>
							<p class="text-sm text-muted mt-1">
								Created {new Date(game.created_at).toLocaleDateString()}
							</p>
							<div class="flex gap-2 mt-4">
								<button onclick={() => editGame(game.id)} class="btn btn-sm btn-secondary">
									Edit
								</button>
								<button onclick={() => playGame(game.id)} class="btn btn-sm btn-primary">
									Play
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 bg-dark-surface rounded-lg">
					<p class="text-muted">You haven't created any games yet.</p>
					<button onclick={createNewGame} class="btn btn-primary mt-4">
						Create Your First Game
					</button>
				</div>
			{/if}
		</div>

		<!-- Shared Games Section -->
		<div class="mb-12">
			<h2 class="text-2xl font-semibold text-dark-text mb-4">Games Shared With Me</h2>
			{#if sharedGames.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each sharedGames as game (game.id)}
						<div class="card-dark">
							<h3 class="text-lg font-medium text-dark-highlight">{game.name}</h3>
							<p class="text-sm text-muted mt-1">
								Shared {new Date(game.created_at).toLocaleDateString()}
							</p>
							<div class="mt-4">
								<button onclick={() => playGame(game.id)} class="btn btn-sm btn-primary">
									Play
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 bg-dark-surface rounded-lg">
					<p class="text-muted">No games have been shared with you yet.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
