<script lang="ts">
	import { scattergories } from '$lib/stores/scattergories';
	import GameTimer from './components/GameTimer.svelte';
	import LetterDisplay from './components/LetterDisplay.svelte';
	import CategoryList from './components/CategoryList.svelte';
	import GameControls from './components/GameControls.svelte';
	import CategoryManager from './components/CategoryManager.svelte';

	let showCategoryManager = $state(false);
	let newCategoryText = $state('');

	function handleAddCategory() {
		if (newCategoryText.trim()) {
			scattergories.addCustomCategory(newCategoryText);
			newCategoryText = '';
		}
	}

	function handleKeyPress(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			handleAddCategory();
		}
	}
</script>

<svelte:head>
	<title>Scattergories - Teacher Dashboard</title>
</svelte:head>

<div class="min-h-screen p-4" style="background-color: var(--bg-base);">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold mb-2" style="color: var(--purple);">Scattergories</h1>
			<p class="text-lg" style="color: var(--muted);">Generate categories and race against time!</p>
		</div>

		<!-- Main Game Layout -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Panel - Game Controls -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Letter Display -->
				<LetterDisplay />

				<!-- Timer -->
				<GameTimer />

				<!-- Game Controls -->
				<GameControls />
			</div>

			<!-- Right Panel - Categories -->
			<div class="lg:col-span-2 relative">
				<!-- Category Controls -->
				<div class="rounded-lg shadow-lg mb-6 p-4" style="background-color: var(--surface);">
					<div>
						<div class="space-y-4">
							<!-- Top Row - Category Count & Mode -->
							<div class="flex flex-wrap items-center justify-between gap-4">
								<div class="flex items-center gap-4">
									<div class="flex items-center gap-2">
										<span class="text-sm font-medium" style="color: var(--text-base);"
											>Categories:</span
										>
										<div class="join">
											<button
												class="btn btn-sm join-item"
												onclick={() =>
													scattergories.setNumberOfWords($scattergories.numberOfWords - 1)}
												disabled={$scattergories.numberOfWords <= 1}
											>
												-
											</button>
											<span class="btn btn-sm join-item no-animation cursor-default">
												{$scattergories.numberOfWords}
											</span>
											<button
												class="btn btn-sm join-item"
												onclick={() =>
													scattergories.setNumberOfWords($scattergories.numberOfWords + 1)}
												disabled={$scattergories.numberOfWords >= 30}
											>
												+
											</button>
										</div>
									</div>

									<button
										class="btn btn-sm btn-outline"
										onclick={() => scattergories.toggleKidFriendly()}
									>
										{$scattergories.isKidFriendly ? 'Kid-Friendly' : 'Regular'} Mode
									</button>
								</div>

								<button
									class="btn btn-sm btn-outline"
									onclick={() => (showCategoryManager = !showCategoryManager)}
								>
									Manage Categories
								</button>
							</div>

							<!-- Quick Add Row -->
							<div class="flex gap-2">
								<input
									type="text"
									placeholder="Add a category..."
									class="input input-bordered input-sm flex-1"
									bind:value={newCategoryText}
									onkeydown={handleKeyPress}
								/>
								<button
									class="btn btn-primary btn-sm"
									onclick={handleAddCategory}
									disabled={!newCategoryText.trim()}
								>
									Add
								</button>
							</div>
						</div>
					</div>
				</div>

				<!-- Category List -->
				<CategoryList />
			</div>
		</div>

		<!-- Category Manager Modal -->
		{#if showCategoryManager}
			<CategoryManager onclose={() => (showCategoryManager = false)} />
		{/if}
	</div>

	<!-- Game Over Modal -->
	{#if $scattergories.gameState === 'game-over'}
		<div class="modal modal-open">
			<div class="modal-box">
				<h3 class="text-2xl font-bold text-center mb-4">Time's Up! 🎉</h3>
				<p class="text-center mb-6">
					How did you do with letter <strong class="text-3xl text-primary"
						>{$scattergories.currentLetter}</strong
					>?
				</p>
				<div class="modal-action justify-center">
					<button class="btn btn-primary" onclick={() => scattergories.resetGame()}>
						Play Again
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.modal-open .modal-box) {
		animation: scale-up 0.3s ease;
	}

	@keyframes scale-up {
		from {
			transform: scale(0.8);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}


	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

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
</style>
