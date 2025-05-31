<script lang="ts">
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
		onSelectClass: (classId: string) => void;
	}>();

	// Debug logging for class data
	$effect(() => {
		console.log('🏫 ClassList Debug:', {
			totalClasses: classes.length,
			classesData: classes.map((c: ClassItem) => ({
				id: c.id,
				name: c.name,
				studentCount: c.studentIds.length,
				studentIds: c.studentIds
			}))
		});
	});
</script>

<div class="bg-card border border-border rounded-lg p-4">
	<h2 class="text-xl font-semibold text-highlight mb-4">All Classes</h2>

	<div class="space-y-2">
		{#each classes as classItem (classItem.id)}
			<button
				onclick={() => onSelectClass(classItem.id)}
				class="w-full p-3 rounded-lg text-left transition-all duration-200 {selectedClassId ===
				classItem.id
					? 'bg-purple text-highlight'
					: 'bg-surface hover:bg-surface/80 text-text-hover'}"
			>
				<div class="flex justify-between items-center">
					<span class="font-medium">{classItem.name}</span>
					<span
						class="text-sm {selectedClassId === classItem.id ? 'text-highlight/90' : 'text-muted'}"
					>
						{classItem.studentIds.length} students
					</span>
				</div>
			</button>
		{/each}

		{#if classes.length === 0}
			<p class="text-muted text-center py-4">No classes found</p>
		{/if}
	</div>
</div>
