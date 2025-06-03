<script lang="ts">
	// Props
	let { 
		isOpen = $bindable(false), 
		title = $bindable('Confirm Action'),
		message = $bindable('Are you sure you want to proceed?'),
		confirmText = $bindable('Confirm'),
		cancelText = $bindable('Cancel'),
		confirmButtonClass = $bindable('bg-purple hover:bg-purple/90'),
		cancelButtonClass = $bindable('bg-surface hover:bg-surface/80'),
		onConfirm = () => {},
		onCancel = () => {}
	} = $props<{
		isOpen?: boolean;
		title?: string;
		message?: string;
		confirmText?: string;
		cancelText?: string;
		confirmButtonClass?: string;
		cancelButtonClass?: string;
		onConfirm?: () => void;
		onCancel?: () => void;
	}>();

	// Close the modal
	function closeModal() {
		isOpen = false;
	}

	// Handle confirm action
	function handleConfirm() {
		onConfirm();
		closeModal();
	}

	// Handle cancel action
	function handleCancel() {
		onCancel();
		closeModal();
	}

	// Handle click outside modal
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}

	// Handle escape key press
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCancel();
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="confirmation-modal-title"
		tabindex="-1"
	>
		<div class="card-dark max-w-md w-full animate-fade-in">
			<!-- Header -->
			<div class="p-5 border-b border-border">
				<div class="flex justify-between items-center">
					<h2 id="confirmation-modal-title" class="text-xl font-semibold text-highlight">{title}</h2>
					<button
						onclick={handleCancel}
						class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
						aria-label="Close modal"
					>
						<svg
							class="w-5 h-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="p-5">
				<p class="text-text-base">{message}</p>
			</div>

			<!-- Footer -->
			<div class="p-5 border-t border-border flex justify-end gap-3">
				<button
					onclick={handleCancel}
					class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-text-hover ${cancelButtonClass}`}
				>
					{cancelText}
				</button>
				<button
					onclick={handleConfirm}
					class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-highlight ${confirmButtonClass}`}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fade-in {
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>