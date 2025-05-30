import { onMount } from 'svelte';
import type { ComponentType } from 'svelte';

interface LazyComponentOptions {
	loader: () => Promise<{ default: ComponentType }>;
	loading?: ComponentType;
	error?: ComponentType;
	delay?: number;
	timeout?: number;
}

export function lazyLoad<T extends ComponentType>(options: LazyComponentOptions) {
	let component = $state<ComponentType | null>(null);
	let loading = $state(true);
	let error = $state<Error | null>(null);
	let delayTimer: NodeJS.Timeout;
	let timeoutTimer: NodeJS.Timeout;

	const load = async () => {
		loading = true;
		error = null;

		// Show loading component after delay
		if (options.delay) {
			delayTimer = setTimeout(() => {
				if (loading && options.loading) {
					component = options.loading;
				}
			}, options.delay);
		} else if (options.loading) {
			component = options.loading;
		}

		// Set timeout for loading
		if (options.timeout) {
			timeoutTimer = setTimeout(() => {
				if (loading) {
					error = new Error('Component loading timed out');
					loading = false;
					if (options.error) {
						component = options.error;
					}
				}
			}, options.timeout);
		}

		try {
			const module = await options.loader();
			component = module.default;
			loading = false;
		} catch (err) {
			error = err as Error;
			loading = false;
			if (options.error) {
				component = options.error;
			}
		} finally {
			clearTimeout(delayTimer);
			clearTimeout(timeoutTimer);
		}
	};

	onMount(() => {
		load();
		return () => {
			clearTimeout(delayTimer);
			clearTimeout(timeoutTimer);
		};
	});

	return {
		get component() {
			return component;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		reload: load
	};
}

// Preload component for critical paths
export async function preloadComponent(loader: () => Promise<any>) {
	try {
		await loader();
	} catch (err) {
		console.error('Failed to preload component:', err);
	}
}

// Intersection Observer for lazy loading
export function lazyLoadOnVisible(node: HTMLElement, loader: () => Promise<void>) {
	let loaded = false;

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting && !loaded) {
					loaded = true;
					loader();
					observer.disconnect();
				}
			});
		},
		{
			rootMargin: '50px' // Start loading 50px before visible
		}
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
