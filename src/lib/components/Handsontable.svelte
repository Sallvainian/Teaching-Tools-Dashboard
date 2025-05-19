<script>
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  // Props
  export let data = [];
  export let colHeaders = true;
  export let rowHeaders = true;
  export let height = 400;
  export let width = '100%';
  export let licenseKey = 'non-commercial-and-evaluation';
  export let settings = {};
  
  // Create Svelte event dispatcher
  const dispatch = createEventDispatcher();
  
  // Container reference
  let container;
  let hotInstance = null;
  
  onMount(async () => {
    // Dynamically import Handsontable to avoid SSR issues
    const { default: Handsontable } = await import('handsontable');
    
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
      afterChange: (changes, source) => {
        if (source !== 'loadData') {
          dispatch('afterChange', { changes, source });
        }
      },
      afterSelection: (row, column, row2, column2) => {
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
  });
  
  onDestroy(() => {
    // Clean up
    if (hotInstance) {
      hotInstance.destroy();
    }
  });
  
  // Method to update data from outside
  export function updateData(newData) {
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