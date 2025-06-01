<script lang="ts">
	// Random loader component with multiple animation options
	let { size = 50, color = 'var(--purple)' } = $props<{
		size?: number;
		color?: string;
	}>();

	// Get random animation on component initialization
	const animations = ['conic', 'pacman', 'bounce'] as const;
	const selectedAnimation = animations[Math.floor(Math.random() * animations.length)];
</script>

<div class="loader-container">
	{#if selectedAnimation === 'conic'}
		<!-- Conic spinning loader -->
		<div class="conic-loader" style="width: {size}px; --loader-color: {color};"></div>
	{:else if selectedAnimation === 'pacman'}
		<!-- Pacman loader -->
		<div class="pacman-container" style="--loader-color: {color};">
			<div class="pacman">
				<div></div>
				<div></div>
				<div></div>
				<div></div>
				<div></div>
			</div>
		</div>
	{:else if selectedAnimation === 'bounce'}
		<!-- Bouncing dots -->
		<div class="bounce-container" style="--loader-color: {color};">
			<div class="bounce-dot"></div>
			<div class="bounce-dot"></div>
			<div class="bounce-dot"></div>
		</div>
	{/if}
</div>

<style>
	.loader-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60px;
	}

	/* Conic Spinner */
	.conic-loader {
		aspect-ratio: 1;
		border-radius: 50%;
		background: repeating-conic-gradient(#0000, var(--loader-color) 1deg 18deg, #0000 20deg 36deg);
		animation: conic-spin 4s infinite linear;
		position: relative;
	}
	.conic-loader::before {
		content: '';
		position: absolute;
		border-radius: 50%;
		inset: 0;
		background: inherit;
		animation: inherit;
	}
	@keyframes conic-spin {
		100% {
			transform: rotate(0.5turn);
		}
	}

	/* Pacman */
	.pacman-container {
		width: 50px;
		height: 50px;
		position: relative;
	}
	.pacman {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--loader-color);
		position: relative;
		animation: pacman-chomp 0.6s infinite ease-in-out;
	}
	.pacman::before {
		content: '';
		position: absolute;
		width: 0;
		height: 0;
		border: 15px solid transparent;
		border-right: 15px solid var(--bg-base, #fff);
		border-radius: 50%;
		animation: pacman-mouth 0.6s infinite ease-in-out;
	}
	.pacman div {
		position: absolute;
		width: 4px;
		height: 4px;
		background: var(--loader-color);
		border-radius: 50%;
		animation: pacman-dots 0.6s infinite ease-in-out;
	}
	.pacman div:nth-child(1) {
		left: 40px;
		top: 13px;
		animation-delay: 0s;
	}
	.pacman div:nth-child(2) {
		left: 50px;
		top: 13px;
		animation-delay: 0.1s;
	}
	.pacman div:nth-child(3) {
		left: 60px;
		top: 13px;
		animation-delay: 0.2s;
	}
	.pacman div:nth-child(4) {
		left: 70px;
		top: 13px;
		animation-delay: 0.3s;
	}
	.pacman div:nth-child(5) {
		left: 80px;
		top: 13px;
		animation-delay: 0.4s;
	}

	@keyframes pacman-chomp {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(-45deg);
		}
	}
	@keyframes pacman-mouth {
		0%,
		100% {
			transform: rotate(0deg);
		}
		50% {
			transform: rotate(-45deg);
		}
	}
	@keyframes pacman-dots {
		0% {
			opacity: 1;
			transform: translateX(0);
		}
		100% {
			opacity: 0;
			transform: translateX(-20px);
		}
	}

	/* Bouncing Dots */
	.bounce-container {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.bounce-dot {
		width: 12px;
		height: 12px;
		background: var(--loader-color);
		border-radius: 50%;
		animation: bounce-animation 1.4s infinite ease-in-out both;
	}
	.bounce-dot:nth-child(1) {
		animation-delay: -0.32s;
	}
	.bounce-dot:nth-child(2) {
		animation-delay: -0.16s;
	}
	.bounce-dot:nth-child(3) {
		animation-delay: 0s;
	}

	@keyframes bounce-animation {
		0%,
		80%,
		100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}
</style>
