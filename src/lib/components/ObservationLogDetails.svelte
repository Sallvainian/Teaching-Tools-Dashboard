<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { observationLogStore } from '$lib/stores/observation-log';
  import type { StudentObservationLog } from '$lib/types/observation-log';
  
  export let logId: string;
  export let showActions = true;
  
  let log: StudentObservationLog | undefined;
  
  $: {
    log = observationLogStore.getLogById(logId);
  }
  
  function editLog() {
    dispatch('edit', logId);
  }
  
  function deleteLog() {
    if (confirm('Are you sure you want to delete this observation log?')) {
      observationLogStore.deleteLog(logId);
      dispatch('delete', logId);
    }
  }
  
  function close() {
    dispatch('close');
  }
  
  function toggleResolvedStatus() {
    if (log) {
      observationLogStore.updateLog(logId, {
        resolved: !log.resolved
      });
      // Refresh log data
      log = observationLogStore.getLogById(logId);
    }
  }
  
  const dispatch = createEventDispatcher();
</script>

<div class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
  <div class="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b border-gray-700">
      <h2 class="text-xl font-semibold text-white">Behavior Log Details</h2>
      <button
        type="button"
        on:click={close}
        class="text-gray-400 hover:text-white focus:outline-none"
      >
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    {#if log}
      <!-- Content -->
      <div class="p-6 overflow-y-auto flex-grow">
        <div class="space-y-6">
          <!-- Student and Date Section -->
          <div class="flex flex-col sm:flex-row sm:justify-between">
            <div>
              <h3 class="text-lg font-medium text-white">{log.studentName}</h3>
              <p class="text-sm text-gray-400">
                Recorded on {new Date(log.createdAt).toLocaleDateString()} at {new Date(log.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div class="mt-2 sm:mt-0">
              <span class={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${log.resolved ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'}`}>
                {log.resolved ? 'Resolved' : 'Unresolved'}
              </span>
            </div>
          </div>
          
          <!-- Observation Details -->
          <div class="bg-gray-700 rounded-lg p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h4 class="text-sm font-medium text-gray-300">Date of Observation</h4>
                <p class="text-white">{new Date(log.date).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 class="text-sm font-medium text-gray-300">Reason</h4>
                <p class="text-white">{log.reason}</p>
              </div>
              {#if log.mood && log.mood !== 'Unknown'}
                <div>
                  <h4 class="text-sm font-medium text-gray-300">Student Mood</h4>
                  <p class="text-white">{log.mood}</p>
                </div>
              {/if}
            </div>
            
            <div class="mb-4">
              <h4 class="text-sm font-medium text-gray-300 mb-1">Observation Notes</h4>
              <div class="bg-gray-800 rounded p-3 text-white whitespace-pre-wrap">
                {log.notes}
              </div>
            </div>
            
            {#if log.followUpActions}
              <div class="mb-4">
                <h4 class="text-sm font-medium text-gray-300 mb-1">Follow-up Actions</h4>
                <div class="bg-gray-800 rounded p-3 text-white whitespace-pre-wrap">
                  {log.followUpActions}
                </div>
              </div>
            {/if}
            
            {#if log.followUpDate}
              <div>
                <h4 class="text-sm font-medium text-gray-300">Follow-up Date</h4>
                <p class="text-white">{new Date(log.followUpDate).toLocaleDateString()}</p>
              </div>
            {/if}
          </div>
          
          {#if log.updatedAt !== log.createdAt}
            <p class="text-xs text-gray-400 italic">
              Last updated on {new Date(log.updatedAt).toLocaleDateString()} at {new Date(log.updatedAt).toLocaleTimeString()}
            </p>
          {/if}
        </div>
      </div>
      
      <!-- Action Buttons -->
      {#if showActions}
        <div class="border-t border-gray-700 p-4 flex justify-end space-x-3">
          <button
            type="button"
            on:click={toggleResolvedStatus}
            class={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${log.resolved ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500 text-white' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white'}`}
          >
            {log.resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
          </button>
          <button
            type="button"
            on:click={editLog}
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Edit
          </button>
          <button
            type="button"
            on:click={deleteLog}
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>
      {/if}
    {:else}
      <div class="p-6 text-center text-gray-400">
        <p>Log not found.</p>
      </div>
    {/if}
  </div>
</div>