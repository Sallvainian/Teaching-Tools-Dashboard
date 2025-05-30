<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import { authStore } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import LoadingBounce from '$lib/components/LoadingBounce.svelte';
	import ImportWizard from '$lib/components/ImportWizard.svelte';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';

	// Lazy load Handsontable component
	let Handsontable = $state<any>(null);
	let handsontableLoading = $state(true);

	onMount(async () => {
		if (browser) {
			const module = await import('$lib/components/Handsontable.svelte');
			Handsontable = module.default;
			handsontableLoading = false;
		}
	});

	// State variables using $state
	let classId = $state('');
	let assignmentName = $state('');
	let maxPoints = $state(100);
	let newStudentName = $state('');
	let newClassName = $state('');
	let showNewClassModal = $state(false);
	let showNewAssignmentModal = $state(false);
	let hotInstance = $state<any>(null);
	let showStudentModal = $state(false);
	let showImportModal = $state(false);
	let showDeleteConfirm = $state('');

	// Reactive values using $derived
	let selectedClass = $derived($gradebookStore.getSelectedClass);
	let classStudents = $derived($gradebookStore.getStudentsInSelectedClass);
	let classAssignments = $derived($gradebookStore.getAssignmentsForSelectedClass);
	let allGrades = $derived($gradebookStore.grades || []);

	// Create reactive data and headers for Handsontable
	let hotData = $derived(createTableData());
	let columnHeaders = $derived(createColumnHeaders());

	// Table functions
	function createTableData() {
		if (!classStudents || classStudents.length === 0) {
			return [];
		}

		return classStudents.map((student, index) => {
			// Start with student number and name
			const row: (string | number | null)[] = [index + 1, student.name];

			// Add grades for each assignment
			if (classAssignments && classAssignments.length > 0) {
				classAssignments.forEach((assignment) => {
					const grade = allGrades.find(
						(g) => g.studentId === student.id && g.assignmentId === assignment.id
					);
					row.push(grade ? grade.points : null);
				});
			}

			// Add average at the end
			try {
				const average = gradebookStore.studentAverageInClass(student.id, classId || '');
				row.push(average);
			} catch (err) {
				console.error('Error calculating average:', err);
				row.push(0);
			}

			return row;
		});
	}

	function createColumnHeaders(): string[] {
		const headers = ['#', 'Student Name'];

		// Add assignment headers
		if (classAssignments && classAssignments.length > 0) {
			classAssignments.forEach((assignment) => {
				headers.push(`${assignment.name} (${assignment.maxPoints})`);
			});
		}

		// Add average header
		headers.push('Average');

		return headers;
	}

	// Grade color coding for visual feedback
	function getCellBackgroundColor(value: number | null): string {
		if (value === null || value === undefined) return 'transparent';
		if (value >= 90) return 'rgba(34, 197, 94, 0.2)'; // Green for A
		if (value >= 80) return 'rgba(96, 165, 250, 0.2)'; // Blue for B
		if (value >= 70) return 'rgba(251, 191, 36, 0.2)'; // Yellow for C
		if (value >= 60) return 'rgba(249, 115, 22, 0.2)'; // Orange for D
		return 'rgba(239, 68, 68, 0.2)'; // Red for F
	}

	// Handle table events
	async function handleAfterChange(event: any) {
		const { changes, source } = event.detail;

		if (source === 'edit' && changes) {
			for (const [row, col, oldValue, newValue] of changes) {
				// Skip the first two columns (# and Name) and the Average column
				if (col <= 2) continue;

				// Get the corresponding student and assignment
				const student = classStudents[row];
				// Adjust column index to match assignments array (subtract 3 to account for #, Name, and Average columns)
				const assignmentIndex = col - 3;
				const assignment = classAssignments[assignmentIndex];

				if (student && assignment) {
					// Record the grade
					await gradebookStore.recordGrade(student.id, assignment.id, parseFloat(newValue) || 0);
				}
			}
		}
	}

	function handleTableInit(event: any) {
		hotInstance = event.detail.hotInstance;
	}

	onMount(async () => {
		// Ensure data is loaded when gradebook is accessed
		await gradebookStore.ensureDataLoaded();
	});

	// Handle initial class selection with $effect
	$effect(() => {
		if ($gradebookStore.classes?.length > 0 && !classId) {
			void gradebookStore.selectClass($gradebookStore.classes[0].id);
			classId = $gradebookStore.classes[0].id;
		}
	});

	async function handleAddAssignment() {
		if (classId && assignmentName.trim()) {
			await gradebookStore.addAssignmentToClass(assignmentName.trim(), maxPoints || 0, classId);
			assignmentName = '';
			maxPoints = 100;
			showNewAssignmentModal = false;
		}
	}

	async function handleAddStudent() {
		if (newStudentName.trim() && classId) {
			// Get current user id
			const currentUser = $authStore.user;
			if (currentUser) {
				const studentId = await gradebookStore.addGlobalStudent(
					newStudentName.trim(),
					currentUser.id
				);
				if (studentId) {
					await gradebookStore.assignStudentToClass(studentId, classId);
					newStudentName = '';
					showStudentModal = false;
				}
			} else {
				console.error('No authenticated user found');
			}
		}
	}

	async function handleAddClass() {
		if (newClassName.trim()) {
			// Get the current user ID from auth store
			const currentUser = $authStore.user;
			if (currentUser) {
				await gradebookStore.addClass(newClassName.trim(), currentUser.id);
				newClassName = '';
				showNewClassModal = false;
			} else {
				console.error('No authenticated user found');
			}
		}
	}

	async function handleDeleteClass(classIdToDelete: string) {
		if (
			confirm(
				'Are you sure you want to delete this class? This will also delete all assignments and grades for this class.'
			)
		) {
			await gradebookStore.deleteClass(classIdToDelete);
			// If we deleted the selected class, clear the selection
			if (classId === classIdToDelete) {
				classId = '';
			}
		}
	}

	async function handleImportClasses() {
		showImportModal = true;
	}

	async function handleImportComplete() {
		showImportModal = false;
		// Refresh data
		await gradebookStore.loadAllData();
	}

	// Function to toggle the new class modal
	function toggleNewClassModal() {
		showNewClassModal = !showNewClassModal;
		if (showNewClassModal) {
			newClassName = '';
		}
	}

	// Watch for class selection changes
	$effect(() => {
		if (classId) {
			gradebookStore.selectClass(classId);
		}
	});
</script>

<div class="min-h-screen bg-bg-base">
	<div class="container mx-auto px-4 py-8">
		<!-- Page Header -->
		<div class="mb-8">
			<div class="flex items-center gap-4">
				<div class="p-3 bg-purple-bg rounded-lg">
					<svg
						class="w-8 h-8 text-highlight"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						></path>
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
						<label for="class-selector" class="block text-sm font-medium text-text-base mb-2"
							>Select Class</label
						>
						<div class="flex gap-2">
							<select id="class-selector" class="select w-full" bind:value={classId}>
								<option value="" disabled>Select a class</option>
								{#each $gradebookStore.classes as cls (cls.id)}
									<option value={cls.id}>{cls.name}</option>
								{/each}
							</select>
							<button
								onclick={toggleNewClassModal}
								class="btn btn-primary"
								aria-label="Create new class"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M12 5v14M5 12h14"></path>
								</svg>
							</button>
							<button
								onclick={handleImportClasses}
								class="btn btn-secondary"
								aria-label="Import classes"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
									<polyline points="7,10 12,15 17,10"></polyline>
									<line x1="12" y1="15" x2="12" y2="3"></line>
								</svg>
							</button>
							{#if selectedClass}
								<button
									onclick={() => handleDeleteClass(selectedClass.id)}
									class="btn btn-danger"
									aria-label="Delete class"
								>
									<svg
										class="w-5 h-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<polyline points="3,6 5,6 21,6"></polyline>
										<path
											d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
										></path>
										<line x1="10" y1="11" x2="10" y2="17"></line>
										<line x1="14" y1="11" x2="14" y2="17"></line>
									</svg>
								</button>
							{/if}
						</div>
					</div>
				</div>

				{#if selectedClass}
					<div class="flex gap-2">
						<button class="btn btn-primary" onclick={() => (showNewAssignmentModal = true)}>
							<svg
								class="w-5 h-5 mr-2"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
								<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
							</svg>
							New Assignment
						</button>

						<button class="btn btn-secondary" onclick={() => (showStudentModal = true)}>
							<svg
								class="w-5 h-5 mr-2"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
								<circle cx="12" cy="7" r="4"></circle>
							</svg>
							Add Student
						</button>
					</div>
				{/if}
			</div>

			{#if selectedClass}
				<div class="card-dark mb-6">
					<div class="flex justify-between items-center mb-6">
						<div>
							<h2 class="text-xl font-bold text-highlight">{selectedClass.name}</h2>
							<p class="text-text-base text-sm mt-1">
								{classStudents.length} student{classStudents.length !== 1 ? 's' : ''} •
								{classAssignments.length} assignment{classAssignments.length !== 1 ? 's' : ''}
							</p>
						</div>

						<div class="flex gap-2">
							<button class="btn btn-sm btn-secondary">
								<svg
									class="w-4 h-4 mr-1"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"></path>
									<polyline points="17,8 12,3 7,8"></polyline>
									<line x1="12" y1="3" x2="12" y2="15"></line>
								</svg>
								Export
							</button>
						</div>
					</div>

					{#if classStudents.length > 0 && classAssignments.length > 0}
						<div class="overflow-x-auto">
							{#if handsontableLoading || !Handsontable}
								<SkeletonLoader type="table" />
							{:else}
								{@const Component = Handsontable}
								<Component
									data={hotData}
									colHeaders={columnHeaders}
									rowHeaders={false}
									width="100%"
									height={400}
									settings={{
										stretchH: 'all',
										manualRowResize: true,
										manualColumnResize: true,
										contextMenu: false,
										readOnly: false,
										cells: (row: number, col: number) => {
											// Make first two columns and last column read-only
											if (col === 0 || col === 1 || col === columnHeaders.length - 1) {
												return { readOnly: true };
											}
											return {};
										},
										afterChange: handleAfterChange,
										afterInit: handleTableInit,
										beforeRenderer: (
											instance: any,
											td: HTMLTableCellElement,
											row: number,
											col: number,
											prop: string,
											value: any,
											_cellProperties: any
										) => {
											// Apply grade color coding to grade cells
											if (col > 1 && col < columnHeaders.length - 1 && typeof value === 'number') {
												td.style.backgroundColor = getCellBackgroundColor(value);
											}
											// Apply average color coding to last column
											if (col === columnHeaders.length - 1 && typeof value === 'number') {
												td.style.backgroundColor = getCellBackgroundColor(value);
												td.style.fontWeight = 'bold';
											}
										}
									}}
								/>
							{/if}
						</div>
					{:else if classStudents.length === 0}
						<div class="text-center py-12">
							<svg
								class="w-16 h-16 text-muted mx-auto mb-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
								<circle cx="12" cy="7" r="4"></circle>
							</svg>
							<h3 class="text-lg font-medium text-text-base mb-2">No students in this class</h3>
							<p class="text-muted mb-4">Add students to start recording grades</p>
							<button class="btn btn-primary" onclick={() => (showStudentModal = true)}>
								Add Student
							</button>
						</div>
					{:else if classAssignments.length === 0}
						<div class="text-center py-12">
							<svg
								class="w-16 h-16 text-muted mx-auto mb-4"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
								<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
							</svg>
							<h3 class="text-lg font-medium text-text-base mb-2">No assignments in this class</h3>
							<p class="text-muted mb-4">Create assignments to start recording grades</p>
							<button class="btn btn-primary" onclick={() => (showNewAssignmentModal = true)}>
								New Assignment
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="text-center py-12">
					<svg
						class="w-16 h-16 text-muted mx-auto mb-4"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						></path>
					</svg>
					<h3 class="text-lg font-medium text-text-base mb-2">No class selected</h3>
					<p class="text-muted mb-4">Select a class from the dropdown above or create a new one</p>
					<button class="btn btn-primary" onclick={toggleNewClassModal}>Create New Class</button>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- New Class Modal -->
{#if showNewClassModal}
	<div
		class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
		onclick={(e) => e.target === e.currentTarget && toggleNewClassModal()}
		onkeydown={(e) => e.key === 'Escape' && toggleNewClassModal()}
		role="dialog"
		aria-modal="true"
		aria-label="Create new class"
		tabindex="0"
	>
		<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
			<h2 class="text-xl font-bold text-highlight mb-4">Create New Class</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleAddClass();
				}}
			>
				<div class="mb-4">
					<label for="new-class-name" class="block text-sm font-medium text-text-base mb-2">
						Class Name
					</label>
					<input
						id="new-class-name"
						type="text"
						bind:value={newClassName}
						placeholder="e.g., Math 101, Science 6B"
						class="input w-full"
						required
					/>
				</div>
				<div class="flex justify-end gap-3">
					<button type="button" onclick={toggleNewClassModal} class="btn btn-secondary">
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={!newClassName.trim()}>
						Create Class
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Import Modal -->
{#if showImportModal}
	<ImportWizard
		isOpen={showImportModal}
		onClose={() => (showImportModal = false)}
		onComplete={handleImportComplete}
	/>
{/if}

<!-- New Assignment Modal -->
{#if showNewAssignmentModal}
	<div
		class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
		onclick={(e) => e.target === e.currentTarget && (showNewAssignmentModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showNewAssignmentModal = false)}
		role="dialog"
		aria-modal="true"
		aria-label="Create new assignment"
		tabindex="0"
	>
		<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
			<h2 class="text-xl font-bold text-highlight mb-4">Create New Assignment</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleAddAssignment();
				}}
			>
				<div class="mb-4">
					<label for="assignment-name" class="block text-sm font-medium text-text-base mb-2">
						Assignment Name
					</label>
					<input
						id="assignment-name"
						type="text"
						bind:value={assignmentName}
						placeholder="e.g., Quiz 1, Homework 3"
						class="input w-full"
						required
					/>
				</div>
				<div class="mb-4">
					<label for="max-points" class="block text-sm font-medium text-text-base mb-2">
						Maximum Points
					</label>
					<input
						id="max-points"
						type="number"
						bind:value={maxPoints}
						min="1"
						max="1000"
						class="input w-full"
						required
					/>
				</div>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showNewAssignmentModal = false)}
						class="btn btn-secondary"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="btn btn-primary"
						disabled={!assignmentName.trim() || !maxPoints}
					>
						Create Assignment
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Add Student Modal -->
{#if showStudentModal}
	<div
		class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
		onclick={(e) => e.target === e.currentTarget && (showStudentModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showStudentModal = false)}
		role="dialog"
		aria-modal="true"
		aria-label="Add student"
		tabindex="0"
	>
		<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
			<h2 class="text-xl font-bold text-highlight mb-4">Add Student</h2>
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleAddStudent();
				}}
			>
				<div class="mb-4">
					<label for="student-name" class="block text-sm font-medium text-text-base mb-2">
						Student Name
					</label>
					<input
						id="student-name"
						type="text"
						bind:value={newStudentName}
						placeholder="Enter student name"
						class="input w-full"
						required
					/>
				</div>
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={() => (showStudentModal = false)}
						class="btn btn-secondary"
					>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary" disabled={!newStudentName.trim()}>
						Add Student
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
