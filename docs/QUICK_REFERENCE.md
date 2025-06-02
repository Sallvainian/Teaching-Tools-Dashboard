# Teacher Dashboard Quick Reference Guide

## 🚀 Getting Started

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables
Create a `.env` file:
```env
PUBLIC_SUPABASE_URL=your-supabase-url
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🗂️ Key File Locations

### Core Configuration
- `src/lib/supabaseClient.ts` - Supabase client setup
- `src/app.d.ts` - TypeScript global types
- `tailwind.config.ts` - Tailwind/DaisyUI config

### Authentication
- `src/lib/stores/auth.ts` - Auth state management
- `src/lib/components/auth/` - Auth UI components

### Data Management
- `src/lib/services/supabaseService.ts` - Data service layer
- `src/lib/stores/` - Feature-specific stores
- `src/lib/types/` - TypeScript interfaces

### UI Components
- `src/lib/components/` - Reusable components
- `src/routes/+layout.svelte` - Main layout
- `src/app.css` - Global styles

## 📊 Common Tasks

### Adding a New Feature

1. **Create Store** (`src/lib/stores/myfeature.ts`):
```typescript
import { writable, derived } from 'svelte/store';
import { supabaseService } from '$lib/services/supabaseService';

function createMyFeatureStore() {
  const items = writable<Item[]>([]);
  
  async function loadItems() {
    const data = await supabaseService.getItems('my_table');
    items.set(data);
  }
  
  async function addItem(item: NewItem) {
    const result = await supabaseService.insertItem('my_table', item);
    if (result) {
      items.update(arr => [...arr, result]);
    }
  }
  
  return {
    subscribe: items.subscribe,
    loadItems,
    addItem
  };
}

export const myFeatureStore = createMyFeatureStore();
```

2. **Create Component** (`src/lib/components/MyFeature.svelte`):
```svelte
<script lang="ts">
  import { myFeatureStore } from '$lib/stores/myfeature';
  
  const { loadItems, addItem } = myFeatureStore;
  
  onMount(() => {
    loadItems();
  });
</script>

<div>
  {#each $myFeatureStore as item}
    <div>{item.name}</div>
  {/each}
</div>
```

3. **Create Route** (`src/routes/myfeature/+page.svelte`):
```svelte
<script lang="ts">
  import MyFeature from '$lib/components/MyFeature.svelte';
</script>

<h1>My Feature</h1>
<MyFeature />
```

### Working with Supabase

#### Query Data
```typescript
// Get all items
const items = await supabaseService.getItems('table_name');

// Get item by ID
const item = await supabaseService.getItemById('table_name', 'id');

// Get with filters
const filtered = await supabaseService.getItems('table_name', {
  filters: { status: 'active' }
});
```

#### Insert Data
```typescript
const newItem = await supabaseService.insertItem('table_name', {
  name: 'New Item',
  description: 'Description'
});
```

#### Update Data
```typescript
const updated = await supabaseService.updateItem('table_name', 'id', {
  name: 'Updated Name'
});
```

#### Delete Data
```typescript
const success = await supabaseService.deleteItem('table_name', 'id');
```

### Authentication

#### Check Auth Status
```typescript
import { isAuthenticated, user } from '$lib/stores/auth';

// In component
$: console.log('Authenticated:', $isAuthenticated);
$: console.log('Current user:', $user);
```

#### Sign In
```typescript
import { authStore } from '$lib/stores/auth';

await authStore.signIn(email, password);
```

#### Sign Out
```typescript
await authStore.signOut();
```

## 🎨 Styling Guide

### Color Palette
```css
/* Dark theme colors */
--dark-bg: #121212;        /* Main background */
--dark-surface: #0A0A0A;   /* Sidebar background */
--dark-card: #1E1E1E;      /* Card backgrounds */
--dark-accent: #2A2A2A;    /* Hover states */
--dark-purple: #404040;    /* Accent color */
--dark-highlight: #E0E0E0; /* Primary text */
--dark-muted: #6E6E6E;     /* Secondary text */
--dark-border: #333333;    /* Borders */
```

### Component Classes
```svelte
<!-- Card -->
<div class="bg-dark-card rounded-xl p-6 border border-dark-border">
  <!-- content -->
</div>

<!-- Button -->
<button class="bg-dark-purple text-white px-4 py-2 rounded-lg hover:bg-dark-accent">
  Click me
</button>

<!-- Input -->
<input class="bg-dark-surface border border-dark-border rounded px-3 py-2 text-white" />
```

## 🔧 Common Patterns

### Loading State
```svelte
<script lang="ts">
  let loading = $state(false);
  
  async function handleAction() {
    loading = true;
    try {
      await performAction();
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <LoadingBounce />
{:else}
  <Content />
{/if}
```

### Error Handling
```svelte
<script lang="ts">
  let error = $state('');
  
  async function handleSubmit() {
    error = '';
    try {
      await submitForm();
    } catch (err) {
      error = err.message || 'An error occurred';
    }
  }
</script>

{#if error}
  <div class="alert alert-error">{error}</div>
{/if}
```

### Protected Routes
```svelte
<!-- In +layout.svelte -->
{#if $isAuthenticated}
  {@render children?.()}
{:else}
  <Redirect to="/auth/login" />
{/if}
```

### Form Handling
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  
  let loading = $state(false);
  
  function handleSubmit() {
    loading = true;
    return async ({ update }) => {
      await update();
      loading = false;
    };
  }
</script>

<form method="POST" use:enhance={handleSubmit}>
  <input name="field" required />
  <button disabled={loading}>Submit</button>
</form>
```

## 📋 Debugging Tips

### Check Supabase Connection
```typescript
// In browser console
const { supabase } = await import('$lib/supabaseClient');
const { data, error } = await supabase.from('students').select().limit(1);
console.log({ data, error });
```

### Inspect Store State
```svelte
<script>
  import { gradebookStore } from '$lib/stores/gradebook';
  
  $: console.log('Current state:', $gradebookStore);
</script>
```

### Toggle Storage Mode
```typescript
// Switch to localStorage only
gradebookStore.setUseSupabase(false);

// Switch back to Supabase
gradebookStore.setUseSupabase(true);
```

### Check Auth State
```typescript
import { authStore } from '$lib/stores/auth';
$: console.log('Auth state:', $authStore);
```

## 🚨 Common Issues

### Supabase Connection Failed
1. Check `.env` file has correct credentials
2. Verify Supabase project is active
3. Check browser console for errors
4. Try localStorage mode as fallback

### Auth State Not Persisting
1. Check `persistSession: true` in client config
2. Clear browser storage and retry
3. Check for auth state listener setup

### Data Not Loading
1. Check network tab for API calls
2. Verify RLS policies in Supabase
3. Check store initialization
4. Try manual `loadAllData()` call

### Type Errors
1. Run `npm run check` to verify types
2. Restart TypeScript server in VS Code
3. Check imports are correct

## 📞 Support Resources

- **Documentation**: `/docs/` folder
- **Supabase Docs**: https://supabase.com/docs
- **SvelteKit Docs**: https://kit.svelte.dev/docs
- **AG-Grid Docs**: https://www.ag-grid.com/
- **Tailwind Docs**: https://tailwindcss.com/docs
- **DaisyUI Docs**: https://daisyui.com/