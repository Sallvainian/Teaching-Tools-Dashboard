<script lang="ts">
  /**
   * KeyedComponent for optimized component rendering
   * 
   * This component wraps its content in a {#key} block, which forces
   * Svelte to completely destroy and recreate the component when the key changes.
   * This is useful for components that depend on specific props and need to be
   * completely re-rendered when those props change.
   */

  // The key that determines when to re-render the component
  export let key: string | number | boolean | object | null | undefined;

  // Optional CSS class for the component wrapper
  export let className: string = '';

  // Optional tag for the component wrapper (div, section, article, etc.)
  export let tag: 'div' | 'section' | 'article' | 'span' | 'none' = 'div';
</script>

{#key key}
  {#if tag === 'none'}
    <slot></slot>
  {:else if tag === 'section'}
    <section class={className}>
      <slot></slot>
    </section>
  {:else if tag === 'article'}
    <article class={className}>
      <slot></slot>
    </article>
  {:else if tag === 'span'}
    <span class={className}>
      <slot></slot>
    </span>
  {:else}
    <div class={className}>
      <slot></slot>
    </div>
  {/if}
{/key}
