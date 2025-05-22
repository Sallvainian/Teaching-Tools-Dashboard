# Svelte 5 Quick Reference

## Basic Component Structure

```svelte
<script>
  // Logic here
</script>

<!-- Markup here -->

<style>
  /* Scoped CSS here */
</style>
```

## Reactivity

### $state
```svelte
<script>
  let count = $state(0);  // Initialize reactive state
</script>

<button onclick={() => count++}>
  clicks: {count}
</button>
```

### $derived
```svelte
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);  // Computed value
</script>
```

### $effect
```svelte
<script>
  $effect(() => {
    // Runs when dependencies change
    console.log('Count changed:', count);
    
    return () => {
      // Cleanup function (optional)
    };
  });
</script>
```

## Component Props

```svelte
<script>
  // Declare props with defaults
  let { name, greeting = 'Hello' } = $props();
</script>

<!-- Usage in parent -->
<Component name="World" />
```

## TypeScript Support

```svelte
<script lang="ts">
  interface Props {
    name: string;
    greeting?: string;
  }
  
  let { name, greeting = 'Hello' }: Props = $props();
</script>
```

## Template Syntax

### Expressions
```svelte
<p>The value is {expression}</p>
```

### Attributes
```svelte
<a href="page/{page}">Link</a>
<button disabled={!isEnabled}>Button</button>
```

### Control Flow

#### If Blocks
```svelte
{#if condition}
  <p>Shown when true</p>
{:else if otherCondition}
  <p>Alternative</p>
{:else}
  <p>Fallback</p>
{/if}
```

#### Each Blocks
```svelte
{#each items as item, index (item.id)}
  <p>{index}: {item.name}</p>
{:else}
  <p>No items</p>
{/each}
```

#### Await Blocks
```svelte
{#await promise}
  <p>Loading...</p>
{:then value}
  <p>Value: {value}</p>
{:catch error}
  <p>Error: {error.message}</p>
{/await}
```

### Binding

```svelte
<input bind:value={name} />          <!-- Two-way binding -->
<input type="checkbox" bind:checked={active} />
<select bind:value={selected}>
  {#each options as option}
    <option value={option}>{option}</option>
  {/each}
</select>
```

## Snippets (Replacing Slots)

### Basic Snippet
```svelte
<!-- Parent -->
{#snippet header()}
  <h1>Page Title</h1>
{/snippet}

<Layout {header} />

<!-- Child (Layout.svelte) -->
<script>
  let { header } = $props();
</script>

<header>
  {@render header()}
</header>
```

### Snippets with Parameters
```svelte
<!-- Parent -->
{#snippet row(item)}
  <tr>
    <td>{item.name}</td>
    <td>{item.price}</td>
  </tr>
{/snippet}

<Table {row} items={products} />

<!-- Child (Table.svelte) -->
<script>
  let { items, row } = $props();
</script>

<table>
  {#each items as item}
    {@render row(item)}
  {/each}
</table>
```

### Children Snippet
```svelte
<!-- Parent -->
<Card>
  Content goes here
</Card>

<!-- Child (Card.svelte) -->
<script>
  let { children } = $props();
</script>

<div class="card">
  {@render children()}
</div>
```

## Lifecycle Methods

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  
  onMount(() => {
    // Component is mounted to the DOM
    return () => {
      // Optional cleanup function
    };
  });
  
  onDestroy(() => {
    // Component is being removed from the DOM
  });
</script>
```

## Context API

```svelte
<script>
  import { setContext, getContext } from 'svelte';
  
  // In parent component
  setContext('key', { value: 'data' });
  
  // In child component
  const { value } = getContext('key');
</script>
```

## Common Patterns

### Reactive Class Names
```svelte
<div class={{ active: isActive, disabled: !isEnabled }}>
  Conditionally styled div
</div>
```

### Form Handling
```svelte
<script>
  let formData = $state({ name: '', email: '' });
  
  function handleSubmit() {
    // Process form data
    console.log(formData);
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={formData.name} placeholder="Name" />
  <input bind:value={formData.email} placeholder="Email" />
  <button type="submit">Submit</button>
</form>
```

### Migrating from Svelte 4

| Svelte 4 | Svelte 5 |
|----------|----------|
| `let count = 0;` | `let count = $state(0);` |
| `$: doubled = count * 2;` | `let doubled = $derived(count * 2);` |
| `export let prop;` | `let { prop } = $props();` |
| `<slot />` | `{@render children()}` |
| `<slot name="header" />` | `{@render header()}` |

For a comprehensive guide, see the [full documentation](https://svelte.dev/docs).