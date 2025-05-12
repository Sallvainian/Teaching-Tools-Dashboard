# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a "Teacher Dashboard" web application built with SvelteKit 5. It provides various tools for educators including:

- A gradebook for tracking student assignments and grades
- A Jeopardy game maker for creating interactive classroom review games
- A lesson planner for organizing teaching materials
- A ClassDojo remake for classroom behavior management
- A dashboard overview for quick access to important information

The application features a modern, dark-themed UI with responsive components and persistent storage.

## Command Reference

```bash
# Development
pnpm install        # Install dependencies
pnpm dev            # Start development server
pnpm build          # Build for production
pnpm preview        # Preview production build

# Testing
pnpm test           # Run all tests
pnpm test:unit      # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage

# Code Quality
pnpm lint           # Lint code
pnpm format         # Format code
pnpm check          # Type check
```

## Core Architecture

### Technology Stack

- **SvelteKit 5**: Modern framework with file-based routing
- **TypeScript**: For type safety (strict mode enabled)
- **TailwindCSS**: For utility-based styling with custom dark theme
- **localStorage**: For client-side data persistence
- **AG Grid**: For data grid capabilities
- **Vitest**: For testing
- **Qodana**: For code quality analysis

### State Management & Data Flow

The application uses Svelte 5 stores for state management:

- **gradebookStore**: Students, categories, assignments, grades
- **jeopardyStore**: Games, categories, questions, teams

All stores provide CRUD operations, derived stores, calculation methods, and localStorage persistence.

### Routing Structure

- `/` - Home page
- `/dashboard` - Overview dashboard
- `/gradebook` - Grade management
- `/jeopardy` - Game creation and play
- `/lesson-planner` - Lesson planning
- `/class-dojo-remake` - Classroom behavior management

## Svelte 5 Concepts (Quick Reference)

### Key Runes

- **$state()**: Reactive state (`let count = $state(0)`)
- **$derived()**: Computed values (`let doubled = $derived(count * 2)`)
- **$effect()**: Side effects (for DOM updates, API calls)
- **$props()**: Component props
- **$bindable()**: Two-way binding support

### Component Patterns

- Store reactive business logic in `.svelte.ts` files
- Use `$state()` for component-owned state
- Use `$props()` to receive data from parents
- Mutate only state objects that you own
- Use temporary reassignment of derived values for optimistic UI

## Focus Areas & Best Practices

- **Build Optimization**: Vercel deployment
- **Feature Development**: Educational modules
- **Accessibility**: Screen reader support, keyboard navigation
- **Visual Design**: Professional dark theme UI
- **Code Quality**: TypeScript best practices

Always:
- Use strong typing with no implicit `any` types
- Handle potential null/undefined cases
- Define interfaces for complex data structures
- Use proper ARIA attributes
- Associate form labels with inputs

## AG Grid Integration

```typescript
// Module Registry
import { ModuleRegistry } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
ModuleRegistry.registerModules([ClientSideRowModelModule]);

// Component Usage
import AgGridSvelte from 'ag-grid-svelte5';
import type { GridOptions } from '@ag-grid-community/core';

const gridOptions: GridOptions = {
  rowSelection: { type: 'multiple', enableClickSelection: true },
  defaultColDef: {
    sortable: true,
    filter: true,
    enableCellChangeFlash: true,
  },
};
```

## Documentation References

- [SvelteKit](https://kit.svelte.dev/docs)
- [Svelte 5 Documentation](https://svelte-5-preview.vercel.app/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [AG Grid](https://www.ag-grid.com/javascript-data-grid/)
- [Vitest](https://vitest.dev/guide/)