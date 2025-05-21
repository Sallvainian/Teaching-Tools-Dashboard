<script lang="ts">
  import { gradebookStore } from '$lib/stores/gradebook';
  import { onMount } from 'svelte';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';
  import Handsontable from '$lib/components/Handsontable.svelte';

  // State variables
  let categoryId = '';
  let assignmentName = '';
  let maxPoints = 100;
  let newStudentName = '';
  let newClassName = '';
  let showNewClassModal = false;
  let hotInstance;
  
  // Reactive values
  $: selectedCategory = $gradebookStore.getSelectedCategory;
  $: categoryStudents = $gradebookStore.getStudentsInSelectedCategory;
  $: categoryAssignments = $gradebookStore.getAssignmentsForSelectedCategory;
  $: allGrades = $gradebookStore.grades || [];
  
  // Create reactive data and headers for Handsontable
  $: hotData = createTableData();
  $: columnHeaders = createColumnHeaders();
  $: columnSettings = createColumnSettings();
  
  // Table functions
  function createTableData() {
    if (!categoryStudents || categoryStudents.length === 0) {
      return [];
    }
    
    return categoryStudents.map(student => {
      // Start with student name
      const row = [student.name];
      
      // Add grades for each assignment
      if (categoryAssignments && categoryAssignments.length > 0) {
        categoryAssignments.forEach(assignment => {
          const grade = allGrades.find(
            g => g.studentId === student.id && g.assignmentId === assignment.id
          );
          row.push(grade ? grade.points : null);
        });
      }
      
      // Add average at the end
      try {
        const average = gradebookStore.studentAverageInCategory(student.id, categoryId || '');
        row.push(average);
      } catch (err) {
        console.error('Error calculating average:', err);
        row.push(0);
      }
      
      return row;
    });
  }
  
  function createColumnHeaders() {
    // Start with Student column
    const headers = ['Student'];
    
    // Add assignment columns
    if (categoryAssignments && categoryAssignments.length > 0) {
      categoryAssignments.forEach(assignment => {
        headers.push(`${assignment.name} (${assignment.maxPoints}pts)`);
      });
    }
    
    // Add average column
    headers.push('Average %');
    
    return headers;
  }
  
  function createColumnSettings() {
    // Student column settings
    const columns = [
      { 
        type: 'text',
        readOnly: true,
        className: 'htLeft font-medium text-white' 
      }
    ];
    
    // Assignment columns
    if (categoryAssignments && categoryAssignments.length > 0) {
      categoryAssignments.forEach((assignment, index) => {
        columns.push({
          type: 'numeric',
          numericFormat: { pattern: '0,0.00' },
          className: 'htCenter',
          validator: function(value, callback) {
            callback(value === null || value === '' || (value >= 0 && value <= assignment.maxPoints));
          },
          allowInvalid: false,
          // Handle grade change
          afterChange: (changes, source) => {
            if (source === 'edit' && changes) {
              const [row, col, oldValue, newValue] = changes[0];
              const studentId = categoryStudents[row].id;
              const assignmentId = categoryAssignments[index].id;
              
              gradebookStore.recordGrade(studentId, assignmentId, parseFloat(newValue) || 0);
            }
          }
        });
      });
    }
    
    // Average column
    columns.push({ 
      type: 'numeric',
      numericFormat: { pattern: '0,0.00' },
      readOnly: true,
      className: 'htCenter font-bold',
      renderer: function(instance, td, row, col, prop, value) {
        td.style.backgroundColor = getGradeColor(value);
        td.innerHTML = value ? `${value.toFixed(1)}%` : '—';
        return td;
      }
    });
    
    return columns;
  }
  
  function getGradeColor(value) {
    if (!value) return 'rgba(139, 92, 246, 0.2)'; // Default purple
    
    if (value >= 90) return 'rgba(52, 211, 153, 0.2)'; // Green for A
    if (value >= 80) return 'rgba(96, 165, 250, 0.2)'; // Blue for B
    if (value >= 70) return 'rgba(251, 191, 36, 0.2)'; // Yellow for C
    if (value >= 60) return 'rgba(249, 115, 22, 0.2)'; // Orange for D
    return 'rgba(239, 68, 68, 0.2)'; // Red for F
  }
  
  // Handle table events
  function handleAfterChange(event) {
    // Refresh the table after changes to update averages
    if (hotInstance) {
      hotInstance.updateData(createTableData());
    }
  }
  
  function handleTableInit(event) {
    hotInstance = event.detail.hotInstance;
  }
  
  onMount(async () => {
    // Ensure data is loaded when gradebook is accessed
    await gradebookStore.ensureDataLoaded();
    console.log('Gradebook data loaded');
  });

  // Handle initial category selection
  $: if ($gradebookStore.categories?.length > 0 && !categoryId) {
    console.log('Setting initial category reactively');
    gradebookStore.selectCategory($gradebookStore.categories[0].id);
  }

  function handleAddAssignment() {
    if (categoryId && assignmentName.trim()) {
      gradebookStore.addAssignmentToCategory(assignmentName.trim(), maxPoints || 0, categoryId);
      assignmentName = '';
      maxPoints = 100;
    }
  }

  async function handleAddStudent() {
    if (newStudentName.trim() && categoryId) {
      const studentId = await gradebookStore.addGlobalStudent(newStudentName.trim());
      if (studentId) {
        gradebookStore.assignStudentToCategory(studentId, categoryId);
        newStudentName = '';
      }
    }
  }

  function handleAddClass() {
    if (newClassName.trim()) {
      gradebookStore.addCategory(newClassName.trim());
      newClassName = '';
    }
  }

  // Function to toggle the new class modal
  function toggleNewClassModal() {
    showNewClassModal = !showNewClassModal;
    if (showNewClassModal) {
      newClassName = '';
    }
  }
  
  // Simple function to check if we can render the grid
  function hasData() {
    return categoryStudents && categoryStudents.length > 0;
  }
</script>

{#if $gradebookStore.isLoading}
  <div class="flex items-center justify-center min-h-[500px]">
    <LoadingBounce />
  </div>
{:else}
  <!-- Class selection dropdown -->
  <div class="mb-4">
    <div class="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-dark-card p-4">
      <label for="class-selector" class="block text-dark-muted text-sm mb-1">Select Class</label>
      <div class="flex gap-2">
        <select 
          id="class-selector" 
          class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
          bind:value={categoryId}
        >
          <option value="" disabled>Select a class</option>
          {#each $gradebookStore.categories as category}
            <option value={category.id}>{category.name}</option>
          {/each}
        </select>
        <button
          onclick={toggleNewClassModal}
          class="bg-dark-purple hover:bg-dark-accent text-white px-4 rounded-lg text-sm transition whitespace-nowrap"
        >
          New Class
        </button>
      </div>
    </div>
  </div>

  {#if selectedCategory}
    <div class="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-dark-card mb-4">
      <div class="p-4 border-b border-dark-border bg-dark-surface">
        <h3 class="font-medium text-white">{selectedCategory.name} - Grades</h3>
        <p class="text-dark-muted text-xs mt-1">
          Excel-like features: Click and drag to select cells, double-click to edit, Ctrl+C to copy,
          and Ctrl+V to paste. Use arrow keys to navigate between cells.
        </p>
      </div>
      
      <div class="p-4">
        {#if hasData()}
          <Handsontable
            data={hotData}
            colHeaders={columnHeaders}
            settings={{
              columns: columnSettings,
              rowHeaderWidth: 40,
              rowHeaders: true,
              stretchH: 'all',
              manualColumnResize: true,
              contextMenu: true,
              fixedColumnsStart: 1,
              licenseKey: 'non-commercial-and-evaluation'
            }}
            height={400}
            on:init={handleTableInit}
            on:afterChange={handleAfterChange}
          />
        {:else}
          <div class="flex items-center justify-center h-64 bg-dark-card">
            <div class="text-center p-6">
              <svg
                class="w-12 h-12 mx-auto mb-4 text-dark-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <h3 class="mb-2 text-lg font-medium text-white">No Data Available</h3>
              <p class="text-dark-muted">Add students and assignments using the forms below.</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
  
  {#if !selectedCategory}
    <div class="bg-dark-card border border-dark-border p-8 rounded-xl text-center">
      <svg
        class="w-16 h-16 mx-auto text-dark-muted mb-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 class="text-lg font-medium text-white mb-2">No Class Selected</h3>
      <p class="text-dark-muted">Please select a class from the dropdown above or create a new one to view grades.</p>
    </div>
  {/if}
{/if}

<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <!-- Add assignment form -->
  {#if selectedCategory}
    <div class="bg-dark-card border border-dark-border rounded-xl p-4">
      <h3 class="font-medium text-white mb-3">Add Assignment</h3>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label for="assignmentName" class="block text-dark-muted text-sm mb-1">Name</label>
          <input
            id="assignmentName"
            type="text"
            bind:value={assignmentName}
            class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
            placeholder="e.g. Midterm Exam"
          />
        </div>
        <div>
          <label for="maxPoints" class="block text-dark-muted text-sm mb-1">Max Points</label>
          <input
            id="maxPoints"
            type="number"
            bind:value={maxPoints}
            min="1"
            class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
          />
        </div>
        <div class="col-span-2">
          <button
            onclick={handleAddAssignment}
            class="w-full bg-dark-purple hover:bg-dark-accent text-white p-2 rounded-lg text-sm transition"
          >
            Add Assignment
          </button>
        </div>
      </div>
    </div>

    <!-- Add student form -->
    <div class="bg-dark-card border border-dark-border rounded-xl p-4">
      <h3 class="font-medium text-white mb-3">Add Student to {selectedCategory.name}</h3>
      <div class="grid grid-cols-4 gap-4">
        <div class="col-span-3">
          <label for="studentName" class="block text-dark-muted text-sm mb-1">Student Name</label>
          <input
            id="studentName"
            type="text"
            bind:value={newStudentName}
            class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
            placeholder="e.g. John Smith"
          />
        </div>
        <div class="flex items-end">
          <button
            onclick={handleAddStudent}
            class="w-full bg-dark-purple hover:bg-dark-accent text-white p-2 rounded-lg text-sm transition"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- New Class Modal -->
{#if showNewClassModal}
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity" aria-hidden="true">
        <div class="absolute inset-0 bg-black opacity-50"></div>
      </div>
      
      <div class="inline-block align-bottom bg-dark-card rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-dark-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-dark-surface sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-dark-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg leading-6 font-medium text-white">Create New Class</h3>
              <div class="mt-2">
                <p class="text-sm text-dark-muted">Enter a name for your new class. You'll be able to add students and assignments after creating it.</p>
                <div class="mt-4">
                  <input
                    type="text"
                    id="new-class-name"
                    bind:value={newClassName}
                    placeholder="Class name (e.g. Math 101)"
                    class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-dark-surface px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onclick={() => {
              handleAddClass();
              toggleNewClassModal();
            }}
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-dark-purple text-base font-medium text-white hover:bg-dark-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple sm:ml-3 sm:w-auto sm:text-sm"
          >
            Create Class
          </button>
          <button
            type="button"
            onclick={toggleNewClassModal}
            class="mt-3 w-full inline-flex justify-center rounded-md border border-dark-border shadow-sm px-4 py-2 bg-dark-surface text-base font-medium text-white hover:bg-dark-accent/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}