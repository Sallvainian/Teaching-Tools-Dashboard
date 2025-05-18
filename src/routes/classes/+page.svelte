<script lang="ts">
  import { gradebookStore } from '$lib/stores/gradebook';
  import ClassList from '$lib/components/ClassList.svelte';
  import StudentRoster from '$lib/components/StudentRoster.svelte';
  import ImportWizard from '$lib/components/ImportWizard.svelte';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  
  let showImportWizard = $state(false);
  let selectedClassId = $state<string | null>(null);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  
  const categories = $derived(get(gradebookStore.categories) || []);
  const selectedClass = $derived(
    selectedClassId ? categories.find((c: any) => c.id === selectedClassId) : null
  );
  
  onMount(async () => {
    try {
      await gradebookStore.ensureDataLoaded();
      isLoading = false;
    } catch (e) {
      error = e instanceof Error ? e.message : 'An error occurred';
      isLoading = false;
    }
  });
  
  function handleClassSelect(classId: string) {
    selectedClassId = classId;
  }
  
  function handleImportComplete() {
    showImportWizard = false;
    // Categories will automatically refresh through the reactive $derived
  }
</script>

<div class="container mx-auto px-4 py-8">
  {#if isLoading}
    <div class="flex justify-center items-center h-64">
      <div class="text-gray-400">Loading classes...</div>
    </div>
  {:else if error}
    <div class="flex justify-center items-center h-64">
      <div class="text-red-400">Error: {error}</div>
    </div>
  {:else}
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-100">Classes</h1>
      <button
        onclick={() => showImportWizard = true}
        class="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all duration-200"
      >
        Import New Class
      </button>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-1">
      <ClassList 
        classes={categories}
        selectedClassId={selectedClassId}
        onSelectClass={handleClassSelect}
      />
    </div>
    
    <div class="lg:col-span-2">
      {#if selectedClass}
        <StudentRoster selectedClass={selectedClass} />
      {:else}
        <div class="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
          <p class="text-gray-400">Select a class to view its students</p>
        </div>
      {/if}
    </div>
    </div>
  {/if}
  
  {#if showImportWizard}
    <ImportWizard 
      onClose={() => showImportWizard = false}
      onComplete={handleImportComplete}
    />
  {/if}
</div>