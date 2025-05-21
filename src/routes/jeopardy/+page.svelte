<script lang="ts">
  import { jeopardyStore } from '$lib/stores/jeopardy';
  import { goto } from '$app/navigation';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';

  const { getGames, createGame, deleteGame } = jeopardyStore;

  let newGameName = $state('');
  let isLoading = $state(true);
  let showCreateModal = $state(false);

  $effect(async () => {
    await jeopardyStore.ensureDataLoaded();
    isLoading = false;
  });

  function handleCreateGame(e: Event) {
    e.preventDefault();
    if (newGameName.trim()) {
      const gameId = createGame(newGameName.trim());
      newGameName = '';
      showCreateModal = false;
      goto(`/jeopardy/editor/${gameId}`);
    }
  }

  function handlePlayGame(gameId: string) {
    goto(`/jeopardy/play/${gameId}`);
  }

  function handleEditGame(gameId: string) {
    goto(`/jeopardy/editor/${gameId}`);
  }

  function handleDeleteGame(gameId: string) {
    if (confirm('Are you sure you want to delete this game?')) {
      deleteGame(gameId);
    }
  }
</script>

<div class="container mx-auto px-4 py-8">
  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <LoadingBounce />
    </div>
  {:else}
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-dark-highlight mb-1">Jeopardy Games</h1>
      <p class="text-dark-text">Create and manage your educational Jeopardy games</p>
    </div>

    <!-- Create New Game Card -->
    <div class="card-dark mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold text-gray-200">Create a New Game</h2>
          <p class="text-gray-400 text-sm mt-1">Start fresh with a blank Jeopardy game</p>
        </div>
        <button
          on:click={() => showCreateModal = true}
          class="btn-primary"
        >
          Create Game
        </button>
      </div>
    </div>

    <!-- Games Grid -->
    {#if $getGames.length > 0}
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each $getGames as game (game.id)}
          <div class="card-dark hover:border-dark-purple transition-all duration-300">
            <div class="mb-4">
              <h3 class="text-xl font-semibold text-gray-200">{game.name}</h3>
              <div class="text-gray-400 text-sm mt-2">
                <div class="flex justify-between">
                  <span>Categories:</span>
                  <span class="text-gray-300">{game.categories.length}</span>
                </div>
                <div class="flex justify-between">
                  <span>Teams:</span>
                  <span class="text-gray-300">{game.teams.length}</span>
                </div>
                <div class="flex justify-between">
                  <span>Last Modified:</span>
                  <span class="text-gray-300">{new Date(game.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div class="flex gap-2">
              <button
                on:click={() => handlePlayGame(game.id)}
                class="flex-1 py-2 px-3 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-all duration-200"
              >
                Play
              </button>
              <button
                on:click={() => handleEditGame(game.id)}
                class="flex-1 py-2 px-3 bg-dark-purple-bg text-dark-purple-light rounded-lg hover:bg-dark-purple-hover hover:text-white transition-all duration-200"
              >
                Edit
              </button>
              <button
                on:click={() => handleDeleteGame(game.id)}
                class="py-2 px-3 bg-dark-error text-white rounded-lg hover:bg-dark-error-hover transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-gray-400">
          <svg class="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
          </svg>
          <p class="text-xl mb-2">No games yet</p>
          <p>Create your first Jeopardy game to get started!</p>
        </div>
      </div>
    {/if}
  {/if}

  <!-- Create Game Modal -->
  {#if showCreateModal}
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-gradient-card border border-dark-border rounded-lg p-6 w-full max-w-md mx-4 shadow-dark-dropdown">
        <h2 class="text-xl font-bold text-gray-200 mb-4">Create New Game</h2>
        <form on:submit={handleCreateGame}>
          <div class="mb-4">
            <label for="gameName" class="block text-sm font-medium text-gray-300 mb-2">
              Game Name
            </label>
            <input
              id="gameName"
              type="text"
              bind:value={newGameName}
              placeholder="Enter game name"
              class="w-full px-3 py-2 bg-dark-bg text-gray-200 border border-dark-border rounded-lg focus:outline-none focus:border-dark-purple"
              required
            />
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              on:click={() => { showCreateModal = false; newGameName = ''; }}
              class="flex-1 py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 py-2 px-4 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-all duration-200"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
</div>