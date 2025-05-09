<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { AgGrid } from 'ag-grid-svelte5-extended';
	import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

	let categoryId = $state('');
	let assignmentName = $state('');
	let maxPoints = $state(100);
	let newStudentName = $state('');
	let rowData = $state([]);
	let columnDefs = $state([]);

	// Access store functions
	const {
		categories,
		getSelectedCategory,
		getStudentsInSelectedCategory,
		getAssignmentsForSelectedCategory,
		studentAverageInCategory,
		addAssignmentToCategory,
		recordGrade,
		addGlobalStudent,
		assignStudentToCategory
	} = gradebookStore;

	const selectedCategory = $derived($getSelectedCategory);
	const categoryStudents = $derived($getStudentsInSelectedCategory);
	const categoryAssignments = $derived($getAssignmentsForSelectedCategory);

	// Update data when relevant state changes
	$effect(() => {
		updateGridData();
	});

	// Simple functions with no nested effects
	function updateGridData() {
		// Create column definitions
		const cols = [
			{
				headerName: 'Student',
				field: 'student',
				editable: false,
				pinned: 'left',
				minWidth: 180,
				cellStyle: { fontWeight: 'bold' },
				resizable: true,
				lockPosition: true,
				suppressMovable: true
			}
		];

		// Add assignment columns
		categoryAssignments.forEach((assignment) => {
			cols.push({
				headerName: assignment.name,
				field: assignment.id,
				editable: true,
				type: 'numericColumn',
				width: 120,
				cellClass: 'editable-cell',
				headerTooltip: `Max Points: ${assignment.maxPoints}`,
				valueFormatter: (params) => {
					return params.value === null || params.value === undefined ? '' : params.value;
				},
				cellEditor: 'agTextCellEditor',
				cellEditorParams: {
					useFormatter: false
				},
				cellStyle: (params) => {
					if (params.value === null || params.value === undefined) {
						return { backgroundColor: 'rgba(0, 0, 0, 0.2)' };
					}
					return {};
				}
			});
		});

		// Add average column
		cols.push({
			headerName: 'Average',
			field: 'average',
			editable: false,
			type: 'numericColumn',
			pinned: 'right',
			lockPosition: true,
			suppressMovable: true,
			valueFormatter: (params) => {
				return params.value ? `${params.value.toFixed(1)}%` : '–';
			},
			cellStyle: {
				color: '#f3e8ff',
				fontWeight: 'bold',
				backgroundColor: 'rgba(99, 102, 241, 0.2)'
			}
		});

		columnDefs = cols;

		// Create rows
		const rows = [];
		categoryStudents.forEach((student) => {
			const row = {
				studentId: student.id,
				student: student.name
			};

			// Add assignment data
			const grades = get(gradebookStore.grades);
			categoryAssignments.forEach((assignment) => {
				const grade = grades.find(
					(g) => g.studentId === student.id && g.assignmentId === assignment.id
				);
				row[assignment.id] = grade ? grade.points : null;
			});

			// Calculate average
			row['average'] = studentAverageInCategory(student.id, categoryId || '');
			
			rows.push(row);
		});

		rowData = rows;
	}

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

	function onCellValueChanged(params) {
		const { data, colDef, newValue } = params;
		if (colDef.field !== 'student' && colDef.field !== 'average') {
			const studentId = data.studentId;
			const assignmentId = colDef.field;
			const value = newValue !== null && newValue !== undefined && newValue !== '' 
				? parseFloat(newValue) 
				: null;
			
			if (value === null || !isNaN(value)) {
				recordGrade(studentId, assignmentId, value);
			}
		}
	}

	// Grid options
	const gridOptions = {
		defaultColDef: {
			sortable: true,
			filter: true,
			resizable: true,
			editable: false,
			cellEditor: 'agTextCellEditor',
			cellEditorParams: {
				useFormatter: false
			},
			enableCellChangeFlash: true
		},
		rowSelection: 'multiple',
		undoRedoCellEditing: true,
		enableCellTextSelection: true,
		ensureDomOrder: true,
		enterNavigatesVertically: true,
		enterNavigatesVerticallyAfterEdit: true,
		copyHeadersToClipboard: true,
		clipboardDelimiter: '\t',
		onCellValueChanged,
		getRowId: (params) => params.data.studentId
	};

	// Try to create a sample student if none exist
	function addSampleData() {
		if (categoryId && categoryStudents.length === 0) {
			const studentId = addGlobalStudent('Sample Student');
			if (studentId) assignStudentToCategory(studentId, categoryId);
		}
		
		if (categoryId && categoryAssignments.length === 0) {
			addAssignmentToCategory('Homework 1', 50, categoryId);
		}
	}

	// Initialize on component mount
	onMount(() => {
		const cats = get(categories);
		if (cats.length > 0 && !categoryId) {
			categoryId = cats[0].id;
			gradebookStore.selectCategory(categoryId);
			setTimeout(addSampleData, 300);
		}
	});

	// Module for grid
	const modules = [ClientSideRowModelModule];
</script>

<!-- PowerSchool Pro style layout with nav tabs -->
<div class="bg-dark-surface rounded-xl overflow-hidden border border-dark-border shadow-lg mb-6">
	<!-- Top bar with class name and actions -->
	<div class="flex justify-between items-center p-4 border-b border-dark-border">
		<div>
			<h1 class="text-xl font-bold text-white">
				{selectedCategory ? selectedCategory.name : 'No Class Selected'}
			</h1>
			<p class="text-dark-muted text-xs">Gradebook</p>
		</div>
		
		<div class="flex gap-2">
			<button class="px-3 py-1.5 bg-dark-purple hover:bg-dark-accent text-white rounded-lg text-sm transition">
				Export Grades
			</button>
			<button class="px-3 py-1.5 bg-dark-card hover:bg-dark-highlight text-white rounded-lg text-sm transition">
				Print View
			</button>
		</div>
	</div>
	
	<!-- Navigation tabs -->
	<div class="flex border-b border-dark-border bg-dark-card">
		<button class="px-4 py-2.5 text-sm font-medium text-white bg-dark-purple">Grades</button>
		<button class="px-4 py-2.5 text-sm font-medium text-dark-muted hover:text-white hover:bg-dark-highlight transition">Assignments</button>
		<button class="px-4 py-2.5 text-sm font-medium text-dark-muted hover:text-white hover:bg-dark-highlight transition">Students</button>
		<button class="px-4 py-2.5 text-sm font-medium text-dark-muted hover:text-white hover:bg-dark-highlight transition">Settings</button>
	</div>

	<!-- Main content area -->
	{#if selectedCategory}
		<div>
			<!-- Info banner -->
			<div class="bg-dark-highlight/10 p-3 border-b border-dark-border">
				<p class="text-dark-muted text-xs">
					<span class="text-dark-lavender font-medium">Excel-like features:</span> 
					Click and drag to select cells, double-click to edit, Ctrl+C to copy,
					and Ctrl+V to paste. Use arrow keys to navigate between cells.
				</p>
			</div>
			
			<!-- Grid -->
			<div class="h-[500px] w-full">
				<AgGrid
					gridClass="ag-theme-material w-full h-full"
					{gridOptions}
					{rowData}
					{columnDefs}
					{modules}
				/>
			</div>
		</div>
	{:else}
		<div class="bg-dark-card p-8 text-center">
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
</div>

<!-- Quick actions cards -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
	<!-- Assignment Statistics Card -->
	{#if selectedCategory}
		<div class="bg-dark-card border border-dark-border rounded-xl p-4">
			<h3 class="font-medium text-white mb-3 flex items-center">
				<svg class="w-5 h-5 mr-2 text-dark-lavender" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
				</svg>
				Class Statistics
			</h3>
			<div class="grid grid-cols-2 gap-4">
				<div class="bg-dark-surface rounded-lg p-3">
					<p class="text-dark-muted text-xs">Students</p>
					<p class="text-2xl font-bold text-white">{categoryStudents.length}</p>
				</div>
				<div class="bg-dark-surface rounded-lg p-3">
					<p class="text-dark-muted text-xs">Assignments</p>
					<p class="text-2xl font-bold text-white">{categoryAssignments.length}</p>
				</div>
				<div class="bg-dark-surface rounded-lg p-3">
					<p class="text-dark-muted text-xs">Class Average</p>
					<p class="text-2xl font-bold text-dark-lavender">
						{categoryStudents.length > 0 ? 
							(categoryStudents.reduce((sum, student) => sum + studentAverageInCategory(student.id, categoryId), 0) / categoryStudents.length).toFixed(1) + '%' 
							: '–'}
					</p>
				</div>
				<div class="bg-dark-surface rounded-lg p-3">
					<p class="text-dark-muted text-xs">Last Updated</p>
					<p class="text-sm font-medium text-white">{new Date().toLocaleDateString()}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Add assignment form -->
	{#if selectedCategory}
		<div class="bg-dark-card border border-dark-border rounded-xl p-4">
			<h3 class="font-medium text-white mb-3 flex items-center">
				<svg class="w-5 h-5 mr-2 text-dark-lavender" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
				</svg>
				Add Assignment
			</h3>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="assignmentName" class="block text-dark-muted text-sm mb-1">Name</label>
					<input
						id="assignmentName"
						type="text"
						bind:value={assignmentName}
						class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm"
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
						class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm"
					/>
				</div>
				<div class="col-span-2">
					<button
						on:click={handleAddAssignment}
						class="w-full bg-dark-purple hover:bg-dark-accent text-white p-2 rounded-lg text-sm transition"
					>
						Add Assignment
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Add student form -->
{#if selectedCategory}
	<div class="bg-dark-card border border-dark-border rounded-xl p-4 mb-6">
		<h3 class="font-medium text-white mb-3 flex items-center">
			<svg class="w-5 h-5 mr-2 text-dark-lavender" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
			</svg>
			Add Student to {selectedCategory.name}
		</h3>
		<div class="flex gap-4">
			<div class="flex-grow">
				<label for="studentName" class="block text-dark-muted text-sm mb-1">Student Name</label>
				<input
					id="studentName"
					type="text"
					bind:value={newStudentName}
					class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 text-sm"
					placeholder="e.g. John Smith"
				/>
			</div>
			<div class="w-40 flex items-end">
				<button
					on:click={handleAddStudent}
					class="w-full bg-dark-purple hover:bg-dark-accent text-white p-2 rounded-lg text-sm transition"
				>
					Add Student
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- Tips and help section -->
<div class="bg-dark-surface border border-dark-border rounded-xl p-4 mb-6">
	<h3 class="font-medium text-white mb-2 flex items-center">
		<svg class="w-5 h-5 mr-2 text-dark-lavender" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
		</svg>
		Gradebook Tips
	</h3>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
		<div>
			<p class="text-dark-muted mb-2">
				<span class="text-white font-medium">Quick Cell Editing:</span> Double-click on any cell to edit grades directly.
			</p>
			<p class="text-dark-muted">
				<span class="text-white font-medium">Keyboard Navigation:</span> Use arrow keys to move between cells after editing.
			</p>
		</div>
		<div>
			<p class="text-dark-muted mb-2">
				<span class="text-white font-medium">Copy and Paste:</span> Use Ctrl+C and Ctrl+V to copy and paste values between cells.
			</p>
			<p class="text-dark-muted">
				<span class="text-white font-medium">Empty Grades:</span> Leave a cell blank for ungraded assignments.
			</p>
		</div>
	</div>
</div>

<style>
/* Basic styling for AG Grid dark theme */
:global(.ag-theme-material) {
  --ag-background-color: #121212 !important;
  --ag-header-background-color: #1e1e1e !important;
  --ag-odd-row-background-color: #0a0a0a !important;
  --ag-foreground-color: #e0e0e0 !important;
  --ag-header-foreground-color: #ffffff !important;
  --ag-border-color: #333333 !important;
  --ag-row-border-color: #333333 !important;
  --ag-row-hover-color: #2a2a2a !important;
}

/* Force dark styling on critical elements */
:global(.ag-theme-material .ag-root-wrapper),
:global(.ag-theme-material .ag-root),
:global(.ag-theme-material .ag-header) {
  background-color: #121212 !important;
}
</style>