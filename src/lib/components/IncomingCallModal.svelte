<script lang="ts">
	import { callStore } from '$lib/stores/call';
	
	let { isOpen = $bindable(false) } = $props<{
		isOpen: boolean;
	}>();

	const call = $derived($callStore.incomingCall);

	function handleAnswer() {
		callStore.answerCall();
		isOpen = false;
	}

	function handleDecline() {
		callStore.declineCall();
		isOpen = false;
	}
</script>

{#if isOpen && call}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
		<div class="bg-card rounded-2xl p-8 max-w-sm w-full mx-4 text-center">
			<div class="mb-6">
				<div class="w-24 h-24 rounded-full bg-purple-bg text-purple flex items-center justify-center text-2xl font-bold mx-auto mb-4">
					{call.callerName[0]?.toUpperCase()}
				</div>
				<h3 class="text-xl font-semibold text-highlight mb-2">{call.callerName}</h3>
				<p class="text-text-base">Incoming voice call</p>
			</div>

			<div class="flex gap-4 justify-center">
				<button
					class="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
					onclick={handleDecline}
					aria-label="Decline call"
				>
					<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>

				<button
					class="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors"
					onclick={handleAnswer}
					aria-label="Answer call"
				>
					<svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}