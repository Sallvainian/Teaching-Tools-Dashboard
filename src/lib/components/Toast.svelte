<script lang="ts">
	import type { Toast, ToastType } from '$lib/types/notifications';
	import { dismissToast } from '$lib/stores/notifications';
	import { fly } from 'svelte/transition';

	let { toast, onclick } = $props<{
		toast: Toast;
		onclick?: () => void;
	}>();

	function handleDismiss() {
		dismissToast(toast.id);
	}

	function handleClick() {
		if (onclick) {
			onclick();
		}
	}

	// Define colors and icons for different toast types
	const typeConfig: Record<ToastType, { bgColor: string; textColor: string; icon: string }> = {
		success: {
			bgColor: 'bg-green-500',
			textColor: 'text-white',
			icon: '✓'
		},
		error: {
			bgColor: 'bg-red-500',
			textColor: 'text-white',
			icon: '✕'
		},
		warning: {
			bgColor: 'bg-yellow-500',
			textColor: 'text-white',
			icon: '⚠'
		},
		info: {
			bgColor: 'bg-blue-500',
			textColor: 'text-white',
			icon: 'ℹ'
		}
	};

	const config = typeConfig[toast.type as ToastType];
</script>

<button
	type="button"
	class={`${config.bgColor} ${config.textColor} rounded-lg shadow-lg p-4 mb-3 cursor-pointer transform transition-all duration-300 hover:scale-105 w-full text-left`}
	transition:fly={{ x: 300, duration: 300 }}
	onclick={handleClick}
	aria-live="polite"
>
	<div class="flex items-start justify-between">
		<div class="flex items-start space-x-3">
			<div class="flex-shrink-0">
				<span class="text-lg font-bold" aria-hidden="true">{config.icon}</span>
			</div>
			<div class="flex-1 min-w-0">
				{#if toast.title}
					<p class="text-sm font-medium">{toast.title}</p>
				{/if}
				<p class="text-sm {toast.title ? 'mt-1' : ''}">{toast.message}</p>
			</div>
		</div>
		<div
			class="flex-shrink-0 ml-4 p-1 rounded-full hover:bg-black/10 transition-colors cursor-pointer"
			onclick={(e) => {
				e.stopPropagation();
				handleDismiss();
			}}
			role="button"
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					e.stopPropagation();
					handleDismiss();
				}
			}}
			aria-label="Dismiss notification"
		>
			<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
					clip-rule="evenodd"
				/>
			</svg>
		</div>
	</div>
</button>