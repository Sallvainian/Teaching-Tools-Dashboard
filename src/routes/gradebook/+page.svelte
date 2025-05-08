<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	let categoryId: string = '';
	let assignmentName = '';
	let maxPoints: number = 100;
	let inputMap: Record<string, string> = {};

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
		recordGrade
	} = gradebookStore;

	// Derived values
	$: selectedCategory = $getSelectedCategory;
	$: categoryStudents = $getStudentsInSelectedCategory;
	$: categoryAssignments = $getAssignmentsForSelectedCategory;
	$: allStudents = $getGlobalStudents;

	onMount(() => {
		const cats = get(categories);
		if (cats.length > 0 && !categoryId) {
			categoryId = cats[0].id;
			gradebookStore.selectCategory(categoryId);
		}
	});

	function handleAddAssignment() {
		if (categoryId && assignmentName.trim()) {
			addAssignmentToCategory(assignmentName.trim(), maxPoints, categoryId);
			assignmentName = '';
			maxPoints = 100;
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
			<label for="category" class="block text-sm text-dark-lavender font-medium mb-2">Class/Category</label>
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
			<label class="block text-sm text-dark-lavender font-medium mb-2">Grading Period</label>
			<select class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple">
				<option>All Periods</option>
				<option>Quarter 1</option>
				<option>Quarter 2</option>
				<option>Quarter 3</option>
				<option>Quarter 4</option>
			</select>
		</div>
		
		<div class="bg-dark-card p-4 rounded-xl border border-dark-border">
			<label class="block text-sm text-dark-lavender font-medium mb-2">Assignment Type</label>
			<select class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple">
				<option>All Types</option>
				<option>Homework</option>
				<option>Quiz</option>
				<option>Test</option>
				<option>Project</option>
			</select>
		</div>
		
		<div class="bg-dark-card p-4 rounded-xl border border-dark-border">
			<label class="block text-sm text-dark-lavender font-medium mb-2">View</label>
			<select class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-2 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple">
				<option>Grade Table</option>
				<option>Student Report</option>
				<option>Assignment Report</option>
			</select>
		</div>
	</div>
</div>

<!-- Add Assignment Card -->
<div class="bg-dark-card border border-dark-border p-6 rounded-xl mb-8 shadow-dark-card">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-lg font-semibold text-white">Add New Assignment</h2>
		<button class="text-dark-lavender hover:text-dark-highlight">
			<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</button>
	</div>
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<div>
			<label class="block text-sm text-dark-lavender font-medium mb-2">Assignment Name</label>
			<input
				type="text"
				placeholder="Enter assignment name"
				bind:value={assignmentName}
				class="w-full bg-dark-surface text-white border border-dark-border rounded-lg p-3 focus:ring-2 focus:ring-dark-purple focus:border-dark-purple placeholder:text-dark-muted"
			/>
		</div>
		<div>
			<label class="block text-sm text-dark-lavender font-medium mb-2">Maximum Points</label>
			<input
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

<!-- Grade Table -->
{#if selectedCategory}
	<div class="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-dark-card mb-4">
		<div class="p-4 border-b border-dark-border bg-dark-surface">
			<h3 class="font-medium text-white">{selectedCategory.name} - Grades</h3>
		</div>
		<div class="overflow-x-auto">
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
										class="w-16 px-3 py-1 rounded-lg bg-dark-surface text-white border border-dark-border focus:ring-2 focus:ring-dark-purple focus:border-dark-purple"
										bind:value={inputMap[`${student.id}-${a.id}`]}
										on:input={(e) => handleGradeInput(student.id, a.id, (e.target as HTMLInputElement).value)}
									/>
								</td>
							{/each}
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="px-3 py-1 rounded-full bg-dark-purple text-white font-medium">
									{Math.round(studentAverageInCategory(student.id, categoryId) * 10) / 10 || '–'}%
								</span>
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
		<h3 class="text-lg font-medium text-white mb-2">No Category Selected</h3>
		<p class="text-dark-muted">Please select a class or category to view grades.</p>
	</div>
{/if}
