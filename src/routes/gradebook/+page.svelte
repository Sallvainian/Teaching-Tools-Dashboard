<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import { authStore } from '$lib/stores/auth';
	import LoadingBounce from '$lib/components/LoadingBounce.svelte';
	import ImportWizard from '$lib/components/ImportWizard.svelte';

	// State variables
	let assignmentName = $state('');
	let maxPoints = $state(100);
	let newStudentName = $state('');
	let newClassName = $state('');
	let showNewClassModal = $state(false);
	let showNewAssignmentModal = $state(false);
	let showStudentModal = $state(false);
	let showImportModal = $state(false);
	
	// PowerTeacher Pro features
	let selectedCells = $state(new Set<string>());
	let bulkGradeValue = $state('');
	let bulkGradeType = $state<'points' | 'percentage' | 'letter'>('points');
	let colorMode = $state(false);
	let colorScheme = $state<'performance' | 'custom'>('performance');
	let customColors = $state<Record<string, string>>({});
	let showBulkActions = $state(false);
	let showColorPanel = $state(false);

	// Reactive values from store
	let selectedClass = $derived($gradebookStore.classes.find(c => c.id === $gradebookStore.selectedClassId));
	let classStudents = $derived($gradebookStore.students.filter(s => selectedClass?.studentIds.includes(s.id)));
	let classAssignments = $derived($gradebookStore.assignments.filter(a => a.classId === $gradebookStore.selectedClassId));

	async function handleClassChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const classId = target.value;
		
		if (classId) {
			await gradebookStore.selectClass(classId);
		}
	}

	async function createNewClass() {
		if (newClassName.trim()) {
			try {
				await gradebookStore.addClass(newClassName.trim(), $authStore.user?.id);
				newClassName = '';
				showNewClassModal = false;
			} catch (error) {
				console.error('Failed to create class:', error);
			}
		}
	}

	async function addStudent() {
		if (newStudentName.trim() && $gradebookStore.selectedClassId) {
			try {
				const studentId = await gradebookStore.addGlobalStudent(newStudentName.trim(), $authStore.user?.id);
				
				if (studentId) {
					await gradebookStore.assignStudentToClass(studentId, $gradebookStore.selectedClassId);
				}
				
				newStudentName = '';
				showStudentModal = false;
			} catch (error) {
				console.error('Failed to add student:', error);
			}
		}
	}

	async function addAssignment() {
		if (assignmentName.trim() && $gradebookStore.selectedClassId) {
			try {
				await gradebookStore.addAssignmentToClass(
					assignmentName.trim(),
					maxPoints,
					$gradebookStore.selectedClassId
				);
				
				assignmentName = '';
				maxPoints = 100;
				showNewAssignmentModal = false;
			} catch (error) {
				console.error('Failed to add assignment:', error);
			}
		}
	}

	async function handleGradeChange(studentId: string, assignmentId: string, maxPoints: number, value: string) {
		const points = parseFloat(value) || 0;
		
		if (points < 0 || points > maxPoints) {
			return; // Invalid grade
		}
		
		try {
			await gradebookStore.recordGrade(studentId, assignmentId, points);
		} catch (error) {
			console.error('Failed to record grade:', error);
		}
	}

	async function handleGradeKeydown(event: KeyboardEvent, studentId: string, assignmentId: string) {
		if (event.key === 'Delete' || event.key === 'Backspace') {
			event.preventDefault();
			
			// Check if there's a grade to delete
			const existingGrade = $gradebookStore.grades.find(
				g => g.studentId === studentId && g.assignmentId === assignmentId
			);
			
			if (existingGrade && existingGrade.points > 0) {
				try {
					await gradebookStore.recordGrade(studentId, assignmentId, 0);
					// Clear the input field
					const target = event.target as HTMLInputElement;
					target.value = '';
				} catch (error) {
					console.error('Failed to delete grade:', error);
				}
			}
		}
	}

	// PowerTeacher Pro-inspired functions
	function toggleCellSelection(studentId: string, assignmentId: string) {
		const cellId = `${studentId}|${assignmentId}`;
		if (selectedCells.has(cellId)) {
			selectedCells.delete(cellId);
		} else {
			selectedCells.add(cellId);
		}
		selectedCells = new Set(selectedCells);
	}

	function selectColumn(assignmentId: string) {
		classStudents.forEach(student => {
			selectedCells.add(`${student.id}|${assignmentId}`);
		});
		selectedCells = new Set(selectedCells);
	}

	function selectRow(studentId: string) {
		classAssignments.forEach(assignment => {
			selectedCells.add(`${studentId}|${assignment.id}`);
		});
		selectedCells = new Set(selectedCells);
	}

	function clearSelection() {
		selectedCells.clear();
		selectedCells = new Set(selectedCells);
	}

	async function applyBulkGrade() {
		if (!bulkGradeValue || selectedCells.size === 0) return;

		// Only apply to cells without existing grades
		let skippedCount = 0;
		const gradesToApply: Array<{ studentId: string; assignmentId: string; points: number }> = [];

		for (const cellId of selectedCells) {
			const [studentId, assignmentId] = cellId.split('|');
			const assignment = classAssignments.find(a => a.id === assignmentId);
			
			if (!assignment) continue;

			// Skip if there's already a grade
			const existingGrade = $gradebookStore.grades.find(
				g => g.studentId === studentId && g.assignmentId === assignmentId
			);
			if (existingGrade && existingGrade.points > 0) {
				skippedCount++;
				continue; // Skip this cell
			}

			let points = 0;
			
			if (bulkGradeType === 'points') {
				points = parseFloat(bulkGradeValue);
			} else if (bulkGradeType === 'percentage') {
				points = (parseFloat(bulkGradeValue) / 100) * assignment.maxPoints;
			} else if (bulkGradeType === 'letter') {
				const letterGrades: Record<string, number> = {
					'A+': 97, 'A': 93, 'A-': 90,
					'B+': 87, 'B': 83, 'B-': 80,
					'C+': 77, 'C': 73, 'C-': 70,
					'D+': 67, 'D': 63, 'D-': 60,
					'F': 0
				};
				const percentage = letterGrades[bulkGradeValue.toUpperCase()] || 0;
				points = (percentage / 100) * assignment.maxPoints;
			}

			if (points >= 0 && points <= assignment.maxPoints) {
				gradesToApply.push({ studentId, assignmentId, points });
			}
		}

		// Apply all grades in parallel for better performance
		const results = await Promise.allSettled(
			gradesToApply.map(({ studentId, assignmentId, points }) =>
				gradebookStore.recordGrade(studentId, assignmentId, points)
			)
		);

		// Count successes and failures
		const succeeded = results.filter(r => r.status === 'fulfilled').length;
		const failed = results.filter(r => r.status === 'rejected').length;

		// Show summary message
		let message = `Applied ${succeeded} grade${succeeded !== 1 ? 's' : ''}`;
		if (skippedCount > 0) {
			message += `, skipped ${skippedCount} existing grade${skippedCount !== 1 ? 's' : ''}`;
		}
		if (failed > 0) {
			message += `, ${failed} failed`;
		}
		
		// You could show this in a toast or alert if you want
		console.log(message);

		clearSelection();
		bulkGradeValue = '';
		showBulkActions = false;
	}

	async function deleteBulkGrades() {
		if (selectedCells.size === 0) return;

		const gradesToDelete: Array<{ studentId: string; assignmentId: string }> = [];

		for (const cellId of selectedCells) {
			const [studentId, assignmentId] = cellId.split('|');
			
			// Check if there's a grade to delete
			const existingGrade = $gradebookStore.grades.find(
				g => g.studentId === studentId && g.assignmentId === assignmentId
			);
			if (existingGrade && existingGrade.points > 0) {
				gradesToDelete.push({ studentId, assignmentId });
			}
		}

		if (gradesToDelete.length === 0) {
			console.log('No grades to delete in selection');
			return;
		}

		// Confirm deletion
		const confirmed = confirm(
			`Delete ${gradesToDelete.length} grade${gradesToDelete.length !== 1 ? 's' : ''}?`
		);
		if (!confirmed) return;

		// Delete all grades in parallel
		const results = await Promise.allSettled(
			gradesToDelete.map(({ studentId, assignmentId }) =>
				gradebookStore.recordGrade(studentId, assignmentId, 0)
			)
		);

		// Count successes and failures
		const succeeded = results.filter(r => r.status === 'fulfilled').length;
		const failed = results.filter(r => r.status === 'rejected').length;

		// Show summary message
		let message = `Deleted ${succeeded} grade${succeeded !== 1 ? 's' : ''}`;
		if (failed > 0) {
			message += `, ${failed} failed`;
		}
		
		console.log(message);

		clearSelection();
		showBulkActions = false;
	}

	function getGradeColor(points: number, maxPoints: number): string {
		if (!colorMode || !points) return '';
		
		const percentage = (points / maxPoints) * 100;
		
		if (colorScheme === 'performance') {
			if (percentage >= 90) return 'bg-green-100 border-green-300 text-green-800';
			if (percentage >= 80) return 'bg-blue-100 border-blue-300 text-blue-800';
			if (percentage >= 70) return 'bg-yellow-100 border-yellow-300 text-yellow-800';
			if (percentage >= 60) return 'bg-orange-100 border-orange-300 text-orange-800';
			return 'bg-red-100 border-red-300 text-red-800';
		}
		
		return customColors[`${points}-${maxPoints}`] || '';
	}

	function getCellId(studentId: string, assignmentId: string): string {
		return `${studentId}|${assignmentId}`;
	}

	function isSelected(studentId: string, assignmentId: string): boolean {
		return selectedCells.has(getCellId(studentId, assignmentId));
	}

	// Initialize data
	$effect(() => {
		gradebookStore.ensureDataLoaded();
	});
</script>

{#if $gradebookStore.isLoading}
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<LoadingBounce />
			<p class="mt-4 text-muted">Loading gradebook...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen">
		<div class="container mx-auto px-4 py-8">
			<!-- Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-highlight mb-2">PowerTeacher Pro</h1>
				<p class="text-text-base">Professional gradebook with advanced grading tools</p>
			</div>

			<!-- Controls -->
			<div class="flex flex-col lg:flex-row gap-4 mb-6">
				<!-- Class Selector -->
				<div class="flex-1">
					<label for="class-select" class="block text-sm font-medium text-text-base mb-2">
						Select Class
					</label>
					<select
						id="class-select"
						onchange={handleClassChange}
						value={$gradebookStore.selectedClassId ?? ''}
						class="input w-full"
					>
						<option value="">Choose a class...</option>
						{#each $gradebookStore.classes as cls}
							<option value={cls.id}>{cls.name}</option>
						{/each}
					</select>
				</div>
				
				<!-- Action Buttons -->
				<div class="flex gap-3 lg:items-end">
					<button
						onclick={() => showNewClassModal = true}
						class="btn btn-primary"
					>
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
						</svg>
						New Class
					</button>
					
					{#if $gradebookStore.selectedClassId}
						<button
							onclick={() => showImportModal = true}
							class="btn btn-secondary"
						>
							<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
							</svg>
							Import
						</button>
					{/if}
				</div>
			</div>

			{#if $gradebookStore.selectedClassId && selectedClass}
				<!-- PowerTeacher Pro Toolbar -->
				<div class="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 mb-6 text-white">
					<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
						<div class="flex items-center gap-6">
							<h2 class="text-xl font-bold">{selectedClass.name}</h2>
							<div class="flex items-center gap-4 text-purple-100">
								<span>{classStudents.length} students</span>
								<span>{classAssignments.length} assignments</span>
								{#if selectedCells.size > 0}
									<span class="bg-white/20 px-2 py-1 rounded text-sm">
										{selectedCells.size} cells selected
									</span>
								{/if}
							</div>
						</div>
						
						<div class="flex flex-wrap gap-2">
							<button
								onclick={() => showStudentModal = true}
								class="bg-white/20 hover:bg-white/30 px-3 py-2 rounded text-sm font-medium transition-colors"
							>
								+ Student
							</button>
							
							<button
								onclick={() => showNewAssignmentModal = true}
								class="bg-white/20 hover:bg-white/30 px-3 py-2 rounded text-sm font-medium transition-colors"
							>
								+ Assignment
							</button>
							
							<button
								onclick={() => showBulkActions = !showBulkActions}
								class="bg-white/20 hover:bg-white/30 px-3 py-2 rounded text-sm font-medium transition-colors"
								class:bg-opacity-60={showBulkActions}
							>
								Bulk Actions
							</button>
							
							<button
								onclick={() => colorMode = !colorMode}
								class="bg-white/20 hover:bg-white/30 px-3 py-2 rounded text-sm font-medium transition-colors"
								class:bg-opacity-60={colorMode}
							>
								Color Mode
							</button>
							
							{#if selectedCells.size > 0}
								<button
									onclick={clearSelection}
									class="bg-red-500/80 hover:bg-red-500 px-3 py-2 rounded text-sm font-medium transition-colors"
								>
									Clear Selection
								</button>
							{/if}
						</div>
					</div>
				</div>

				<!-- Bulk Actions Panel -->
				{#if showBulkActions}
					<div class="card-dark p-4 mb-6 border-l-4 border-blue-500">
						<h3 class="font-semibold text-highlight mb-3">Bulk Actions</h3>
						<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
							<div>
								<label class="block text-sm font-medium text-text-base mb-1">Grade Value</label>
								<input
									bind:value={bulkGradeValue}
									type="text"
									placeholder="Enter grade"
									class="input w-full"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-text-base mb-1">Grade Type</label>
								<select bind:value={bulkGradeType} class="input w-full">
									<option value="points">Points</option>
									<option value="percentage">Percentage</option>
									<option value="letter">Letter Grade</option>
								</select>
							</div>
							<div class="flex items-end">
								<button
									onclick={applyBulkGrade}
									disabled={!bulkGradeValue || selectedCells.size === 0}
									class="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Apply to Selected
								</button>
							</div>
							<div class="flex items-end">
								<button
									onclick={deleteBulkGrades}
									disabled={selectedCells.size === 0}
									class="btn btn-error w-full disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Delete Selected Grades
								</button>
							</div>
							<div class="flex items-end">
								<button
									onclick={() => showColorPanel = !showColorPanel}
									class="btn btn-outline w-full"
								>
									Color Options
								</button>
							</div>
						</div>

						{#if showColorPanel}
							<div class="mt-4 p-4 bg-bg-base rounded border">
								<h4 class="font-medium text-text-base mb-3">Color Scheme</h4>
								<div class="flex gap-4 mb-4">
									<label class="flex items-center gap-2">
										<input type="radio" bind:group={colorScheme} value="performance" />
										<span class="text-text-base">Performance Based</span>
									</label>
									<label class="flex items-center gap-2">
										<input type="radio" bind:group={colorScheme} value="custom" />
										<span class="text-text-base">Custom Colors</span>
									</label>
								</div>
								
								{#if colorScheme === 'performance'}
									<div class="grid grid-cols-5 gap-2 text-sm">
										<div class="bg-green-100 border-green-300 text-green-800 p-2 rounded text-center">90-100%</div>
										<div class="bg-blue-100 border-blue-300 text-blue-800 p-2 rounded text-center">80-89%</div>
										<div class="bg-yellow-100 border-yellow-300 text-yellow-800 p-2 rounded text-center">70-79%</div>
										<div class="bg-orange-100 border-orange-300 text-orange-800 p-2 rounded text-center">60-69%</div>
										<div class="bg-red-100 border-red-300 text-red-800 p-2 rounded text-center">Below 60%</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}

				<!-- PowerTeacher Pro Gradebook Grid -->
				<div class="card-dark overflow-hidden">
					{#if classStudents.length === 0}
						<div class="text-center py-12">
							<p class="text-muted">No students in this class yet. Add students to get started.</p>
						</div>
					{:else if classAssignments.length === 0}
						<div class="text-center py-12">
							<p class="text-muted">No assignments created yet. Add assignments to start grading.</p>
						</div>
					{:else}
						<div class="overflow-auto max-h-[600px]">
							<table class="w-full">
								<thead class="bg-card-dark">
									<tr class="border-b-2 border-purple-500">
										<th class="bg-card-dark p-3 text-left border-r border-border">
											<div class="font-semibold text-highlight">Student</div>
											<div class="text-xs text-muted mt-1">{classStudents.length} total</div>
										</th>
										{#each classAssignments as assignment, index}
											<th class="p-3 text-center min-w-[120px] border-r border-border">
												<div class="flex flex-col items-center gap-1">
													<div class="font-semibold text-text-base">{assignment.name}</div>
													<div class="text-xs text-muted">Max: {assignment.maxPoints}</div>
													<button
														onclick={() => selectColumn(assignment.id)}
														class="text-xs text-blue-400 hover:text-blue-300 underline"
													>
														Select Column
													</button>
												</div>
											</th>
										{/each}
										<th class="p-3 text-center min-w-[100px] bg-purple-900/50">
											<div class="font-semibold text-purple-400">Average</div>
											<div class="text-xs text-purple-300">Overall</div>
										</th>
									</tr>
								</thead>
								<tbody>
									{#each classStudents as student, studentIndex}
										<tr class="border-b border-border hover:bg-purple-bg/20 transition-colors">
											<td class="bg-card-dark p-3 border-r border-border">
												<div class="flex items-center justify-between">
													<div>
														<div class="font-medium text-highlight">{student.name}</div>
														<div class="text-xs text-muted">Student #{studentIndex + 1}</div>
													</div>
													<button
														onclick={() => selectRow(student.id)}
														class="text-xs text-blue-400 hover:text-blue-300 underline"
													>
														Select Row
													</button>
												</div>
											</td>
											{#each classAssignments as assignment}
												{@const grade = $gradebookStore.grades.find(g => g.studentId === student.id && g.assignmentId === assignment.id)}
												{@const cellId = getCellId(student.id, assignment.id)}
												{@const selected = isSelected(student.id, assignment.id)}
												<td class="p-1 text-center border-r border-border">
													<div class="relative">
														<input
															type="number"
															value={grade?.points || ''}
															placeholder="—"
															min="0"
															max={assignment.maxPoints}
															step="0.1"
															class="w-full px-2 py-2 text-center bg-transparent border rounded text-text-base transition-all focus:ring-2 focus:ring-purple-500 focus:border-purple-500 {selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-border'} {colorMode && grade ? getGradeColor(grade.points, assignment.maxPoints) : ''}"
															onchange={(e) => handleGradeChange(student.id, assignment.id, assignment.maxPoints, e.target.value)}
															onkeydown={(e) => handleGradeKeydown(e, student.id, assignment.id)}
															onclick={() => toggleCellSelection(student.id, assignment.id)}
														/>
														{#if grade && grade.points > 0}
															<div class="absolute -top-1 -right-1 text-xs text-muted bg-card px-1 rounded">
																{Math.round((grade.points / assignment.maxPoints) * 100)}%
															</div>
														{/if}
													</div>
												</td>
											{/each}
											<td class="p-3 text-center bg-purple-bg/30">
												{#snippet averageCalculation()}
													{@const studentGrades = classAssignments.map(assignment => {
														const grade = $gradebookStore.grades.find(g => g.studentId === student.id && g.assignmentId === assignment.id);
														return grade ? grade.points : null;
													}).filter(g => g !== null && g > 0)}
													{@const totalPossible = classAssignments.reduce((sum, assignment) => sum + assignment.maxPoints, 0)}
													{@const totalEarned = studentGrades.reduce((sum, g) => sum + (g || 0), 0)}
													{@const average = studentGrades.length > 0 ? Math.round((totalEarned / (studentGrades.length * (totalPossible / classAssignments.length))) * 100) : 0}
													<div class="font-bold text-purple-400">
														{average || '—'}%
													</div>
													<div class="text-xs text-purple-300">
														{studentGrades.length}/{classAssignments.length}
													</div>
												{/snippet}
												{@render averageCalculation()}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>

				<!-- Grade Distribution Summary -->
				{#if classStudents.length > 0 && classAssignments.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
						<div class="card-dark p-4">
							<h3 class="font-semibold text-highlight mb-2">Class Statistics</h3>
							<div class="space-y-2 text-sm">
								<div class="flex justify-between">
									<span class="text-muted">Total Students:</span>
									<span class="text-text-base">{classStudents.length}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted">Total Assignments:</span>
									<span class="text-text-base">{classAssignments.length}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted">Grades Entered:</span>
									<span class="text-text-base">{$gradebookStore.grades.length}</span>
								</div>
							</div>
						</div>

						<div class="card-dark p-4">
							<h3 class="font-semibold text-highlight mb-2">Quick Actions</h3>
							<div class="space-y-2">
								<button class="btn btn-outline w-full text-sm" onclick={() => showBulkActions = true}>
									Bulk Grade Entry
								</button>
								<button class="btn btn-outline w-full text-sm" onclick={() => colorMode = !colorMode}>
									Toggle Color Coding
								</button>
							</div>
						</div>

						<div class="card-dark p-4">
							<h3 class="font-semibold text-highlight mb-2">Selection Tools</h3>
							<div class="space-y-2">
								<button 
									class="btn btn-outline w-full text-sm"
									onclick={() => {
										classStudents.forEach(student => {
											classAssignments.forEach(assignment => {
												selectedCells.add(getCellId(student.id, assignment.id));
											});
										});
										selectedCells = new Set(selectedCells);
									}}
								>
									Select All Cells
								</button>
								<button class="btn btn-outline w-full text-sm" onclick={clearSelection}>
									Clear Selection
								</button>
							</div>
						</div>
					</div>
				{/if}

			{:else if !$gradebookStore.selectedClassId}
				<!-- Empty State -->
				<div class="card-dark p-8 text-center">
					<div class="flex flex-col items-center justify-center py-12">
						<svg
							class="w-16 h-16 text-muted mb-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
						</svg>
						<h3 class="text-lg font-medium text-highlight mb-2">Welcome to PowerTeacher Pro</h3>
						<p class="text-text-base text-center max-w-md mb-6">
							Select a class to access the advanced gradebook with bulk actions, color coding, and professional grading tools.
						</p>
						<button
							onclick={() => showNewClassModal = true}
							class="btn btn-primary"
						>
							Create Your First Class
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Modals -->
{#if showNewClassModal}
	<div class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
		<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md">
			<h3 class="text-xl font-bold text-highlight mb-4">Create New Class</h3>
			<input
				bind:value={newClassName}
				placeholder="Class name"
				class="input w-full mb-4"
			/>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => showNewClassModal = false}
					class="btn btn-outline"
				>
					Cancel
				</button>
				<button
					onclick={createNewClass}
					class="btn btn-primary"
				>
					Create
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showStudentModal}
	<div class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
		<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md">
			<h3 class="text-xl font-bold text-highlight mb-4">Add Student</h3>
			<input
				bind:value={newStudentName}
				placeholder="Student name"
				class="input w-full mb-4"
			/>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => showStudentModal = false}
					class="btn btn-outline"
				>
					Cancel
				</button>
				<button
					onclick={addStudent}
					class="btn btn-primary"
				>
					Add
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showNewAssignmentModal}
	<div class="fixed inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50">
		<div class="bg-card border border-border rounded-lg p-6 w-full max-w-md">
			<h3 class="text-xl font-bold text-highlight mb-4">Add Assignment</h3>
			<input
				bind:value={assignmentName}
				placeholder="Assignment name"
				class="input w-full mb-4"
			/>
			<input
				bind:value={maxPoints}
				type="number"
				min="1"
				placeholder="Max points"
				class="input w-full mb-4"
			/>
			<div class="flex justify-end gap-2">
				<button
					onclick={() => showNewAssignmentModal = false}
					class="btn btn-outline"
				>
					Cancel
				</button>
				<button
					onclick={addAssignment}
					class="btn btn-primary"
				>
					Add
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showImportModal}
	<ImportWizard
		onClose={() => showImportModal = false}
		onComplete={() => {
			// Handle import completion
			showImportModal = false;
		}}
	/>
{/if}