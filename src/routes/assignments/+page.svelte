<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, slide } from 'svelte/transition';
	import { assignments, addAssignment, updateAssignmentStatus } from '$lib/stores/notifications';
	import type { Assignment } from '$lib/types/notifications';

	// Assignment form state
	let showAddAssignmentModal = $state(false);
	let newAssignmentTitle = $state('');
	let newAssignmentDescription = $state('');
	let newAssignmentSubject = $state('');
	let newAssignmentDueDate = $state('');
	let newAssignmentDueTime = $state('');
	let newAssignmentPriority = $state<'low' | 'medium' | 'high'>('medium');

	// Filter and sort state
	let statusFilter = $state<'all' | 'pending' | 'submitted' | 'graded'>('all');
	let subjectFilter = $state('all');
	let sortBy = $state<'dueDate' | 'priority' | 'title'>('dueDate');

	// Get unique subjects for filter
	let subjects = $derived([...new Set($assignments.map(a => a.subject))]);

	// Filter and sort assignments
	let filteredAssignments = $derived($assignments
		.filter(assignment => {
			if (statusFilter !== 'all' && assignment.status !== statusFilter) return false;
			if (subjectFilter !== 'all' && assignment.subject !== subjectFilter) return false;
			return true;
		})
		.sort((a, b) => {
			switch (sortBy) {
				case 'dueDate':
					return a.dueDate.getTime() - b.dueDate.getTime();
				case 'priority': {
					const priorityOrder = { high: 3, medium: 2, low: 1 };
					return priorityOrder[b.priority] - priorityOrder[a.priority];
				}
				case 'title':
					return a.title.localeCompare(b.title);
				default:
					return 0;
			}
		}));

	function openAddAssignmentModal() {
		// Set default due date to tomorrow
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		newAssignmentDueDate = tomorrow.toISOString().split('T')[0];
		newAssignmentDueTime = '23:59';
		
		showAddAssignmentModal = true;
	}

	function clearAssignmentForm() {
		newAssignmentTitle = '';
		newAssignmentDescription = '';
		newAssignmentSubject = '';
		newAssignmentDueDate = '';
		newAssignmentDueTime = '';
		newAssignmentPriority = 'medium';
	}

	function handleAddAssignment() {
		if (!newAssignmentTitle.trim() || !newAssignmentDueDate || !newAssignmentSubject.trim()) return;

		const dueDateTime = new Date(`${newAssignmentDueDate}T${newAssignmentDueTime}`);

		const assignment: Assignment = {
			id: crypto.randomUUID(),
			title: newAssignmentTitle.trim(),
			description: newAssignmentDescription.trim() || undefined,
			dueDate: dueDateTime,
			subject: newAssignmentSubject.trim(),
			status: 'pending',
			priority: newAssignmentPriority,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		addAssignment(assignment);
		clearAssignmentForm();
		showAddAssignmentModal = false;
	}

	function handleStatusChange(assignmentId: string, newStatus: Assignment['status']) {
		updateAssignmentStatus(assignmentId, newStatus);
	}

	function getPriorityColor(priority: Assignment['priority']) {
		switch (priority) {
			case 'high':
				return 'text-red-400 bg-red-500/20 border-red-500/50';
			case 'medium':
				return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
			case 'low':
				return 'text-green-400 bg-green-500/20 border-green-500/50';
		}
	}

	function getStatusColor(status: Assignment['status']) {
		switch (status) {
			case 'pending':
				return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
			case 'submitted':
				return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
			case 'graded':
				return 'text-green-400 bg-green-500/20 border-green-500/50';
		}
	}

	function getDaysUntilDue(dueDate: Date) {
		const now = new Date();
		const diffTime = dueDate.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return diffDays;
	}

	function formatDueDate(dueDate: Date) {
		const days = getDaysUntilDue(dueDate);
		
		if (days < 0) {
			return `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`;
		} else if (days === 0) {
			return 'Due today';
		} else if (days === 1) {
			return 'Due tomorrow';
		} else if (days <= 7) {
			return `Due in ${days} days`;
		} else {
			return dueDate.toLocaleDateString('en-US', { 
				month: 'short', 
				day: 'numeric',
				year: dueDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
			});
		}
	}

	onMount(() => {
		// Add some sample assignments for demonstration
		if ($assignments.length === 0) {
			const sampleAssignments: Assignment[] = [
				{
					id: '1',
					title: 'Math Homework Chapter 5',
					description: 'Complete exercises 1-20 from Chapter 5',
					dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
					subject: 'Mathematics',
					status: 'pending',
					priority: 'high',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: '2',
					title: 'Science Project Proposal',
					description: 'Submit your science fair project proposal',
					dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
					subject: 'Science',
					status: 'pending',
					priority: 'medium',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: '3',
					title: 'History Essay',
					description: 'Write a 3-page essay on the Civil War',
					dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
					subject: 'History',
					status: 'submitted',
					priority: 'medium',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			// Add sample assignments
			sampleAssignments.forEach(assignment => {
				assignments.update(a => [...a, assignment]);
			});
		}
	});
</script>

<svelte:head>
	<title>Assignments - Teacher Dashboard</title>
</svelte:head>

<div class="p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h1 class="text-3xl font-bold text-text-base">Assignments</h1>
			<p class="text-muted mt-1">Manage student assignments and due dates</p>
		</div>
		<button
			onclick={openAddAssignmentModal}
			class="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Assignment
		</button>
	</div>

	<!-- Filters and Stats -->
	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
		<!-- Stats Cards -->
		<div class="bg-card border border-border rounded-lg p-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-text-base">{$assignments.filter(a => a.status === 'pending').length}</p>
					<p class="text-sm text-muted">Pending</p>
				</div>
			</div>
		</div>

		<div class="bg-card border border-border rounded-lg p-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-text-base">{$assignments.filter(a => a.status === 'submitted').length}</p>
					<p class="text-sm text-muted">Submitted</p>
				</div>
			</div>
		</div>

		<div class="bg-card border border-border rounded-lg p-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-text-base">{$assignments.filter(a => a.status === 'graded').length}</p>
					<p class="text-sm text-muted">Graded</p>
				</div>
			</div>
		</div>

		<div class="bg-card border border-border rounded-lg p-4">
			<div class="flex items-center gap-3">
				<div class="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
					<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.902-.833-2.672 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<div>
					<p class="text-2xl font-bold text-text-base">{$assignments.filter(a => getDaysUntilDue(a.dueDate) < 0).length}</p>
					<p class="text-sm text-muted">Overdue</p>
				</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-card border border-border rounded-lg p-4 mb-6">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<div>
				<label for="status-filter" class="block text-sm font-medium text-muted mb-2">Status</label>
				<select id="status-filter" bind:value={statusFilter} class="w-full px-3 py-2 bg-bg-base border border-border rounded-md text-text-base">
					<option value="all">All Status</option>
					<option value="pending">Pending</option>
					<option value="submitted">Submitted</option>
					<option value="graded">Graded</option>
				</select>
			</div>
			
			<div>
				<label for="subject-filter" class="block text-sm font-medium text-muted mb-2">Subject</label>
				<select id="subject-filter" bind:value={subjectFilter} class="w-full px-3 py-2 bg-bg-base border border-border rounded-md text-text-base">
					<option value="all">All Subjects</option>
					{#each subjects as subject}
						<option value={subject}>{subject}</option>
					{/each}
				</select>
			</div>
			
			<div>
				<label for="sort-by-filter" class="block text-sm font-medium text-muted mb-2">Sort By</label>
				<select id="sort-by-filter" bind:value={sortBy} class="w-full px-3 py-2 bg-bg-base border border-border rounded-md text-text-base">
					<option value="dueDate">Due Date</option>
					<option value="priority">Priority</option>
					<option value="title">Title</option>
				</select>
			</div>
			
			<div class="flex items-end">
				<button
					onclick={() => {
						statusFilter = 'all';
						subjectFilter = 'all';
						sortBy = 'dueDate';
					}}
					class="px-4 py-2 text-muted hover:text-text-base transition-colors"
				>
					Clear Filters
				</button>
			</div>
		</div>
	</div>

	<!-- Assignments List -->
	<div class="space-y-4">
		{#if filteredAssignments.length === 0}
			<div class="bg-card border border-border rounded-lg p-8 text-center">
				<svg class="w-12 h-12 mx-auto mb-3 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				<h3 class="text-lg font-medium text-text-base mb-1">No assignments found</h3>
				<p class="text-muted">Create your first assignment to get started</p>
			</div>
		{:else}
			{#each filteredAssignments as assignment (assignment.id)}
				<div class="bg-card border border-border rounded-lg p-6 hover:bg-purple-bg/30 transition-colors" transition:slide={{ duration: 200 }}>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<div class="flex items-start gap-4">
								<div class="flex-1">
									<h3 class="text-lg font-semibold text-text-base mb-2">{assignment.title}</h3>
									{#if assignment.description}
										<p class="text-muted mb-3">{assignment.description}</p>
									{/if}
									
									<div class="flex items-center gap-4 text-sm">
										<span class="flex items-center gap-2">
											<svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
											</svg>
											<span class="text-muted">{assignment.subject}</span>
										</span>
										
										<span class="flex items-center gap-2">
											<svg class="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
											</svg>
											<span class="text-muted">{formatDueDate(assignment.dueDate)}</span>
										</span>
									</div>
								</div>
								
								<div class="flex items-center gap-3">
									<!-- Priority Badge -->
									<span class="px-2 py-1 text-xs font-medium rounded-full border {getPriorityColor(assignment.priority)}">
										{assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
									</span>
									
									<!-- Status Dropdown -->
									<select 
										bind:value={assignment.status}
										onchange={(e) => handleStatusChange(assignment.id, (e.target as HTMLSelectElement)?.value as Assignment['status'])}
										class="px-3 py-1 text-xs font-medium rounded-full border {getStatusColor(assignment.status)} bg-transparent"
									>
										<option value="pending">Pending</option>
										<option value="submitted">Submitted</option>
										<option value="graded">Graded</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Add Assignment Modal -->
{#if showAddAssignmentModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" transition:fade={{ duration: 200 }}>
		<div class="bg-card rounded-lg shadow-xl w-full max-w-md mx-4" transition:slide={{ duration: 200 }}>
			<div class="p-6">
				<h3 class="text-lg font-medium text-text-base mb-4">Add New Assignment</h3>

				<div class="space-y-4">
					<div>
						<label for="assignment-title" class="block text-sm font-medium text-muted mb-1">Title</label>
						<input
							id="assignment-title"
							bind:value={newAssignmentTitle}
							type="text"
							placeholder="Assignment title"
							class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
						/>
					</div>

					<div>
						<label for="assignment-subject" class="block text-sm font-medium text-muted mb-1">Subject</label>
						<input
							id="assignment-subject"
							bind:value={newAssignmentSubject}
							type="text"
							placeholder="Subject"
							class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
						/>
					</div>

					<div>
						<label for="assignment-description" class="block text-sm font-medium text-muted mb-1">Description (Optional)</label>
						<textarea
							id="assignment-description"
							bind:value={newAssignmentDescription}
							placeholder="Assignment description"
							rows="3"
							class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none bg-bg-base text-text-base"
						></textarea>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="assignment-due-date" class="block text-sm font-medium text-muted mb-1">Due Date</label>
							<input
								id="assignment-due-date"
							bind:value={newAssignmentDueDate}
								type="date"
								class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
							/>
						</div>
						<div>
							<label for="assignment-due-time" class="block text-sm font-medium text-muted mb-1">Due Time</label>
							<input
								id="assignment-due-time"
							bind:value={newAssignmentDueTime}
								type="time"
								class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
							/>
						</div>
					</div>

					<div>
						<label for="assignment-priority" class="block text-sm font-medium text-muted mb-1">Priority</label>
						<select
							id="assignment-priority"
							bind:value={newAssignmentPriority}
							class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-bg-base text-text-base"
						>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>
					</div>
				</div>
			</div>

			<div class="bg-bg-base px-6 py-3 flex justify-end gap-3 rounded-b-lg">
				<button
					onclick={() => { showAddAssignmentModal = false; clearAssignmentForm(); }}
					class="px-4 py-2 text-sm font-medium text-muted hover:text-text-base transition-colors"
				>
					Cancel
				</button>
				<button
					onclick={handleAddAssignment}
					class="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
					disabled={!newAssignmentTitle.trim() || !newAssignmentDueDate || !newAssignmentSubject.trim()}
				>
					Add Assignment
				</button>
			</div>
		</div>
	</div>
{/if}