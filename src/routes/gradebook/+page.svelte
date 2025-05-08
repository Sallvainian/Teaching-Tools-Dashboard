<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	let categoryId: string = '';
	let assignmentName = '';
	let maxPoints: number = 100;
	let inputMap: Record<string, string> = {};
	let newStudentName = '';

	// We'll use a simpler approach since AG Grid is causing compatibility issues

	// Access the store
	const { 
		categories,
		getCategories,
		getGlobalStudents,
		getSelectedCategory,
		getStudentsInSelectedCategory,
		getAssignmentsForSelectedCategory,
		studentAverageInCategory,
		addAssignmentToCategory,
		recordGrade,
		addGlobalStudent,
		assignStudentToCategory
	} = gradebookStore;

	// Derived values
	$: selectedCategory = $getSelectedCategory;
	$: categoryStudents = $getStudentsInSelectedCategory;
	$: categoryAssignments = $getAssignmentsForSelectedCategory;
	$: allStudents = $getGlobalStudents;

	// Since we had compatibility issues with AG Grid, I'll create a simpler solution for multi-select, copy/paste
	
	// State for enhanced copy/paste functionality
	let selectedCells: [string, string][] = []; // [studentId, assignmentId]
	let selectionStart: [string, string] | null = null;
	
	// Function to handle cell selection
	function selectCell(e: MouseEvent, studentId: string, assignmentId: string) {
		if (e.shiftKey && selectionStart) {
			// Range selection with shift
			const students = categoryStudents.map(s => s.id);
			const assignments = categoryAssignments.map(a => a.id);
			
			const startStudentIndex = students.indexOf(selectionStart[0]);
			const endStudentIndex = students.indexOf(studentId);
			const startAssignmentIndex = assignments.indexOf(selectionStart[1]);
			const endAssignmentIndex = assignments.indexOf(assignmentId);
			
			// Get range bounds
			const minStudentIndex = Math.min(startStudentIndex, endStudentIndex);
			const maxStudentIndex = Math.max(startStudentIndex, endStudentIndex);
			const minAssignmentIndex = Math.min(startAssignmentIndex, endAssignmentIndex);
			const maxAssignmentIndex = Math.max(startAssignmentIndex, endAssignmentIndex);
			
			// Create range selection
			selectedCells = [];
			for (let i = minStudentIndex; i <= maxStudentIndex; i++) {
				for (let j = minAssignmentIndex; j <= maxAssignmentIndex; j++) {
					selectedCells.push([students[i], assignments[j]]);
				}
			}
		} else if (e.ctrlKey) {
			// Add to selection with Ctrl
			const cellKey = `${studentId}-${assignmentId}`;
			const exists = selectedCells.some(([s, a]) => `${s}-${a}` === cellKey);
			
			if (exists) {
				// Remove if already selected
				selectedCells = selectedCells.filter(([s, a]) => `${s}-${a}` !== cellKey);
			} else {
				// Add to selection
				selectedCells = [...selectedCells, [studentId, assignmentId]];
			}
		} else {
			// Simple selection (replaces current selection)
			selectedCells = [[studentId, assignmentId]];
			selectionStart = [studentId, assignmentId];
		}
	}
	
	// Function to check if a cell is selected
	function isCellSelected(studentId: string, assignmentId: string): boolean {
		return selectedCells.some(([s, a]) => s === studentId && a === assignmentId);
	}
	
	// Function to copy selected cell values
	function copySelectedCells() {
		if (!selectedCells.length) return;
		
		// Group selected cells by student (row)
		const cellsByStudent = selectedCells.reduce((acc, [studentId, assignmentId]) => {
			if (!acc[studentId]) {
				acc[studentId] = [];
			}
			acc[studentId].push(assignmentId);
			return acc;
		}, {} as Record<string, string[]>);
		
		// Get all unique student IDs and sort them by their order in categoryStudents
		const studentIdsByIndex = Object.keys(cellsByStudent).sort((a, b) => {
			const indexA = categoryStudents.findIndex(s => s.id === a);
			const indexB = categoryStudents.findIndex(s => s.id === b);
			return indexA - indexB;
		});
		
		// For each student, get their selected assignment values
		const rows: string[] = [];
		studentIdsByIndex.forEach(studentId => {
			const assignmentIds = cellsByStudent[studentId].sort((a, b) => {
				const indexA = categoryAssignments.findIndex(asmt => asmt.id === a);
				const indexB = categoryAssignments.findIndex(asmt => asmt.id === b);
				return indexA - indexB;
			});
			
			const rowData: string[] = assignmentIds.map(assignmentId => {
				return inputMap[`${studentId}-${assignmentId}`] || '';
			});
			
			rows.push(rowData.join('\t'));
		});
		
		// Create TSV content
		const tsvContent = rows.join('\n');
		
		// Copy to clipboard
		navigator.clipboard.writeText(tsvContent)
			.then(() => {
				console.log('Copied to clipboard');
			})
			.catch(err => {
				console.error('Error copying to clipboard:', err);
			});
	}
	
	// Function to handle keyboard shortcuts
	function handleKeyDown(e: KeyboardEvent) {
		// Only handle events when focus is in the grade table
		if (!e.target || !(e.target as HTMLElement).closest('.grade-table')) return;
		
		// Copy with Ctrl+C
		if (e.ctrlKey && e.key === 'c') {
			e.preventDefault();
			copySelectedCells();
		}
		
		// Select all with Ctrl+A
		if (e.ctrlKey && e.key === 'a') {
			e.preventDefault();
			selectAllCells();
		}
	}
	
	// Function to select all cells
	function selectAllCells() {
		selectedCells = [];
		categoryStudents.forEach(student => {
			categoryAssignments.forEach(assignment => {
				selectedCells.push([student.id, assignment.id]);
			});
		});
	}
	
	// Function to paste from clipboard
	async function handlePaste(e: ClipboardEvent) {
		// Only handle paste events when focus is in the grade table
		if (!e.target || !(e.target as HTMLElement).closest('.grade-table')) return;
		
		e.preventDefault();
		
		// Get clipboard text
		let text = '';
		if (e.clipboardData) {
			text = e.clipboardData.getData('text/plain');
		}
		
		if (!text || !selectedCells.length) return;
		
		// Parse clipboard text into rows and cells
		const rows = text.split(/\r?\n/);
		const data = rows.map(row => row.split('\t'));
		
		// Get starting cell
		const [startStudentId, startAssignmentId] = selectedCells[0];
		
		// Get starting indexes
		const startStudentIndex = categoryStudents.findIndex(s => s.id === startStudentId);
		const startAssignmentIndex = categoryAssignments.findIndex(a => a.id === startAssignmentId);
		
		// Paste data
		data.forEach((rowData, rowOffset) => {
			rowData.forEach((cellValue, colOffset) => {
				const targetStudentIndex = startStudentIndex + rowOffset;
				const targetAssignmentIndex = startAssignmentIndex + colOffset;
				
				// Ensure we don't go out of bounds
				if (targetStudentIndex < categoryStudents.length && targetAssignmentIndex < categoryAssignments.length) {
					const studentId = categoryStudents[targetStudentIndex].id;
					const assignmentId = categoryAssignments[targetAssignmentIndex].id;
					
					// Update grade
					handleGradeInput(studentId, assignmentId, cellValue);
				}
			});
		});
	}
	
	// Add event listeners
	onMount(() => {
		const cats = get(categories);
		if (cats.length > 0 && !categoryId) {
			categoryId = cats[0].id;
			gradebookStore.selectCategory(categoryId);
		}
		
		// Add event listeners for keyboard shortcuts
		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('paste', handlePaste);
		
		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('paste', handlePaste);
		};
	});

	function handleAddAssignment() {
		if (categoryId && assignmentName.trim()) {
			addAssignmentToCategory(assignmentName.trim(), maxPoints, categoryId);
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

	function handleGradeInput(studentId: string, assignmentId: string, value: string) {
		inputMap[`${studentId}-${assignmentId}`] = value;
		const num = parseFloat(value);
		if (!isNaN(num)) {
			recordGrade(studentId, assignmentId, num);
		}
	}

	function getStudentById(id: string) {
		return allStudents.find(s => s.id === id);
	}

	// The spreadsheet-like functionality is now handled by AG Grid
</script>

<!-- Page header with controls -->
<div class="mb-8">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-2xl font-bold text-white mb-1">Gradebook</h1>
			<p class="text-dark-muted">Manage student assignments and grades</p>
		</div>
		
		<div class="flex gap-3">
			<button 
				class="flex items-center gap-2 px-4 py-2 bg-dark-card border border-dark-border rounded-lg text-gray-300 hover:bg-dark-accent hover:text-white transition"
			>
				<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				<span>Export</span>
			</button>
			
			<button 
				class="flex items-center gap-2 px-4 py-2 bg-dark-purple text-white rounded-lg hover:bg-dark-accent transition"
				on:click={() => {
					if (confirm("Are you sure you want to reset all gradebook data? This action cannot be undone.")) {
						gradebookStore.clearAllData();
					}
				}}
			>
				<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
				<span>Reset Data</span>
			</button>
		</div>
	</div>
	
	<!-- Filter controls -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
		<div class="bg-dark-card p-4 rounded-xl border border-dark-border">
			<label for="category" class="block text-sm text-dark-lavender font-medium mb-2">Class</label>
			<select 
				id="category" 
				bind:value={categoryId} 
				on:change={() => gradebookStore.selectCategory(categoryId)} 
				class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
			>
				{#each $getCategories as cat}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>
		
		<div class="bg-dark-card p-4 rounded-xl border border-dark-border">
			<label for="gradingPeriod" class="block text-sm text-dark-lavender font-medium mb-2">Grading Period</label>
			<select id="gradingPeriod" class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple">
				<option>All Periods</option>
				<option>Quarter 1</option>
				<option>Quarter 2</option>
				<option>Quarter 3</option>
				<option>Quarter 4</option>
			</select>
		</div>
		
		<div class="bg-dark-card p-4 rounded-xl border border-dark-border">
			<label for="assignmentType" class="block text-sm text-dark-lavender font-medium mb-2">Assignment Type</label>
			<select id="assignmentType" class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple">
				<option>All Types</option>
				<option>Homework</option>
				<option>Quiz</option>
				<option>Test</option>
				<option>Project</option>
			</select>
		</div>
		
		<div class="bg-dark-card p-4 rounded-xl border border-dark-border">
			<label for="viewType" class="block text-sm text-dark-lavender font-medium mb-2">View</label>
			<select id="viewType" class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple">
				<option>Grade Table</option>
				<option>Student Report</option>
				<option>Assignment Report</option>
			</select>
		</div>
	</div>
</div>

<!-- Add Student Card -->
<div class="bg-dark-card border border-dark-border p-6 rounded-xl mb-8 shadow-dark-card">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-lg font-semibold text-white">Add New Student</h2>
		<button class="text-dark-lavender hover:text-dark-highlight" aria-label="Student information">
			<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</button>
	</div>
	<div class="flex gap-4">
		<div class="flex-grow">
			<label for="newStudentName" class="block text-sm text-dark-lavender font-medium mb-2">Student Name</label>
			<input
				id="newStudentName"
				type="text"
				placeholder="Enter student name"
				bind:value={newStudentName}
				class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"
			/>
		</div>
		<div class="self-end">
			<button 
				on:click={handleAddStudent} 
				class="w-full px-4 py-3 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple"
			>
				Add Student
			</button>
		</div>
	</div>
</div>

<!-- Add Assignment Card -->
<div class="bg-dark-card border border-dark-border p-6 rounded-xl mb-8 shadow-dark-card">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-lg font-semibold text-white">Add New Assignment</h2>
		<button class="text-dark-lavender hover:text-dark-highlight" aria-label="Assignment information">
			<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</button>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div>
			<label for="assignmentName" class="block text-sm text-dark-lavender font-medium mb-2">Assignment Name</label>
			<input
				id="assignmentName"
				type="text"
				placeholder="Enter assignment name"
				bind:value={assignmentName}
				class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"
			/>
		</div>
		<div>
			<label for="maxPoints" class="block text-sm text-dark-lavender font-medium mb-2">Maximum Points</label>
			<input
				id="maxPoints"
				type="number"
				min="0"
				placeholder="Points"
				bind:value={maxPoints}
				class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"
			/>
		</div>
		<div class="flex items-end">
			<button 
				on:click={handleAddAssignment} 
				class="w-full px-4 py-3 bg-dark-highlight text-dark-purple font-medium rounded-lg hover:bg-dark-lavender transition focus:ring-2 focus:ring-offset-2 focus:ring-dark-purple"
			>
				Add Assignment
			</button>
		</div>
	</div>
</div>

<!-- Enhanced Grade Table with Copy/Paste -->
{#if selectedCategory}
	<div class="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-dark-card mb-4">
		<div class="p-4 border-b border-dark-border bg-dark-surface">
			<h3 class="font-medium text-white">{selectedCategory.name} - Grades</h3>
			<p class="text-dark-muted text-xs mt-1">
				Spreadsheet features: Click a cell, then use Shift+Click for range selection, Ctrl+C to copy, and Ctrl+V to paste.
			</p>
		</div>
		<div class="overflow-x-auto grade-table">
			<table class="w-full text-left">
				<thead>
					<tr class="bg-dark-surface text-dark-muted text-xs uppercase tracking-wider">
						<th class="px-6 py-3 border-b border-dark-border">Student</th>
						{#each categoryAssignments as a}
							<th class="px-6 py-3 border-b border-dark-border">{a.name}</th>
						{/each}
						<th class="px-6 py-3 border-b border-dark-border">Average</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-dark-border">
					{#each categoryStudents as student}
						<tr class="hover:bg-dark-surface transition-colors">
							<td class="px-6 py-4 whitespace-nowrap font-medium text-white">{student.name}</td>
							{#each categoryAssignments as a}
								<td class="px-6 py-4 whitespace-nowrap">
									<input
										type="number"
										min="0"
										class="w-16 px-3 py-1 rounded-lg bg-dark-surface text-white border border-dark-border focus:ring-2 focus:ring-dark-purple focus:border-dark-purple grade-cell {isCellSelected(student.id, a.id) ? 'cell-selected' : ''}"
										bind:value={inputMap[`${student.id}-${a.id}`]}
										on:input={(e) => handleGradeInput(student.id, a.id, (e.target as HTMLInputElement).value)}
										on:mousedown={(e) => selectCell(e, student.id, a.id)}
									/>
								</td>
							{/each}
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-3 py-1 rounded-full bg-dark-purple text-white font-medium">
									{Math.round(studentAverageInCategory(student.id, categoryId) * 10) / 10 || '–'}%
								</span>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan={categoryAssignments.length + 2} class="px-6 py-4 text-center text-dark-muted">
								No students in this class yet. Add some students above!
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
{:else}
	<div class="bg-dark-card border border-dark-border p-8 rounded-xl text-center">
		<svg class="w-16 h-16 mx-auto text-dark-muted mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
		</svg>
		<h3 class="text-lg font-medium text-white mb-2">No Class Selected</h3>
		<p class="text-dark-muted">Please select a class or create a new one to view grades.</p>
	</div>
{/if}

<style>
	/* Cell selection styles */
	.cell-selected {
		outline: 2px solid #8B5CF6;
		outline-offset: -2px;
		z-index: 10;
	}
	
	/* Make the grade table a focus target */
	.grade-table {
		position: relative;
	}
</style>