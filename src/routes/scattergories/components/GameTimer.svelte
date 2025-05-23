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

<div class="card bg-base-200 shadow-lg border-2 border-base-300">
	<div class="card-body p-6">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-xl font-bold">Timer</h3>
			{#if $scattergories.gameState === 'ready' && !editingTime}
				<button
					class="btn btn-sm btn-outline btn-primary"
					onclick={startEditing}
				>
					⚙️ Change
				</button>
			{/if}
		</div>
		
		{#if editingTime}
			<div class="space-y-3">
				<div class="join w-full">
					<input
						type="number"
						class="input input-bordered join-item flex-1 text-center"
						bind:value={tempMinutes}
						min="1"
						max="60"
					/>
					<span class="btn join-item no-animation cursor-default">min</span>
				</div>
				<div class="flex gap-2">
					<button class="btn btn-primary btn-sm flex-1" onclick={saveTime}>
						Save
					</button>
					<button class="btn btn-outline btn-sm flex-1" onclick={cancelEdit}>
						Cancel
					</button>
				</div>
			</div>
		{:else}
			<div class="text-center">
				<div class="bg-base-100 rounded-2xl p-4 mb-3">
					<div 
						class="text-4xl lg:text-5xl font-mono font-black"
						class:text-error={$scattergories.timeRemaining <= 30 && $scattergories.gameState === 'playing'}
						class:animate-pulse={$scattergories.timeRemaining <= 10 && $scattergories.gameState === 'playing'}
					>
						{$timeFormatted}
					</div>
				</div>
				
				{#if $scattergories.gameState === 'playing' && $scattergories.timeRemaining <= 30}
					<div class="text-sm text-error font-bold animate-pulse">
						⚡ Hurry up! Time's running out!
					</div>
				{/if}
			</div>
		{/if}
		
		<!-- Progress Bar -->
		{#if $scattergories.gameState === 'playing'}
			<div class="mt-4">
				<progress 
					class="progress progress-primary w-full" 
					value={$scattergories.timeRemaining} 
					max={$scattergories.timeLimit}
					class:progress-error={$scattergories.timeRemaining <= 30}
				></progress>
			</div>
		{/if}
	</div>
</div>