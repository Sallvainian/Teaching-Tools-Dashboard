<script lang="ts">
	import { scattergories } from '$lib/stores/scattergories';
	
	interface Props {
		onclose: () => void;
	}
	
	let { onclose }: Props = $props();
	let newCategory = $state('');
	
	function handleAddCategory() {
		if (newCategory.trim()) {
			scattergories.addCustomCategory(newCategory.trim());
			newCategory = '';
		}
	}
	
	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleAddCategory();
		} else if (event.key === 'Escape') {
			onclose();
		}
	}
</script>

<div class="modal modal-open">
	<div class="modal-box max-w-2xl max-h-[80vh] overflow-y-auto">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-xl font-bold">Edit Categories</h3>
			<button class="btn btn-sm btn-circle btn-ghost" onclick={onclose}>✕</button>
		</div>
		
		<!-- Quick Actions -->
		<div class="mb-4">
			<div class="flex flex-wrap gap-2 mb-3">
				<button
					class="btn btn-sm btn-outline"
					onclick={() => scattergories.toggleKidFriendly()}
				>
					Make {$scattergories.isKidFriendly ? 'Adult' : 'Child'}-Friendly
				</button>
				<button
					class="btn btn-sm btn-outline btn-warning"
					onclick={() => scattergories.removeAllCategories()}
				>
					Remove All
				</button>
			</div>
			<div class="join w-full">
				<input
					type="text"
					placeholder="Enter category name..."
					class="input input-bordered input-sm join-item flex-1"
					bind:value={newCategory}
					onkeydown={handleKeyPress}
				/>
				<button
					class="btn btn-primary btn-sm join-item"
					onclick={handleAddCategory}
					disabled={!newCategory.trim()}
				>
					+
				</button>
			</div>
		</div>
		
		<!-- Category List -->
		<div class="mb-4">
			<div class="text-sm text-base-content/70 mb-2">
				{$scattergories.categories.length} total ({$scattergories.customCategories.length} custom)
			</div>
			
			<div class="max-h-60 overflow-y-auto border border-base-300 rounded">
				{#if $scattergories.categories.length === 0}
					<div class="p-4 text-center text-base-content/60">
						<p class="text-sm">No categories available</p>
					</div>
				{:else}
					<div class="divide-y divide-base-300">
						{#each $scattergories.categories as category (category.id)}
							<div class="flex items-center justify-between p-2 hover:bg-base-50 text-sm">
								<div class="flex items-center gap-2">
									<span>{category.category}</span>
									{#if category.isCustom}
										<span class="text-xs text-primary">★</span>
									{/if}
								</div>
								{#if category.isCustom}
									<button
										class="btn btn-xs btn-ghost text-error hover:bg-error hover:text-error-content"
										onclick={() => scattergories.removeCategory(category.id)}
									>
										×
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Close Button -->
		<div class="modal-action mt-6">
			<button class="btn btn-primary w-full" onclick={onclose}>Done</button>
		</div>
	</div>
	<button class="modal-backdrop" onclick={onclose} aria-label="Close modal"></button>
</div>