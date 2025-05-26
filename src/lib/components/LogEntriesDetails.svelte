<script lang="ts">
  import { logEntriesStore } from '$lib/stores/log-entries';
  // import type { LogEntry } from '$lib/types/log-entries'; // Removed unused import
  
  interface Props {
    logId: string;
    onclose?: () => void;
    onedit?: () => void;
    ondelete?: () => void;
  }
  
  let { logId, onclose, onedit, ondelete }: Props = $props();
  
  // Use derived for reactive log lookup
  const log = $derived(logEntriesStore.getLog(logId));
  
  function handleClose() {
    onclose?.();
  }
  
  function handleEdit() {
    onedit?.();
  }
  
  async function handleDelete() {
    if (confirm('Are you sure you want to delete this log entry?')) {
      try {
        await logEntriesStore.deleteLog(logId);
        ondelete?.();
      } catch (_error) { // Prefixed unused error with _
        alert('Failed to delete log entry. Please try again.');
      }
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
  <div class="fixed inset-0 bg-bg-base bg-opacity-80 z-50 flex items-center justify-center p-4">
    <div class="bg-surface rounded-xl shadow-dropdown max-w-3xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="sticky top-0 bg-surface p-6 border-b border-border flex justify-between items-start">
        <div>
          <h2 class="text-2xl font-bold text-highlight">{log.student}</h2>
          <p class="text-muted">{formatDate(log.date)}</p>
        </div>
        <button
          onclick={handleClose}
          class="text-muted hover:text-highlight transition-colors"
          aria-label="Close"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 class="text-sm font-medium text-muted mb-1">Observer</h3>
            <p class="text-highlight">{log.observer}</p>
          </div>
          {#if log.subject}
            <div>
              <h3 class="text-sm font-medium text-muted mb-1">Subject</h3>
              <p class="text-highlight">{log.subject}</p>
            </div>
          {/if}
        </div>

        {#if log.objective}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-muted mb-1">Objective</h3>
            <p class="text-highlight">{log.objective}</p>
          </div>
        {/if}
        
        <div class="mb-6">
          <h3 class="text-sm font-medium text-muted mb-1">Observation</h3>
          <p class="text-highlight whitespace-pre-wrap">{log.observation}</p>
        </div>
        
        {#if log.actions}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-muted mb-1">Actions Taken</h3>
            <p class="text-highlight whitespace-pre-wrap">{log.actions}</p>
          </div>
        {/if}
        
        {#if log.follow_up}
          <div class="mb-6 p-4 bg-purple-bg border border-purple rounded-lg">
            <h3 class="text-sm font-medium text-purple-light mb-1">Follow-up</h3>
            <p class="text-highlight whitespace-pre-wrap">{log.follow_up}</p>
          </div>
        {/if}
        
        {#if log.tags && log.tags.length > 0}
          <div class="mb-6">
            <h3 class="text-sm font-medium text-muted mb-2">Tags</h3>
            <div class="flex flex-wrap gap-2">
              {#each log.tags as tag (tag)} <!-- Added tag as key -->
                <span class="px-3 py-1 bg-accent text-sm text-text-base rounded-full">
                  {tag}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      
      <!-- Actions -->
      <div class="sticky bottom-0 bg-surface p-6 border-t border-border flex justify-end gap-3">
        <button
          onclick={handleEdit}
          class="px-4 py-2 bg-accent text-highlight rounded-lg hover:bg-accent-hover transition-colors"
        >
          Edit
        </button>
        <button
          onclick={handleDelete}
          class="px-4 py-2 bg-error text-white rounded-lg hover:bg-error-hover transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}