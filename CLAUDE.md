# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Teacher Dashboard - A comprehensive web application for educators to manage classroom activities, built with SvelteKit 5, TypeScript, and Supabase. Features include gradebook management, Jeopardy game creation, student observation logs, and more.

## Essential Commands

```bash
# Development
pnpm install        # Install dependencies
pnpm dev            # Start dev server (http://localhost:5173)
pnpm build          # Build for production
pnpm preview        # Preview production build

# Testing
pnpm test           # Run tests with coverage
pnpm test:unit      # Run tests in watch mode
pnpm test:coverage  # Generate coverage report
pnpm test:coverage:qodana  # Coverage report for Qodana

# Code Quality
pnpm lint           # Run ESLint
pnpm lint:fix       # Fix linting issues
pnpm check          # Run svelte-check
pnpm check:watch    # Run svelte-check in watch mode
pnpm validate       # Run both lint and check

# Maintenance
./archive-xml-reports.sh  # Archive IDE inspection XML files

# Single Test File
pnpm test -- path/to/file.test.ts
```

## GitHub Actions & Claude Code

This repository includes Claude Code GitHub Actions for automated code reviews, PR management, and issue triage:

- **Interactive Assistant**: Tag `@claude` in issues/PRs for AI assistance
- **Automated Code Reviews**: Thorough analysis of all PRs to main branch
- **Issue Triage**: Automatic categorization and priority assessment
- **Documentation Sync**: Updates docs when code changes
- **PR Validation**: Quality checks and compliance verification

See `docs/CLAUDE_GITHUB_ACTIONS_SETUP.md` for complete setup instructions.

## High-Level Architecture

### Dual Storage System
The app features a unique dual-storage architecture:

1. **Primary**: Supabase (PostgreSQL) for authenticated users
2. **Fallback**: localStorage for offline/development mode

This is implemented through `SupabaseService` (`src/lib/services/supabaseService.ts`):
- Automatic fallback to localStorage on Supabase errors
- Synchronization between both storage systems
- Type-safe database operations with full TypeScript support

### State Management Pattern
Stores follow a consistent pattern (`src/lib/stores/`):

```typescript
function createStore() {
  // Primary state atoms
  const items = writable<Item[]>([]);
  const loading = writable(false);
  
  // Derived computed values
  const computed = derived([items], ([$items]) => {...});
  
  // Async operations with service layer
  async function loadData() {
    const data = await supabaseService.getItems('table');
    items.set(data);
  }
  
  return { subscribe: store.subscribe, loadData };
}
```

### Database Schema
Key tables with RLS (Row Level Security):
- `app_users` - User profiles with role (teacher/student)
- `students` - Student records (user_id for multi-tenancy)
- `categories` - Grade categories/classes
- `assignments` - Class assignments
- `grades` - Student grades
- `observation_logs` - Behavior tracking
- `games`, `game_categories`, `questions` - Jeopardy game system

### Authentication Flow
1. Supabase Auth handles login/signup/reset
2. Auth store (`src/lib/stores/auth.ts`) manages state
3. Root layout (`src/routes/+layout.svelte`) provides auth context
4. Protected routes check `$isAuthenticated` derived store

### Component Architecture
- Modern Svelte 5 with runes (`$state`, `$derived`, `$effect`)
- TypeScript for type safety (strict mode)
- Tailwind CSS with custom dark theme
- DaisyUI component library
- AG-Grid for complex data tables
- Handsontable for spreadsheet-like interfaces

## Critical Implementation Details

### Service Layer (`src/lib/services/supabaseService.ts`)
- Generic CRUD operations with TypeScript generics
- Composite key support for junction tables
- Error handling with localStorage fallback
- Type-safe operations using generated database types

### Store Initialization Pattern
Stores use lazy loading to avoid premature Supabase calls:
```typescript
async function ensureDataLoaded() {
  if (get(dataLoaded)) return;
  await loadAllData();
  dataLoaded.set(true);
}
```

### Data Transformation
Database models are transformed to app models:
```typescript
// src/lib/utils/modelConverters.ts
export function dbStudentToAppStudent(dbStudent: Tables<'students'>): Student
```

### Route Protection
Layout handles authentication state:
```svelte
{#if $isAuthenticated}
  {@render children?.()}
{:else}
  <Redirect to="/auth/login" />
{/if}
```

### Feature Modules
The codebase is organized into distinct feature modules:

1. **Authentication** - User signup, login, profile management
   - Components: `LoginForm.svelte`, `SignupForm.svelte`, `ProfileForm.svelte`
   - Store: `auth.ts`

2. **Gradebook** - Class and assignment management
   - Components: `ClassList.svelte`, `StudentRoster.svelte`
   - Store: `gradebook.ts`

3. **Jeopardy** - Interactive game management
   - Routes: `/jeopardy/editor/[gameId]`, `/jeopardy/play/[gameId]`
   - Store: `jeopardy.ts`
   - Components: `GameSharingModal.svelte`, `JeopardyTimer.svelte`

4. **Observation Logs** - Student behavior tracking
   - Components: `LogEntriesList.svelte`, `LogEntriesForm.svelte`, `LogEntriesSearch.svelte`
   - Store: `log-entries.ts`

## Development Guidelines

### Type Safety
- No implicit `any` types
- Define interfaces for all data structures
- Use generated database types from Supabase
- Handle null/undefined cases explicitly

### Component Patterns
```svelte
<script lang="ts">
  import { myStore } from '$lib/stores/myStore';
  
  let loading = $state(false);
  let { data } = $props();
  
  $effect(() => {
    // Side effects here
  });
</script>
```

### Error Handling
- Always catch and display user-friendly errors
- Use loading states for async operations
- Provide fallback UI for error states
- Log errors to console in development

### Performance Considerations
- Dynamic imports for Supabase client
- Lazy loading of store data
- Optimistic UI updates
- AG-Grid virtual scrolling for large datasets

## Environment Configuration

Required `.env` variables:
```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Development uses hardcoded credentials (see `src/lib/supabaseClient.ts`).

## File Structure

```
src/
├── lib/
│   ├── components/     # Reusable components
│   │   ├── auth/       # Authentication components
│   │   └── ...         # Feature-specific components
│   ├── services/       # Data access layer
│   ├── stores/         # State management 
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── routes/             # SvelteKit routes
│   ├── auth/           # Authentication routes
│   ├── dashboard/      # Main dashboard view
│   ├── gradebook/      # Gradebook feature routes
│   ├── jeopardy/       # Jeopardy game routes
│   ├── log-entries/    # Observation log routes
│   └── settings/       # User settings
└── app.css            # Global styles
```

## Testing Strategy

- Unit tests for stores and utilities
- Component tests with Vitest
- E2E testing planned for critical paths
- Coverage reports for CI/CD

## Deployment

- Platform: Vercel
- Build command: `pnpm build`
- Environment variables set in Vercel dashboard
- Node.js version: >=18.x

## Known Issues & Workarounds

1. **Supabase Connection**: Falls back to localStorage if unavailable
2. **Auth State**: May need refresh on session timeout
3. **Type Generation**: Run `supabase gen types` for database changes
4. **Tailwind CSS Custom Properties**: Defined `--tw-empty` in app.css to fix inspection warnings
5. **IDE Inspection Reports**: Use `archive-xml-reports.sh` to manage IntelliJ inspection reports

## Library Dependencies

- **UI Framework**: Svelte 5 with SvelteKit 2
- **Data Grid**: AG-Grid with Svelte 5 wrappers
- **Spreadsheet UI**: Handsontable for Excel-like interfaces
- **Styling**: TailwindCSS with DaisyUI components
- **Backend/Auth**: Supabase for database and authentication
- **Icons**: Heroicons via @steeze-ui/heroicons

## Future Roadmap

1. Student self-registration with join codes
2. Role-based access control (teacher/student views)
3. Email notifications
4. Parent portal
5. Real-time updates using Supabase subscriptions