import { browser } from '$app/environment';

// Web Vitals monitoring
export interface Metric {
	name: string;
	value: number;
	rating: 'good' | 'needs-improvement' | 'poor';
	delta: number;
	id: string;
}

// Report metrics to analytics service
function sendToAnalytics(metric: Metric) {
	// Send to your analytics endpoint
	if (browser && (window as any).gtag) {
		(window as any).gtag('event', metric.name, {
			value: Math.round(metric.value),
			metric_rating: metric.rating,
			metric_delta: Math.round(metric.delta),
			non_interaction: true
		});
	}

	// Log in development
	if (import.meta.env.DEV) {
		console.log(`[Performance] ${metric.name}:`, metric.value, metric.rating);
	}
}

// Initialize Web Vitals monitoring
export async function initWebVitals() {
	if (!browser) return;

	try {
		const { onCLS, onINP, onFCP, onLCP, onTTFB } = await import('web-vitals');

		onCLS(sendToAnalytics);
		onINP(sendToAnalytics);
		onFCP(sendToAnalytics);
		onLCP(sendToAnalytics);
		onTTFB(sendToAnalytics);
	} catch (error) {
		console.error('Failed to load Web Vitals:', error);
	}
}

// Performance observer for custom metrics
export function measurePerformance(name: string, startMark?: string) {
	if (!browser || !window.performance) return;

	const endMark = `${name}-end`;
	performance.mark(endMark);

	if (startMark) {
		try {
			performance.measure(name, startMark, endMark);
			const measure = performance.getEntriesByName(name)[0];

			if (measure) {
				sendToAnalytics({
					name,
					value: measure.duration,
					rating:
						measure.duration < 1000
							? 'good'
							: measure.duration < 3000
								? 'needs-improvement'
								: 'poor',
					delta: 0,
					id: crypto.randomUUID()
				});
			}
		} catch (error) {
			// Silently ignore missing performance marks
			console.warn(`Performance mark '${startMark}' not found for measurement '${name}'`);
		}
	}

	return endMark;
}

// Resource timing analysis
export function analyzeResourceTiming() {
	if (!browser || !window.performance) return;

	const resources = performance.getEntriesByType('resource');
	const summary = {
		total: resources.length,
		images: 0,
		scripts: 0,
		stylesheets: 0,
		fonts: 0,
		totalSize: 0,
		totalDuration: 0
	};

	resources.forEach((resource) => {
		const res = resource as PerformanceResourceTiming;
		summary.totalDuration += res.duration;

		if (res.transferSize) {
			summary.totalSize += res.transferSize;
		}

		if (res.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
			summary.images++;
		} else if (res.name.match(/\.(js|mjs)$/i)) {
			summary.scripts++;
		} else if (res.name.match(/\.css$/i)) {
			summary.stylesheets++;
		} else if (res.name.match(/\.(woff|woff2|ttf|otf)$/i)) {
			summary.fonts++;
		}
	});

	return summary;
}

// Memory usage monitoring
export function getMemoryUsage() {
	if (!browser || !('memory' in performance)) return null;

	const memory = (performance as any).memory;
	return {
		usedJSHeapSize: memory.usedJSHeapSize,
		totalJSHeapSize: memory.totalJSHeapSize,
		jsHeapSizeLimit: memory.jsHeapSizeLimit,
		percentUsed: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
	};
}

// FPS monitoring
export function createFPSMonitor() {
	let fps = 0;
	let lastTime = performance.now();
	let frame = 0;
	let animationId: number;

	function tick() {
		frame++;
		const currentTime = performance.now();

		if (currentTime >= lastTime + 1000) {
			fps = Math.round((frame * 1000) / (currentTime - lastTime));
			frame = 0;
			lastTime = currentTime;
		}

		animationId = requestAnimationFrame(tick);
	}

	return {
		start() {
			if (browser) {
				tick();
			}
		},
		stop() {
			if (browser && animationId) {
				cancelAnimationFrame(animationId);
			}
		},
		getFPS() {
			return fps;
		}
	};
}

// Debounce for performance-sensitive operations
export function debounce<T extends (...args: any[]) => any>(
	func: T,
	wait: number
): (...args: Parameters<T>) => void {
	let timeout: NodeJS.Timeout;

	return function executedFunction(...args: Parameters<T>) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};

		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
}

// Throttle for rate-limiting
export function throttle<T extends (...args: any[]) => any>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle: boolean;

	return function executedFunction(this: any, ...args: Parameters<T>) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

// Request idle callback wrapper
export function whenIdle(callback: () => void, timeout = 1000) {
	if (browser && 'requestIdleCallback' in window) {
		requestIdleCallback(callback, { timeout });
	} else {
		setTimeout(callback, 0);
	}
}
