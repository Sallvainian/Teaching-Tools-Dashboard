# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Teacher Dashboard** - A comprehensive web application for educators to manage classroom activities, students, and educational games. Built with modern web technologies focusing on type safety, performance, and user experience.

### Tech Stack
- **Frontend**: SvelteKit 5, TypeScript (strict mode), Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Data Tables**: AG-Grid Community, Handsontable
- **Testing**: Vitest, Testing Library
- **CI/CD**: GitHub Actions, Vercel

## Code Style Guidelines

### TypeScript Standards
- **Strict Mode**: Always enabled, no implicit `any`
- **Type Imports**: Use `type` keyword for type-only imports
- **Null Handling**: Explicit null/undefined checks required
- **Type Assertions**: Avoid; prefer type guards
- **Return Types**: Explicitly type all function returns

### Svelte 5 Patterns
```typescript
// CORRECT: Use modern Svelte 5 runes
let count = $state(0);
let doubled = $derived(count * 2);
let { data, onchange } = $props<{ data: Item[], onchange?: (item: Item) => void }>();

// INCORRECT: Don't use old Svelte 4 patterns
export let data; // ❌ Use $props instead
$: doubled = count * 2; // ❌ Use $derived instead
```

### Event Handling
```typescript
// CORRECT: Use callback props
let { onclick } = $props<{ onclick?: () => void }>();

// INCORRECT: Don't use createEventDispatcher
dispatch('click'); // ❌ Use callback props
```

### Component Structure
1. Imports (grouped by type)
2. Type definitions
3. Props declaration with $props()
4. State with $state()
5. Derived values with $derived()
6. Effects with $effect()
7. Functions
8. Markup

## Review Criteria for PRs

### Must Pass
1. **Type Safety**: No TypeScript errors (run `pnpm check`)
2. **Linting**: ESLint passes (run `pnpm lint`)
3. **Tests**: All tests pass (run `pnpm test`)
4. **Build**: Production build succeeds (run `pnpm build`)

### Code Quality Checks
- [ ] Uses proper Svelte 5 patterns (runes, props)
- [ ] Follows established store patterns
- [ ] Implements proper error handling
- [ ] Includes loading states for async operations
- [ ] Uses correct Tailwind classes from our theme
- [ ] Maintains consistent file organization

### Database Changes
- [ ] Updates TypeScript types if schema changes
- [ ] Includes migration files for schema changes
- [ ] Updates model converters if needed
- [ ] Tests database operations

## Essential Commands

```bash
# Development
pnpm dev            # Start dev server (http://localhost:5173)
pnpm build          # Build for production
pnpm preview        # Preview production build

# Code Quality (MUST RUN BEFORE COMMIT)
pnpm lint           # Run ESLint
pnpm lint:fix       # Auto-fix linting issues
pnpm check          # Run svelte-check for TypeScript
pnpm validate       # Run both lint and check

# Testing
pnpm test           # Run tests with coverage
pnpm test:unit      # Run tests in watch mode
pnpm test -- path/to/file.test.ts  # Test specific file

# Database
supabase gen types typescript --local > src/lib/types/database.ts
```

## Architecture Patterns

### Service Layer Pattern
```typescript
// src/lib/services/supabaseService.ts
class SupabaseService {
  async getItems<T>(table: string): Promise<T[]> {
    try {
      const { data, error } = await supabase.from(table).select();
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error fetching from ${table}:`, error);
      return this.getFromLocalStorage(table) || [];
    }
  }
}
```

### Store Pattern
```typescript
// Consistent store pattern with TypeScript
function createStore() {
  const items = writable<Item[]>([]);
  const loading = writable(false);
  const dataLoaded = writable(false);
  
  async function ensureDataLoaded() {
    if (get(dataLoaded)) return;
    await loadAllData();
    dataLoaded.set(true);
  }
  
  return {
    subscribe: derived([items, loading], ([$items, $loading]) => ({
      items: $items,
      loading: $loading
    })).subscribe,
    ensureDataLoaded
  };
}
```

### Error Handling Pattern
```typescript
try {
  loading.set(true);
  const data = await supabaseService.getItems('table');
  items.set(data);
} catch (error) {
  console.error('Failed to load items:', error);
  // User-friendly error handling
  errorMessage.set('Failed to load data. Please try again.');
} finally {
  loading.set(false);
}
```

## Database Schema

### Key Tables
- `app_users` - User profiles with roles
- `students` - Student records (linked to user_id)
- `categories` - Classes/grade categories
- `assignments` - Class assignments
- `grades` - Student grades
- `log_entries` - Student observation logs (NOT observation_logs)
- `games`, `game_categories`, `questions` - Jeopardy system

### Type Generation
After database changes:
```bash
supabase gen types typescript --local > src/lib/types/database.ts
```

## Testing Guidelines

### Unit Tests
```typescript
// Follow this pattern for store tests
describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should initialize with default state', () => {
    const state = get(authStore);
    expect(state.user).toBeNull();
    expect(state.loading).toBe(true);
  });
});
```

### Component Tests
```typescript
// Use Testing Library with Vitest
import { render, fireEvent } from '@testing-library/svelte';
import Component from './Component.svelte';

test('handles click events', async () => {
  const { getByRole } = render(Component, {
    props: { onclick: vi.fn() }
  });
  
  await fireEvent.click(getByRole('button'));
  expect(onclick).toHaveBeenCalled();
});
```

## Common Pitfalls to Avoid

### ❌ Don't Do This
```typescript
// Don't use any type
let data: any; // ❌

// Don't use old Svelte patterns
export let prop; // ❌
dispatch('event'); // ❌

// Don't ignore errors
await supabase.from('table').select(); // ❌ Handle errors

// Don't use wrong table names
from('observation_logs') // ❌ It's 'log_entries'
```

### ✅ Do This Instead
```typescript
// Use proper types
let data: StudentData; // ✅

// Use Svelte 5 patterns
let { prop } = $props(); // ✅
let { onevent } = $props(); // ✅

// Handle errors properly
const { data, error } = await supabase.from('table').select();
if (error) handleError(error); // ✅

// Use correct table names
from('log_entries') // ✅
```

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

### Commit Messages
Follow conventional commits:
```
feat: add student import functionality
fix: correct grade calculation in gradebook
docs: update API documentation
style: fix log entries page styling
refactor: simplify auth store logic
test: add tests for grade calculations
```

## Environment Setup

### Required Environment Variables
```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Local Development
The project includes hardcoded development credentials in `src/lib/supabaseClient.ts` for local development only.

## Debugging Tips

1. **TypeScript Errors**: Run `pnpm check` to see all TS errors
2. **Component State**: Use Svelte DevTools browser extension
3. **Database Issues**: Check Supabase dashboard logs
4. **Build Errors**: Check `pnpm build` output carefully
5. **Test Failures**: Run `pnpm test -- --reporter=verbose`

## Performance Guidelines

1. **Lazy Loading**: Use dynamic imports for heavy components
2. **Virtual Scrolling**: AG-Grid handles this automatically
3. **Image Optimization**: Use appropriate formats and sizes
4. **Bundle Size**: Monitor with `pnpm build --analyze`
5. **State Updates**: Batch updates when possible

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use environment variables** for sensitive data
3. **Validate user input** on both client and server
4. **Use RLS policies** in Supabase for data access
5. **Sanitize HTML** when displaying user content

## When Working on This Codebase

1. **Start with**: `pnpm install && pnpm dev`
2. **Before committing**: `pnpm validate`
3. **Update types after DB changes**: `supabase gen types`
4. **Check your work**: `pnpm build && pnpm preview`
5. **Write tests**: Especially for stores and utilities

## Need Help?

- **Supabase Issues**: Check connection and RLS policies
- **TypeScript Errors**: Ensure types are properly imported
- **Svelte Warnings**: Usually about accessibility or unused CSS
- **Build Failures**: Clear `.svelte-kit` and `node_modules`

Remember: This is a production application for educators. Code quality, type safety, and user experience are paramount.