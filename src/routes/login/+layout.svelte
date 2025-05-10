<script lang="ts">
  import '../../app.css';
  import '@fontsource/inter/400.css';
  import '@fontsource/inter/500.css';
  import '@fontsource/inter/600.css';
  import { onMount } from 'svelte';
  
  // Always use dark mode
  onMount(() => {
    document.documentElement.classList.add('dark');
  });
</script>

<div class="min-h-screen bg-dark-bg text-gray-100">
  <slot />
</div>

<style>
  :global(body) {
    background-color: #121212;
  }
</style>