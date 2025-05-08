# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a "Teacher Dashboard" web application built with SvelteKit. It provides various tools for educators including:

- A gradebook for tracking student assignments and grades
- A lesson planner for organizing teaching materials
- A ClassDojo remake for classroom behavior management
- A dashboard overview for quick access to important information

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
- **TailwindCSS**: For utility-based styling
- **Dark/Light Theme Support**: Theme toggle with local storage persistence

### State Management

The application uses Svelte stores for state management. Core stores include:

- **gradebookStore**: Manages gradebook data with these main entities:
  - Students (global roster)
  - Categories (classes/subjects)
  - Assignments
  - Grades

The gradebook store provides:
- CRUD operations for all entities
- Derived stores for calculated/filtered data
- Methods for calculating student grades

### Routing Structure

- `/` - Home page with student roster management
- `/dashboard` - Overview dashboard
- `/gradebook` - Grade management interface
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
  let count = $state(0);              // Basic reactive state
  let user = $state({ name: 'John' }); // Deep reactive state (objects/arrays)
  let items = $state.raw([1, 2, 3]);   // Non-deep reactive state
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
  let { name, count }: { name: string, count: number } = $props();
  
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
<script>
  // Component logic
</script>

<script module>
  // Module-level logic (runs once)
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

### Common Gotchas

1. Destructuring reactive state breaks reactivity
2. Don't mutate other components' state
3. Async code in effects requires special handling
4. Props reassignment is temporary and will be reset by parent updates
5. Snippets are lexically scoped like functions

# General Overview/Extra Context
# 🚀 SvelteKit Gradebook Migration – Project Overview

## 🧩 Project Objective

Migrate an existing Nuxt/Vue-based “Dashboard Master Module” into a fully modern, desktop-only **[SvelteKit](https://kit.svelte.dev/)** web application using **[TypeScript](https://www.typescriptlang.org/)**, **[TailwindCSS](https://tailwindcss.com/)**, and **[Svelte Stores](https://svelte.dev/docs/svelte-store)**, while retaining original functionality and improving UI/UX with dark mode and modular architecture.

---

## ✅ Work Completed

### 🛠️ 1. Project Initialization

- Scaffolded new SvelteKit app:
  ```bash
  pnpm create svelte@latest . -- --template minimal --typescript
  ```
- Installed and configured:
  - **TailwindCSS** (`darkMode: 'class'`)
  - **[Prettier](https://prettier.io/)** for formatting
  - **[ESLint](https://eslint.org/)** for code quality

---

### 🗂️ 2. File Structure & Routing Migration

- Converted Nuxt pages into SvelteKit routes using `src/routes/`:
  - `/dashboard` → Central navigation hub
  - `/gradebook` → Fully implemented
  - `/lesson-planner`, `/class-dojo-remake`, `/test` → Placeholder routes
- All pages follow the `+page.svelte` routing convention.

---

### 🌌 3. Global Layout & Theming

- Implemented `src/routes/+layout.svelte`:
  - Top nav bar with links to modules
  - Footer and page container
  - **Dark mode toggle** using `class="dark"` on `<html>`
- Dark mode:
  - Toggle button (☀️ / 🌙)
  - Style saved in `localStorage`
  - Tailwind dark mode variants via `dark:` prefix

---

### 🧭 4. Dashboard Page

- Modern UI built using Tailwind grid layout
- Cards link to:
  - Gradebook
  - Lesson Planner
  - Class Dojo Remake
  - Test Module
- Icons added via **[@steeze-ui/heroicons](https://www.npmjs.com/package/@steeze-ui/heroicons)** (based on [Heroicons](https://heroicons.com/))
- Fully responsive and styled for dark mode

---

### 📚 5. Gradebook Store & Types

- Store: `src/lib/stores/gradebook.ts`
  - Built using `writable`, `derived`, `get`, and `nanoid`
- Types: `src/lib/types/gradebook.ts`
  - `Student`, `Category`, `Assignment`, `Grade`
- Store supports:
  - Global student list
  - Category creation
  - Student-category assignments
  - Assignment creation
  - Grade recording
  - Average grade calculation

---

### 🧮 6. Gradebook UI (PowerSchool-Inspired)

- Implemented in `/gradebook/+page.svelte`
- Features:
  - Dropdown for selecting category
  - Form for adding assignment (name + max points)
  - Dynamic table:
    - Rows = students
    - Columns = assignments
    - Inline grade inputs
    - Real-time average calculation
- All logic wired directly into the store

---

### 🌙 7. Dark Mode Toggle

- Global theme toggle added to layout nav
- Tailwind `dark:` class applied
- Setting persisted using `localStorage`
- Automatically applies on mount

---

## 🔜 Next Steps

1. **Add gradebook state persistence** via `localStorage`
2. **Port remaining Vue pages**:
   - Lesson Planner
   - Class Dojo Remake
   - Test Module
3. Optional:
   - Print/export functionality
   - Unit/E2E tests via [Vitest](https://vitest.dev/) or [Playwright](https://playwright.dev/)
   - Better validation and form feedback

---

## 📁 Folder Structure (Key Files)

```
src/
├── lib/
│   ├── stores/gradebook.ts
│   └── types/gradebook.ts
├── routes/
│   ├── +layout.svelte
│   ├── dashboard/+page.svelte
│   ├── gradebook/+page.svelte
│   ├── lesson-planner/+page.svelte
│   ├── class-dojo-remake/+page.svelte
│   └── test/+page.svelte
```

---

## 🔗 Documentation References

- [SvelteKit](https://kit.svelte.dev/docs)
- [Svelte Stores](https://svelte.dev/docs/svelte-store)
- [TailwindCSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [ESLint](https://eslint.org/docs/latest/)
- [Prettier](https://prettier.io/docs/en/index.html)
- [Heroicons](https://heroicons.com/)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

---

## 👤 Developer Notes

- This app is intended for **internal desktop use only**
- Emphasis on modularity, performance, and clean dark UI


