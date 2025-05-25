<script lang="ts">
  import { onMount } from 'svelte';
  import { Sun, Moon } from 'lucide-svelte';

  let isDarkMode = $state(false);
  let isClient = $state(false);

  onMount(() => {
    isClient = true;
    
    // Check localStorage for user preference
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme) {
      isDarkMode = storedTheme === 'dark';
    } else {
      // If no stored preference, use OS preference
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    applyTheme(isDarkMode);
    
    // Listen for OS theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only apply if user hasn't explicitly chosen a theme
      if (!localStorage.getItem('theme')) {
        isDarkMode = e.matches;
        applyTheme(isDarkMode);
      }
    });
  });

  function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme(isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }

  function applyTheme(dark: boolean) {
    if (!isClient) return;
    
    // Apply for Tailwind
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply for DaisyUI
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
</script>

<button
  onclick={toggleTheme}
  class="p-2 rounded-full hover:bg-accent transition-colors dark:text-highlight"
  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {#if isDarkMode}
    <Sun class="w-5 h-5" />
  {:else}
    <Moon class="w-5 h-5" />
  {/if}
</button>
