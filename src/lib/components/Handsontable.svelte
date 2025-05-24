<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  // Define props with $props
  let { 
    data = [], 
    colHeaders = true,
    rowHeaders = true,
    height = 400,
    width = '100%',
    licenseKey = 'non-commercial-and-evaluation',
    settings = {}
  } = $props();
  
  // Create Svelte event dispatcher
  const dispatch = createEventDispatcher();
  
  // Container reference
  let container: HTMLDivElement;
  let hotInstance = $state<any>(null);
  
  onMount(async () => {
    try {
      // Dynamically import Handsontable to avoid SSR issues
      const Handsontable = (await import('handsontable')).default;
      
      // Also import CSS
      await import('handsontable/dist/handsontable.full.min.css');
      
      // Additional CSS for dark theme
      const darkStyles = document.createElement('style');
      darkStyles.textContent = `
        .dark-theme .handsontable {
          background-color: #1e1e1e;
          color: #ffffff;
        }
        
        .dark-theme .handsontable th {
          background-color: #2d2d2d;
          color: #e0e0e0;
          border-color: #444444;
        }
        
        .dark-theme .handsontable td {
          background-color: #292929;
          border-color: #444444;
          color: #ffffff;
        }
        
        .dark-theme .handsontable td.area-selection {
          background-color: rgba(75, 83, 188, 0.3) !important;
        }
        
        .dark-theme .handsontable .current {
          background-color: rgba(125, 125, 225, 0.15) !important;
        }
        
        .dark-theme .handsontable tbody th.ht__highlight,
        .dark-theme .handsontable thead th.ht__highlight {
          background-color: #444444;
        }
        
        .dark-theme .handsontable td.area-selection {
          background-color: rgba(100, 100, 225, 0.2) !important;
        }
      `;
      document.head.appendChild(darkStyles);
      
      // Initialize Handsontable with merged settings
      const mergedSettings = {
        data,
        colHeaders,
        rowHeaders,
        licenseKey,
        width,
        height,
        afterChange: (changes: any[] | null, source: string) => {
          if (source !== 'loadData' && changes) {
            dispatch('afterChange', { changes, source });
          }
        },
        afterSelection: (row: number, column: number, row2: number, column2: number) => {
          dispatch('afterSelection', { row, column, row2, column2 });
        },
        ...settings
      };
      
      // Add the dark theme to the container
      container.classList.add('dark-theme');
      
      // Initialize Handsontable
      hotInstance = new Handsontable(container, mergedSettings);
      
      // Make the instance available to parent components
      dispatch('init', { hotInstance });
    } catch (error) {
      console.error('Error initializing Handsontable:', error);
    }
  });
  
  onDestroy(() => {
    // Clean up
    if (hotInstance) {
      hotInstance.destroy();
    }
  });
  
  // Method to update data from outside  
  export function updateData(newData: any[]) {
    if (hotInstance) {
      hotInstance.loadData(newData);
    }
  }
  
  // Method to get current data
  export function getData() {
    return hotInstance ? hotInstance.getData() : [];
  }
  
  // Method to refresh the table
  export function render() {
    if (hotInstance) {
      hotInstance.render();
    }
  }
</script>

<div class="relative" bind:this={container} style="width: {width}; height: {height}px;"></div>

<style>
  /* Your custom styles */
  .relative {
    position: relative;
  }
</style>