<script lang="ts">
	import { scattergories } from '$lib/stores/scattergories';
</script>

<div class="card bg-base-100 shadow-xl border-2 border-base-300">
	<div class="card-body p-6">
		<div class="flex items-center justify-between mb-6">
			<h3 class="text-2xl font-bold">
				📝 Categories
				{#if $scattergories.gameState === 'playing' || $scattergories.gameState === 'paused' || $scattergories.gameState === 'game-over'}
					<span class="text-lg font-normal text-primary ml-2">
						({$scattergories.currentCategories.length} selected)
					</span>
				{/if}
			</h3>
		</div>
		
		{#if $scattergories.gameState === 'ready'}
			<!-- Show all available categories when not playing -->
			<div class="max-h-96 overflow-y-auto">
				{#if $scattergories.categories.length === 0}
					<div class="text-center py-8 text-base-content/60">
						<p class="mb-4">No categories available</p>
						<p class="text-sm">Add some categories to get started!</p>
					</div>
				{:else}
					<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
						{#each $scattergories.categories as category (category.id)}
							<div 
								class="flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md {category.isCustom ? 'bg-primary/10 border-primary/40 hover:bg-primary/20' : 'border-base-300 hover:bg-base-200 hover:border-base-400'}"
							>
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium">
										{category.category}
									</span>
									{#if category.isCustom}
										<span class="badge badge-primary badge-sm">★</span>
									{/if}
								</div>
								{#if category.isCustom}
									<button
										class="btn btn-xs btn-circle btn-error btn-outline hover:btn-error"
										onclick={() => scattergories.removeCategory(category.id)}
										title="Remove custom category"
									>
										×
									</button>
								{/if}
							</div>
						{/each}
					</div>
					
					<div class="mt-4 text-xs text-base-content/60 text-center">
						{$scattergories.numberOfWords} categories will be randomly selected when you start the game
					</div>
				{/if}
			</div>
		{:else}
			<!-- Show selected categories during/after game -->
			<div class="space-y-2">
				{#each $scattergories.currentCategories as category, index (category.id)}
					<div 
						class="flex items-center p-3 rounded-lg bg-base-200 hover:bg-base-300 transition-colors"
						style="animation-delay: {index * 50}ms"
						class:animate-slide-in={$scattergories.gameState === 'playing'}
					>
						<div class="flex-shrink-0 w-8 h-8 bg-primary text-primary-content rounded-full flex items-center justify-center text-sm font-bold mr-3">
							{index + 1}
						</div>
						<div class="flex-1">
							<span class="text-base font-medium">{category.category}</span>
							{#if category.isCustom}
								<span class="text-xs text-primary ml-2">★</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			
			{#if $scattergories.gameState === 'playing'}
				<div class="mt-6 p-4 bg-primary/10 rounded-lg text-center">
					<div class="text-lg font-bold text-primary mb-2">
						Letter: {$scattergories.currentLetter}
					</div>
					<div class="text-sm text-base-content/70">
						Find items in each category that start with <strong>{$scattergories.currentLetter}</strong>
					</div>
				</div>
			{/if}
		{/if}
	</div>
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
</style>