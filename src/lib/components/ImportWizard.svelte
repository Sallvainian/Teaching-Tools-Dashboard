<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import type { Category } from '$lib/types/gradebook';
	import { writable } from 'svelte/store';

	let { onClose, onComplete } = $props<{
		onClose: () => void;
		onComplete: () => void;
	}>();

	const className = writable('');
	const jsonInput = writable('');
	const error = writable<string | null>(null);

	const exampleJson = JSON.stringify(
		[{ name: 'John Smith' }, { name: 'Jane Doe' }, { name: 'Emily Johnson' }],
		null,
		2
	);

	async function handleImport(e: SubmitEvent) {
		e.preventDefault();

		error.set(null);

		if (!$className.trim()) {
			error.set('Please enter a class name');
			return;
		}

		let students: Array<{ name: string }> = [];

		if ($jsonInput.trim()) {
			try {
				students = JSON.parse($jsonInput);

				if (!Array.isArray(students)) {
					throw new Error('JSON must be an array of student objects');
				}

				for (const student of students) {
					if (!student || typeof student !== 'object') {
						throw new Error('Each item must be an object with a "name" field');
					}

					if (!student.name.trim()) {
						// Removed typeof student.name !== 'string'
						throw new Error('Each student must have a non-empty "name" field');
					}
				}
			} catch (err) {
				const e = err as Error;
				error.set(`Invalid JSON: ${e.message}`);
				return;
			}
		}

		try {
			// Make sure supabase is properly imported
			const { supabase } = await import('$lib/supabaseClient');

			// Check if user is authenticated
			const { data: authData } = await supabase.auth.getSession();
			const userId = authData?.session?.user?.id;

			// If not authenticated, show login message
			if (!userId) {
				error.set('You need to be logged in to create classes. Please sign in first.');
				return;
			}

			// Create the class with user_id field
			await gradebookStore.addCategory($className, userId);

			// Get current state to find the newly created category
			let categoriesData: Category[] = [];
			const unsubscribe = gradebookStore.subscribe((state) => {
				categoriesData = state.categories;
			});
			unsubscribe();

			// Find our newly created category
			const category = categoriesData.find((c) => c.name === $className);

			if (!category) {
				error.set('Failed to create class. Please try again.');
				return;
			}

			// Add students if any
			for (const studentData of students) {
				const studentId = await gradebookStore.addGlobalStudent(studentData.name);

				if (studentId) {
					await gradebookStore.assignStudentToCategory(studentId, category.id);
				}
			}

			onComplete();
		} catch (err) {
			error.set(`Error creating class: ${err instanceof Error ? err.message : String(err)}`);
			console.error('ImportWizard error:', err);
		}
	}
</script>

<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
	<div class="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl mx-4">
		<h2 class="text-2xl font-bold text-gray-100 mb-6">Import New Class</h2>

		<form onsubmit={handleImport} class="space-y-4">
			<div>
				<label for="className" class="block text-sm font-medium text-gray-300 mb-2">
					Class Name
				</label>
				<input
					id="className"
					type="text"
					bind:value={$className}
					placeholder="Math 101"
					class="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:border-dark-purple"
					required
				/>
			</div>

			<div>
				<label for="jsonInput" class="block text-sm font-medium text-gray-300 mb-2">
					Students (JSON) - Optional
				</label>
				<textarea
					id="jsonInput"
					bind:value={$jsonInput}
					placeholder={exampleJson}
					rows="8"
					class="w-full px-3 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:border-dark-purple font-mono text-sm"
				></textarea>
				<p class="text-sm text-gray-400 mt-1">
					Enter an array of student objects. Each student should have a "name" field.
				</p>
			</div>

			{#if $error}
				<div class="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
					{$error}
				</div>
			{/if}

			<div class="flex justify-end gap-3 mt-6">
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200"
				>
					Cancel
				</button>
				<button
					type="submit"
					class="px-4 py-2 bg-dark-purple text-white rounded-lg hover:bg-dark-purple-hover transition-all duration-200"
				>
					Import Class
				</button>
			</div>
		</form>
	</div>
</div>
