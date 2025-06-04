<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { getUser } from '$lib/utils/storeHelpers';

	interface Game {
		id: string;
		name: string;
		created_at: string;
		last_modified: string;
		is_public: boolean;
		settings: unknown;
	}

	let ownGames = $state<Game[]>([]);
	let sharedGames = $state<Game[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	onMount(async () => {
		await loadGames();
	});

	async function loadGames() {
		isLoading = true;
		error = '';

		try {
			const { supabase } = await import('$lib/supabaseClient');
			const user = getUser($authStore);

			if (!user) {
				error = 'Not authenticated';
				return;
			}

			// Load own games
			const { data: myGames, error: gamesError } = await supabase
				.from('games')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (gamesError) throw gamesError;
			if (myGames) ownGames = myGames;

			// Load shared games
			const { data: shared, error: sharedError } = await supabase
				.from('shared_games')
				.select(
					`
          *,
          games (*)
        `
				)
				.eq('shared_with_id', user.id);

			if (sharedError) throw sharedError;
			if (shared) sharedGames = shared.map((s: any) => s.games);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load games';
		} finally {
			isLoading = false;
		}
	}

	async function createGame() {
		await goto('/jeopardy/editor/new');
	}

	async function editGame(gameId: string) {
		await goto(`/jeopardy/editor/${gameId}`);
	}

	async function playGame(gameId: string) {
		await goto(`/jeopardy/play/${gameId}`);
	}

	async function deleteGame(gameId: string) {
		if (!confirm('Are you sure you want to delete this game?')) return;

		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { error } = await supabase.from('games').delete().eq('id', gameId);

			if (error) throw error;

			// Remove from local state
			ownGames = ownGames.filter((g) => g.id !== gameId);
		} catch (err) {
			alert('Failed to delete game');
		}
	}

	async function togglePublic(game: Game) {
		try {
			const { supabase } = await import('$lib/supabaseClient');
			const { error } = await supabase
				.from('games')
				.update({ is_public: !game.is_public })
				.eq('id', game.id);

			if (error) throw error;

			// Update local state
			const index = ownGames.findIndex((g) => g.id === game.id);
			if (index >= 0) {
				ownGames[index].is_public = !game.is_public;
			}
		} catch (err) {
			alert('Failed to update game visibility');
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8 flex justify-between items-center">
		<h1 class="text-3xl font-bold text-dark-highlight">My Jeopardy Games</h1>
		<button onclick={createGame} class="btn btn-primary"> Create New Game </button>
	</div>

	{#if isLoading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg"></span>
		</div>
	{:else if error}
		<div class="alert alert-error">
			<p>{error}</p>
		</div>
	{:else}
		<!-- Own Games -->
		<div class="mb-12">
			<h2 class="text-2xl font-semibold text-dark-text mb-4">Games I Created</h2>
			{#if ownGames.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each ownGames as game (game.id)}
						<div class="card-dark p-6">
							<h3 class="text-lg font-medium text-dark-highlight mb-2">{game.name}</h3>
							<p class="text-sm text-gray-400 mb-4">
								Created {new Date(game.created_at).toLocaleDateString()}
							</p>

							<div class="flex items-center gap-2 mb-4">
								<label class="label cursor-pointer">
									<input
										type="checkbox"
										checked={game.is_public}
										onchange={() => togglePublic(game)}
										class="checkbox checkbox-primary checkbox-sm"
									/>
									<span class="label-text ml-2">Public</span>
								</label>
							</div>

							<div class="flex gap-2">
								<button onclick={() => playGame(game.id)} class="btn btn-sm btn-primary">
									Play
								</button>
								<button onclick={() => editGame(game.id)} class="btn btn-sm btn-secondary">
									Edit
								</button>
								<button onclick={() => deleteGame(game.id)} class="btn btn-sm btn-error">
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 bg-dark-surface rounded-lg">
					<p class="text-gray-400">You haven't created any games yet.</p>
					<button onclick={createGame} class="btn btn-primary mt-4">
						Create Your First Game
					</button>
				</div>
			{/if}
		</div>

		<!-- Shared Games -->
		<div>
			<h2 class="text-2xl font-semibold text-dark-text mb-4">Games Shared With Me</h2>
			{#if sharedGames.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each sharedGames as game (game.id)}
						<div class="card-dark p-6">
							<h3 class="text-lg font-medium text-dark-highlight mb-2">{game.name}</h3>
							<p class="text-sm text-gray-400 mb-4">
								Shared on {new Date(game.created_at).toLocaleDateString()}
							</p>

							<button onclick={() => playGame(game.id)} class="btn btn-sm btn-primary">
								Play
							</button>
						</div>
					{/each}
				</div>
			{:else}
				<div class="text-center py-8 bg-dark-surface rounded-lg">
					<p class="text-gray-400">No games have been shared with you yet.</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
