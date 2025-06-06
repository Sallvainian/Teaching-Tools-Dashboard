<script lang="ts">
	import { gradebookStore } from '$lib/stores/gradebook';
	import { confirmationStore } from '$lib/stores/confirmationModal';

	interface ClassItem {
		id: string;
		name: string;
		studentIds: string[];
	}

	let {
		classes = [],
		selectedClassId = null,
		onSelectClass
	} = $props<{
		classes: ClassItem[];
		selectedClassId: string | null;
		onSelectClass: (classId: string | null) => void;
	}>();

	async function deleteClass(classId: string, className: string, event: Event) {
		event.stopPropagation(); // Prevent class selection

		await confirmationStore.confirm({
			title: 'Delete Class',
			message: `Are you sure you want to delete "${className}"? This action cannot be undone.`,
			confirmText: 'Delete',
			cancelText: 'Cancel',
			confirmButtonClass: 'bg-red-500 hover:bg-red-600',
			onConfirm: async () => {
				await gradebookStore.deleteClass(classId);
			}
		});
	}
</script>

<div class="bg-card border border-border rounded-lg p-4">
	<h2 class="text-xl font-semibold text-highlight mb-4">All Classes</h2>

	<div class="space-y-2">
		{#each classes as classItem (classItem.id)}
			<div
				class="relative group rounded-lg {selectedClassId === classItem.id
					? 'bg-purple text-highlight'
					: 'bg-surface hover:bg-surface/80 text-text-hover'}"
			>
				<button
					onclick={() => onSelectClass(classItem.id)}
					class="w-full p-3 text-left transition-all duration-200"
				>
					<div class="flex justify-between items-center pr-8">
						<span class="font-medium">{classItem.name}</span>
						<span
							class="text-sm {selectedClassId === classItem.id ? 'text-highlight/90' : 'text-muted'}"
						>
							{classItem.studentIds.length} students
						</span>
					</div>
				</button>
				<button
					onclick={(e) => deleteClass(classItem.id, classItem.name, e)}
					class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-error hover:text-highlight text-error"
					title="Delete class"
					aria-label={`Delete ${classItem.name}`}
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
					</svg>
				</button>
			</div>
		{/each}

		{#if classes.length === 0}
			<p class="text-muted text-center py-4">No classes found</p>
		{/if}
	</div>
</div>
