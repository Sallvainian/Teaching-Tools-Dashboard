# Development Guidelines

## Store Management

### Store Creation Rules

- **ALWAYS** use `createStore` from `$lib/stores/storeFactory.ts` for new stores
- **NEVER** create stores using raw `writable()` or `derived()`
- **MUST** register all stores with `storeRegistry` via the factory
- **MUST** implement these methods: `set`, `update`, `reset`, `current`
- **MUST** provide `initialValue` and unique `name` parameters
- **CAN** add `localStorageKey` for persistence, `validator` for validation
- **FORBIDDEN** to create stores without factory pattern

### Store File Structure

- Place all stores in `src/lib/stores/`
- Export stores from `src/lib/stores/index.ts`
- Name store files with lowercase: `chat.ts`, `auth.ts`, `files.ts`

## State Management

### Svelte 5 Runes

- **USE** `$state()` for reactive component state
- **USE** `$derived()` for computed values
- **NEVER** use old Svelte 4 syntax (`let`, `$:`)
- Initialize state variables early to prevent reference errors
- Example: `let loading = $state(false);`

## Database Integration

### Supabase Configuration

- **MUST** check for missing credentials and throw specific error:
```typescript
throw new Error('Missing Supabase credentials. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY environment variables.');
```
- **MUST** check `browser` environment before enabling auth features:
```typescript
auth: {
  autoRefreshToken: browser,
  persistSession: browser,
  detectSessionInUrl: browser
}
```
- Import Supabase client from `$lib/supabaseClient`

### Type Definitions

- Database types are in `src/lib/types/database.ts`
- **NEVER** manually edit database types - they are auto-generated
- Use `Database['public']['Tables']['table_name']['Row']` pattern for types
- Place module-specific types in corresponding files: `chat.ts`, `auth.ts`, etc.

### RLS Policy Rules

- **AVOID** circular references between tables
- **USE** direct comparisons: `user_id = auth.uid()`
- **AVOID** nested EXISTS queries that reference the same table
- **TEST** policies with actual queries to prevent infinite recursion

## UI Components

### Required Libraries

- **Icons**: ONLY use `lucide-svelte` - NEVER other icon libraries
- **Time formatting**: ONLY use `date-fns` - NEVER moment.js or others
- **Styling**: TailwindCSS with DaisyUI components
- **Animations**: Use Svelte's built-in transitions (`fade`, `slide`, `flip`)

### Component Patterns

- Place reusable components in `src/lib/components/`
- Use PascalCase for component names: `UserSelectModal.svelte`
- Components expecting in chat module:
  - `UserSelectModal.svelte`
  - `TypingIndicator.svelte`
  - `GifPicker.svelte`
  - `ImagePreviewModal.svelte`

### Custom Directives

- Custom actions go in `src/lib/utils/`
- Example: `clickOutside` directive in `src/lib/utils/clickOutside.ts`

## Routing Structure

### File-based Routing

- **MUST** use `+page.svelte` for route components
- **MUST** use `+layout.svelte` for layouts
- **MUST** use `+page.ts` or `+page.server.ts` for data loading
- Route folders must be lowercase kebab-case

### Module Structure

Teaching Tools modules - maintain this exact structure:
```
src/routes/
├── assignments/
├── auth/
├── calendar/
├── chat/
├── classes/
├── dashboard/
├── files/
├── gradebook/
├── jeopardy/      # Game module
├── scattergories/ # Game module
├── settings/
└── student/
```

## Environment Variables

### Client-side Variables

- **MUST** prefix with `PUBLIC_` for client access
- Example: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`
- Import from `$env/static/public`

### Server-side Variables

- Use `PRIVATE_` prefix or no prefix
- Import from `$env/static/private`
- **NEVER** expose these to client code

## Theming System

### CSS Variables

- Theme colors use CSS variables defined in root
- Variable pattern: `--property-name`
- Access in Tailwind: `var(--property-name)`
- Required theme variables:
  - `--bg-base`, `--bg-gradient`
  - `--card`, `--surface`
  - `--accent`, `--accent-hover`
  - `--purple`, `--purple-light`, `--purple-bg`, `--purple-hover`
  - `--error`, `--error-hover`
  - `--text-base`, `--text-hover`
  - `--highlight`

### Dark Mode

- Controlled via `class` strategy in Tailwind
- Add `dark` class to root element for dark mode

## Build Configuration

### Required Scripts

These npm scripts must work:
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run check` - Type checking
- `npm run lint` - Linting
- `npm run format` - Code formatting
- `npm run test` - Run tests

### Dependencies Version Lock

- **Node.js**: Must be >= 18.x
- **Package Manager**: ONLY npm (not yarn/pnpm)
- Critical versions locked in package.json

## Error Handling

### Supabase Errors

- Check for missing credentials before creating client
- Provide clear error messages mentioning environment variables
- Log warnings for failed localStorage operations

### Component Errors

- Use try-catch for async operations
- Set error state: `error = $state<string | null>(null)`
- Display user-friendly error messages

## Utility Patterns

### Store Helpers

- Place helper functions in `src/lib/utils/storeHelpers.ts`
- Example: `getUser()` function for auth state

### Type Guards

- Create type guard functions for runtime type checking
- Place in module-specific type files

## Testing Requirements

### Test Configuration

- Test runner: Vitest
- Test files: `*.test.ts` pattern
- Coverage reports with `npm run test:coverage`

## Multi-file Coordination

### Type Definition Updates

When modifying database schema:
1. Update Supabase schema
2. Regenerate `src/lib/types/database.ts`
3. Update module-specific types if affected

### Store Registry

When creating new store:
1. Create store file in `src/lib/stores/`
2. Export from `src/lib/stores/index.ts`
3. Store auto-registers via factory

## AI-Specific Rules

### Chat Module Integration

- AI chat functionality in `src/routes/chat/`
- Message types defined in `src/lib/types/chat.ts`
- Real-time updates via Supabase subscriptions
- Typing indicators for AI responses

### API Integration

- **NEVER** expose API keys in client code
- Use server-side routes for AI API calls
- Implement rate limiting per user
- Cache AI responses when appropriate

## Prohibited Actions

### Never Do These

- ❌ Create stores without storeFactory
- ❌ Use moment.js (use date-fns)
- ❌ Use Font Awesome (use lucide-svelte)
- ❌ Edit auto-generated database types
- ❌ Create circular RLS policies
- ❌ Expose PRIVATE_ env vars to client
- ❌ Use Svelte 4 reactive syntax
- ❌ Create routes without +page.svelte
- ❌ Use yarn or pnpm (use npm only)
- ❌ Ignore TypeScript errors
- ❌ Store sensitive data in localStorage without encryption

### Always Do These

- ✅ Check browser environment for Supabase auth
- ✅ Use PUBLIC_ prefix for client env vars
- ✅ Register stores with storeRegistry
- ✅ Use CSS variables for theme colors
- ✅ Test RLS policies for recursion
- ✅ Use enhanced store methods
- ✅ Follow exact module structure
- ✅ Use Svelte 5 runes for state
- ✅ Handle missing Supabase credentials