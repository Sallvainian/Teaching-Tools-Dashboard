<script lang="ts">
	interface Props {
		isOpen: boolean;
		imageUrl: string | null;
		onClose: () => void;
	}

	let { isOpen = $bindable(), imageUrl, onClose }: Props = $props();

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if isOpen && imageUrl}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="button"
		tabindex="-1"
	>
		<!-- Close button -->
		<button
			class="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
			onclick={onClose}
			aria-label="Close preview"
		>
			<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>

		<!-- Image container -->
		<div class="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
			<img
				src={imageUrl}
				alt="Preview"
				class="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
			/>
		</div>
	</div>
{/if}

<style>
	/* Add subtle animation */
	div {
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>