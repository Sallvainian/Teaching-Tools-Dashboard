<script lang="ts">
	import { PUBLIC_GIPHY_API_KEY } from '$env/static/public';
	
	interface Props {
		isOpen: boolean;
		onSelectGif: (gifUrl: string) => void;
	}
	
	let { isOpen = $bindable(), onSelectGif }: Props = $props();
	
	let searchTerm = $state('');
	let gifs = $state<any[]>([]);
	let loading = $state(false);
	let debounceTimer: NodeJS.Timeout;
	
	// Load trending GIFs
	async function loadTrending() {
		loading = true;
		try {
			const url = `https://api.giphy.com/v1/gifs/trending?api_key=${PUBLIC_GIPHY_API_KEY}&limit=20&rating=g`;
			const response = await fetch(url);
			const data = await response.json();
			gifs = data.data;
		} catch (error) {
			console.error('Error fetching trending GIFs:', error);
			gifs = [];
		} finally {
			loading = false;
		}
	}
	
	// Search GIFs
	async function searchGifs() {
		if (!searchTerm.trim()) {
			await loadTrending();
			return;
		}
		
		loading = true;
		try {
			const url = `https://api.giphy.com/v1/gifs/search?api_key=${PUBLIC_GIPHY_API_KEY}&q=${searchTerm}&limit=20&rating=g`;
			const response = await fetch(url);
			const data = await response.json();
			gifs = data.data;
		} catch (error) {
			console.error('Error searching GIFs:', error);
			gifs = [];
		} finally {
			loading = false;
		}
	}
	
	// Debounced search
	function handleInput() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(searchGifs, 500);
	}
	
	// Select GIF
	function selectGif(gif: any) {
		onSelectGif(gif.images.fixed_width.url);
		isOpen = false;
		searchTerm = '';
	}
	
	// Load trending when opened
	$effect(() => {
		if (isOpen) {
			loadTrending();
		}
	});
</script>
{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<!-- Backdrop -->
		<button
			class="absolute inset-0 bg-black/50"
			onclick={() => isOpen = false}
			aria-label="Close GIF picker"
		></button>
		
		<!-- Modal -->
		<div class="relative bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
			<!-- Header -->
			<div class="p-4 border-b border-border">
				<div class="flex items-center justify-between mb-3">
					<h3 class="text-lg font-semibold text-highlight">Choose a GIF</h3>
					<button
						class="p-1 hover:bg-surface rounded-lg transition-colors"
						onclick={() => isOpen = false}
						aria-label="Close"
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				
				<!-- Search -->
				<input
					type="text"
					bind:value={searchTerm}
					oninput={handleInput}
					placeholder="Search for GIFs..."
					class="input w-full"
				/>
			</div>
			
			<!-- GIF Grid -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="flex items-center justify-center h-32">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple"></div>
					</div>
				{:else if gifs.length === 0}
					<div class="text-center text-text-base py-8">
						No GIFs found
					</div>
				{:else}
					<div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
						{#each gifs as gif}
							<button
								class="relative overflow-hidden rounded-lg hover:ring-2 hover:ring-purple transition-all"
								onclick={() => selectGif(gif)}
							>
								<img
									src={gif.images.fixed_width.url}
									alt={gif.title}
									class="w-full h-full object-cover"
									loading="lazy"
								/>
							</button>
						{/each}
					</div>
				{/if}
			</div>
			
			<!-- Footer -->
			<div class="p-3 border-t border-border text-center">
				<span class="text-xs text-text-base">Powered by GIPHY</span>
			</div>
		</div>
	</div>
{/if}