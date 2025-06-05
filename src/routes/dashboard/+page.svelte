<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
	import { useKeyboardShortcuts } from '$lib/utils/keyboard';
	import * as Sentry from '@sentry/sveltekit';

	// Current date
	const today = new Date();
	const formattedDate = today.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	// Dashboard stats
	let totalStudents = $state(25);
	let totalClasses = $state(4);
	let totalLessons = $state(32);
	let totalFiles = $state(128);

	let recentUploads = $state([
		{ name: 'Lesson Plan - Week 12.pdf', size: '1.2 MB', date: '2 hours ago' },
		{ name: 'Math Quiz - Fractions.docx', size: '450 KB', date: '5 hours ago' },
		{ name: 'Science Project Guidelines.pdf', size: '2.8 MB', date: 'Yesterday' },
		{ name: 'Student Progress Report.xlsx', size: '1.5 MB', date: 'Yesterday' }
	]);

	let recentMessages = $state([
		{ from: 'Emily Johnson', message: 'When is the science project due?', time: '10:45 AM' },
		{ from: 'Michael Smith', message: 'I submitted my math homework', time: '9:30 AM' },
		{ from: 'Sarah Williams', message: 'Can we review the test questions?', time: 'Yesterday' }
	]);

	let upcomingLessons = $state([
		{ title: 'Algebra Fundamentals', class: 'Math 101', time: 'Today, 2:00 PM' },
		{ title: 'Cell Structure & Function', class: 'Biology', time: 'Tomorrow, 10:30 AM' },
		{ title: 'Essay Writing Workshop', class: 'English', time: 'Wed, 1:15 PM' }
	]);

	// Chart data
	let chartLoaded = $state(false);
	let isLoading = $state(true);

	// Keyboard shortcuts
	useKeyboardShortcuts([
		{ key: 'g', action: () => goto('/gradebook'), description: 'Go to Gradebook' },
		{ key: 'f', action: () => goto('/files'), description: 'Go to Files' },
		{ key: 'c', action: () => goto('/classes'), description: 'Go to Classes' },
		{ key: 's', action: () => goto('/student/dashboard'), description: 'Go to Students' },
		{ key: '?', shift: true, action: () => showKeyboardHelp(), description: 'Show help' }
	]);

	let showHelp = $state(false);

	function showKeyboardHelp() {
		showHelp = true;
	}

	function testSentry() {
		try {
			// Trigger a test error
			throw new Error('Sentry test error from Teacher Dashboard');
		} catch (error) {
			Sentry.captureException(error);
		}
	}

	onMount(async () => {
		// Simulate data loading
		try {
			await new Promise((resolve) => setTimeout(resolve, 500));
			chartLoaded = true;
			isLoading = false;
		} catch (error) {
			console.error('Error loading dashboard data:', error);
			isLoading = false;
		}
	});
</script>

<ErrorBoundary>
	<div class="min-h-screen">
		<div class="container mx-auto px-4 py-8">
			<!-- Header -->
			<div class="mb-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="text-purple">
							<svg
								class="w-10 h-10"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
							</svg>
						</div>
						<div>
							<h1 class="text-3xl font-bold text-highlight">Dashboard</h1>
							<p class="text-text-base">Today, {formattedDate}</p>
						</div>
					</div>
					<button onclick={testSentry} class="btn btn-sm btn-outline">
						Test Sentry
					</button>
				</div>
			</div>

			{#if isLoading}
				<!-- Loading state -->
				<div class="space-y-6">
					<!-- Stats skeleton -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {#each Array(4) as _, i (i)}
							<SkeletonLoader type="card" />
						{/each}
					</div>

					<!-- Main content skeleton -->
					<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div class="lg:col-span-2">
							<SkeletonLoader type="table" />
						</div>
						<SkeletonLoader type="card" lines={5} />
					</div>
				</div>
			{:else}
				<!-- Stats Row -->
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
					<!-- Students -->
					<a href="/student/dashboard" class="card-dark hover:bg-surface transition-colors block">
						<div class="flex items-center gap-3 mb-2">
							<div
								class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
									<circle cx="9" cy="7" r="4"></circle>
									<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
									<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
								</svg>
							</div>
							<span class="text-text-base">Students</span>
						</div>

						<div class="text-3xl font-bold text-highlight">{totalStudents}</div>
					</a>

					<!-- Classes -->
					<a href="/classes" class="card-dark hover:bg-surface transition-colors block">
						<div class="flex items-center gap-3 mb-2">
							<div
								class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
									<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
								</svg>
							</div>
							<span class="text-text-base">Classes</span>
						</div>

						<div class="text-3xl font-bold text-highlight">{totalClasses}</div>
					</a>

					<!-- Jeopardy Games -->
					<a href="/jeopardy" class="card-dark hover:bg-surface transition-colors block">
						<div class="flex items-center gap-3 mb-2">
							<div
								class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
								</svg>
							</div>
							<span class="text-text-base">Jeopardy</span>
						</div>

						<div class="text-3xl font-bold text-highlight">{totalLessons}</div>
					</a>

					<!-- Files -->
					<a href="/files" class="card-dark hover:bg-surface transition-colors block">
						<div class="flex items-center gap-3 mb-2">
							<div
								class="w-10 h-10 rounded-lg bg-purple-bg flex items-center justify-center text-purple"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14 2 14 8 20 8"></polyline>
									<line x1="16" y1="13" x2="8" y2="13"></line>
									<line x1="16" y1="17" x2="8" y2="17"></line>
									<polyline points="10 9 9 9 8 9"></polyline>
								</svg>
							</div>
							<span class="text-text-base">Files</span>
						</div>

						<div class="text-3xl font-bold text-highlight">{totalFiles}</div>
					</a>
				</div>

				<!-- Main Content -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<!-- Recent Files -->
					<div class="card-dark lg:col-span-2">
						<h2 class="text-xl font-bold text-highlight mb-4">Recent Files</h2>

						<div class="overflow-x-auto">
							<table class="w-full">
								<thead class="text-left border-b border-border">
									<tr>
										<th class="pb-3 text-text-base font-medium">Name</th>
										<th class="pb-3 text-text-base font-medium">Size</th>
										<th class="pb-3 text-text-base font-medium">Uploaded</th>
										<th class="pb-3 text-text-base font-medium"></th>
									</tr>
								</thead>
								<tbody>
									{#each recentUploads as file (file.name)}
										<tr class="border-b border-border/50 hover:bg-surface/50 transition-colors">
											<td class="py-3 text-highlight">
												<div class="flex items-center gap-2">
													<svg
														class="w-5 h-5 text-purple"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
														></path>
														<polyline points="14 2 14 8 20 8"></polyline>
													</svg>
													{file.name}
												</div>
											</td>
											<td class="py-3 text-text-base">{file.size}</td>
											<td class="py-3 text-text-base">{file.date}</td>
											<td class="py-3 text-right">
												<button
													class="text-purple hover:text-purple-hover transition-colors"
													aria-label="Download file"
												>
													<svg
														class="w-5 h-5"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
														<polyline points="7 10 12 15 17 10"></polyline>
														<line x1="12" y1="15" x2="12" y2="3"></line>
													</svg>
												</button>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>

						<div class="mt-4 flex justify-end">
							<a
								href="/files"
								class="text-purple hover:text-purple-hover transition-colors text-sm flex items-center gap-1"
							>
								View all files
								<svg
									class="w-4 h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<polyline points="9 18 15 12 9 6"></polyline>
								</svg>
							</a>
						</div>
					</div>

					<!-- Quick Actions -->
					<div class="card-dark">
						<h2 class="text-xl font-bold text-highlight mb-4">Quick Actions</h2>

						<div class="space-y-3">
							<a href="/classes" class="w-full p-3 bg-surface/50 rounded-lg hover:bg-surface transition-colors flex items-center gap-3">
								<svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
								</svg>
								<span class="text-highlight">Manage Classes</span>
							</a>
							<a href="/gradebook" class="w-full p-3 bg-surface/50 rounded-lg hover:bg-surface transition-colors flex items-center gap-3">
								<svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
								</svg>
								<span class="text-highlight">Grade Students</span>
							</a>
							<a href="/jeopardy" class="w-full p-3 bg-surface/50 rounded-lg hover:bg-surface transition-colors flex items-center gap-3">
								<svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
								</svg>
								<span class="text-highlight">Create Jeopardy Game</span>
							</a>
						</div>
					</div>
				</div>

				<!-- Bottom Row -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
					<!-- Recent Messages -->
					<div class="card-dark lg:col-span-2">
						<h2 class="text-xl font-bold text-highlight mb-4">Recent Messages</h2>

						<div class="space-y-4">
							{#each recentMessages as message (message.message)}
								<div class="p-4 bg-surface/50 rounded-lg">
									<div class="flex justify-between mb-2">
										<span class="font-medium text-highlight">{message.from}</span>
										<span class="text-sm text-text-base">{message.time}</span>
									</div>
									<p class="text-text-base">{message.message}</p>
								</div>
							{/each}
						</div>

						<div class="mt-4 flex justify-end">
							<a
								href="/chat"
								class="text-purple hover:text-purple-hover transition-colors text-sm flex items-center gap-1"
							>
								Open Chat
								<svg
									class="w-4 h-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<polyline points="9 18 15 12 9 6"></polyline>
								</svg>
							</a>
						</div>
					</div>

					<!-- Storage Usage -->
					<div class="card-dark">
						<h2 class="text-xl font-bold text-highlight mb-4">Storage Usage</h2>

						<div class="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
							<div class="relative w-32 h-32 mb-4">
								<svg class="w-full h-full" viewBox="0 0 36 36">
									<path
										d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
										fill="none"
										stroke="#374151"
										stroke-width="3"
										stroke-dasharray="100, 100"
									/>
									<path
										d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
										fill="none"
										stroke="url(#gradient-storage)"
										stroke-width="3"
										stroke-dasharray="65, 100"
										class="animate-pulse-subtle"
									/>
									<defs>
										<linearGradient id="gradient-storage" x1="0%" y1="0%" x2="100%" y2="0%">
											<stop offset="0%" stop-color="#8B5CF6" />
											<stop offset="100%" stop-color="#A78BFA" />
										</linearGradient>
									</defs>
								</svg>
								<div class="absolute inset-0 flex items-center justify-center flex-col">
									<span class="text-2xl font-bold text-highlight">65%</span>
									<span class="text-xs text-text-base">Used</span>
								</div>
							</div>

							<div class="text-center">
								<p class="text-text-base mb-1">6.5 GB of 10 GB used</p>
								<button
									onclick={() => goto('/settings')}
									class="text-sm text-purple hover:text-purple-hover transition-colors"
								>
									Upgrade Storage
								</button>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Keyboard Help Modal -->
		{#if showHelp}
			<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
				<div class="card max-w-lg w-full">
					<h2 class="text-xl font-bold text-highlight mb-4">Keyboard Shortcuts</h2>
					<div class="space-y-2">
						<div class="flex justify-between">
							<kbd class="kbd">G</kbd>
							<span class="text-text-base">Go to Gradebook</span>
						</div>
						<div class="flex justify-between">
							<kbd class="kbd">L</kbd>
							<span class="text-text-base">Go to Lesson Planner</span>
						</div>
						<div class="flex justify-between">
							<kbd class="kbd">F</kbd>
							<span class="text-text-base">Go to Files</span>
						</div>
						<div class="flex justify-between">
							<kbd class="kbd">C</kbd>
							<span class="text-text-base">Go to Classes</span>
						</div>
						<div class="flex justify-between">
							<kbd class="kbd">S</kbd>
							<span class="text-text-base">Go to Students</span>
						</div>
						<div class="flex justify-between">
							<kbd class="kbd">?</kbd>
							<span class="text-text-base">Show this help</span>
						</div>
					</div>
					<button onclick={() => (showHelp = false)} class="btn btn-primary mt-4 w-full">
						Close
					</button>
				</div>
			</div>
		{/if}
	</div>
</ErrorBoundary>
