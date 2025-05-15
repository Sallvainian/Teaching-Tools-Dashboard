<script lang="ts">
  import { observationLogStore } from '$lib/stores/observation-log';
  import type { StudentObservationLog, ObservationLogFilters } from '$lib/types/observation-log';
  import ObservationLogForm from '$lib/components/ObservationLogForm.svelte';
  import ObservationLogSearch from '$lib/components/ObservationLogSearch.svelte';
  import ObservationLogList from '$lib/components/ObservationLogList.svelte';
  import ObservationLogDetails from '$lib/components/ObservationLogDetails.svelte';
  
  let showNewLogForm = false;
  let showDetailsView = false;
  let editMode = false;
  let selectedLogId: string | null = null;
  
  // Current filtered logs
  let filteredLogs: StudentObservationLog[] = [];
  
  // Initial load of all logs
  $: {
    filteredLogs = observationLogStore.getLogs().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  function handleFilter(event: CustomEvent<ObservationLogFilters>) {
    filteredLogs = observationLogStore.filterLogs(event.detail).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  function handleSelectLog(event: CustomEvent<string>) {
    selectedLogId = event.detail;
    showDetailsView = true;
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
    // Refresh the list
    filteredLogs = observationLogStore.getLogs().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  function handleSaveLog() {
    showNewLogForm = false;
    editMode = false;
    // Refresh the list
    filteredLogs = observationLogStore.getLogs().sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  function handleCancelLog() {
    showNewLogForm = false;
    editMode = false;
    selectedLogId = null;
  }
  
  function createNewLog() {
    editMode = false;
    selectedLogId = null;
    showNewLogForm = true;
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <header class="mb-8">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-white">Student Behavior Logs</h1>
      <button
        on:click={createNewLog}
        class="px-4 py-2 bg-dark-purple text-white rounded-md hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-dark-highlight"
      >
        New Observation
      </button>
    </div>
    <p class="text-gray-400 mt-2">
      Track and document student behavior, academic progress, and other significant events.
    </p>
  </header>
  
  {#if showNewLogForm}
    <div class="mb-8">
      <ObservationLogForm
        editMode={editMode}
        logId={selectedLogId}
        on:save={handleSaveLog}
        on:cancel={handleCancelLog}
      />
    </div>
  {:else}
    <div class="mb-8">
      <ObservationLogSearch on:filter={handleFilter} />
    </div>
    
    <div>
      <ObservationLogList logs={filteredLogs} on:select={handleSelectLog} />
    </div>
  {/if}
  
  {#if showDetailsView && selectedLogId}
    <ObservationLogDetails
      logId={selectedLogId}
      on:close={handleCloseDetails}
      on:edit={handleEditLog}
      on:delete={handleDeleteLog}
    />
  {/if}
</div>