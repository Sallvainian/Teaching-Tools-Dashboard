<script lang="ts">
  /**
   * StaticContent component for optimizing SSR
   * 
   * This component renders content that doesn't need interactivity,
   * minimizing client-side JavaScript by marking it as static.
   */
  import { markStatic, isServer } from '$lib/utils/ssr';

  // Whether to render the content only on the server
  export let serverOnly = false;

  // Whether to include minimal client-side JavaScript
  export let minimal = true;

  // CSS class for the container
  export let className = '';

  // Mark the component as static
  const { isStatic: _isStatic } = markStatic();

  // Determine if the component should render
  const shouldRender = !serverOnly || isServer();
</script>

{#if shouldRender}
  {#if minimal}
    <!-- Render with minimal client-side JavaScript -->
    <div class={className}>
      <slot />
    </div>
  {:else}
    <!-- Render with normal hydration -->
    <div class={className}>
      <slot />
    </div>
  {/if}
{/if}

<style>
  /* Add any component-specific styles here */
</style>
