<script lang="ts">
  
  interface ClassItem {
    id: string;
    name: string;
    studentIds: string[];
  }

  let { 
    classes = [], 
    selectedClassId = null, 
    onSelectClass 
  } = $props<{
    classes: ClassItem[];
    selectedClassId: string | null;
    onSelectClass: (classId: string) => void;
  }>();
</script>

<div class="bg-gray-800 border border-gray-700 rounded-lg p-4">
  <h2 class="text-xl font-semibold text-gray-100 mb-4">All Classes</h2>
  
  <div class="space-y-2">
    {#each classes as classItem (classItem.id)}
      <button
        onclick={() => onSelectClass(classItem.id)}
        class="w-full p-3 rounded-lg text-left transition-all duration-200 {
          selectedClassId === classItem.id
            ? 'bg-dark-purple text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
        }"
      >
        <div class="flex justify-between items-center">
          <span class="font-medium">{classItem.name}</span>
          <span class="text-sm {
            selectedClassId === classItem.id
              ? 'text-white/90'
              : 'text-gray-400'
          }">
            {classItem.studentIds.length} students
          </span>
        </div>
      </button>
    {/each}
    
    {#if classes.length === 0}
      <p class="text-gray-400 text-center py-4">No classes found</p>
    {/if}
  </div>
</div>