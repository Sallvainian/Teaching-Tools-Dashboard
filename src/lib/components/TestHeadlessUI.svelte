<script lang="ts">
  // A simple component that showcases a dropdown menu
  // This is a placeholder since we don't have @headlessui installed yet
  let isOpen = false;
  
  function toggleMenu() {
    isOpen = !isOpen;
  }
</script>

<div class="relative">
  <button 
    type="button"
    class="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    on:click={toggleMenu}
  >
    Menu Options
    <svg class="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
    </svg>
  </button>

  {#if isOpen}
    <div 
      class="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
    >
      <div class="py-1" role="menu" aria-orientation="vertical">
        <a 
          href="#" 
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" 
          role="menuitem"
        >
          Account settings
        </a>
        <a 
          href="#" 
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" 
          role="menuitem"
        >
          Support
        </a>
        <a 
          href="#" 
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white" 
          role="menuitem"
        >
          License
        </a>
        <button
          type="button"
          class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
          role="menuitem"
        >
          Sign out
        </button>
      </div>
    </div>
  {/if}
</div>