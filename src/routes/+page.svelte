<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import type { Readable } from 'svelte/store';
	import type { Student, Category } from '$lib/types/gradebook';

	// ── Global Student Roster ─────────────────────────────────────
	const globalStudents: Readable<Student[]> = gradebookStore.getGlobalStudents;
	const { addGlobalStudent } = gradebookStore;

	let newGlobalStudentName = '';

	function handleAddGlobalStudent() {
		const name = newGlobalStudentName.trim();
		if (!name) {
			alert('Please enter a student name.');
			return;
		}
		addGlobalStudent(name);
		newGlobalStudentName = '';
	}

	// ── Category Management ───────────────────────────────────────
	const categories: Readable<Category[]> = gradebookStore.getCategories;

	// Make this a `let` so Svelte can bind to it
	let selectedCategoryId = gradebookStore.selectedCategoryId;
	const selectedCategory: Readable<Category | null> = gradebookStore.getSelectedCategory;

	const { addCategory, assignStudentToCategory, removeStudentFromCategory } = gradebookStore;

	let newCategoryName = '';
</script>

<!-- Global Student Roster -->
<section class="mb-10 bg-slate-800 p-6 rounded-xl shadow-2xl">
	<h2 class="text-2xl font-semibold mb-4 text-sky-300 border-b border-slate-700 pb-2">
		1. Global Student Roster
	</h2>

	<div class="flex flex-col sm:flex-row gap-4 mb-4 items-end">
		<input
			bind:value={newGlobalStudentName}
			type="text"
			placeholder="Enter new student's full name"
			class="input flex-grow bg-slate-700 border-slate-600 rounded focus:ring-sky-500 focus:border-sky-500 placeholder-slate-500"
			on:keyup={(e) => e.key === 'Enter' && handleAddGlobalStudent()}
		/>
		<button
			on:click={handleAddGlobalStudent}
			class="px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded text-white"
		>
			Add Student
		</button>
	</div>

	{#if $globalStudents.length > 0}
		<h3 class="text-lg font-medium mb-2 text-slate-300">
			All Students ({$globalStudents.length}):
		</h3>
		<ul
			class="list-none text-sm max-h-40 overflow-y-auto bg-slate-750 p-3 rounded-lg border border-slate-700"
		>
			{#each $globalStudents as student (student.id)}
				<li class="mb-1 p-2 rounded hover:bg-slate-700 transition-colors">
					{student.name}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-slate-500 italic">
			No students in the global list yet. Add some to get started!
		</p>
	{/if}
</section>

<!-- Category Management -->
<section class="mb-10 p-6 bg-slate-800 rounded-xl shadow-2xl">
	<h2 class="text-2xl font-semibold mb-4 text-sky-300">2. Categories</h2>

	<!-- Add new category -->
	<div class="flex gap-4 mb-4 items-end">
		<input
			bind:value={newCategoryName}
			placeholder="New category name"
			class="input bg-slate-700 border-slate-600 rounded"
		/>
		<button
			on:click={() => {
				addCategory(newCategoryName);
				newCategoryName = '';
			}}
			class="px-4 py-2 bg-sky-500 rounded text-white"
		>
			Add Category
		</button>
	</div>

	<!-- Select category by ID -->
	<div class="mb-4">
		<label for="category-select" class="mr-2">Choose category:</label>
		<select
			id="category-select"
			class="bg-slate-700 border-slate-600 rounded p-2"
			bind:value={$selectedCategoryId}
		>
			<option value="">— none —</option>
			{#each $categories as cat (cat.id)}
				<option value={cat.id}>{cat.name}</option>
			{/each}
		</select>
	</div>

	{#if $selectedCategory}
		<!-- Assigned students -->
		<h3 class="font-medium mb-2 text-slate-300">
			Students in "{$selectedCategory.name}":
		</h3>
		<ul class="list-disc pl-5 mb-4">
			{#each $selectedCategory.studentIds as sid (sid)}
				<li class="flex justify-between">
					{sid}
					<button
						on:click={() =>
							removeStudentFromCategory(
								sid,
								$selectedCategory && $selectedCategory.id ? $selectedCategory.id : ''
							)}
						class="text-red-400 hover:text-red-600 ml-4"
					>
						Remove
					</button>
				</li>
			{/each}
		</ul>

		<!-- Assign new student -->
		<div>
			<label for="student-assign" class="mr-2">Assign student:</label>
			<select
				id="student-assign"
				class="bg-slate-700 border-slate-600 rounded p-2"
				on:change={(e) =>
					assignStudentToCategory((e.target as HTMLSelectElement).value, $selectedCategoryId!)}
			>
				<option value="">— select —</option>
				{#each $globalStudents as st (st.id)}
					{#if !$selectedCategory.studentIds.includes(st.id)}
						<option value={st.id}>{st.name}</option>
					{/if}
				{/each}
			</select>
		</div>
	{/if}
</section>
