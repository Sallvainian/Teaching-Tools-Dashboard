import { writable } from 'svelte/store';

export interface LoadingState {
	isLoading: boolean;
	animation: 'conic' | 'pacman' | 'bounce' | 'pulse' | 'dots';
}

// Get random animation
function getRandomAnimation(): LoadingState['animation'] {
	const animations: LoadingState['animation'][] = ['conic', 'pacman', 'bounce', 'pulse', 'dots'];
	return animations[Math.floor(Math.random() * animations.length)];
}

function createLoadingStore() {
	const { subscribe, update } = writable<LoadingState>({
		isLoading: false,
		animation: getRandomAnimation()
	});

	return {
		subscribe,
		start: () =>
			update(() => ({
				isLoading: true,
				animation: getRandomAnimation()
			})),
		stop: () =>
			update((state) => ({
				...state,
				isLoading: false
			})),
		setLoading: (loading: boolean) =>
			update((state) => ({
				...state,
				isLoading: loading
			}))
	};
}

export const loadingStore = createLoadingStore();
