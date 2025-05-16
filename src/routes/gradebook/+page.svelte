<script lang="ts">
  import { gradebookStore } from '$lib/stores/gradebook';
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import LoadingBounce from '$lib/components/LoadingBounce.svelte';

  // Import AG Grid components with correct name
  import AgGridSvelte from 'ag-grid-svelte5';

  // Import AG Grid core modules
  import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
  import type { GridOptions } from '@ag-grid-community/core';

  // Define our model types for better type safety
  interface Student {
    id: string;
    name: string;
  }

  interface Assignment {
    id: string;
    name: string;
    maxPoints: number;
    categoryId: string;
  }

  interface Grade {
    studentId: string;
    assignmentId: string;
    points: number;
  }

  interface GradeRow {
    studentId: string;
    student: string;
    average: number;
    [key: string]: string | number | null; // For dynamic assignment columns
  }

  // State variables
  let categoryId = $state('');
  let assignmentName = $state('');
  let maxPoints = $state(100);
  let newStudentName = $state('');

  // Access the store
  const {
    categories,
    getSelectedCategory,
    getStudentsInSelectedCategory,
    getAssignmentsForSelectedCategory,
    studentAverageInCategory,
    addAssignmentToCategory,
    recordGrade,
    addGlobalStudent,
    assignStudentToCategory,
    isLoading,
  } = gradebookStore;

  // Derived values using runes
  const selectedCategory = $derived($getSelectedCategory);
  const categoryStudents = $derived($getStudentsInSelectedCategory);
  const categoryAssignments = $derived($getAssignmentsForSelectedCategory);

  // Create reactive data source for the grid
  let rowData = $state(createRowData());

  // Create a reactive gridOptions object with all properties - typed correctly
  let gridOptions = $state<GridOptions<GradeRow>>({
    columnDefs: createColumnDefs(),
    getRowId: (params) => params.data.studentId,
    defaultColDef: {
      sortable: true,
      filter: true,
      resizable: true,
      editable: false,
      enableCellChangeFlash: true, // Fixed from suppressCellFlash
      suppressHeaderMenuButton: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      minWidth: 120,
      cellStyle: {
        display: 'flex',
        alignItems: 'center',
        lineHeight: '40px',
        paddingLeft: '12px',
      },
    },
    // Proper event handler
    onCellValueChanged: (params) => {
      const { data, colDef, newValue } = params;
      if (colDef.field !== 'student' && colDef.field !== 'average') {
        const studentId = data.studentId;
        const assignmentId = colDef.field || '';
        const value =
          newValue === null || newValue === undefined || newValue === ''
            ? 0 // Default to 0 instead of null
            : parseFloat(String(newValue));

        if (!isNaN(value)) {
          recordGrade(studentId, assignmentId, value);
        }
      }
    },
    rowSelection: {
      type: 'multiple',
      enableClickSelection: true, // Fixed from suppressRowClickSelection
    },
    undoRedoCellEditing: true,
    enableCellTextSelection: true,
    suppressCellFocus: false,
    domLayout: 'normal',
    animateRows: false,
    stopEditingWhenCellsLoseFocus: true,
  });

  // Module definition as expected by the component
  const modules = [ClientSideRowModelModule];

  // Effect to update column definitions when assignments change
  $effect(() => {
    if (categoryAssignments) {
      const newColDefs = createColumnDefs();
      console.log(`Updated columnDefs, length: ${newColDefs.length || 0}`);
      gridOptions.columnDefs = newColDefs;
    }
  });

  // Effect to update rowData when dependencies change - runs after column defs
  $effect(() => {
    if (categoryStudents) {
      const newRowData = createRowData();
      console.log(
        `Updated rowData, students: ${categoryStudents.length}, assignments: ${categoryAssignments.length}`
      );
      rowData = newRowData;
    }
  });

  // Data transformation for AG Grid - safely creating row data
  function createRowData(): GradeRow[] {
    // Safety check
    if (!categoryStudents || categoryStudents.length === 0) {
      return [];
    }

    // Get grades once outside the loop to avoid triggering effects
    const allGrades = get(gradebookStore.grades);

    return categoryStudents.map((student) => {
      // Start with required fields
      const row: GradeRow = {
        studentId: student.id,
        student: student.name,
        average: 0,
      };

      // Add dynamic columns for each assignment
      if (categoryAssignments && categoryAssignments.length > 0) {
        categoryAssignments.forEach((assignment) => {
          if (assignment && assignment.id) {
            const grade = allGrades.find(
              (g) => g.studentId === student.id && g.assignmentId === assignment.id
            );
            row[assignment.id] = grade ? grade.points : null;
          }
        });
      }

      // Calculate average - avoid recalculating if we already know there are no assignments
      if (categoryAssignments.length > 0) {
        try {
          row.average = studentAverageInCategory(student.id, categoryId || '');
        } catch (err) {
          console.error('Error calculating average:', err);
          row.average = 0;
        }
      }

      return row;
    });
  }

  // Create column definitions with safety checks
  function createColumnDefs() {
    // Start with student column
    const colDefs: Array<import('@ag-grid-community/core').ColDef<GradeRow>> = [
      {
        headerName: 'Student',
        field: 'student',
        editable: false,
        pinned: 'left',
        minWidth: 180,
        cellStyle: {
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
        },
        resizable: true,
        lockPosition: true,
        suppressMovable: true,
        enableCellChangeFlash: false, // Fixed deprecated suppressCellFlash
      },
    ];

    // Add assignment columns if available
    if (categoryAssignments && categoryAssignments.length > 0) {
      const validAssignments = categoryAssignments.filter((a) => a?.name && a?.id);
      validAssignments.forEach((assignment) => {
        colDefs.push({
          headerName: assignment.name,
          field: assignment.id,
          editable: true,
          type: 'numericColumn',
          width: 120,
          headerTooltip: `Max Points: ${assignment.maxPoints}`,
          valueFormatter: (params: any) => {
            return params.value === null || params.value === undefined ? '' : params.value;
          },
          cellEditor: 'agTextCellEditor',
          cellEditorParams: {
            useFormatter: false,
            maxLength: 6,
            type: 'number',
          },
          cellStyle: {
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '12px',
            backgroundColor: 'rgba(54, 54, 54, 0.1)',
          },
          cellRendererParams: {
            cellEditorTemplate: 'agTextCellEditor',
            inputType: 'number',
          },
        });
      });
    }

    // Always add average column
    colDefs.push({
      headerName: 'Average',
      field: 'average',
      editable: false,
      type: 'numericColumn',
      minWidth: 120,
      pinned: 'right',
      valueFormatter: (params: any) => {
        return params.value ? `${params.value.toFixed(1)}%` : '–';
      },
      cellStyle: (params: any) => {
        // Change background color based on grade
        const val = params.value || 0;
        let bgColor = 'rgba(139, 92, 246, 0.2)'; // Default purple

        if (val >= 90) {
          bgColor = 'rgba(52, 211, 153, 0.2)'; // Green for A
        } else if (val >= 80) {
          bgColor = 'rgba(96, 165, 250, 0.2)'; // Blue for B
        } else if (val >= 70) {
          bgColor = 'rgba(251, 191, 36, 0.2)'; // Yellow for C
        } else if (val >= 60) {
          bgColor = 'rgba(249, 115, 22, 0.2)'; // Orange for D
        } else if (val > 0) {
          bgColor = 'rgba(239, 68, 68, 0.2)'; // Red for F
        }

        return {
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '12px',
          backgroundColor: bgColor,
          color: '#ffffff',
        };
      },
    });

    return colDefs;
  }

  onMount(async () => {
    // Ensure data is loaded when gradebook is accessed
    await gradebookStore.ensureDataLoaded();
    console.log('Gradebook data loaded');
  });

  // Pure reactive approach to handle initial category selection
  // Add this instead
  $effect(() => {
    if ($categories?.length > 0 && !categoryId) {
      console.log('Setting initial category reactively');
      gradebookStore.selectCategory($categories[0].id);
    }
  });

  function handleAddAssignment() {
    if (categoryId && assignmentName.trim()) {
      addAssignmentToCategory(assignmentName.trim(), maxPoints || 0, categoryId);
      assignmentName = '';
      maxPoints = 100;
    }
  }

  function handleAddStudent() {
    if (newStudentName.trim() && categoryId) {
      const studentId = addGlobalStudent(newStudentName.trim());
      if (studentId) {
        assignStudentToCategory(studentId, categoryId);
        newStudentName = '';
      }
    }
  }

  // Simple function to check if we can render the grid
  function hasData() {
    return rowData && rowData.length > 0;
  }
</script>

{#if $isLoading}
  <div class="flex items-center justify-center min-h-[500px]">
    <LoadingBounce />
  </div>
{:else if selectedCategory}
  <div
    class="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-dark-card mb-4"
  >
    <div class="p-4 border-b border-dark-border bg-dark-surface">
      <h3 class="font-medium text-white">{selectedCategory.name} - Grades</h3>
      <p class="text-dark-muted text-xs mt-1">
        Excel-like features: Click and drag to select cells, double-click to edit, Ctrl+C to copy,
        and Ctrl+V to paste. Use arrow keys to navigate between cells.
      </p>
    </div>
    <div class="h-[500px] ag-theme-alpine" data-ag-theme-mode="dark">
      <!-- Conditional rendering -->
      {#if hasData()}
        <!-- Use the component with name matching our import -->
        <AgGridSvelte
          {gridOptions}
          {rowData}
          {modules}
          style="width: 100%; height: 100%;"
          gridClass="ag-theme-alpine"
        />
      {:else}
        <div class="flex items-center justify-center h-full bg-dark-card">
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
{:else}
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
    <p class="text-dark-muted">Please select a class or create a new one to view grades.</p>
  </div>
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
