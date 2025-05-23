<script lang="ts">
	import { scattergories } from '$lib/stores/scattergories';
</script>

<div class="card bg-gradient-to-br from-primary to-primary-focus text-primary-content shadow-xl">
	<div class="card-body text-center p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-xl font-bold">Letter</h3>
			{#if $scattergories.gameState === 'ready'}
				<button
					class="btn btn-sm btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
					onclick={() => scattergories.generateNewLetter()}
				>
					🎲 Re-roll
				</button>
			{/if}
		</div>
		
		<div class="min-h-[8rem] flex items-center justify-center mb-4">
			{#if $scattergories.currentLetter}
				<div class="w-24 h-24 lg:w-32 lg:h-32 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
					<span class="text-5xl lg:text-7xl font-black animate-bounce-in">{$scattergories.currentLetter}</span>
				</div>
			{:else}
				<div class="text-2xl opacity-70 font-medium">Ready to start!</div>
			{/if}
		</div>
		
		{#if $scattergories.currentLetter}
			<p class="text-sm opacity-90 font-medium">
				Find items starting with <strong class="text-lg">{$scattergories.currentLetter}</strong>
			</p>
		{/if}
	</div>
</div>

<style>
	@keyframes bounce-in {
		0% {
			transform: scale(0.3);
			opacity: 0;
		}
		50% {
			transform: scale(1.05);
		}
		70% {
			transform: scale(0.9);
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.animate-bounce-in {
		animation: bounce-in 0.6s ease-out;
	}
</style>