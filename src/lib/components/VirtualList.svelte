<script lang="ts" generics="T">
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		items: T[];
		itemHeight: number;
		windowHeight?: number;
		overscan?: number;
		getKey?: (item: T, index: number) => string | number;
	}

	let {
		items = [],
		itemHeight,
		windowHeight = 600,
		overscan = 3,
		getKey = (_, index) => index
	}: Props = $props();

	let container: HTMLDivElement;
	let scrollTop = $state(0);

	// Reactive calculations using $derived
	let totalHeight = $derived(items.length * itemHeight);
	let visibleCount = $derived(Math.ceil(windowHeight / itemHeight));
	let visibleStart = $derived(Math.max(0, Math.floor(scrollTop / itemHeight) - overscan));
	let visibleEnd = $derived(Math.min(items.length, visibleStart + visibleCount + overscan * 2));
	let visibleItems = $derived(items.slice(visibleStart, visibleEnd));
	let offsetY = $derived(visibleStart * itemHeight);

	function handleScroll() {
		if (container) {
			scrollTop = container.scrollTop;
		}
	}

	onMount(() => {
		if (container) {
			container.addEventListener('scroll', handleScroll, { passive: true });
		}
	});

	onDestroy(() => {
		if (container) {
			container.removeEventListener('scroll', handleScroll);
		}
	});
</script>

<div
	bind:this={container}
	class="virtual-list-container"
	style="height: {windowHeight}px; overflow-y: auto;"
>
	<div class="virtual-list-inner" style="height: {totalHeight}px;">
		<div class="virtual-list-items" style="transform: translateY({offsetY}px);">
			{#each visibleItems as item, i (getKey(item, visibleStart + i))}
				<div class="virtual-list-item" style="height: {itemHeight}px;">
					<slot {item} index={visibleStart + i} />
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.virtual-list-container {
		position: relative;
		will-change: scroll-position;
	}

	.virtual-list-inner {
		position: relative;
	}

	.virtual-list-items {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		will-change: transform;
	}

	.virtual-list-item {
		position: relative;
	}
</style>
