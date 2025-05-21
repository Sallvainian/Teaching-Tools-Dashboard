<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { logEntriesStore } from '$lib/stores/log-entries';
  import type { LogEntry } from '$lib/types/log-entries';
  
  export let logId: string;
  
  const dispatch = createEventDispatcher();
  
  let log: LogEntry | undefined;
  $: log = logEntriesStore.getLog(logId);
  
  function handleClose() {
    dispatch('close');
  }
  
  function handleEdit() {
    dispatch('edit');
  }
  
  function handleDelete() {
    if (confirm('Are you sure you want to delete this log entry?')) {
      logEntriesStore.deleteLog(logId);
      dispatch('delete');
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

{#if log}
  <div class="fixed inset-0 bg-dark-overlay z-50 flex items-center justify-center p-4">
    <div class="bg-dark-surface rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-dark-surface p-6 border-b border-dark-border flex justify-between items-start">
        <div>
          <h2 class="text-2xl font-bold text-white">{log.student}</h2>
          <p class="text-dark-muted">{formatDate(log.date)}</p>
        </div>
        <button
          onclick={handleClose}
          class="text-gray-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <div class="mb-6">
          <h3 class="text-sm font-medium text-dark-muted mb-1">Log Entry</h3>
          <p class="text-white whitespace-pre-wrap">{log.log_entry}</p>
        </div>
        
        {#if log.actions}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-dark-muted mb-1">Actions Taken</h3>
            <p class="text-white whitespace-pre-wrap">{log.actions}</p>
          </div>
        {/if}
        
        {#if log.follow_up}
          <div class="mb-6 p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg">
            <h3 class="text-sm font-medium text-yellow-500 mb-1">Follow-up</h3>
            <p class="text-white whitespace-pre-wrap">{log.follow_up}</p>
          </div>
        {/if}
        
        {#if log.tags.length > 0}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-dark-muted mb-2">Tags</h3>
            <div class="flex flex-wrap gap-2">
              {#each log.tags as tag}
                <span class="px-3 py-1 bg-dark-accent text-sm text-gray-300 rounded-full">
                  {tag}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Actions -->
      <div class="sticky bottom-0 bg-dark-surface p-6 border-t border-dark-border flex justify-end gap-3">
        <button
          onclick={handleEdit}
          class="px-4 py-2 bg-dark-accent text-white rounded-lg hover:bg-dark-accent-hover transition-colors"
        >
          Edit
        </button>
        <button
          onclick={handleDelete}
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}