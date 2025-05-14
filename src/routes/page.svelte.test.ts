import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

// Mock the $app/navigation module
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

describe('/+page.svelte', () => {
  test('should render h1', () => {
    try {
      render(Page);
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    } catch (error) {
      console.error('Error rendering page:', error);
      throw error;
    }
  });
});
