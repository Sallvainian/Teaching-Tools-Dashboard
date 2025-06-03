<script lang="ts">
  /**
   * KeyedList component for optimized list rendering
   * 
   * This component ensures that each item in a list has a unique key,
   * which helps Svelte's diffing algorithm efficiently update the DOM
   * when the list changes.
   */
  import { dev } from '$app/environment';

  // The array of items to render
  export let items: unknown[] = [];

  // Function to get a unique key for each item
  export let getKey: (item: unknown, index: number) => string | number = (_, index) => index;

  // Optional CSS class for the list container
  export let className: string = '';

  // Optional CSS class for each list item
  export let itemClassName: string = '';

  // Optional tag for the list container (ul, ol, div, etc.)
  export let tag: 'ul' | 'ol' | 'div' = 'div';

  // Optional tag for each list item (li, div, etc.)
  export let itemTag: 'li' | 'div' = tag === 'ul' || tag === 'ol' ? 'li' : 'div';

  // Track keys for debugging
  let keys: (string | number)[] = [];
  $: keys = items.map(getKey);

  // Check for duplicate keys in development mode
  $: {
    if (dev) {
      const keySet = new Set(keys);
      if (keySet.size !== keys.length) {
        console.warn('KeyedList: Duplicate keys detected. Each item should have a unique key.');
      }
    }
  }
</script>

{#if tag === 'ul'}
  <ul class={className}>
    {#each items as item, index (getKey(item, index))}
      <li class={itemClassName}>
        <slot {item} {index}></slot>
      </li>
    {/each}
  </ul>
{:else if tag === 'ol'}
  <ol class={className}>
    {#each items as item, index (getKey(item, index))}
      <li class={itemClassName}>
        <slot {item} {index}></slot>
      </li>
    {/each}
  </ol>
{:else}
  <div class={className}>
    {#each items as item, index (getKey(item, index))}
      {#if itemTag === 'li'}
        <li class={itemClassName}>
          <slot {item} {index}></slot>
        </li>
      {:else}
        <div class={itemClassName}>
          <slot {item} {index}></slot>
        </div>
      {/if}
    {/each}
  </div>
{/if}
