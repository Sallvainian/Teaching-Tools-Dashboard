<script lang="ts">
	import type { Student } from '$lib/types/gradebook';
	import type { Class } from '$lib/types/gradebook';
	import { gradebookStore } from '$lib/stores/gradebook';
	import { writable, derived } from 'svelte/store';

	let { selectedClass } = $props<{ selectedClass: Class }>();

	// Create a writable store for student name
	const newStudentName = writable('');

	// Derive students for this class with debugging
	const students = derived(gradebookStore, ($gradebookStore) => {
		const allStudents = $gradebookStore.students || [];

		// Debug logging to track data mismatch
		console.log('🔍 StudentRoster Debug:', {
			selectedClassId: selectedClass.id,
			selectedClassName: selectedClass.name,
			studentIdsInClass: selectedClass.studentIds,
			totalStudentsAvailable: allStudents.length,
			allStudentIds: allStudents.map((s) => s.id)
		});

		const foundStudents = selectedClass.studentIds
			.map((id: string) => {
				const student = allStudents.find((s) => s.id === id);
				if (!student) {
					console.warn(
						`⚠️ Student ID ${id} not found in students list for class ${selectedClass.name}`
					);
				}
				return student;
			})
			.filter(Boolean) as Student[];

		console.log(
			`📊 Found ${foundStudents.length} of ${selectedClass.studentIds.length} students for class ${selectedClass.name}`
		);

		return foundStudents;
	});

	async function addStudent(e: SubmitEvent): Promise<void> {
		e.preventDefault();

		if ($newStudentName.trim()) {
			const studentId = await gradebookStore.addGlobalStudent($newStudentName.trim());

			if (studentId) {
				await gradebookStore.assignStudentToClass(studentId, selectedClass.id);
				newStudentName.set('');
			}
		}
	}

	function removeStudent(studentId: string) {
		if (confirm('Remove this student from the class?')) {
			gradebookStore.removeStudentFromClass(studentId, selectedClass.id);
		}
	}

	async function fixDataInconsistency() {
		if (confirm('This will remove all orphaned student IDs from this class. Are you sure?')) {
			try {
				// Remove all orphaned student IDs from the class
				for (const studentId of selectedClass.studentIds) {
					await gradebookStore.removeStudentFromClass(studentId, selectedClass.id);
				}
				// Reload data to ensure consistency
				await gradebookStore.loadAllData();
			} catch (error) {
				console.error('Error fixing data inconsistency:', error);
			}
		}
	}
</script>

<div class="bg-card border border-border rounded-lg p-6">
	{#if selectedClass}
		<h2 class="text-xl font-semibold text-highlight mb-6">{selectedClass.name} - Student Roster</h2>

		{#if selectedClass.studentIds.length > 0 && $students.length === 0}
			<div class="bg-error/10 border border-error rounded-lg p-4 mb-6">
				<div class="flex items-center gap-2 text-error">
					<svg
						class="w-5 h-5"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<path
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
						></path>
					</svg>
					<span class="font-semibold">Data Inconsistency Detected</span>
				</div>
				<p class="text-text-base mt-2 text-sm">
					This class shows {selectedClass.studentIds.length} students in the count, but no student records
					were found. This usually means there are orphaned student IDs in the class_students table that
					don't match actual student records.
				</p>
				<div class="flex justify-between items-start mt-3">
					<details>
						<summary class="text-error cursor-pointer text-sm hover:text-error-hover">
							Show technical details
						</summary>
						<div class="mt-2 text-xs text-muted font-mono bg-error/5 p-2 rounded">
							<p>Expected student IDs: {JSON.stringify(selectedClass.studentIds)}</p>
							<p>Found students: {$students.length}</p>
						</div>
					</details>
					<button
						onclick={fixDataInconsistency}
						class="px-3 py-1 bg-error hover:bg-error-hover text-highlight text-sm rounded transition-colors"
					>
						Fix Data
					</button>
				</div>
			</div>
		{/if}

		<div class="mb-6">
			<form class="flex gap-2" onsubmit={addStudent}>
				<input
					type="text"
					placeholder="Student name"
					bind:value={$newStudentName}
					class="flex-1 px-3 py-2 bg-surface text-text-hover border border-border rounded-lg focus:outline-none focus:border-purple"
					required
				/>
				<button
					type="submit"
					class="px-4 py-2 bg-purple text-highlight rounded-lg hover:bg-purple-hover transition-all duration-200"
				>
					Add Student
				</button>
			</form>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full">
				<thead>
					<tr class="text-left border-b border-border">
						<th class="p-3 text-text-hover">#</th>
						<th class="p-3 text-text-hover">Name</th>
						<th class="p-3 text-text-hover">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each $students as student, index (student.id)}
						<tr class="border-b border-border hover:bg-surface/50">
							<td class="p-3 text-muted">{index + 1}</td>
							<td class="p-3 text-text-hover">{student.name}</td>
							<td class="p-3">
								<button
									onclick={() => removeStudent(student.id)}
									class="px-3 py-1 text-error hover:text-highlight hover:bg-error rounded-md transition-colors"
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
				<div class="text-center py-12 bg-surface/30 rounded-lg my-4">
					<p class="text-muted mb-2">No students in this class yet</p>
					<p class="text-muted text-sm">Use the form above to add students</p>
				</div>
			{/if}
		</div>
	{/if}
</div>
