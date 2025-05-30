<script lang="ts">
	import { v4 as uuidv4 } from 'uuid';
	import { PlusCircle, Trash2 as Trash } from 'lucide-svelte';

	type LessonSection = {
		id: string;
		title: string;
		duration: number;
		notes: string;
	};

	let lessonSections = $state<LessonSection[]>([
		{
			id: uuidv4(),
			title: 'Introduction',
			duration: 10,
			notes: "Brief overview of today's topics"
		}
	]);

	function addSection() {
		lessonSections = [
			...lessonSections,
			{
				id: uuidv4(),
				title: '',
				duration: 15,
				notes: ''
			}
		];
	}

	function removeSection(id: string) {
		lessonSections = lessonSections.filter((section) => section.id !== id);
	}

	function getTotalDuration() {
		return lessonSections.reduce((total, section) => total + section.duration, 0);
	}
</script>

<div class="card max-w-4xl mx-auto my-8">
	<h2 class="text-2xl font-bold mb-6 text-text-hover dark:text-highlight">Lesson Planner</h2>

	<div class="space-y-6">
		{#each lessonSections as section (section.id)}
			<div
				class="p-4 border border-border dark:border-border rounded-lg bg-surface dark:bg-surface"
			>
				<div class="flex justify-between mb-3">
					<input
						type="text"
						bind:value={section.title}
						placeholder="Section title"
						class="input w-full max-w-xs"
					/>

					<div class="flex items-center space-x-2">
						<label class="flex items-center">
							<span class="mr-2 text-text-base dark:text-text-base">Duration:</span>
							<input
								type="number"
								bind:value={section.duration}
								min="1"
								max="120"
								class="input w-16 text-center"
							/>
							<span class="ml-1 text-text-base dark:text-text-base">min</span>
						</label>

						<button
							onclick={() => removeSection(section.id)}
							class="p-2 text-error hover:text-error-hover transition-colors rounded-full hover:bg-surface dark:hover:bg-accent"
							aria-label="Remove section"
						>
							<Trash class="w-5 h-5" />
						</button>
					</div>
				</div>

				<textarea
					bind:value={section.notes}
					placeholder="Section notes and details..."
					class="input w-full h-24 resize-none"
				></textarea>
			</div>
		{/each}
	</div>

	<div class="mt-6 flex justify-between items-center">
		<button onclick={addSection} class="btn-primary flex items-center">
			<PlusCircle class="w-5 h-5 mr-2" />
			Add Section
		</button>

		<div class="text-text-hover dark:text-text-base font-medium">
			Total Duration: <span class="text-purple font-bold">{getTotalDuration()} minutes</span>
		</div>
	</div>
</div>
