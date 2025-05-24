<script lang="ts">
  import { gradebookStore } from '$lib/stores/gradebook';
  import { onMount } from 'svelte';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';
  import Handsontable from '$lib/components/Handsontable.svelte';

  // State variables using $state
  let categoryId = $state('');
  let assignmentName = $state('');
  let maxPoints = $state(100);
  let newStudentName = $state('');
  let newClassName = $state('');
  let showNewClassModal = $state(false);
  let showNewAssignmentModal = $state(false);
  let hotInstance = $state(null);
  let showStudentModal = $state(false);
  
  // Reactive values using $derived
  let selectedCategory = $derived($gradebookStore.getSelectedCategory);
  let categoryStudents = $derived($gradebookStore.getStudentsInSelectedCategory);
  let categoryAssignments = $derived($gradebookStore.getAssignmentsForSelectedCategory);
  let allGrades = $derived($gradebookStore.grades || []);
  
  // Create reactive data and headers for Handsontable
  let hotData = $derived(createTableData());
  let columnHeaders = $derived(createColumnHeaders());
  let columnSettings = $derived(createColumnSettings());
  
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
    if (!value) return 'rgba(139, 92, 246, 0.1)'; // Default purple
    
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
  });

  // Handle initial category selection with $effect
  $effect(() => {
    if ($gradebookStore.categories?.length > 0 && !categoryId) {
      gradebookStore.selectCategory($gradebookStore.categories[0].id);
      categoryId = $gradebookStore.categories[0].id;
    }
  });

  function handleAddAssignment() {
    if (categoryId && assignmentName.trim()) {
      gradebookStore.addAssignmentToCategory(assignmentName.trim(), maxPoints || 0, categoryId);
      assignmentName = '';
      maxPoints = 100;
      showNewAssignmentModal = false;
    }
  }

  async function handleAddStudent() {
    if (newStudentName.trim() && categoryId) {
      const studentId = await gradebookStore.addGlobalStudent(newStudentName.trim());
      if (studentId) {
        gradebookStore.assignStudentToCategory(studentId, categoryId);
        newStudentName = '';
        showStudentModal = false;
      }
    }
  }

  function handleAddClass() {
    if (newClassName.trim()) {
      gradebookStore.addCategory(newClassName.trim());
      newClassName = '';
      showNewClassModal = false;
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

<div class="min-h-screen">
  <div class="container mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center gap-3">
        <div class="text-purple">
          <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </div>
        <div>
          <h1 class="text-3xl font-bold text-highlight">Gradebook</h1>
          <p class="text-text-base">Manage student grades and assignments</p>
        </div>
      </div>
    </div>

    {#if $gradebookStore.isLoading}
      <div class="flex items-center justify-center min-h-[500px]">
        <LoadingBounce />
      </div>
    {:else}
      <!-- Action Bar -->
      <div class="flex flex-wrap gap-4 mb-6">
        <div class="flex-1">
          <div class="card-dark p-4">
            <label for="class-selector" class="block text-sm font-medium text-text-base mb-2">Select Class</label>
            <div class="flex gap-2">
              <select 
                id="class-selector" 
                class="select w-full"
                bind:value={categoryId}
              >
                <option value="" disabled>Select a class</option>
                {#each $gradebookStore.categories as category}
                  <option value={category.id}>{category.name}</option>
                {/each}
              </select>
              <button
                onclick={toggleNewClassModal}
                class="btn btn-primary"
                aria-label="Create new class"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {#if selectedCategory}
          <div class="flex gap-2">
            <button 
              class="btn btn-primary"
              onclick={() => showNewAssignmentModal = true}
            >
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              New Assignment
            </button>
            
            <button 
              class="btn btn-secondary"
              onclick={() => showStudentModal = true}
            >
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Add Student
            </button>
          </div>
        {/if}
      </div>

      {#if selectedCategory}
        <div class="card-dark mb-6">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-xl font-bold text-highlight">{selectedCategory.name}</h2>
              <p class="text-text-base text-sm mt-1">
                {categoryStudents.length} student{categoryStudents.length !== 1 ? 's' : ''} • 
                {categoryAssignments.length} assignment{categoryAssignments.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div class="flex gap-2">
              <button class="btn btn-sm btn-secondary">
                <svg class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export
              </button>
              <button class="btn btn-sm btn-secondary">
                <svg class="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 3v12M5 8l7-5 7 5"></path>
                  <path d="M5 21h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z"></path>
                </svg>
                Import
              </button>
            </div>
          </div>
          
          {#if hasData() && categoryAssignments.length > 0}
            <!-- Gradebook Table -->
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-surface/50 text-left">
                    <th class="p-3 border-b border-border text-text-base font-medium">#</th>
                    <th class="p-3 border-b border-border text-text-base font-medium">Name</th>
                    <th class="p-3 border-b border-border text-text-base font-medium text-center">Average</th>
                    {#each categoryAssignments as assignment}
                      <th class="p-3 border-b border-border text-text-base font-medium text-center">
                        <div>{assignment.name}</div>
                        <div class="text-xs opacity-70">{assignment.maxPoints}pts</div>
                      </th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each categoryStudents as student, index}
                    {@const avg = gradebookStore.studentAverageInCategory(student.id, categoryId)}
                    <tr class="hover:bg-surface/30 transition-colors">
                      <td class="p-3 border-b border-border/50 text-text-base">{index + 1}</td>
                      <td class="p-3 border-b border-border/50 text-highlight font-medium">{student.name}</td>
                      <td class="p-3 border-b border-border/50 text-center">
                        <div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium
                          ${avg >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                            avg >= 80 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 
                            avg >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                            avg >= 60 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' : 
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}">
                          {avg}%
                        </div>
                      </td>
                      {#each categoryAssignments as assignment}
                        {@const grade = allGrades.find(g => g.studentId === student.id && g.assignmentId === assignment.id)}
                        {@const percentage = grade ? (grade.points / assignment.maxPoints) * 100 : 0}
                        <td class="p-3 border-b border-border/50 text-center relative group">
                          <div class="flex items-center justify-center">
                            <input 
                              type="number" 
                              value={grade ? grade.points : ''} 
                              class="w-16 text-center bg-surface/50 border border-border rounded py-1 px-2 focus:ring-1 focus:ring-purple focus:border-purple"
                              min="0"
                              max={assignment.maxPoints}
                              onchange={(e) => {
                                const value = parseFloat(e.currentTarget.value);
                                if (!isNaN(value)) {
                                  gradebookStore.recordGrade(student.id, assignment.id, value);
                                }
                              }}
                            />
                          </div>
                          {#if grade}
                            <div class="absolute bottom-0 left-0 right-0 h-1 bg-surface">
                              <div 
                                class="${percentage >= 90 ? 'bg-green-500' : 
                                  percentage >= 80 ? 'bg-blue-500' : 
                                  percentage >= 70 ? 'bg-yellow-500' : 
                                  percentage >= 60 ? 'bg-orange-500' : 
                                  'bg-red-500'}" 
                                style="width: ${percentage}%"
                              ></div>
                            </div>
                          {/if}
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {:else if hasData()}
            <div class="bg-surface/30 rounded-lg p-6 text-center">
              <svg class="w-16 h-16 mx-auto text-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <h3 class="text-xl font-bold text-highlight mb-2">No Assignments Yet</h3>
              <p class="text-text-base mb-6">
                You have students in this class, but no assignments have been created.
              </p>
              <button 
                class="btn btn-primary"
                onclick={() => showNewAssignmentModal = true}
              >
                <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Create First Assignment
              </button>
            </div>
          {:else}
            <div class="flex flex-col items-center justify-center py-16 bg-surface/30 rounded-lg">
              <svg class="w-16 h-16 text-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <h3 class="text-xl font-bold text-highlight mb-2">No Students Yet</h3>
              <p class="text-text-base text-center max-w-md mb-6">
                Add students to this class to start tracking grades. You can add students individually or import a list.
              </p>
              <button 
                class="btn btn-primary"
                onclick={() => showStudentModal = true}
              >
                <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Add First Student
              </button>
            </div>
          {/if}
        </div>
        
        {#if categoryAssignments.length > 0}
          <div class="card-dark mb-6">
            <h3 class="text-lg font-bold text-highlight mb-4">Assignment Summary</h3>
            
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="text-left border-b border-border">
                  <tr>
                    <th class="pb-3 text-text-base font-medium">Name</th>
                    <th class="pb-3 text-text-base font-medium">Max Points</th>
                    <th class="pb-3 text-text-base font-medium">Average</th>
                    <th class="pb-3 text-text-base font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#each categoryAssignments as assignment}
                    <tr class="border-b border-border/50 hover:bg-surface/50 transition-colors">
                      <td class="py-3 text-highlight">{assignment.name}</td>
                      <td class="py-3 text-text-base">{assignment.maxPoints}</td>
                      <td class="py-3">
                        {#if categoryStudents.length > 0}
                          {@const grades = allGrades.filter(g => g.assignmentId === assignment.id)}
                          {@const total = grades.reduce((sum, g) => sum + g.points, 0)}
                          {@const avg = grades.length > 0 ? (total / grades.length / assignment.maxPoints * 100).toFixed(1) : '—'}
                          <div class="flex items-center gap-2">
                            <div class="w-24 h-2 bg-surface rounded-full overflow-hidden">
                              <div 
                                class="h-full bg-purple" 
                                style={`width: ${avg === '—' ? '0' : avg}%`}
                              ></div>
                            </div>
                            <span class="text-text-base">{avg}%</span>
                          </div>
                        {:else}
                          <span class="text-text-base">—</span>
                        {/if}
                      </td>
                      <td class="py-3 text-right">
                        <div class="flex justify-end gap-2">
                          <button class="p-1 text-text-base hover:text-purple transition-colors" aria-label="Edit assignment">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button class="p-1 text-text-base hover:text-error transition-colors" aria-label="Delete assignment">
                            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
        
        {#if categoryStudents.length > 0}
          <div class="card-dark">
            <h3 class="text-lg font-bold text-highlight mb-4">Students</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each categoryStudents as student}
                <div class="bg-surface/50 rounded-lg p-4 hover:bg-surface transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div class="font-medium text-highlight">{student.name}</div>
                      {#if categoryAssignments.length > 0}
                        {@const avg = gradebookStore.studentAverageInCategory(student.id, categoryId)}
                        <div class="text-sm">
                          <span class={`${avg >= 90 ? 'text-green-400' : avg >= 80 ? 'text-blue-400' : avg >= 70 ? 'text-yellow-400' : avg >= 60 ? 'text-orange-400' : 'text-red-400'}`}>
                            {avg}%
                          </span>
                          <span class="text-text-base ml-1">average</span>
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {:else}
        <div class="card-dark p-8 text-center">
          <svg class="w-16 h-16 mx-auto text-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"></path>
          </svg>
          <h3 class="text-xl font-bold text-highlight mb-2">No Class Selected</h3>
          <p class="text-text-base mb-6">Please select a class from the dropdown above or create a new one to view grades.</p>
          <button
            onclick={toggleNewClassModal}
            class="btn btn-primary"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 5v14M5 12h14"></path>
            </svg>
            Create New Class
          </button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- New Class Modal -->
{#if showNewClassModal}
  <div class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-card border border-border rounded-lg p-6 w-full max-w-md">
      <h3 class="text-xl font-bold text-highlight mb-4">Create New Class</h3>
      
      <div class="mb-6">
        <label for="new-class-name" class="block text-sm font-medium text-text-base mb-2">Class Name</label>
        <input
          type="text"
          id="new-class-name"
          bind:value={newClassName}
          placeholder="Class name (e.g. Math 101)"
          class="input w-full"
        />
        <p class="text-xs text-text-base mt-1">You'll be able to add students and assignments after creating the class.</p>
      </div>
      
      <div class="flex gap-3">
        <button
          type="button"
          onclick={toggleNewClassModal}
          class="btn btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleAddClass}
          class="btn btn-primary flex-1"
          disabled={!newClassName.trim()}
        >
          Create Class
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- New Assignment Modal -->
{#if showNewAssignmentModal}
  <div class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-card border border-border rounded-lg p-6 w-full max-w-md">
      <h3 class="text-xl font-bold text-highlight mb-4">Add New Assignment</h3>
      
      <div class="mb-4">
        <label for="assignment-name" class="block text-sm font-medium text-text-base mb-2">Assignment Name</label>
        <input
          type="text"
          id="assignment-name"
          bind:value={assignmentName}
          placeholder="e.g. Midterm Exam"
          class="input w-full"
        />
      </div>
      
      <div class="mb-6">
        <label for="max-points" class="block text-sm font-medium text-text-base mb-2">Maximum Points</label>
        <input
          type="number"
          id="max-points"
          bind:value={maxPoints}
          min="1"
          class="input w-full"
        />
      </div>
      
      <div class="flex gap-3">
        <button
          type="button"
          onclick={() => showNewAssignmentModal = false}
          class="btn btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleAddAssignment}
          class="btn btn-primary flex-1"
          disabled={!assignmentName.trim() || maxPoints <= 0}
        >
          Add Assignment
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Add Student Modal -->
{#if showStudentModal}
  <div class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
    <div class="bg-card border border-border rounded-lg p-6 w-full max-w-md">
      <h3 class="text-xl font-bold text-highlight mb-4">Add Student to {selectedCategory?.name}</h3>
      
      <div class="mb-6">
        <label for="student-name" class="block text-sm font-medium text-text-base mb-2">Student Name</label>
        <input
          type="text"
          id="student-name"
          bind:value={newStudentName}
          placeholder="e.g. John Smith"
          class="input w-full"
        />
      </div>
      
      <div class="flex gap-3">
        <button
          type="button"
          onclick={() => showStudentModal = false}
          class="btn btn-secondary flex-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleAddStudent}
          class="btn btn-primary flex-1"
          disabled={!newStudentName.trim()}
        >
          Add Student
        </button>
      </div>
    </div>
  </div>
{/if}