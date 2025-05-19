<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { LogEntry } from '$lib/types/log-entries';
  
  export let logs: LogEntry[] = [];
  
  const dispatch = createEventDispatcher();
  
  // State for handling deletion confirmation and selection
  let itemsToConfirmDelete: Record<string, boolean> = {};
  let selectedItems: Record<string, boolean> = {};
  let showBulkActions = false;
  let selectAll = false;
  
  // Undo functionality
  let lastDeletedItem: LogEntry | null = null;
  let showUndoBar = false;
  let undoTimeout: any;
  
  function handleSelectLog(logId: string) {
    if (showBulkActions) {
      toggleSelection(logId);
    } else {
      dispatch('select', logId);
    }
  }
  
  function confirmDelete(logId: string) {
    itemsToConfirmDelete[logId] = true;
    itemsToConfirmDelete = {...itemsToConfirmDelete};
    
    // Auto-reset after 5 seconds
    setTimeout(() => {
      itemsToConfirmDelete[logId] = false;
      itemsToConfirmDelete = {...itemsToConfirmDelete};
    }, 5000);
  }
  
  function handleDeleteLog(event: Event, logId: string, log: LogEntry) {
    event.stopPropagation(); // Prevent the click from selecting the log
    
    if (itemsToConfirmDelete[logId]) {
      // This is the confirmation click - actual delete
      lastDeletedItem = log;
      showUndoBanner();
      
      dispatch('delete', logId);
      itemsToConfirmDelete[logId] = false;
      itemsToConfirmDelete = {...itemsToConfirmDelete};
    } else {
      // First click - show confirmation
      confirmDelete(logId);
    }
  }
  
  function showUndoBanner() {
    // Clear any existing timeout
    if (undoTimeout) clearTimeout(undoTimeout);
    
    showUndoBar = true;
    
    // Auto-hide after 10 seconds
    undoTimeout = setTimeout(() => {
      showUndoBar = false;
      lastDeletedItem = null;
    }, 10000);
  }
  
  function handleUndo() {
    if (lastDeletedItem) {
      dispatch('restore', lastDeletedItem);
      showUndoBar = false;
      lastDeletedItem = null;
      if (undoTimeout) clearTimeout(undoTimeout);
    }
  }
  
  // Bulk selection functionality
  function toggleBulkMode() {
    showBulkActions = !showBulkActions;
    if (!showBulkActions) {
      // Clear selections when exiting bulk mode
      selectedItems = {};
      selectAll = false;
    }
  }
  
  function toggleSelection(logId: string) {
    selectedItems[logId] = !selectedItems[logId];
    selectedItems = {...selectedItems};
    
    // Update selectAll based on current selections
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    selectAll = selectedCount === logs.length;
  }
  
  function handleSelectAll() {
    selectAll = !selectAll;
    
    if (selectAll) {
      // Select all items
      logs.forEach(log => {
        selectedItems[log.id] = true;
      });
    } else {
      // Deselect all items
      selectedItems = {};
    }
    
    selectedItems = {...selectedItems};
  }
  
  function handleBulkDelete() {
    const selectedIds = Object.entries(selectedItems)
      .filter(([id, selected]) => selected)
      .map(([id]) => id);
    
    if (selectedIds.length > 0) {
      if (confirm(`Delete ${selectedIds.length} log entries?`)) {
        dispatch('bulkDelete', selectedIds);
        selectedItems = {};
        selectAll = false;
      }
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
  
  function truncateText(text: string, maxLength: number) {
    if (!text) return ''; // Add null check
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }
</script>

<div class="space-y-4">
  {#if showBulkActions}
    <div class="bg-dark-card border border-dark-border rounded-xl p-4 mb-4 flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <input 
          type="checkbox" 
          checked={selectAll} 
          onchange={handleSelectAll}
          class="h-4 w-4 rounded border-dark-border text-dark-purple"
        />
        <span class="text-white">Select All</span>
      </div>
      <div class="flex space-x-2">
        <button
          class="px-3 py-1 text-gray-300 hover:text-white transition-colors"
          onclick={toggleBulkMode}
        >
          Cancel
        </button>
        <button
          class="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          onclick={handleBulkDelete}
        >
          Delete Selected
        </button>
      </div>
    </div>
  {:else}
    <div class="flex justify-end mb-4">
      <button
        class="px-3 py-1 text-gray-300 hover:text-white transition-colors"
        onclick={toggleBulkMode}
      >
        Select Multiple
      </button>
    </div>
  {/if}

  {#each logs as log}
    <div
      class="bg-dark-card border border-dark-border rounded-xl p-4 hover:border-dark-highlight transition-colors cursor-pointer relative {selectedItems[log.id] ? 'border-dark-purple' : ''}"
      onclick={() => handleSelectLog(log.id)}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === 'Enter' && handleSelectLog(log.id)}
    >
      <!-- Content area with conditional padding -->
      <div class={showBulkActions ? "ml-8" : ""}>
        <!-- Checkbox for bulk selection mode -->
        {#if showBulkActions}
          <div class="absolute left-4 top-1/2 transform -translate-y-1/2">
            <input 
              type="checkbox" 
              checked={selectedItems[log.id] || false} 
              onchange={() => toggleSelection(log.id)} 
              onclick={(e) => e.stopPropagation()}
              class="h-5 w-5 rounded border-dark-border text-dark-purple"
            />
          </div>
        {/if}
        
        <!-- Entry header -->
        <div class="flex justify-between items-start mb-2">
          <div>
            <h3 class="text-lg font-semibold text-white">{log.student}</h3>
            <p class="text-sm text-dark-muted">{formatDate(log.date)}</p>
          </div>
          <div class="flex items-center gap-2">
            {#if log.tags.length > 0}
              <div class="flex gap-2">
                {#each log.tags.slice(0, 3) as tag}
                  <span class="px-2 py-1 bg-dark-accent text-xs text-gray-300 rounded-full">
                    {tag}
                  </span>
                {/each}
                {#if log.tags.length > 3}
                  <span class="px-2 py-1 bg-dark-accent text-xs text-gray-300 rounded-full">
                    +{log.tags.length - 3}
                  </span>
                {/if}
              </div>
            {/if}
            {#if !showBulkActions}
              <button 
                class="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full" 
                onclick={(e) => handleDeleteLog(e, log.id, log)}
                onkeydown={(e) => {}}
                title={itemsToConfirmDelete[log.id] ? "Click to confirm deletion" : "Delete log entry"}
              >
                {#if itemsToConfirmDelete[log.id]}
                  <span class="text-red-500 font-medium text-sm px-2">Confirm?</span>
                {:else}
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                {/if}
              </button>
            {/if}
          </div>
        </div>
        
        <!-- Log entry content -->
        <p class="text-gray-300">
          {truncateText(log.log_entry, 200)}
        </p>
        
        <!-- Follow-up indicator -->
        {#if log.follow_up}
          <div class="mt-2 pt-2 border-t border-dark-border">
            <p class="text-sm text-yellow-500">Follow-up required</p>
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<!-- Undo notification banner -->
{#if showUndoBar}
  <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-dark-surface border border-dark-border rounded-lg shadow-lg p-4 flex items-center space-x-4 z-50">
    <span class="text-white">Entry deleted</span>
    <button
      class="px-3 py-1 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-colors"
      onclick={handleUndo}
    >
      Undo
    </button>
  </div>
{/if}