<script lang="ts">
	import { toasts } from '$lib/stores/notifications';
	import Toast from './Toast.svelte';
	import { flip } from 'svelte/animate';

	// Maximum number of toasts to show at once
	const MAX_TOASTS = 5;

	// Reactive statement to limit the number of visible toasts
	$: visibleToasts = $toasts.slice(0, MAX_TOASTS);
</script>

<!-- Toast Container positioned in bottom right corner -->
<div class="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm w-full" role="region" aria-label="Notifications">
	{#each visibleToasts as toast (toast.id)}
		<div animate:flip={{ duration: 300 }}>
			<Toast {toast} />
		</div>
	{/each}
</div>

<style>
	/* Additional responsive adjustments if needed */
	@media (max-width: 640px) {
		div {
			@apply left-4 right-4 max-w-none;
		}
	}
</style>