<script lang="ts">
	import { scattergories, canStart } from '$lib/stores/scattergories';
	
	function getPlayButtonText() {
		switch ($scattergories.gameState) {
			case 'ready': return 'Start Game';
			case 'playing': return 'Pause';
			case 'paused': return 'Resume';
			case 'game-over': return 'Play Again';
			default: return 'Start';
		}
	}
	
	function handlePlayButton() {
		switch ($scattergories.gameState) {
			case 'ready':
			case 'paused':
				scattergories.startGame();
				break;
			case 'playing':
				scattergories.pauseGame();
				break;
			case 'game-over':
				scattergories.resetGame();
				break;
		}
	}
</script>

<div class="card bg-base-200 shadow-lg border-2 border-base-300">
	<div class="card-body p-6 text-center">
		<!-- Play Label -->
		<div class="mb-4">
			<div class="text-lg font-bold mb-2">
				{#if $scattergories.gameState === 'ready'}
					Click to Start
				{:else if $scattergories.gameState === 'playing'}
					Playing
				{:else if $scattergories.gameState === 'paused'}
					Paused
				{:else if $scattergories.gameState === 'game-over'}
					Game Over
				{/if}
			</div>
		</div>
		
		<div class="space-y-3">
			<!-- Main Play/Pause Button -->
			<button
				class="btn btn-lg w-full text-lg font-bold shadow-lg"
				class:btn-success={$scattergories.gameState === 'ready'}
				class:btn-warning={$scattergories.gameState === 'playing'}
				class:btn-info={$scattergories.gameState === 'paused'}
				class:btn-primary={$scattergories.gameState === 'game-over'}
				onclick={handlePlayButton}
				disabled={$scattergories.gameState === 'ready' && !$canStart}
			>
				{#if $scattergories.gameState === 'playing'}
					<svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
						<rect x="6" y="4" width="4" height="16"/>
						<rect x="14" y="4" width="4" height="16"/>
					</svg>
				{:else}
					<svg class="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
						<path d="M8 5v14l11-7z"/>
					</svg>
				{/if}
				{getPlayButtonText()}
			</button>
			
			<!-- Reset Button -->
			{#if $scattergories.gameState !== 'ready'}
				<button
					class="btn btn-outline btn-sm w-full"
					onclick={() => scattergories.resetGame()}
				>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
					</svg>
					Reset Game
				</button>
			{/if}
		</div>
		
		<!-- Game Status -->
		<div class="mt-4 text-sm opacity-70">
			{#if $scattergories.gameState === 'ready'}
				Ready to start!
			{:else if $scattergories.gameState === 'playing'}
				Game in progress...
			{:else if $scattergories.gameState === 'paused'}
				Game paused
			{:else if $scattergories.gameState === 'game-over'}
				Time's up!
			{/if}
		</div>
		
		{#if !$canStart && $scattergories.categories.length === 0}
			<div class="alert alert-warning mt-4 text-xs">
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
				</svg>
				Add some categories to start playing!
			</div>
		{/if}
	</div>
</div>