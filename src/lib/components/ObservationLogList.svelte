<script lang="ts">
  import type { StudentObservationLog } from '$lib/types/observation-log';
  
  export let logs: StudentObservationLog[] = [];
  
  // Handle log selection
  function selectLog(id: string) {
    dispatch('select', id);
  }
  
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="bg-dark-card rounded-lg shadow-dark-card overflow-hidden border border-dark-border">
  {#if logs.length === 0}
    <div class="p-6 text-center text-dark-muted">
      <p>No observation logs found.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-dark-border">
        <thead class="bg-dark-surface">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-dark-lavender uppercase tracking-wider">
              Student
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-dark-lavender uppercase tracking-wider">
              Date
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-dark-lavender uppercase tracking-wider">
              Reason
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-dark-lavender uppercase tracking-wider">
              Status
            </th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-dark-lavender uppercase tracking-wider">
              Preview
            </th>
          </tr>
        </thead>
        <tbody class="bg-dark-card divide-y divide-dark-border">
          {#each logs as log}
            <tr 
              class="hover:bg-dark-accent cursor-pointer transition-colors duration-150"
              onclick={() => selectLog(log.id)}
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                {log.studentName}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {new Date(log.date).toLocaleDateString()}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                {log.reason}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.resolved ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'}`}>
                  {log.resolved ? 'Resolved' : 'Unresolved'}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                {log.notes}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>