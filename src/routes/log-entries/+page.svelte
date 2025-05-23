<script lang="ts">
  import { logEntriesStore } from '$lib/stores/log-entries';
  import type { LogEntry, LogEntryFilters } from '$lib/types/log-entries';
  import LogEntriesForm from '$lib/components/LogEntriesForm.svelte';
  import LogEntriesSearch from '$lib/components/LogEntriesSearch.svelte';
  import LogEntriesList from '$lib/components/LogEntriesList.svelte';
  import LogEntriesDetails from '$lib/components/LogEntriesDetails.svelte';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';
  
  let showNewLogForm = $state(false);
  let showDetailsView = $state(false);
  let editMode = $state(false);
  let selectedLogId = $state<string | null>(null);
  
  // Current filtered logs
  let filteredLogs = $state<LogEntry[]>([]);
  let isLoading = $state(true);
  
  // Use $effect instead of subscribe
  $effect(() => {
    const state = $logEntriesStore;
    filteredLogs = state.logs.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });
  
  function handleFilter(filters: LogEntryFilters) {
    filteredLogs = logEntriesStore.filterLogs(filters).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  function handleSelectLog(logId: string) {
    selectedLogId = logId;
    showDetailsView = true;
  }
  
  function handleListDelete(logId: string) {
    logEntriesStore.deleteLog(logId);
    // No need to update filteredLogs as we're now using a subscription
  }
  
  function handleRestoreLog(log: LogEntry) {
    logEntriesStore.addLog(log);
  }
  
  function handleBulkDelete(logIds: string[]) {
    logIds.forEach(id => {
      logEntriesStore.deleteLog(id);
    });
  }
  
  function handleCloseDetails() {
    showDetailsView = false;
    selectedLogId = null;
  }
  
  function handleEditLog() {
    editMode = true;
    showDetailsView = false;
    showNewLogForm = true;
  }
  
  function handleDeleteLog() {
    showDetailsView = false;
    selectedLogId = null;
  }
  
  function handleSaveLog(logEntry: Omit<LogEntry, 'id'>) {
    console.log("Saving log entry:", logEntry);
    if (editMode && selectedLogId) {
      logEntriesStore.updateLog(selectedLogId, logEntry);
    } else {
      logEntriesStore.addLog(logEntry as LogEntry);
    }
    showNewLogForm = false;
    editMode = false;
    selectedLogId = null;
    
    // Force refresh of filtered logs
    filteredLogs = logEntriesStore.getLogs().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  $effect(() => {
    async function initializeData() {
      try {
        // Dynamically import supabase client
        const { initializeDB } = await import('$lib/supabaseClient');
        
        // Initialize database tables and functions
        await initializeDB();
      } catch (err) {
        console.warn("Could not initialize Supabase DB:", err);
      }
      
      // Initialize the log entries store
      logEntriesStore.init();
      
      setTimeout(() => {
        isLoading = false;
      }, 500);
    }
    
    initializeData();
  });
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Page Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-highlight">Log Entries</h1>
      <p class="text-muted">Track and manage student interactions</p>
    </div>
    <button
      class="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple-hover transition-colors"
      onclick={() => {
        editMode = false;
        selectedLogId = null;
        showNewLogForm = true;
      }}
    >
      + New Entry
    </button>
  </div>
  
  {#if isLoading}
    <div class="flex items-center justify-center h-64">
      <LoadingBounce />
    </div>
  {:else}
    <!-- Search and Filter Bar -->
    <LogEntriesSearch onfilter={handleFilter} />

    <!-- Main Content -->
    <div class="mt-6">
      {#if filteredLogs.length === 0}
        <div class="text-center py-12">
          <p class="text-muted">No log entries found</p>
        </div>
      {:else}
        <LogEntriesList 
          logs={filteredLogs} 
          onselect={handleSelectLog}
          ondelete={handleListDelete}
          onrestore={handleRestoreLog}
          onbulkdelete={handleBulkDelete}
        />
      {/if}
    </div>
  {/if}
  
  <!-- New/Edit Log Form Modal -->
  {#if showNewLogForm}
    <div class="fixed inset-0 bg-bg-base bg-opacity-80 z-50 flex items-center justify-center p-4">
      <div class="bg-surface rounded-xl shadow-dropdown max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-border">
          <h2 class="text-xl font-semibold text-highlight">
            {editMode ? 'Edit' : 'New'} Log Entry
          </h2>
        </div>
        <div class="p-6">
          <LogEntriesForm
            {editMode}
            log={editMode && selectedLogId ? logEntriesStore.getLog(selectedLogId) : undefined}
            onsave={handleSaveLog}
            oncancel={() => {
              showNewLogForm = false;
              editMode = false;
              selectedLogId = null;
            }}
          />
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Log Details View Modal -->
  {#if showDetailsView && selectedLogId}
    <LogEntriesDetails
      logId={selectedLogId}
      onclose={handleCloseDetails}
      onedit={handleEditLog}
      ondelete={handleDeleteLog}
    />
  {/if}
</div>