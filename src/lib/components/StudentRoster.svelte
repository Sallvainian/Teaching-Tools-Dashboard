<script lang="ts">
	import type { Student } from '$lib/types/gradebook';
	import type { Class } from '$lib/types/gradebook';
	import { gradebookStore } from '$lib/stores/gradebook';
	import { writable, derived } from 'svelte/store';
	import { authStore } from '$lib/stores/auth';

	let { selectedClass } = $props<{ selectedClass: Class }>();

	// Create a writable store for student name
	const newStudentName = writable('');
	
	// State for import functionality
	let showImportModal = $state(false);
	let importError = $state<string | null>(null);
	let isImporting = $state(false);
	let importMode = $state<'file' | 'paste'>('paste');
	let jsonInput = $state('');

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

	async function handleFileUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (!file) return;
		
		if (!file.name.endsWith('.json')) {
			importError = 'Please select a JSON file';
			return;
		}
		
		isImporting = true;
		importError = null;
		
		try {
			const text = await file.text();
			await processJsonData(text);
		} catch (error) {
			importError = error instanceof Error ? error.message : 'Failed to import students';
		} finally {
			isImporting = false;
			// Reset file input
			target.value = '';
		}
	}

	async function handlePastedImport() {
		if (!jsonInput.trim()) {
			importError = 'Please enter JSON data';
			return;
		}
		
		isImporting = true;
		importError = null;
		
		try {
			await processJsonData(jsonInput);
		} catch (error) {
			importError = error instanceof Error ? error.message : 'Failed to import students';
		} finally {
			isImporting = false;
		}
	}

	async function processJsonData(jsonText: string) {
		const jsonData = JSON.parse(jsonText);
		
		// Validate JSON structure
		if (!Array.isArray(jsonData)) {
			throw new Error('JSON must be an array of student objects');
		}
		
		// Validate each student object
		const studentsData = jsonData.filter((item) => {
			return item && typeof item === 'object' && typeof item.name === 'string' && item.name.trim();
		});
		
		if (studentsData.length === 0) {
			throw new Error('No valid student records found. Each student must have a "name" field.');
		}
		
		// Import students to this class
		const userId = $authStore.user?.id;
		await gradebookStore.importStudentsToClass(studentsData, selectedClass.id, userId);
		
		showImportModal = false;
		jsonInput = '';
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
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-lg font-medium text-text-hover">Add Students</h3>
				<button
					onclick={() => (showImportModal = true)}
					class="px-3 py-2 bg-accent text-text-hover rounded-lg hover:bg-accent/80 transition-all duration-200 text-sm"
				>
					Import from JSON
				</button>
			</div>
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

<!-- Import Students Modal -->
{#if showImportModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onclick={() => (showImportModal = false)}>
		<div class="bg-card border border-border rounded-lg p-6 max-w-lg w-full mx-4" onclick={(e) => e.stopPropagation()}>
			<h3 class="text-xl font-semibold text-highlight mb-4">Import Students to {selectedClass.name}</h3>
			
			<!-- Mode Tabs -->
			<div class="mb-4">
				<div class="flex border-b border-border">
					<button
						onclick={() => (importMode = 'paste')}
						class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {importMode === 'paste'
							? 'border-purple text-purple'
							: 'border-transparent text-muted hover:text-text-hover'}"
					>
						Paste JSON
					</button>
					<button
						onclick={() => (importMode = 'file')}
						class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {importMode === 'file'
							? 'border-purple text-purple'
							: 'border-transparent text-muted hover:text-text-hover'}"
					>
						Upload File
					</button>
				</div>
			</div>

			{#if importError}
				<div class="bg-error/10 border border-error text-error p-3 rounded mb-4 text-sm">
					{importError}
				</div>
			{/if}

			{#if importMode === 'paste'}
				<div class="mb-4">
					<p class="text-text-hover text-sm mb-2">
						Paste JSON array of student objects with "name" fields:
					</p>
					<textarea
						bind:value={jsonInput}
						placeholder={`[
  {"name": "John Doe"},
  {"name": "Jane Smith"}
]`}
						disabled={isImporting}
						class="w-full h-32 px-3 py-2 bg-surface border border-border rounded-lg text-text-hover focus:outline-none focus:border-purple disabled:opacity-50 font-mono text-sm"
					></textarea>
				</div>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => (showImportModal = false)}
						disabled={isImporting}
						class="px-4 py-2 bg-surface text-text-hover rounded-lg hover:bg-surface/80 transition-all duration-200 disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onclick={handlePastedImport}
						disabled={isImporting || !jsonInput.trim()}
						class="px-4 py-2 bg-purple text-highlight rounded-lg hover:bg-purple-hover transition-all duration-200 disabled:opacity-50"
					>
						Import Students
					</button>
				</div>
			{:else}
				<div class="mb-4">
					<p class="text-text-hover text-sm mb-2">
						Select a JSON file containing an array of student objects:
					</p>
					<input
						type="file"
						accept=".json"
						onchange={handleFileUpload}
						disabled={isImporting}
						class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-hover focus:outline-none focus:border-purple disabled:opacity-50"
					/>
				</div>
				<div class="flex justify-end gap-2">
					<button
						onclick={() => (showImportModal = false)}
						disabled={isImporting}
						class="px-4 py-2 bg-surface text-text-hover rounded-lg hover:bg-surface/80 transition-all duration-200 disabled:opacity-50"
					>
						Cancel
					</button>
				</div>
			{/if}

			{#if isImporting}
				<div class="flex items-center justify-center py-4">
					<div class="text-purple">Importing students...</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
