import { describe, it, expect } from 'vitest';
import { debounce, throttle, memoize } from '../performanceOptimized';

describe('Performance Utilities', () => {
	describe('debounce', () => {
		it('should be a function', () => {
			expect(typeof debounce).toBe('function');
		});

		it('should return a function', () => {
			const mockFn = () => {};
			const debounced = debounce(mockFn, 100);
			expect(typeof debounced).toBe('function');
		});
	});

	describe('throttle', () => {
		it('should be a function', () => {
			expect(typeof throttle).toBe('function');
		});

		it('should return a function', () => {
			const mockFn = () => {};
			const throttled = throttle(mockFn, 100);
			expect(typeof throttled).toBe('function');
		});
	});

	describe('memoize', () => {
		it('should cache function results', () => {
			let callCount = 0;
			const expensiveFn = (n: number) => {
				callCount++;
				return n * 2;
			};

			const memoized = memoize(expensiveFn as (...args: unknown[]) => unknown) as (n: number) => number;

			expect(memoized(5)).toBe(10);
			expect(memoized(5)).toBe(10);
			expect(callCount).toBe(1); // Should only be called once
		});
	});
});
