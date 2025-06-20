<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { goto } from '$app/navigation';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import SkeletonLoader from '$lib/components/SkeletonLoader.svelte';
	import { useKeyboardShortcuts } from '$lib/utils/keyboard';
	import { gradebookStore } from '$lib/stores/gradebook';
	import { jeopardyStore } from '$lib/stores/jeopardy';
	import { fileService } from '$lib/services/fileService';
	import { chatStore } from '$lib/stores/chat';
	import { authStore, isAuthenticated } from '$lib/stores/auth';
	import { supabase } from '$lib/supabaseClient';
	import type { UnknownError } from '$lib/types/ai-enforcement';
	import type { ConversationWithDetails } from '$lib/types/chat';

	interface RecentMessage {
		id: string; // Or number, depending on your data
		from: string;
		time: string;
		message: string;
		// Add other properties if available
	}

	interface DashboardData {
		totalStudents?: number;
		totalClasses?: number;
		totalLessons?: number;
		totalFiles?: number;
		recentUploads?: Array<{ name: string; size: string; date: string }>;
		recentMessages?: RecentMessage[];
		upcomingEvents?: Array<{ id: string; title: string; date: string; time?: string; category: string }>;
		upcomingLessons?: Array<{ title: string; class: string; time: string }>;
		storagePercentage?: number;
		storageUsed?: string;
		// Add other properties from your actual data structure
	}

	// Get data from the server
	let { data }: { data?: { dashboardData?: DashboardData } } = $props();

	// Current date
	const today = new Date();
	const formattedDate = today.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	// Dashboard stats - reactive from stores  
	let totalStudents = $derived($gradebookStore.students.length);
	let totalClasses = $derived($gradebookStore.classes.length);
	let totalGames = $derived($jeopardyStore.length);
	let totalFiles = $state(0);
	let storageUsed = $state('0 GB');
	let storagePercentage = $state(0);
	let recentFiles = $state<Array<{name: string; size: string; date: string}>>([]);
	
	// Calculate average students per class
	let avgStudentsPerClass = $derived(
		$gradebookStore.classes.length === 0 
			? 0 
			: Math.round(
				$gradebookStore.classes.reduce((total, cls) => total + cls.studentIds.length, 0) / 
				$gradebookStore.classes.length
			)
	);

	let recentMessages = $state<Array<{from: string; message: string; time: string}>>([]);


	// Chart data
	let _chartLoaded = $state(false);
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


	onMount(async () => {
		try {
			// Store data is already loaded by AppLayout.svelte (gradebook only)
			// Load jeopardy data for dashboard stats
			await jeopardyStore.ensureDataLoaded();

			// Load file statistics
			const [files, stats] = await Promise.all([
				fileService.getFiles(),
				fileService.getUserStats()
			]);
			
			totalFiles = files.length;
			recentFiles = files.slice(0, 4).map(file => ({
				name: file.name,
				size: formatFileSize(file.size),
				date: formatRelativeDate(file.created_at)
			}));
			
			if (stats) {
				storageUsed = formatFileSize(stats.total_size_bytes);
				storagePercentage = Math.round((stats.total_size_bytes / (10 * 1024 * 1024 * 1024)) * 100); // Assume 10GB limit
			}

			// Load recent messages from chat store - wait for auth first
			try {
				// Wait for auth to be ready
				if (!$isAuthenticated) {
					recentMessages = [];
				} else {
					// Get current user ID and conversations (they should already be loaded by chat store initialization)
					const currentUserId = $authStore.user?.id;
					let conversations = get(chatStore.conversations) as ConversationWithDetails[];
					
					// Only load if not already loaded
					if (conversations.length === 0) {
						const chatTimeout = new Promise((_, reject) => {
							setTimeout(() => reject(new Error('Chat load timeout')), 8000);
						});
						
						await Promise.race([chatStore.loadConversations(), chatTimeout]);
						await new Promise(resolve => setTimeout(resolve, 100));
						conversations = get(chatStore.conversations) as ConversationWithDetails[];
					}
					
					if (conversations.length > 0) {
						// Process each conversation to find recent messages from others
						const conversationPromises = conversations.map(async (conv) => {
							// Load messages directly without setting active conversation
							const { data: messagesData } = await supabase
								.from('messages')
								.select('*')
								.eq('conversation_id', conv.id)
								.order('created_at', { ascending: false })
								.limit(10);
							
							const activeMessages = messagesData || [];
							const filteredMessages = activeMessages
								.filter(msg => msg.sender_id !== currentUserId)
								.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
							const lastMessageFromOther = filteredMessages.length > 0 ? filteredMessages[0] : null;
							
							if (lastMessageFromOther) {
								const sender = conv.participants?.find(p => p.user_id === lastMessageFromOther.sender_id)?.user;
								return {
									conversation_id: conv.id,
									from: sender?.full_name || sender?.email || 'Unknown',
									message: lastMessageFromOther.content,
									time: formatRelativeDate(lastMessageFromOther.created_at),
									created_at: lastMessageFromOther.created_at
								};
							}
							return null;
						});
						
						const results = await Promise.all(conversationPromises);
						
						recentMessages = results
							.filter((msg): msg is NonNullable<typeof msg> => msg !== null)
							.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
							.slice(0, 3);
						
						console.log('Success: Displaying Recent Messages');
					} else {
						recentMessages = [];
					}
				}
			} catch (chatError) {
				recentMessages = [];
			}

			_chartLoaded = true;
			isLoading = false;
		} catch (error: UnknownError) {
			console.error('Error loading dashboard data:', error);
			isLoading = false;
		}
	});

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function formatRelativeDate(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
		
		if (diffInHours < 1) return 'Just now';
		if (diffInHours < 24) return `${diffInHours} hours ago`;
		if (diffInHours < 48) return 'Yesterday';
		return date.toLocaleDateString();
	}
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
							<p class="text-text-base">{formattedDate}</p>
						</div>
					</div>
				</div>
			</div>

			{#if isLoading}
				<!-- Loading state -->
				<div class="space-y-6">
					<!-- Stats skeleton -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each Array(3) as _, i (i)}
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
				<!-- Dashboard Statistics -->
				<div class="mb-8">
					<div class="mb-6">
						<h2 class="text-lg font-semibold text-highlight mb-2">Dashboard Overview</h2>
						<p class="text-sm text-muted">Latest updates</p>
					</div>
					
					<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
						<!-- Students -->
						<a href="/classes" class="bg-card border border-border rounded-lg p-6 hover:bg-surface transition-colors">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-sm font-medium text-highlight">Students</h3>
								<svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
									<circle cx="9" cy="7" r="4"></circle>
									<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
									<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
								</svg>
							</div>
							<div class="text-3xl font-bold text-highlight mb-1">{totalStudents}</div>
							<p class="text-sm text-muted">Total enrolled</p>
							{#if totalClasses > 0}
								<div class="mt-3 pt-3 border-t border-border">
									<p class="text-xs text-muted">
										{avgStudentsPerClass} avg per class
									</p>
								</div>
							{/if}
						</a>

						<!-- Classes -->
						<a href="/classes" class="bg-card border border-border rounded-lg p-6 hover:bg-surface transition-colors">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-sm font-medium text-highlight">Classes</h3>
								<svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
									<path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
								</svg>
							</div>
							<div class="text-3xl font-bold text-highlight mb-1">{totalClasses}</div>
							<p class="text-sm text-muted">Active classes</p>
							{#if totalClasses > 0}
								<div class="mt-3 pt-3 border-t border-border">
									<p class="text-xs text-muted">
										{$gradebookStore.assignments.length} total assignments
									</p>
								</div>
							{/if}
						</a>

						<!-- Jeopardy Games -->
						<a href="/jeopardy" class="bg-card border border-border rounded-lg p-6 hover:bg-surface transition-colors">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-sm font-medium text-highlight">Jeopardy</h3>
								<svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
								</svg>
							</div>
							<div class="text-3xl font-bold text-highlight mb-1">{totalGames}</div>
							<p class="text-sm text-muted">Games created</p>
							{#if totalGames > 0}
								<div class="mt-3 pt-3 border-t border-border">
									<p class="text-xs text-muted">
										{$jeopardyStore.reduce((total: number, game: unknown) => total + (game as any).categories.reduce((catTotal: number, cat: unknown) => catTotal + (cat as any).questions.length, 0), 0)} total questions
									</p>
								</div>
							{/if}
						</a>

						<!-- Files -->
						<a href="/files" class="bg-card border border-border rounded-lg p-6 hover:bg-surface transition-colors">
							<div class="flex items-center justify-between mb-4">
								<h3 class="text-sm font-medium text-highlight">Files</h3>
								<svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14 2 14 8 20 8"></polyline>
									<line x1="16" y1="13" x2="8" y2="13"></line>
									<line x1="16" y1="17" x2="8" y2="17"></line>
									<polyline points="10 9 9 9 8 9"></polyline>
								</svg>
							</div>
							<div class="text-3xl font-bold text-highlight mb-1">{totalFiles}</div>
							<p class="text-sm text-muted">Total uploads</p>
							<div class="mt-3 pt-3 border-t border-border">
								<p class="text-xs text-muted">{storageUsed} used</p>
							</div>
						</a>
					</div>
				</div>

				<!-- Main Content -->
				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<!-- Recent Files -->
					<div class="bg-card border border-border rounded-lg p-6 lg:col-span-2">
						<div class="flex items-center justify-between mb-6">
							<h2 class="text-lg font-semibold text-highlight">Recent Files</h2>
							<a href="/files" class="text-sm text-purple hover:text-purple-hover">View All</a>
						</div>

						<div class="overflow-x-auto">
							<table class="w-full">
								<thead>
									<tr class="border-b border-border">
										<th class="text-left py-3 text-sm font-medium text-muted">Name</th>
										<th class="text-left py-3 text-sm font-medium text-muted">Size</th>
										<th class="text-left py-3 text-sm font-medium text-muted">Uploaded</th>
										<th class="text-left py-3 text-sm font-medium text-muted"></th>
									</tr>
								</thead>
								<tbody>
									{#each recentFiles as file (file.name)}
										<tr class="border-b border-border hover:bg-surface/50 transition-colors">
											<td class="py-4">
												<div class="flex items-center gap-3">
													<svg class="w-5 h-5 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
														<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
														<polyline points="14 2 14 8 20 8"></polyline>
													</svg>
													<span class="text-sm font-medium text-highlight">{file.name}</span>
												</div>
											</td>
											<td class="py-4 text-sm text-muted">{file.size}</td>
											<td class="py-4 text-sm text-muted">{file.date}</td>
											<td class="py-4 text-right">
												<button class="text-purple hover:text-purple-hover transition-colors" aria-label="Download file">
													<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
					</div>

					<!-- Quick Actions -->
					<div class="bg-card border border-border rounded-lg p-6">
						<h2 class="text-lg font-semibold text-highlight mb-6">Quick Actions</h2>

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
					<div class="bg-card border border-border rounded-lg p-6 lg:col-span-2">
						<div class="flex items-center justify-between mb-6">
							<h2 class="text-lg font-semibold text-highlight">Recent Messages</h2>
							<a href="/messaging" class="text-sm text-purple hover:text-purple-hover">Open Messaging</a>
						</div>

						<div class="space-y-4">
							{#each recentMessages as message, index (index)}
								<div class="flex items-start gap-3 p-3 hover:bg-surface/50 rounded-lg transition-colors">
									<div class="w-8 h-8 bg-surface rounded-full flex items-center justify-center flex-shrink-0">
										<span class="text-xs font-medium text-highlight">{message.from.charAt(0)}</span>
									</div>
									<div class="flex-1 min-w-0">
										<div class="flex items-center justify-between mb-1">
											<span class="text-sm font-medium text-highlight">{message.from}</span>
											<span class="text-xs text-muted">{message.time}</span>
										</div>
										<p class="text-sm text-muted">{message.message}</p>
									</div>
								</div>
							{:else}
								<div class="text-center py-8">
									<div class="flex flex-col items-center gap-2">
										<svg class="w-8 h-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
										</svg>
										<span class="text-muted">No recent messages</span>
										<a href="/messaging" class="text-purple hover:text-purple-hover text-sm">Start a conversation</a>
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Storage Usage -->
					<div class="bg-card border border-border rounded-lg p-6">
						<h2 class="text-lg font-semibold text-highlight mb-6">Storage Usage</h2>

						<div class="flex flex-col items-center justify-center">
							<div class="relative w-32 h-32 mb-4">
								<svg class="w-full h-full" viewBox="0 0 36 36">
									<!-- Background Circle -->
									<circle
										cx="18"
										cy="18"
										r="16"
										fill="none"
										class="stroke-current text-border"
										stroke-width="3"
									/>
									<!-- Progress Circle -->
									<circle
										cx="18"
										cy="18"
										r="16"
										fill="none"
										stroke="currentColor"
										class="text-purple"
										stroke-width="3"
										stroke-linecap="round"
										stroke-dasharray="100"
										stroke-dashoffset="{100 - storagePercentage}"
										transform="rotate(-90 18 18)"
									/>
								</svg>
								<div class="absolute inset-0 flex items-center justify-center flex-col">
									<span class="text-2xl font-bold text-highlight">{storagePercentage}%</span>
									<span class="text-xs text-muted">Used</span>
								</div>
							</div>

							<div class="text-center">
								<p class="text-sm text-muted mb-2">{storageUsed} of 10 GB used</p>
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
