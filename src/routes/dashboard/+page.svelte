<script lang="ts">
	import { AcademicCap, ClipboardDocument, Users, Beaker } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';

	const modules = [
		{
			name: 'Gradebook',
			path: '/gradebook',
			description: 'Manage assignments and track grades by category and student.',
			icon: AcademicCap
		},
		{
			name: 'Jeopardy',
			path: '/jeopardy',
			description: 'Create and play Jeopardy-style quiz games with student teams.',
			icon: ClipboardDocument
		},
		{
			name: 'Lesson Planner',
			path: '/lesson-planner',
			description: 'Create, organize, and schedule classroom lesson plans.',
			icon: ClipboardDocument
		},
		{
			name: 'Class Dojo Remake',
			path: '/class-dojo-remake',
			description: 'Gamify behavior management and student engagement.',
			icon: Users
		},
		{
			name: 'Test Module',
			path: '/test',
			description: 'Prototype or test experimental features here.',
			icon: Beaker
		}
	];
</script>

<!-- Page header -->
<div class="mb-8">
	<h1 class="text-2xl font-bold text-white mb-1">Teacher Dashboard</h1>
	<p class="text-dark-muted">Welcome back! Here's an overview of your teaching tools</p>
</div>

<!-- Stats Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
	<div class="bg-dark-card border border-dark-border p-4 rounded-xl">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-dark-muted text-sm">Total Students</p>
				<h3 class="text-xl font-bold text-white">124</h3>
			</div>
			<div
				class="w-10 h-10 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
					/>
				</svg>
			</div>
		</div>
	</div>

	<div class="bg-dark-card border border-dark-border p-4 rounded-xl">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-dark-muted text-sm">Classes</p>
				<h3 class="text-xl font-bold text-white">5</h3>
			</div>
			<div
				class="w-10 h-10 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
					/>
				</svg>
			</div>
		</div>
	</div>

	<div class="bg-dark-card border border-dark-border p-4 rounded-xl">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-dark-muted text-sm">Assignments</p>
				<h3 class="text-xl font-bold text-white">24</h3>
			</div>
			<div
				class="w-10 h-10 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
					/>
				</svg>
			</div>
		</div>
	</div>

	<div class="bg-dark-card border border-dark-border p-4 rounded-xl">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-dark-muted text-sm">Avg. Score</p>
				<h3 class="text-xl font-bold text-white">86%</h3>
			</div>
			<div
				class="w-10 h-10 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
		</div>
	</div>
</div>

<!-- Module Cards -->
<div class="mb-6">
	<h2 class="text-lg font-semibold text-white mb-4">Tools & Modules</h2>
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each modules as mod (mod.path)}
			<a
				href={mod.path}
				class="flex flex-col group bg-dark-card border border-dark-border rounded-xl p-6 hover:border-dark-purple transition shadow-dark-card overflow-hidden relative"
			>
				<div
					class="absolute top-0 left-0 w-1 h-full bg-dark-highlight transform scale-y-0 group-hover:scale-y-100 transition-transform origin-top"
				></div>
				<div class="flex items-start gap-4">
					<div
						class="w-12 h-12 rounded-lg bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight mb-4"
					>
						<Icon src={mod.icon} class="w-6 h-6" />
					</div>
				</div>
				<h2 class="text-lg font-semibold text-white mb-2">{mod.name}</h2>
				<p class="text-sm text-dark-muted">{mod.description}</p>
				<div class="mt-4 pt-4 border-t border-dark-border flex justify-between items-center">
					<span class="text-xs text-dark-lavender">Last used: Today</span>
					<svg
						class="w-5 h-5 text-dark-lavender transform group-hover:translate-x-1 transition-transform"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
			</a>
		{/each}
	</div>
</div>

<!-- Recent Activity -->
<div class="bg-dark-card border border-dark-border rounded-xl p-6 shadow-dark-card">
	<h2 class="text-lg font-semibold text-white mb-4">Recent Activity</h2>
	<div class="space-y-4">
		<div class="flex items-start gap-4">
			<div
				class="w-8 h-8 rounded-full bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight flex-shrink-0"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
					/>
				</svg>
			</div>
			<div>
				<p class="text-white">
					Added a new assignment: <span class="text-dark-highlight">Midterm Exam</span>
				</p>
				<p class="text-xs text-dark-muted">Today, 10:42 AM</p>
			</div>
		</div>

		<div class="flex items-start gap-4">
			<div
				class="w-8 h-8 rounded-full bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight flex-shrink-0"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</div>
			<div>
				<p class="text-white">
					Created a new Jeopardy game: <span class="text-dark-highlight">Science Quiz</span>
				</p>
				<p class="text-xs text-dark-muted">Yesterday, 3:15 PM</p>
			</div>
		</div>

		<div class="flex items-start gap-4">
			<div
				class="w-8 h-8 rounded-full bg-dark-purple bg-opacity-20 flex items-center justify-center text-dark-highlight flex-shrink-0"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
					/>
				</svg>
			</div>
			<div>
				<p class="text-white">
					Added a new student: <span class="text-dark-highlight">Emily Johnson</span>
				</p>
				<p class="text-xs text-dark-muted">2 days ago, 11:30 AM</p>
			</div>
		</div>
	</div>
</div>
