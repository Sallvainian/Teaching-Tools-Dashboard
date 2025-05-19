<script lang="ts">
  import { logEntriesStore } from '$lib/stores/log-entries';
  import type { LogEntry, LogEntryFilters } from '$lib/types/log-entries';
  import LogEntriesForm from '$lib/components/LogEntriesForm.svelte';
  import LogEntriesSearch from '$lib/components/LogEntriesSearch.svelte';
  import LogEntriesList from '$lib/components/LogEntriesList.svelte';
  import LogEntriesDetails from '$lib/components/LogEntriesDetails.svelte';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';
  import { onMount } from 'svelte';
  
  let showNewLogForm = false;
  let showDetailsView = false;
  let editMode = false;
  let selectedLogId: string | null = null;
  
  // Current filtered logs
  let filteredLogs: LogEntry[] = [];
  let isLoading = true;
  
  // Subscribe to the store for changes
  logEntriesStore.subscribe(state => {
    filteredLogs = state.logs.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  });
  
  function handleFilter(event: CustomEvent<LogEntryFilters>) {
    filteredLogs = logEntriesStore.filterLogs(event.detail).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  function handleSelectLog(event: CustomEvent<string>) {
    selectedLogId = event.detail;
    showDetailsView = true;
  }
  
  function handleListDelete(event: CustomEvent<string>) {
    const logId = event.detail;
    logEntriesStore.deleteLog(logId);
    // No need to update filteredLogs as we're now using a subscription
  }
  
  function handleRestoreLog(event: CustomEvent<LogEntry>) {
    const logToRestore = event.detail;
    logEntriesStore.addLog(logToRestore);
  }
  
  function handleBulkDelete(event: CustomEvent<string[]>) {
    const logIds = event.detail;
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
  
  function handleSaveLog(event: CustomEvent) {
    console.log("Saving log entry:", event.detail);
    if (editMode && selectedLogId) {
      logEntriesStore.updateLog(selectedLogId, event.detail);
    } else {
      logEntriesStore.addLog(event.detail);
    }
    showNewLogForm = false;
    editMode = false;
    selectedLogId = null;
    
    // Force refresh of filtered logs
    filteredLogs = logEntriesStore.getLogs().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  onMount(async () => {
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
  });
</script>

<div class="container mx-auto px-4 py-8">
  <!-- Page Header -->
  <div class="flex justify-between items-center mb-6">
    <div>
      <h1 class="text-3xl font-bold text-white">Log Entries</h1>
      <p class="text-dark-muted">Track and manage student interactions</p>
    </div>
    <button
      class="px-4 py-2 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-colors"
      on:click={() => {
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
    <LogEntriesSearch on:filter={handleFilter} />

    <!-- Main Content -->
    <div class="mt-6">
      {#if filteredLogs.length === 0}
        <div class="text-center py-12">
          <p class="text-dark-muted">No log entries found</p>
        </div>
      {:else}
        <LogEntriesList 
          logs={filteredLogs} 
          on:select={handleSelectLog}
          on:delete={handleListDelete}
          on:restore={handleRestoreLog}
          on:bulkDelete={handleBulkDelete}
        />
      {/if}
    </div>
  {/if}
  
  <!-- New/Edit Log Form Modal -->
  {#if showNewLogForm}
    <div class="fixed inset-0 bg-dark-overlay z-50 flex items-center justify-center p-4">
      <div class="bg-dark-surface rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6 border-b border-dark-border">
          <h2 class="text-xl font-semibold text-white">
            {editMode ? 'Edit' : 'New'} Log Entry
          </h2>
        </div>
        <div class="p-6">
          <LogEntriesForm
            {editMode}
            log={editMode && selectedLogId ? logEntriesStore.getLog(selectedLogId) : undefined}
            on:save={handleSaveLog}
            on:cancel={() => {
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
      on:close={handleCloseDetails}
      on:edit={handleEditLog}
      on:delete={handleDeleteLog}
    />
  {/if}
</div>