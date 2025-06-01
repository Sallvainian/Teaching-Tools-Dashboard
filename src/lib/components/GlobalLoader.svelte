<script lang="ts">
	import { loadingStore } from '$lib/stores/loading';

	let { size = 50, color = 'var(--purple)' } = $props<{
		size?: number;
		color?: string;
	}>();
</script>

{#if $loadingStore.isLoading}
	<div class="global-loader-overlay">
		<div class="loader-container">
			{#if $loadingStore.animation === 'conic'}
				<!-- Conic spinning loader -->
				<div class="conic-loader" style="width: {size}px; --loader-color: {color};"></div>
			{:else if $loadingStore.animation === 'pacman'}
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
			{:else if $loadingStore.animation === 'bounce'}
				<!-- Bouncing dots -->
				<div class="bounce-container" style="--loader-color: {color};">
					<div class="bounce-dot"></div>
					<div class="bounce-dot"></div>
					<div class="bounce-dot"></div>
				</div>
			{:else if $loadingStore.animation === 'pulse'}
				<!-- Pulsing circle -->
				<div class="pulse-container" style="--loader-color: {color};">
					<div class="pulse-circle"></div>
					<div class="pulse-circle"></div>
					<div class="pulse-circle"></div>
				</div>
			{:else if $loadingStore.animation === 'dots'}
				<!-- Moving dots -->
				<div class="dots-container" style="--loader-color: {color};">
					<div class="moving-dot"></div>
					<div class="moving-dot"></div>
					<div class="moving-dot"></div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.global-loader-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		backdrop-filter: blur(2px);
		animation: fade-in 0.2s ease-out;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.loader-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60px;
		background-color: var(--surface);
		padding: 2rem;
		border-radius: 1rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
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
		border-right: 15px solid var(--surface);
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

	/* Pulsing Circles */
	.pulse-container {
		position: relative;
		width: 60px;
		height: 60px;
	}
	.pulse-circle {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 2px solid var(--loader-color);
		border-radius: 50%;
		animation: pulse-animation 2s infinite;
	}
	.pulse-circle:nth-child(1) {
		animation-delay: 0s;
	}
	.pulse-circle:nth-child(2) {
		animation-delay: 0.6s;
	}
	.pulse-circle:nth-child(3) {
		animation-delay: 1.2s;
	}

	@keyframes pulse-animation {
		0% {
			transform: scale(0);
			opacity: 1;
		}
		100% {
			transform: scale(1);
			opacity: 0;
		}
	}

	/* Moving Dots */
	.dots-container {
		display: flex;
		gap: 4px;
		align-items: center;
	}
	.moving-dot {
		width: 8px;
		height: 8px;
		background: var(--loader-color);
		border-radius: 50%;
		animation: moving-dots 1.5s infinite ease-in-out;
	}
	.moving-dot:nth-child(1) {
		animation-delay: 0s;
	}
	.moving-dot:nth-child(2) {
		animation-delay: 0.2s;
	}
	.moving-dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes moving-dots {
		0%,
		80%,
		100% {
			transform: scale(0) translateY(0);
		}
		40% {
			transform: scale(1) translateY(-20px);
		}
	}
</style>
