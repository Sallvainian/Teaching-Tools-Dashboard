# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a "Teacher Dashboard" web application built with SvelteKit 5. It provides various tools for educators including:

- A gradebook for tracking student assignments and grades
- A Jeopardy game maker for creating interactive classroom review games
- A lesson planner for organizing teaching materials
- A ClassDojo remake for classroom behavior management
- A dashboard overview for quick access to important information

The application features a modern, dark-themed UI inspired by the Edu.Link Gradebook design, with responsive components and persistent storage.

## Command Reference

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:unit
```

### Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm check

# Type check in watch mode
pnpm check:watch
```

## Core Architecture

### Frontend Technology Stack

- **SvelteKit 5**: Modern framework with file-based routing
- **TypeScript**: For type safety
- **TailwindCSS**: For utility-based styling with custom dark theme
- **@steeze-ui/heroicons**: Icon library with @steeze-ui/svelte-icon for rendering
- **localStorage**: For client-side data persistence

### State Management

The application uses Svelte 5 stores for state management. Core stores include:

- **gradebookStore**: Manages gradebook data with these main entities:

  - Students (global roster)
  - Categories (classes/subjects)
  - Assignments
  - Grades

- **jeopardyStore**: Manages Jeopardy game data with these main entities:
  - Games (collection of categories and questions)
  - Categories (groups of related questions)
  - Questions (with text, answer, and point value)
  - Teams (with names, scores, and custom colors)

The stores provide:

- CRUD operations for all entities
- Derived stores for calculated/filtered data
- Methods for calculating student grades and game scores
- localStorage persistence

### Routing Structure

- `/` - Home page with login/welcome screen
- `/dashboard` - Overview dashboard with stats and module access
- `/gradebook` - Grade management interface
- `/jeopardy` - Game creation and play interface
- `/lesson-planner` - Lesson planning tools
- `/class-dojo-remake` - Classroom behavior management
- `/test` - Development testing page

### Testing Approach

The project uses Vitest with two separate configurations:

- Client tests (with jsdom environment)
- Server tests (with node environment)

Tests are organized alongside their components with the naming pattern `*.svelte.test.ts`.

## Svelte 5 Concepts

### Runes

Runes are special functions prefixed with `$` that control reactivity in Svelte 5. They replace the reactive statements (`$:`) from previous Svelte versions.

#### `$state` - Reactive State

```svelte
<script>
  let count = $state(0); // Basic reactive state
  let user = $state({ name: 'John' }); // Deep reactive state (objects/arrays)
  let items = $state.raw([1, 2, 3]); // Non-deep reactive state
</script>

<button onclick={() => count++}>
  Clicks: {count}
</button>
```

- Use `$state.snapshot()` to get a non-reactive copy of state
- Avoid mutating state you don't own (passed from parent components)

#### `$derived` - Computed Values

```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);

  // For complex derivations:
  let total = $derived.by(() => {
    // Complex calculation logic
    return result;
  });
</script>
```

- Recalculated when dependencies change
- Dependencies are automatically tracked
- Can be temporarily overridden with assignments

#### `$effect` - Side Effects

```svelte
<script>
  let count = $state(0);

  $effect(() => {
    // Runs after DOM updates when 'count' changes
    console.log('Count changed to', count);

    // Optional teardown function
    return () => {
      // Cleanup code here
    };
  });

  // For pre-DOM-update effects
  $effect.pre(() => {
    // Runs before DOM updates
  });
</script>
```

- Use sparingly, generally for external integrations
- Avoid using for state synchronization (use `$derived` instead)
- Automatically tracks dependencies
- Useful for DOM manipulations, API calls, etc.

#### `$props` - Component Props

```svelte
<script>
  // Destructuring with defaults
  let { name = 'Guest', count = 0 } = $props();

  // With TypeScript
  let { name, count }: { name: string; count: number } = $props();

  // Generate unique IDs for accessibility
  const uid = $props.id();
</script>
```

#### `$bindable` - Two-way Binding Support

```svelte
<script>
  // Makes the value prop bindable from parent
  let { value = $bindable('') } = $props();
</script>

<input bind:value />
```

### Component File Structure

```svelte
<script module>
  // Module-level logic (runs once)
</script>

<script>
  // Component logic
</script>

<!-- Template markup -->

<style>
  /* Component-scoped CSS */
</style>
```

### Template Syntax

#### Control Flow

```svelte
{#if condition}
  <!-- content -->
{:else if otherCondition}
  <!-- content -->
{:else}
  <!-- content -->
{/if}

{#each items as item, index (item.id)}
  <!-- content with item -->
{:else}
  <!-- if array is empty -->
{/each}

{#await promise}
  <!-- loading -->
{:then value}
  <!-- resolved -->
{:catch error}
  <!-- rejected -->
{/await}

{#key value}
  <!-- recreated when value changes -->
{/key}
```

#### Snippets (New in Svelte 5)

```svelte
{#snippet header()}
  <th>Name</th>
  <th>Price</th>
{/snippet}

{#snippet row(item)}
  <td>{item.name}</td>
  <td>{item.price}</td>
{/snippet}

<Table data={items} {header} {row} />

<!-- Or nest snippets inside a component -->
<Table data={items}>
  {#snippet header()}
    <th>Name</th>
    <th>Price</th>
  {/snippet}

  {#snippet row(item)}
    <td>{item.name}</td>
    <td>{item.price}</td>
  {/snippet}
</Table>

<!-- Use snippets with the render tag -->
{@render row(item)}
```

### Component Patterns

1. **Reactive Objects and `.svelte.ts` Files**

   - Store reactive business logic in `.svelte.ts` files
   - Reuse reactive state across components

2. **Passing State**

   - Use `$state()` for component-owned state
   - Use `$props()` to receive data from parents
   - Use `$bindable()` for two-way binding when needed

3. **State Updates**

   - Mutate only state objects that you own
   - Never mutate props unless explicitly `$bindable()`
   - When mutating deep state, the original object is not mutated

4. **Optimistic UI**
   - Temporarily reassign derived values for immediate feedback
   - Revert on errors from async operations

### Best Practices

1. **Prefer `$derived` over `$effect`** for state calculations
2. **Use `$state.raw` for large objects/arrays** that don't need deep reactivity
3. **Avoid infinite loops** by ensuring effects don't trigger themselves
4. **Use snippet patterns** to reduce duplicated template code
5. **Keep components focused** on a single responsibility
6. **Leverage TypeScript** for better type safety and editor support
7. **Always use proper ARIA attributes** for accessibility
8. **Add IDs to form elements** and associate them with their labels

### Recent Updates

1. **Jeopardy Game Feature**:

   - Added a complete Jeopardy game creation and play system
   - Created a game board UI with categories and questions
   - Implemented team management with customizable colors and scoring
   - Added game state persistence with localStorage
   - Designed a dual-mode interface for editing and playing games

2. **Dark Theme Implementation**:

   - Added a custom dark theme inspired by Edu.Link Gradebook design
   - Created a cohesive color scheme with dark backgrounds and accents
   - Added hover effects and visual hierarchy

3. **Icon System Improvements**:

   - Updated from direct icon usage to the Icon component pattern
   - Using `@steeze-ui/svelte-icon` for rendering icons from `@steeze-ui/heroicons`

4. **Accessibility Enhancements**:

   - Fixed anchor href attributes to use proper navigation or javascript:void(0)
   - Added ARIA labels to icon-only buttons
   - Associated form labels with their respective inputs

5. **Data Persistence**:
   - Implemented localStorage for all module data
   - Added functionality to save/load data automatically
   - Created reset options for clearing module data

## Folder Structure (Key Files)

```
src/
├── lib/
│   ├── stores/
│   │   ├── gradebook.ts
│   │   └── jeopardy.ts
│   └── types/
│       ├── gradebook.ts
│       └── jeopardy.ts
├── routes/
│   ├── +layout.svelte
│   ├── dashboard/+page.svelte
│   ├── gradebook/+page.svelte
│   ├── jeopardy/+page.svelte
│   ├── lesson-planner/+page.svelte
│   ├── class-dojo-remake/+page.svelte
│   └── test/+page.svelte
```

## Current Focus Areas

1. **Build Optimization**: Ensuring the application builds correctly with Vercel deployment
2. **Feature Development**: Completing and enhancing educational modules like Jeopardy
3. **Accessibility**: Improving screen reader support and keyboard navigation
4. **Visual Design**: Refining the dark theme UI for a professional educational application
5. **Code Quality**: Adhering to TypeScript best practices and enhancing maintainability

## Known Issues and Solutions

1. **Vercel Deployment**: Resolved by adding proper adapter-vercel and configuration
2. **Icon Import Error**: Fixed by using the proper Icon component from @steeze-ui/svelte-icon
3. **HREF Warnings**: Resolved by replacing "#" with "javascript:void(0)" for non-navigation links
4. **Form Label Issues**: Being addressed by adding proper for/id attributes to form elements
5. **AG Grid Module/Package Conflict**: Fixed by consistently using module approach, ensuring CSS is imported correctly, and updating deprecated grid options

## AG Grid Integration

This project uses [ag-grid-svelte5](https://github.com/JohnMaher1/ag-grid-svelte5) for powerful data grid capabilities.

### AG Grid Setup

1. **Installation**:

   ```bash
   npm install @ag-grid-community/core @ag-grid-community/client-side-row-model @ag-grid-community/styles ag-grid-svelte5
   ```

2. **Module Registry** (in `src/lib/ag-grid-modules.ts`):

   ```typescript
   import { ModuleRegistry } from '@ag-grid-community/core';
   import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

   ModuleRegistry.registerModules([ClientSideRowModelModule]);
   ```

3. **CSS Import** (in `src/routes/+layout.svelte`):

   ```svelte
   import '@ag-grid-community/styles/ag-grid.css'; import
   '@ag-grid-community/styles/ag-theme-material.css';
   ```

4. **Component Usage**:

   ```svelte
   <script>
     import AgGridSvelte from 'ag-grid-svelte5';
     import type { GridOptions } from '@ag-grid-community/core';

     const gridOptions: GridOptions = {
       // Grid configuration...
     };
   </script>

   <AgGridSvelte class="ag-theme-material w-full h-full" {gridOptions} />
   ```

### AG Grid Configuration Notes

- **Module vs Package Approach:** Always use the module approach (`@ag-grid-community/core`) rather than the package approach (`ag-grid-community`). Never mix these approaches.

- **Dark Mode:** Implemented using CSS variables in `app.css` and the `data-ag-theme-mode="dark"` attribute:

  ```css
  :root {
    --ag-background-color: #121212;
    --ag-header-background-color: #1e1e1e;
    --ag-odd-row-background-color: #0a0a0a;
    /* other theme variables... */
  }
  ```

- **Modern Grid Options Syntax** (v32+):

  ```typescript
  const gridOptions: GridOptions = {
    // Use object form of rowSelection (not string)
    rowSelection: { type: 'multiple', enableClickSelection: true },

    // Put enableCellChangeFlash in defaultColDef
    defaultColDef: {
      sortable: true,
      filter: true,
      // Move from root level to defaultColDef as per v31.2+ recommendation
      enableCellChangeFlash: true,
    },

    // Avoid enterprise-only features
    // Do NOT use: cellSelection, enableRangeSelection, enableRangeHandle
  };
  ```

## Code Replacement Preferences

```
CODE_REPLACEMENT_PREFERENCES:
1. When replacing properties, search for the property name followed by colon (e.g., "suppressCellFlash:")
2. Replace the entire property including its value while preserving the original indentation
3. Always verify the replacement by showing a diff of the changes before applying
4. For deprecation warnings, only replace the exact deprecated property, not similar named properties
5. If multiple matches are found, show all occurrences and ask for confirmation before replacing
```

## Documentation References

- [SvelteKit](https://kit.svelte.dev/docs)
- [Svelte 5 Documentation](https://svelte-5-preview.vercel.app/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Heroicons](https://heroicons.com/)
- [@steeze-ui/svelte-icon](https://github.com/steeze-ui/icons)
- [AG Grid](https://www.ag-grid.com/javascript-data-grid/)
- [AG Grid Modules](https://www.ag-grid.com/javascript-data-grid/modules/)
- [AG Grid Styling](https://www.ag-grid.com/javascript-data-grid/global-style-customisation-variables/)
- [AG Grid Column Definitions](https://www.ag-grid.com/javascript-data-grid/column-definitions/)
- [ag-grid-svelte5](https://github.com/JohnMaher1/ag-grid-svelte5)
- [Vitest](https://vitest.dev/guide/)
- [nanoid](https://github.com/ai/nanoid)
- [localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
