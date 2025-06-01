<script lang="ts">
	import { scattergories, timeFormatted } from '$lib/stores/scattergories';

	let editingTime = $state(false);
	let tempMinutes = $state(3);

	function startEditing() {
		tempMinutes = Math.floor($scattergories.timeLimit / 60);
		editingTime = true;
	}

	function saveTime() {
		scattergories.setTimeLimit(tempMinutes);
		editingTime = false;
	}

	function cancelEdit() {
		editingTime = false;
	}

	$effect(() => {
		if ($scattergories.gameState !== 'ready') {
			editingTime = false;
		}
	});
</script>

<div class="rounded-lg shadow-lg p-6" style="background-color: var(--surface);">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-xl font-bold" style="color: var(--text-base);">Timer</h3>
		{#if $scattergories.gameState === 'ready' && !editingTime}
			<button class="btn btn-sm btn-outline" onclick={startEditing}> ⚙️ Change </button>
		{/if}
	</div>

	{#if editingTime}
		<div class="space-y-3">
			<div class="flex w-full">
				<input
					type="number"
					class="flex-1 text-center p-2 rounded-l-lg border"
					style="background-color: var(--card); border-color: var(--border); color: var(--text-base);"
					bind:value={tempMinutes}
					min="1"
					max="60"
				/>
				<span
					class="px-3 py-2 rounded-r-lg border-l-0 border"
					style="background-color: var(--surface); border-color: var(--border); color: var(--text-base);"
					>min</span
				>
			</div>
			<div class="flex gap-2">
				<button class="btn btn-primary btn-sm flex-1" onclick={saveTime}> Save </button>
				<button class="btn btn-outline btn-sm flex-1" onclick={cancelEdit}> Cancel </button>
			</div>
		</div>
	{:else}
		<div class="text-center">
			<div
				class="rounded-2xl p-4 mb-3"
				style="background-color: var(--card); border: 1px solid var(--border);"
			>
				<div
					class="text-4xl lg:text-5xl font-mono font-black"
					style="color: {$scattergories.timeRemaining <= 30 &&
					$scattergories.gameState === 'playing'
						? 'var(--error)'
						: 'var(--text-base)'};"
					class:animate-pulse={$scattergories.timeRemaining <= 10 &&
						$scattergories.gameState === 'playing'}
				>
					{$timeFormatted}
				</div>
			</div>

			{#if $scattergories.gameState === 'playing' && $scattergories.timeRemaining <= 30}
				<div class="text-sm font-bold animate-pulse" style="color: var(--error);">
					⚡ Hurry up! Time's running out!
				</div>
			{/if}
		</div>
	{/if}

	<!-- Progress Bar -->
	{#if $scattergories.gameState === 'playing'}
		<div class="mt-4">
			<div class="w-full h-2 rounded-full" style="background-color: var(--border);">
				<div
					class="h-full rounded-full transition-all duration-1000"
					style="width: {($scattergories.timeRemaining / $scattergories.timeLimit) *
						100}%; background-color: {$scattergories.timeRemaining <= 30
						? 'var(--error)'
						: 'var(--purple)'};"
				></div>
			</div>
		</div>
	{/if}
</div>
