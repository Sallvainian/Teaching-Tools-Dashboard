<script lang="ts">
	import { scattergories } from '$lib/stores/scattergories';
</script>

<div class="rounded-lg shadow-lg p-6" style="background-color: var(--surface);">
	<div class="text-center">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-xl font-bold" style="color: var(--text-base);">Letter</h3>
			<button class="btn btn-sm btn-outline" onclick={() => scattergories.generateNewLetter()}>
				🎲 Re-roll
			</button>
		</div>

		<div class="min-h-[8rem] flex items-center justify-center mb-4">
			{#if $scattergories.currentLetter}
				<div
					class="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl flex items-center justify-center"
					style="background-color: var(--purple-bg); border: 2px solid var(--purple);"
				>
					<span
						class="text-5xl lg:text-7xl font-black animate-bounce-in"
						style="color: var(--purple);">{$scattergories.currentLetter}</span
					>
				</div>
			{:else}
				<div class="text-2xl font-medium" style="color: var(--muted);">Ready to start!</div>
			{/if}
		</div>

		{#if $scattergories.currentLetter}
			<p class="text-sm font-medium" style="color: var(--muted);">
				Find items starting with <strong class="text-lg" style="color: var(--purple);"
					>{$scattergories.currentLetter}</strong
				>
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
