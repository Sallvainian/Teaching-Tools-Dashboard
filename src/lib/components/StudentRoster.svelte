<script lang="ts">
  import type { Student } from '$lib/types/gradebook';
  import type { Category } from '$lib/types/gradebook';
  import { gradebookStore } from '$lib/stores/gradebook';
  import { writable, derived } from 'svelte/store';
  
  let { selectedClass } = $props<{ selectedClass: Category }>();
  
  // Create a writable store for student name
  const newStudentName = writable('');
  
  // Derive students for this class
  const students = derived(
  gradebookStore,
  $gradebookStore => {
    const allStudents = $gradebookStore.students || [];
    return selectedClass.studentIds
      .map((id: string) => allStudents.find(s => s.id === id))
      .filter(Boolean) as Student[];
  }
);
  
  async function addStudent(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    
    if ($newStudentName.trim()) {
      const studentId = await gradebookStore.addGlobalStudent($newStudentName.trim());
      
      if (studentId) {
        await gradebookStore.assignStudentToCategory(studentId, selectedClass.id);
        newStudentName.set('');
      }
    }
  }
  
  function removeStudent(studentId: string) {
    if (confirm('Remove this student from the class?')) {
      gradebookStore.removeStudentFromCategory(studentId, selectedClass.id);
    }
  }
</script>

<div class="bg-gray-800 border border-gray-700 rounded-lg p-6">
  {#if selectedClass}
    <h2 class="text-xl font-semibold text-gray-100 mb-6">{selectedClass.name} - Student Roster</h2>
  
  <div class="mb-6">
    <form class="flex gap-2" onsubmit={addStudent}>
      <input
        type="text"
        placeholder="Student name"
        bind:value={$newStudentName}
        class="flex-1 px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:border-purple"
        required
      />
      <button
        type="submit"
        class="px-4 py-2 bg-purple text-white rounded-lg hover:bg-purple-hover transition-all duration-200"
      >
        Add Student
      </button>
    </form>
  </div>
  
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="text-left border-b border-gray-700">
          <th class="p-3 text-gray-300">#</th>
          <th class="p-3 text-gray-300">Name</th>
          <th class="p-3 text-gray-300">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $students as student, index (student.id)}
          <tr class="border-b border-gray-700 hover:bg-gray-700/50">
            <td class="p-3 text-gray-400">{index + 1}</td>
            <td class="p-3 text-gray-100">{student.name}</td>
            <td class="p-3">
              <button
                onclick={() => removeStudent(student.id)}
                class="px-3 py-1 text-red-400 hover:text-white hover:bg-red-500 rounded-md transition-colors"
                aria-label={`Remove ${student.name} from class`}
                title={`Remove ${student.name} from class`}
              >
                Remove
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    
    {#if $students.length === 0}
      <div class="text-center py-12 bg-gray-700/30 rounded-lg my-4">
        <p class="text-gray-400 mb-2">No students in this class yet</p>
        <p class="text-gray-500 text-sm">Use the form above to add students</p>
      </div>
    {/if}
  </div>
  {/if}
</div>