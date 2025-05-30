<script lang="ts">
	import '../app.css';
	// Core imports
	import '@fontsource/inter/400.css';
	import '@fontsource/inter/500.css';
	import '@fontsource/inter/600.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	import { goto } from '$app/navigation';
	import { navigating, page } from '$app/stores';
	import LoadingBounce from '$lib/components/LoadingBounce.svelte';
	import ImportWizard from '$lib/components/ImportWizard.svelte';

	// Use regular imports - we'll fix the store files after
	import {
		authStore,
		isAuthenticated,
		loading as authLoading,
		isInitialized
	} from '$lib/stores/auth';
	import { gradebookStore } from '$lib/stores/gradebook';

	// Vercel Speed Insights
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	injectSpeedInsights();

	// Vercel Analytics
	import { dev } from '$app/environment';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';
	injectAnalytics({ mode: dev ? 'development' : 'production' });

	// Performance monitoring
	import { initWebVitals, measurePerformance } from '$lib/utils/performance';
	import { browser } from '$app/environment';

	// Get children prop for Svelte 5
	let { children } = $props();

	// Local state using $state
	let newClassName = $state('');
	let sidebarCollapsed = $state(false);
	let userMenuOpen = $state(false);
	let classesDropdownOpen = $state(false);
	let showImportWizard = $state(false);

	async function handleAddClass() {
		if (newClassName.trim()) {
			await gradebookStore.addClass(newClassName);
			newClassName = '';
		}
	}

	async function handleSelectClass(categoryId: string) {
		await gradebookStore.selectClass(categoryId);
		await goto('/gradebook');
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}

	function toggleClassesDropdown() {
		classesDropdownOpen = !classesDropdownOpen;
	}

	async function handleSignOut() {
		console.log('Sign out button clicked');
		try {
			const success = await authStore.signOut();
			console.log('Sign out result:', success);
			// Navigation is handled by the auth store
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}

	// Setup with $effect instead of onMount
	$effect(() => {
		// Close user menu when clicking outside
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (userMenuOpen && !target.closest('.user-menu')) {
				userMenuOpen = false;
			}
			if (classesDropdownOpen && !target.closest('.classes-dropdown')) {
				classesDropdownOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	// Ensure data is loaded - make it non-blocking
	$effect(() => {
		setTimeout(() => {
			gradebookStore.ensureDataLoaded().catch(console.error);
		}, 100); // Small delay to not block initial render
	});

	// Initialize performance monitoring - temporarily disabled for debugging
	// $effect(() => {
	// 	if (browser) {
	// 		initWebVitals();
	// 		// Mark navigation performance
	// 		if ($navigating) {
	// 			performance.mark('navigation-start');
	// 		} else if (performance.getEntriesByName('navigation-start').length > 0) {
	// 			measurePerformance('navigation-end', 'navigation-start');
	// 		}
	// 	}
	// });

	// Helper function to check if current path matches menu item
	function isActivePath(path: string): boolean {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}
</script>

<!-- Show loading state while auth is initializing -->
{#if !$isInitialized}
	<div class="min-h-screen bg-bg-base flex items-center justify-center">
		<div class="text-center">
			<LoadingBounce />
			<p class="text-muted mt-4">Initializing...</p>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-bg-base text-text-base flex flex-col transition-colors">
		<nav class="bg-surface/80 backdrop-blur-md border-b border-border/50 relative z-50">
			<div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
				<div class="flex items-center gap-3">
					<div
						class="h-8 w-8 bg-gradient-to-br from-purple to-purple-light rounded-md flex items-center justify-center shadow-glow"
					>
						<svg
							class="w-5 h-5 text-highlight"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
						</svg>
					</div>
					<h1 class="text-xl font-bold tracking-wide text-highlight">
						Teacher <span class="text-purple">Dashboard</span>
					</h1>
				</div>

				<div class="flex items-center gap-8">
					<div class="flex gap-6">
						<a href="/dashboard" class="nav-button">Dashboard</a>
						<a href="/files" class="nav-button">Files</a>
						<a href="/chat" class="nav-button">Chat</a>

						<!-- Classes dropdown -->
						<div class="relative classes-dropdown">
							<button onclick={toggleClassesDropdown} class="nav-button flex items-center gap-1">
								Classes
								<svg
									class="w-4 h-4 transition-transform duration-200"
									class:rotate-180={classesDropdownOpen}
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>

							{#if classesDropdownOpen}
								<div
									class="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-lg shadow-dropdown z-[100] max-h-80 overflow-y-auto"
								>
									<div class="p-2">
										<!-- Create new class section -->
										<button
											onclick={() => {
												showImportWizard = true;
												classesDropdownOpen = false;
											}}
											class="w-full mb-3 p-3 bg-purple text-highlight rounded-lg hover:bg-purple-hover transition-all duration-300 flex items-center justify-center gap-2"
										>
											<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M12 4v16m8-8H4"
												/>
											</svg>
											Create New Class
										</button>
										<div
											style="display: none"
											class="mb-3 p-3 bg-surface/50 rounded-lg border border-border/50"
										>
											<div class="flex items-center gap-2">
												<input
													type="text"
													bind:value={newClassName}
													placeholder="New class name"
													class="flex-1 bg-bg-base text-text-hover border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent-hover focus:border-accent-hover transition-all duration-200 placeholder:text-muted"
													onkeydown={(e) => e.key === 'Enter' && handleAddClass()}
												/>
												<button
													onclick={handleAddClass}
													class="bg-purple text-highlight px-3 py-2 rounded-lg text-sm hover:bg-purple-hover transition-all duration-300 flex items-center gap-1"
													aria-label="Add new class"
												>
													<svg
														class="w-4 h-4"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 4v16m8-8H4"
														/>
													</svg>
													Add
												</button>
											</div>
										</div>

										<!-- Classes list -->
										{#if $gradebookStore.getClasses.length > 0}
											<div class="space-y-1">
												{#each $gradebookStore.getClasses as category (category.id)}
													<button
														onclick={() => {
															handleSelectClass(category.id);
															classesDropdownOpen = false;
														}}
														class="w-full text-left p-3 hover:bg-accent/20 rounded-lg transition-all duration-200 flex items-center justify-between group"
													>
														<div class="flex items-center gap-3">
															<svg
																class="w-4 h-4 text-muted group-hover:text-highlight transition-colors"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
																/>
															</svg>
															<span
																class="text-text-hover group-hover:text-highlight transition-colors"
																>{category.name}</span
															>
														</div>
														<span class="bg-purple text-highlight text-xs rounded-full px-2 py-1">
															{category.studentIds.length}
														</span>
													</button>
												{/each}
											</div>
										{:else}
											<div class="p-3 text-center text-muted text-sm">No classes created yet</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>

						<a href="/gradebook" class="nav-button">Gradebook</a>
						<a href="/jeopardy" class="nav-button">Jeopardy</a>
						<a href="/log-entries" class="nav-button whitespace-nowrap">Logs</a>
					</div>

					<div class="flex items-center gap-3">
						<ThemeToggle />

						<div class="relative user-menu">
							{#if $isAuthenticated}
								<button
									onclick={toggleUserMenu}
									class="flex items-center gap-3 hover:bg-accent/20 p-1 rounded-lg"
								>
									<div
										class="w-8 h-8 bg-purple rounded-full flex items-center justify-center text-highlight font-medium"
									>
										{$authStore.user?.user_metadata?.full_name?.[0] ||
											$authStore.user?.email?.[0]?.toUpperCase() ||
											'T'}
									</div>
									<span class="text-sm text-muted"
										>{$authStore.user?.user_metadata?.full_name || 'Teacher'}</span
									>
									<svg
										class="w-4 h-4 text-muted"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>

								{#if userMenuOpen}
									<div
										class="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-dropdown z-[100]"
									>
										<div class="py-1">
											<a
												href="/settings/profile"
												class="menu-item text-sm"
												onclick={() => (userMenuOpen = false)}
											>
												<svg
													class="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
													></path>
												</svg>
												<span>Profile</span>
											</a>
											<a
												href="/settings"
												class="menu-item text-sm"
												onclick={() => (userMenuOpen = false)}
											>
												<svg
													class="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
													></path>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
													></path>
												</svg>
												<span>Settings</span>
											</a>
											<div class="separator mx-2 my-1"></div>
											<button
												onclick={() => {
													userMenuOpen = false;
													handleSignOut();
												}}
												class="menu-item danger text-sm w-full text-left"
											>
												<svg
													class="w-4 h-4 flex-shrink-0"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
													xmlns="http://www.w3.org/2000/svg"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
													></path>
												</svg>
												<span>Sign out</span>
											</button>
										</div>
									</div>
								{/if}
							{:else}
								<a
									href="/auth/login"
									class="text-text-hover hover:text-highlight transition-all duration-300 font-medium px-3 py-2 rounded-md hover:bg-purple-bg"
								>
									Sign in
								</a>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</nav>

		<div class="flex flex-grow relative">
			<!-- Left sidebar - hidden on smaller screens -->
			<aside
				class="hidden md:block bg-surface/80 backdrop-blur-md border-r border-border/50 transition-[width] duration-150 relative"
				class:collapsed={sidebarCollapsed}
				style="width: {sidebarCollapsed ? '3.5rem' : '14rem'}"
			>
				<!-- Toggle button -->
				<button
					onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
					class="absolute -right-3 top-6 z-10 w-6 h-6 bg-surface border border-border rounded-md text-muted hover:text-highlight hover:border-highlight transition-all duration-200"
					aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				>
					<svg
						class="w-full h-full p-1"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d={sidebarCollapsed ? 'M13 5l7 7-7 7' : 'M11 19l-7-7 7-7'}
						/>
					</svg>
				</button>

				<div
					class="space-y-6 transition-[padding] duration-150"
					class:p-4={!sidebarCollapsed}
					class:px-0={sidebarCollapsed}
					class:py-4={sidebarCollapsed}
				>
					<div>
						{#if !sidebarCollapsed}
							<h3 class="text-muted uppercase text-xs font-semibold mb-3 px-3">Menu</h3>
						{/if}
						<div class="space-y-1">
							<a
								href="/dashboard"
								class="menu-item relative group hover:bg-purple-bg text-text-hover hover:text-highlight"
								class:px-3={!sidebarCollapsed}
								class:px-1={sidebarCollapsed}
								class:justify-center={sidebarCollapsed}
								title="Dashboard"
							>
								<svg
									class="w-5 h-5 flex-shrink-0"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
									/>
								</svg>
								{#if !sidebarCollapsed}
									<span>Dashboard</span>
								{:else}
									<span
										class="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm text-text-hover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-dropdown"
										>Dashboard</span
									>
								{/if}
							</a>

							<a
								href="/files"
								class="menu-item relative group hover:bg-purple-bg text-text-hover hover:text-highlight"
								class:px-3={!sidebarCollapsed}
								class:px-1={sidebarCollapsed}
								class:justify-center={sidebarCollapsed}
								title="Files"
							>
								<svg
									class="w-5 h-5 flex-shrink-0"
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
								{#if !sidebarCollapsed}
									<span>Files</span>
								{:else}
									<span
										class="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm text-text-hover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-dropdown"
										>Files</span
									>
								{/if}
							</a>

							<a
								href="/chat"
								class="menu-item relative group hover:bg-purple-bg text-text-hover hover:text-highlight"
								class:px-3={!sidebarCollapsed}
								class:px-1={sidebarCollapsed}
								class:justify-center={sidebarCollapsed}
								title="Chat"
							>
								<svg
									class="w-5 h-5 flex-shrink-0"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
									></path>
								</svg>
								{#if !sidebarCollapsed}
									<span>Chat</span>
								{:else}
									<span
										class="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm text-text-hover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-dropdown"
										>Chat</span
									>
								{/if}
							</a>

							<a
								href="/gradebook"
								class="menu-item relative group hover:bg-purple-bg text-text-hover hover:text-highlight"
								class:px-3={!sidebarCollapsed}
								class:px-1={sidebarCollapsed}
								class:justify-center={sidebarCollapsed}
								title="Gradebook"
							>
								<svg
									class="w-5 h-5 flex-shrink-0"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
									/>
								</svg>
								{#if !sidebarCollapsed}
									<span>Gradebook</span>
								{:else}
									<span
										class="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm text-text-hover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-dropdown"
										>Gradebook</span
									>
								{/if}
							</a>

							<a
								href="/jeopardy"
								class="menu-item relative group"
								class:px-3={!sidebarCollapsed}
								class:px-1={sidebarCollapsed}
								class:justify-center={sidebarCollapsed}
								title="Jeopardy"
							>
								<svg
									class="w-5 h-5 flex-shrink-0"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
									/>
								</svg>
								{#if !sidebarCollapsed}
									<span>Jeopardy</span>
								{:else}
									<span
										class="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm text-text-hover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-dropdown"
										>Jeopardy</span
									>
								{/if}
							</a>

							<a
								href="/log-entries"
								class="menu-item relative group"
								class:px-3={!sidebarCollapsed}
								class:px-1={sidebarCollapsed}
								class:justify-center={sidebarCollapsed}
								title="Log Entries"
							>
								<svg
									class="w-5 h-5 flex-shrink-0"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/>
								</svg>
								{#if !sidebarCollapsed}
									<span>Log Entries</span>
								{:else}
									<span
										class="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm text-text-hover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-dropdown"
										>Log Entries</span
									>
								{/if}
							</a>

							<a
								href="/class-dojo-remake"
								class="menu-item relative group"
								class:px-3={!sidebarCollapsed}
								class:px-1={sidebarCollapsed}
								class:justify-center={sidebarCollapsed}
								title="Class Dojo"
							>
								<svg
									class="w-5 h-5 flex-shrink-0"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								{#if !sidebarCollapsed}
									<span>Class Dojo</span>
								{:else}
									<span
										class="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm text-text-hover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-dropdown"
										>Class Dojo</span
									>
								{/if}
							</a>

							<a
								href="/lesson-planner"
								class="menu-item relative group"
								class:px-3={!sidebarCollapsed}
								class:px-1={sidebarCollapsed}
								class:justify-center={sidebarCollapsed}
								title="Lesson Planner"
							>
								<svg
									class="w-5 h-5 flex-shrink-0"
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								{#if !sidebarCollapsed}
									<span>Lesson Planner</span>
								{:else}
									<span
										class="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded-lg text-sm text-text-hover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-dropdown"
										>Lesson Planner</span
									>
								{/if}
							</a>
						</div>
					</div>
				</div>
			</aside>

			<!-- Main content area -->
			<main class="flex-grow p-6 overflow-y-auto relative z-0">
				{#if $navigating}
					<div
						class="absolute inset-0 bg-bg-base/80 backdrop-blur-sm flex items-center justify-center z-50"
					>
						<LoadingBounce />
					</div>
				{/if}
				{@render children?.()}
			</main>
		</div>

		<footer
			class="bg-card/80 backdrop-blur-sm text-center text-muted text-xs py-4 border-t border-border/50 px-6"
		>
			Teacher Dashboard • {new Date().getFullYear()}
		</footer>
	</div>

	{#if showImportWizard}
		<ImportWizard
			onClose={() => (showImportWizard = false)}
			onComplete={() => {
				showImportWizard = false;
				void gradebookStore.loadAllData();
			}}
		/>
	{/if}
{/if}
