<script lang="ts">
	import { callStore, isInCall } from '$lib/stores/call';
	import { onMount, onDestroy } from 'svelte';

	let callDuration = $state(0);
	let durationInterval: number | null = null;

	const currentCall = $derived($callStore.currentCall);
	const isMuted = $derived($callStore.isMuted);
	const isSpeakerOn = $derived($callStore.isSpeakerOn);

	// Format duration as MM:SS
	function formatDuration(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	// Start duration timer when call becomes active
	$effect(() => {
		if ($isInCall && currentCall?.state === 'connected') {
			callDuration = 0;
			durationInterval = window.setInterval(() => {
				callDuration++;
			}, 1000);
		} else {
			if (durationInterval) {
				clearInterval(durationInterval);
				durationInterval = null;
			}
		}
	});

	onDestroy(() => {
		if (durationInterval) {
			clearInterval(durationInterval);
		}
	});

	function handleEndCall() {
		callStore.endCall();
	}

	function handleToggleMute() {
		callStore.toggleMute();
	}

	function handleToggleSpeaker() {
		callStore.toggleSpeaker();
	}
</script>

{#if $isInCall && currentCall}
	<div class="fixed top-4 right-4 bg-card border border-border rounded-lg shadow-lg p-4 z-40 min-w-[280px]">
		<div class="flex items-center gap-3 mb-4">
			<div class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium">
				{currentCall.calleeId === currentCall.callerId ? currentCall.calleeName[0] : currentCall.callerName[0]}
			</div>
			<div class="flex-1">
				<div class="font-medium text-highlight">
					{currentCall.calleeId === currentCall.callerId ? currentCall.calleeName : currentCall.callerName}
				</div>
				<div class="text-sm text-text-base">
					{currentCall.state === 'connected' ? formatDuration(callDuration) : 'Connecting...'}
				</div>
			</div>
			<div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
		</div>

		<div class="flex gap-2 justify-center">
			<button
				class={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
					isMuted 
						? 'bg-red-500 hover:bg-red-600 text-white' 
						: 'bg-surface hover:bg-surface-hover text-text-base'
				}`}
				onclick={handleToggleMute}
				aria-label={isMuted ? 'Unmute' : 'Mute'}
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					{#if isMuted}
						<path d="M9 9v3a3 3 0 0 0 5.12 2.12l1.27-1.27A5.97 5.97 0 0 1 18 11v1a8 8 0 0 1-13.3 6"></path>
						<path d="M9 9L5 5"></path>
						<path d="M19 19l-4-4"></path>
					{:else}
						<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
						<path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
						<line x1="12" y1="19" x2="12" y2="23"></line>
						<line x1="8" y1="23" x2="16" y2="23"></line>
					{/if}
				</svg>
			</button>

			<button
				class={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
					isSpeakerOn 
						? 'bg-purple text-white' 
						: 'bg-surface hover:bg-surface-hover text-text-base'
				}`}
				onclick={handleToggleSpeaker}
				aria-label={isSpeakerOn ? 'Turn off speaker' : 'Turn on speaker'}
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					{#if isSpeakerOn}
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
						<path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
						<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
					{:else}
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
					{/if}
				</svg>
			</button>

			<button
				class="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-colors"
				onclick={handleEndCall}
				aria-label="End call"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			</button>
		</div>
	</div>
{/if}