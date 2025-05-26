<script lang="ts">
	import type { LogEntry } from '$lib/types/log-entries';
	import { authStore } from '$lib/stores/auth';

	// Convert props to Svelte 5 runes
	const {
		editMode = false,
		log,
		onsave,
		oncancel
	} = $props<{
		editMode?: boolean;
		log?: LogEntry;
		onsave?: (logEntry: Omit<LogEntry, 'id'>) => void;
		oncancel?: () => void;
	}>();

	// Define available tag options
	const tagOptions = [
		'Behavioral',
		'Positive',
		'Academic',
		'Social',
		'Attendance',
		'Progress',
		'Intervention'
	];

	// Form fields with $state
	let date = $state(log?.date || new Date().toISOString().slice(0, 10));
	let observer = $state(log?.observer || $authStore.user?.email || '');
	let student = $state(log?.student || '');
	let subject = $state(log?.subject || '');
	let objective = $state(log?.objective || '');
	let observation = $state(log?.observation || '');
	let actions = $state(log?.actions || '');
	let follow_up = $state(log?.follow_up || '');
	let selectedTag = $state(log?.tags && log.tags.length > 0 ? log.tags[0] : '');

	// Form validation
	type ErrorTypes = {
		student: string;
		observation: string;
	};

	let errors = $state<ErrorTypes>({
		student: '',
		observation: ''
	});

	function validateForm() {
		let isValid = true;
		errors = {
			student: '',
			observation: ''
		};

		if (!student.trim()) {
			errors.student = 'Student name is required';
			isValid = false;
		}

		if (!observation.trim()) {
			errors.observation = 'Observation details are required';
			isValid = false;
		}

		return isValid;
	}

	async function handleSave(event: SubmitEvent) {
		event.preventDefault();
		if (!validateForm()) return;

		const logEntry: Omit<LogEntry, 'id'> = {
			date,
			observer: observer.trim(),
			student: student.trim(),
			subject: subject.trim() || null,
			objective: objective.trim() || null,
			observation: observation.trim(),
			actions: actions.trim() || null,
			follow_up: follow_up.trim() || null,
			tags: selectedTag ? [selectedTag] : null
		};

		await onsave?.(logEntry);
	}

	function handleCancel() {
		oncancel?.();
	}
</script>

<form onsubmit={handleSave} class="space-y-4">
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div>
			<label for="date" class="block text-sm font-medium text-muted mb-1"> Date </label>
			<input
				id="date"
				type="date"
				bind:value={date}
				class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
			/>
		</div>

		<div>
			<label for="observer" class="block text-sm font-medium text-muted mb-1"> Observer </label>
			<input
				id="observer"
				type="text"
				bind:value={observer}
				class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
				placeholder="Your name or email"
			/>
		</div>
	</div>

	<div>
		<label for="student" class="block text-sm font-medium text-muted mb-1"> Student Name </label>
		<input
			id="student"
			type="text"
			bind:value={student}
			class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
			placeholder="Enter student name"
		/>
		{#if errors.student}
			<p class="text-error text-sm mt-1">{errors.student}</p>
		{/if}
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		<div>
			<label for="subject" class="block text-sm font-medium text-muted mb-1">
				Subject (Optional)
			</label>
			<input
				id="subject"
				type="text"
				bind:value={subject}
				class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
				placeholder="e.g., Math, Science, etc."
			/>
		</div>

		<div>
			<label for="objective" class="block text-sm font-medium text-muted mb-1">
				Objective (Optional)
			</label>
			<input
				id="objective"
				type="text"
				bind:value={objective}
				class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
				placeholder="Learning objective"
			/>
		</div>
	</div>

	<div>
		<label for="observation" class="block text-sm font-medium text-muted mb-1"> Observation </label>
		<textarea
			id="observation"
			bind:value={observation}
			rows="4"
			class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
			placeholder="Describe the observation..."
		></textarea>
		{#if errors.observation}
			<p class="text-error text-sm mt-1">{errors.observation}</p>
		{/if}
	</div>

	<div>
		<label for="actions" class="block text-sm font-medium text-muted mb-1">
			Actions Taken (Optional)
		</label>
		<textarea
			id="actions"
			bind:value={actions}
			rows="2"
			class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
			placeholder="Actions taken..."
		></textarea>
	</div>

	<div>
		<label for="follow_up" class="block text-sm font-medium text-muted mb-1">
			Follow Up (Optional)
		</label>
		<textarea
			id="follow_up"
			bind:value={follow_up}
			rows="2"
			class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
			placeholder="Follow up actions..."
		></textarea>
	</div>

	<div>
		<label for="tag" class="block text-sm font-medium text-muted mb-1"> Tag (Optional) </label>
		<select
			id="tag"
			bind:value={selectedTag}
			class="w-full px-3 py-2 bg-surface border border-border rounded-lg text-highlight focus:outline-none focus:ring-2 focus:ring-purple"
		>
			<option value="">Select a tag</option>
			{#each tagOptions as tag (tag)}
				<!-- Added tag as key -->
				<option value={tag}>{tag}</option>
			{/each}
		</select>
	</div>

	<div class="flex justify-end gap-3 pt-4">
		<button
			type="button"
			onclick={handleCancel}
			class="px-4 py-2 text-muted hover:text-highlight transition-colors"
		>
			Cancel
		</button>
		<button
			type="submit"
			class="px-6 py-2 bg-purple text-white rounded-lg hover:bg-purple-hover transition-colors"
		>
			{editMode ? 'Update' : 'Save'} Log Entry
		</button>
	</div>
</form>
