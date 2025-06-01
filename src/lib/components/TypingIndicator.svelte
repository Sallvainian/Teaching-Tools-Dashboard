<script lang="ts">
	let { typingUsers = $bindable([]) }: { typingUsers: string[] } = $props();

	function getTypingText(): string {
		if (typingUsers.length === 0) return '';
		if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`;
		if (typingUsers.length === 2) return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
		return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
	}
</script>

{#if typingUsers.length > 0}
	<div class="typing-indicator px-4 py-2 text-text-base text-sm flex items-center gap-2">
		<div class="typing-dots flex gap-1">
			<div class="dot animate-bounce" style="animation-delay: 0ms"></div>
			<div class="dot animate-bounce" style="animation-delay: 150ms"></div>
			<div class="dot animate-bounce" style="animation-delay: 300ms"></div>
		</div>
		<span>{getTypingText()}</span>
	</div>
{/if}

<style>
	.dot {
		width: 4px;
		height: 4px;
		background-color: currentColor;
		border-radius: 50%;
		animation-duration: 1s;
		animation-iteration-count: infinite;
		opacity: 0.7;
	}

	.typing-indicator {
		border-top: 1px solid var(--border);
		background: var(--background);
	}

	@keyframes bounce {
		0%,
		20%,
		50%,
		80%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-6px);
		}
		60% {
			transform: translateY(-3px);
		}
	}

	.animate-bounce {
		animation: bounce 1s infinite;
	}
</style>
