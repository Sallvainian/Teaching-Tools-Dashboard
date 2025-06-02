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
1. **Type Safety**: No TypeScript errors (run `npm run check`)
2. **Linting**: ESLint passes (run `npm run lint`)
3. **Tests**: All tests pass (run `npm test`)
4. **Build**: Production build succeeds (run `npm run build`)

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
npm run dev         # Start dev server (http://localhost:5173)
npm run build       # Build for production
npm run preview     # Preview production build

# Code Quality (MUST RUN BEFORE COMMIT)
npm run lint        # Run ESLint
npm run lint:fix    # Auto-fix linting issues
npm run check       # Run svelte-check for TypeScript
npm run validate    # Run both lint and check

# Testing
npm test            # Run tests with coverage
npm run test:unit   # Run tests in watch mode
npm test -- path/to/file.test.ts  # Test specific file

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

1. **TypeScript Errors**: Run `npm run check` to see all TS errors
2. **Component State**: Use Svelte DevTools browser extension
3. **Database Issues**: Check Supabase dashboard logs
4. **Build Errors**: Check `npm run build` output carefully
5. **Test Failures**: Run `npm test -- --reporter=verbose`

## Performance Guidelines

1. **Lazy Loading**: Use dynamic imports for heavy components
2. **Virtual Scrolling**: AG-Grid handles this automatically
3. **Image Optimization**: Use appropriate formats and sizes
4. **Bundle Size**: Monitor with `npm run build --analyze`
5. **State Updates**: Batch updates when possible

## Security Best Practices

1. **Never commit secrets** to the repository
2. **Use environment variables** for sensitive data
3. **Validate user input** on both client and server
4. **Use RLS policies** in Supabase for data access
5. **Sanitize HTML** when displaying user content

## When Working on This Codebase

1. **Start with**: `npm install && npm run dev`
2. **Before committing**: `npm run validate`
3. **Update types after DB changes**: `supabase gen types`
4. **Check your work**: `npm run build && npm run preview`
5. **Write tests**: Especially for stores and utilities

## Need Help?

- **Supabase Issues**: Check connection and RLS policies
- **TypeScript Errors**: Ensure types are properly imported
- **Svelte Warnings**: Usually about accessibility or unused CSS
- **Build Failures**: Clear `.svelte-kit` and `node_modules`

Remember: This is a production application for educators. Code quality, type safety, and user experience are paramount.

## Session Memory - January 2025

### Critical Fixes Applied

#### 1. Fixed File Storage System
**Problem**: File upload button was not working
**Root Cause**: Incorrect Svelte 5 event handler syntax
**Fix**: Changed from `onchange={handleFileUpload}` to `onchange={(e) => handleFileUpload(e)}`
**File**: `src/routes/files/+page.svelte`

#### 2. Fixed LogEntriesList.svelte Parsing Error
**Problem**: Component had a parsing error due to duplicate content
**Fix**: Removed orphaned duplicate section at line 285
**File**: `src/lib/components/LogEntriesList.svelte`

#### 3. Fixed All TypeScript Errors (40 total)
**Key Issues Fixed**:
- Catch clause type annotations (changed from `Error` to `any`)
- Added missing auth store methods: `signUpStudent`, `signUpTeacher`, `role`
- Fixed implicit any type errors throughout codebase
- Fixed Handsontable prop types
- Updated Sentry to v8 API (changed from `span.setTag` to `span.setAttribute`)
- Fixed RoleSignupForm return type mismatch

#### 4. Fixed PostCSS @apply Warning
**Problem**: PostCSS @apply directive warning in PDFViewer.svelte
**Fix**: Added `lang="postcss"` to style tag
**File**: `src/lib/components/PDFViewer.svelte`

### Important Learnings

1. **Svelte 5 Event Handlers**: Always use callback syntax for events
   - Wrong: `onchange={handler}`
   - Right: `onchange={(e) => handler(e)}`

2. **TypeScript Catch Clauses**: Must use `any` or `unknown` type
   - Wrong: `catch (error: Error)`
   - Right: `catch (error: any)`

3. **Always Check Before Git Operations**: Never pull/push without checking status first

4. **File Storage Tables**: The correct tables are:
   - `file_folders` - For folder organization
   - `file_metadata` - For file information
   - Storage bucket: `teacher-files`

### Current State
- Zero TypeScript errors
- File upload functionality restored
- All components properly typed
- Sentry integration working with v8 API
- PostCSS properly configured

### Development Workflow Reminders
1. Always run `npm run check` before committing
2. Use `npm run validate` to run both lint and type check
3. Test file uploads after any changes to file-related components
4. Keep TypeScript strict mode enabled
5. IMPORTANT: This project uses npm, NOT pnpm

## Coding Memories

- When using puppeteer, always make the window 1440p