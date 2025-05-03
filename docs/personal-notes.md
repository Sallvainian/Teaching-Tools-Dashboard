# My Dashboard - Personal Teaching Tools

This document contains personal notes and documentation for my Nuxt 3 teaching dashboard. It serves as a centralized hub for accessing and managing all my teaching tools.

## Table of Contents

- [Project Overview](#project-overview)
- [Setup and Installation](#setup-and-installation)
- [Common Commands](#common-commands)
- [How to Add a New Tool](#how-to-add-a-new-tool)
- [Development Guidelines](#development-guidelines)
- [Theme Customization](#theme-customization)
- [Deployment](#deployment)

## Project Overview

My Dashboard is a private, single-user application that provides quick access to various teaching tools I use regularly. It's built with Nuxt 3, TypeScript, Tailwind CSS, and @nuxt/ui components.

The dashboard includes:

- **Centralized dashboard** for accessing all teaching tools
- **State persistence** of user preferences and last used tool
- **Theme support** with light/dark mode toggle
- **Responsive design** that works on all devices
- **TypeScript** for improved code quality and developer experience

Current tools include:

- **Lesson Planner** - Create and manage lesson plans
- **Gradebook** - Track student grades and assignments
- **ClassDojo Remake** - Manage student behavior and rewards

## Setup and Installation

### Prerequisites

- Node.js (18.x or later)
- npm or yarn

### Installation Steps

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd nuxtjs-boilerplate-main
   ```

2. Install dependencies
   ```bash
   npm install
   # or 
   yarn install
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser at `http://localhost:3000` to see the dashboard

## Common Commands

| Command             | Description                                            |
|---------------------|--------------------------------------------------------|
| `npm run dev`       | Start development server                               |
| `npm run build`     | Build the application for production                   |
| `npm run generate`  | Generate static version of the application             |
| `npm run preview`   | Preview the built application locally                  |
| `npm run lint`      | Run ESLint to check and fix code issues                |
| `npm run format`    | Run Prettier to format code                            |
| `npm run test`      | Run tests with Vitest                                  |
| `npm run test:coverage` | Run tests with coverage report                     |

## How to Add a New Tool

To add a new tool to the dashboard, follow these steps:

### 1. Create a New Page

Create a new file in the `pages` directory with the name of your tool:

```vue
<!-- pages/new-tool-name.vue -->
<template>
  <DashboardLayout>
    <div>
      <div class="flex items-center mb-6">
        <UIcon name="i-heroicons-[icon-name]" class="text-3xl text-primary-600 dark:text-primary-400 mr-3" />
        <h1 class="text-3xl font-bold">Your Tool Name</h1>
      </div>
      
      <!-- Your tool content goes here -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Tool Section</h2>
        </template>
        
        <p>Tool content goes here...</p>
      </UCard>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { useDashboardStore } from '~/stores/dashboard';

// Get the dashboard store
const dashboardStore = useDashboardStore();

// Update last used tool
onMounted(() => {
  dashboardStore.setLastUsedTool('new-tool-id');
});

// Set page metadata
useHead({
  title: 'Your Tool Name',
  meta: [
    { name: 'description', content: 'Description of your tool' }
  ]
});
</script>
```

### 2. Add the Tool to the Dashboard Store

Open `stores/dashboard.ts` and add your new tool to the cards array:

```typescript
cards: [
  // ... existing tools
  {
    id: 'new-tool-id',
    title: 'Your Tool Name',
    icon: 'i-heroicons-[icon-name]',
    route: '/new-tool-name',
    description: 'Description of your new tool',
  },
],
```

### 3. Testing Your New Tool

After adding the new tool:

1. Ensure it appears on the dashboard page.
2. Test navigation to and from the tool.
3. Verify that the "last used tool" functionality works correctly.
4. Check appearance in both light and dark mode.

## Development Guidelines

### Code Style

- Follow the ESLint and Prettier configurations.
- Use TypeScript interfaces for all data structures.
- Use Vue 3 composition API with `<script setup>` syntax.
- Keep components small and focused on a single responsibility.

### Component Structure

- Place shared components in `components/my-dashboard/`.
- Create tool-specific components in folders like `components/my-dashboard/lesson-planner/`.
- Use TypeScript for props definitions and reactive state.

### State Management

- Use the Pinia store for shared state.
- When adding new state to the dashboard store:
  1. Define TypeScript interfaces for your state.
  2. Add getters and actions as needed.
  3. Consider whether the state should be persisted.

### Accessibility

- Ensure color contrast meets WCAG standards.
- Include proper aria labels on interactive elements.
- Test keyboard navigation for all features.

## Theme Customization

The project uses Tailwind CSS with custom theming for light/dark mode.

### Colors

To customize the theme colors:

1. Edit `tailwind.config.ts`
2. Modify the color palette under `theme.extend.colors`
3. Use the defined colors with Tailwind classes like `text-primary-500`

### Dark Mode

Dark mode is handled through:

- The `@nuxtjs/color-mode` module
- Tailwind's dark mode variant (`dark:`)
- The Pinia store's theme state

## Deployment

The project is configured for deployment to Vercel, but you can use any Nuxt-compatible hosting service.

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set the following build settings:
   - Framework Preset: `Nuxt.js`
   - Build Command: `npm run build` (default)
   - Output Directory: `.output` (default)
3. Add any required environment variables
4. Deploy

### Environment Variables

For production deployments, you may need to set:

- `NUXT_PUBLIC_API_BASE` - Base URL for API calls (if applicable)
- Any other service-specific variables

## Extending and Customizing Further

Feel free to extend the dashboard with:

- Additional tools specific to your teaching needs
- Integration with external APIs for fetching data
- More advanced data persistence options
- Mobile app conversion using Capacitor or similar tools

Remember that this is a personal tool designed for your specific workflow, so customize it to fit your needs!

