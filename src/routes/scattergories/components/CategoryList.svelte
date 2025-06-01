<script lang="ts">
	import { scattergories } from '$lib/stores/scattergories';
</script>

<div class="rounded-lg shadow-lg p-6" style="background-color: var(--surface);">
	<div class="flex items-center justify-between mb-6">
		<h3 class="text-2xl font-bold" style="color: var(--text-base);">
			📝 Categories
			{#if $scattergories.gameState === 'playing' || $scattergories.gameState === 'paused' || $scattergories.gameState === 'game-over'}
				<span class="text-lg font-normal ml-2" style="color: var(--purple);">
					({$scattergories.currentCategories.length} selected)
				</span>
			{/if}
		</h3>
	</div>

	{#if $scattergories.gameState === 'ready'}
		<!-- Show all available categories when not playing -->
		<div class="max-h-96 overflow-y-auto">
			{#if $scattergories.categories.length === 0}
				<div class="text-center py-8" style="color: var(--muted);">
					<p class="mb-4">No categories available</p>
					<p class="text-sm">Add some categories to get started!</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
					{#each $scattergories.categories as category (category.id)}
						<div
							class="flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md"
							style="background-color: {category.isCustom
								? 'var(--purple-bg)'
								: 'var(--card)'}; border-color: {category.isCustom
								? 'var(--purple)'
								: 'var(--border)'};"
						>
							<div class="flex items-center gap-2">
								<span class="text-sm font-medium" style="color: var(--text-base);">
									{category.category}
								</span>
								{#if category.isCustom}
									<span
										class="text-xs px-2 py-1 rounded-full"
										style="background-color: var(--purple); color: white;">★</span
									>
								{/if}
							</div>
							{#if category.isCustom}
								<button
									class="text-xs w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80"
									style="background-color: var(--error); color: white;"
									onclick={() => scattergories.removeCategory(category.id)}
									title="Remove custom category"
								>
									×
								</button>
							{/if}
						</div>
					{/each}
				</div>

				<div class="mt-4 text-xs text-center" style="color: var(--muted);">
					{$scattergories.numberOfWords} categories will be randomly selected when you start the game
				</div>
			{/if}
		</div>
	{:else}
		<!-- Show selected categories during/after game -->
		<div class="space-y-2 relative">
			{#each $scattergories.currentCategories as category, index (category.id)}
				<div
					class="flex items-center p-3 rounded-lg transition-colors relative overflow-hidden hover:opacity-80"
					style="background-color: var(--card); border: 1px solid var(--border); animation-delay: {index *
						50}ms"
					class:animate-slide-in={$scattergories.gameState === 'playing'}
				>
					<div
						class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3"
						style="background-color: var(--purple); color: white;"
					>
						{index + 1}
					</div>
					<div class="flex-1">
						<span class="text-base font-medium" style="color: var(--text-base);"
							>{category.category}</span
						>
						{#if category.isCustom}
							<span class="text-xs ml-2" style="color: var(--purple);">★</span>
						{/if}
					</div>

					<!-- Individual pause overlay for this category -->
					{#if $scattergories.gameState === 'paused'}
						<div
							class="absolute inset-0 bg-black rounded-lg block-reveal"
							style="animation-delay: {index * 100}ms;"
						></div>
					{/if}
				</div>
			{/each}
		</div>

		{#if $scattergories.gameState === 'playing'}
			<div class="mt-6 p-4 rounded-lg text-center" style="background-color: var(--purple-bg);">
				<div class="text-lg font-bold mb-2" style="color: var(--purple);">
					Letter: {$scattergories.currentLetter}
				</div>
				<div class="text-sm" style="color: var(--muted);">
					Find items in each category that start with <strong style="color: var(--purple);"
						>{$scattergories.currentLetter}</strong
					>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	@keyframes slide-in {
		from {
			transform: translateX(-20px);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slide-in {
		animation: slide-in 0.5s ease-out forwards;
	}

	.block-reveal {
		animation: block-reveal 0.6s ease-out forwards;
		transform: scaleX(0);
		transform-origin: left;
	}

	@keyframes block-reveal {
		0% {
			transform: scaleX(0);
		}
		50% {
			transform: scaleX(1);
		}
		100% {
			transform: scaleX(1);
		}
	}
</style>
