<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import type { Snippet } from 'svelte';
	
	interface Props {
		error?: Error | null;
		retry?: () => void;
 		children?: Snippet;
		fallback?: boolean;
	}

	let { error = null, retry, children, fallback = false }: Props = $props();
	let hasError = $state(false);
	let errorMessage = $state('');
	let errorStack = $state('');

	$effect(() => {
		if (error) {
			hasError = true;
			errorMessage = error.message || 'An unexpected error occurred';
			errorStack = error.stack || '';
		}
	});

	onMount(() => {
		// Global error handler for uncaught errors
		const handleError = (event: ErrorEvent) => {
			hasError = true;
			errorMessage = event.error?.message || event.message || 'An unexpected error occurred';
			errorStack = event.error?.stack || '';
			event.preventDefault();
		};

		const handleRejection = (event: PromiseRejectionEvent) => {
			hasError = true;
			errorMessage = event.reason?.message || 'An unexpected error occurred';
			errorStack = event.reason?.stack || '';
			event.preventDefault();
		};

		window.addEventListener('error', handleError);
		window.addEventListener('unhandledrejection', handleRejection);

		return () => {
			window.removeEventListener('error', handleError);
			window.removeEventListener('unhandledrejection', handleRejection);
		};
	});

	function handleRetry() {
		hasError = false;
		errorMessage = '';
		errorStack = '';
		retry?.();
	}

	function reload() {
		window.location.reload();
	}
</script>

{#if hasError || fallback}
	<div class="min-h-screen flex items-center justify-center p-4">
		<div class="card max-w-lg w-full">
			<div class="text-center">
				<!-- Error Icon -->
				<div class="mb-4">
					<svg
						class="mx-auto h-16 w-16 text-error"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>

				<h1 class="text-2xl font-bold text-highlight mb-2">Something went wrong</h1>
				<p class="text-text-base mb-6">
					{errorMessage}
				</p>

				{#if dev && errorStack}
					<details class="mb-6 text-left">
						<summary class="cursor-pointer text-sm text-muted hover:text-text-hover">
							Show error details
						</summary>
						<pre class="mt-2 p-4 bg-surface rounded-lg text-xs overflow-x-auto">{errorStack}</pre>
					</details>
				{/if}

				<div class="flex gap-4 justify-center">
					{#if retry}
						<button onclick={handleRetry} class="btn btn-primary"> Try Again </button>
					{/if}
					<button onclick={reload} class="btn btn-secondary"> Reload Page </button>
				</div>
			</div>
		</div>
	</div>
{:else}
	{@render children?.()}
{/if}
