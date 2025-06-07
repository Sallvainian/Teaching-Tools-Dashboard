<script lang="ts">
	import type { Class } from '$lib/types/gradebook';
	import { gradebookStore } from '$lib/stores/gradebook';
	import { authStore } from '$lib/stores/auth';
	import { get } from 'svelte/store';

 // Props using Svelte 5 syntax
	let { 
		isOpen: _isOpen = false,
		onClose,
		onComplete 
	} = $props<{
		isOpen?: boolean;
		onClose: () => void;
		onComplete: () => void;
	}>();

	// State using Svelte 5 runes
	let mode = $state<'manual' | 'json'>('manual');
	let className = $state('');
	let jsonInput = $state('');
	let manualStudents = $state<string[]>(['']);
	let error = $state('');

	const exampleJson = `[
  {"name": "John Doe"},
  {"name": "Jane Smith"},
  {"name": "Bob Johnson"}
]`;

	async function handleImport(e: Event) {
		e.preventDefault();
		error = '';

		if (!className.trim()) {
			error = 'Please enter a class name';
			return;
		}

		let students: string[] = [];

		if (mode === 'json') {
			// Parse JSON input
			try {
				const parsed = JSON.parse(jsonInput);
				if (!Array.isArray(parsed)) {
					throw new Error('Input must be an array');
				}
				students = parsed
					.map((item) => {
						if (typeof item === 'string') return item.trim();
						if (item && typeof item === 'object' && 'name' in item) {
							return String(item.name).trim();
						}
						return '';
					})
					.filter((name) => name);
			} catch (err) {
				error = `Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`;
				return;
			}
		} else {
			// Manual mode - filter out empty entries
			students = manualStudents.map((s) => s.trim()).filter((name) => name);
		}

		// Import to gradebook
		await importToGradebook(className.trim(), students);
	}

	async function importToGradebook(categoryName: string, studentNames: string[]) {
		try {
			// Ensure data is loaded
			await gradebookStore.ensureDataLoaded();

			// Get current user id
			const currentUser = get(authStore).user;
			const userId = currentUser?.id;

			if (!userId) {
				throw new Error('No authenticated user found');
			}

			// Add the class with user_id
			await gradebookStore.addClass(categoryName, userId);

			// Wait a bit for the store to update, then get the newly created class
			await new Promise(resolve => setTimeout(resolve, 100));

			const classes = get(gradebookStore).classes;
			const newClass = classes.find((cls: Class) => cls.name === categoryName);

			if (!newClass) {
				console.error('Available classes:', classes.map(c => c.name));
				throw new Error(`Failed to create class "${categoryName}". Available classes: ${classes.map(c => c.name).join(', ')}`);
			}

			// Add students to global list and assign to class
			const skippedStudents: string[] = [];
			let addedCount = 0;

			for (const studentName of studentNames) {
				if (!studentName) continue;

				// Add student globally with user_id
				const studentId = await gradebookStore.addGlobalStudent(studentName, userId);

				if (studentId) {
					// Assign to class
					await gradebookStore.assignStudentToClass(studentId, newClass.id);
					addedCount++;
				} else {
					skippedStudents.push(studentName);
				}
			}

			// Prepare success message
			let _message = `Successfully created class "${categoryName}"`;
			if (addedCount > 0) {
				_message += ` with ${addedCount} student${addedCount !== 1 ? 's' : ''}`;
			}
			if (skippedStudents.length > 0) {
				_message += `. Skipped ${skippedStudents.length} duplicate student${
					skippedStudents.length !== 1 ? 's' : ''
				}`;
			}

			// Reset form
			className = '';
			jsonInput = '';
			manualStudents = [''];
			mode = 'manual';

			// Close modal and notify parent
			onClose();
			onComplete();
		} catch (err) {
			error = `Error creating class: ${err instanceof Error ? err.message : String(err)}`;
			console.error('ImportWizard error:', err);
		}
	}

	function addStudentField() {
		manualStudents = [...manualStudents, ''];
	}

	function removeStudentField(index: number) {
		manualStudents = manualStudents.filter((_, i) => i !== index);
	}

	function updateStudentName(index: number, value: string) {
		manualStudents[index] = value;
	}
</script>

<div
	class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
	onclick={(e) => e.target === e.currentTarget && onClose()}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="dialog"
	aria-modal="true"
	aria-label="Create new class"
	tabindex="-1"
>
	<div
		class="bg-card border border-border rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh]
		overflow-y-auto"
	>
		<h2 class="text-2xl font-bold text-highlight mb-6">Create New Class</h2>

		<!-- Mode selector -->
		<div class="flex gap-2 mb-6">
			<button
				type="button"
				onclick={() => (mode = 'manual')}
				class="flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 {mode ===
				'manual'
					? 'bg-purple text-highlight'
					: 'bg-surface text-muted hover:bg-accent/20'}"
			>
				Manual Entry
			</button>
			<button
				type="button"
				onclick={() => (mode = 'json')}
				class="flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 {mode === 'json'
					? 'bg-purple text-highlight'
					: 'bg-surface text-muted hover:bg-accent/20'}"
			>
				JSON Import
			</button>
		</div>

		<form onsubmit={handleImport} class="space-y-4">
			<div>
				<label for="className" class="block text-sm font-medium text-text-base mb-2">
					Class Name
				</label>
				<input
					id="className"
					type="text"
					bind:value={className}
					placeholder="e.g., Math 101, Science 6B"
					class="w-full px-3 py-2 bg-bg-base text-text-hover border border-border rounded-lg focus:ring-2 focus:ring-accent-hover focus:border-accent-hover transition-all duration-200 placeholder:text-muted"
					required
				/>
			</div>

			{#if mode === 'manual'}
				<div>
					<!-- svelte-ignore a11y_label_has_associated_control -->
					<label class="block text-sm font-medium text-text-base mb-2"> Students </label>
					<div class="space-y-2 max-h-64 overflow-y-auto">
						{#each manualStudents as student, index (index)}
							<div class="flex gap-2">
								<input
									type="text"
									value={student}
									oninput={(e) => updateStudentName(index, e.currentTarget.value)}
									placeholder="Student name"
									class="flex-1 px-3 py-2 bg-bg-base text-text-hover border border-border rounded-lg focus:ring-2 focus:ring-accent-hover focus:border-accent-hover transition-all duration-200 placeholder:text-muted"
								/>
								{#if manualStudents.length > 1}
									<button
										type="button"
										onclick={() => removeStudentField(index)}
										class="px-3 py-2 bg-error/20 text-error border border-error/50 rounded-lg hover:bg-error/30 transition-all duration-200"
										aria-label="Remove student"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								{/if}
							</div>
						{/each}
					</div>
					<button
						type="button"
						onclick={addStudentField}
						class="mt-2 w-full py-2 bg-surface text-text-hover border border-border rounded-lg hover:bg-accent/20 transition-all duration-200 flex items-center justify-center gap-2"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						Add Another Student
					</button>
					<p class="text-sm text-muted mt-2">Leave blank if you want to add students later</p>
				</div>
			{:else}
				<div>
					<label for="jsonInput" class="block text-sm font-medium text-text-base mb-2">
						Students (JSON)
					</label>
					<textarea
						id="jsonInput"
						bind:value={jsonInput}
						placeholder={exampleJson}
						rows="10"
						class="w-full px-3 py-2 bg-bg-base text-text-hover border border-border rounded-lg focus:ring-2 focus:ring-accent-hover focus:border-accent-hover transition-all duration-200 font-mono text-sm placeholder:text-muted"
					></textarea>
					<p class="text-sm text-muted mt-1">
						Enter an array of student objects. Each student should have a "name" field.
					</p>
				</div>
			{/if}

			{#if error}
				<div class="p-3 bg-error/20 border border-error/50 rounded-lg text-error">
					{error}
				</div>
			{/if}

			<div class="flex justify-end gap-3 mt-6">
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 bg-surface text-text-hover border border-border rounded-lg hover:bg-accent/20 transition-all duration-200"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="px-4 py-2 bg-purple text-highlight rounded-lg hover:bg-purple-hover transition-all duration-200"
				>
					Create Class
				</button>
			</div>
		</form>
	</div>
</div>
