<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import ThemeToggle from '$components/ThemeToggle.svelte';
	import { authStore, isAuthenticated, profile } from '$stores/auth';
	import { gradebookStore } from '$stores/gradebook';
	import { debounce } from '$utils/performanceOptimized';

	// Props
	let { userMenuOpen = $bindable(false), classesDropdownOpen = $bindable(false), gamesDropdownOpen = $bindable(false) } = $props();

	// Debounced handlers
	const debouncedClassSelect = debounce(async (categoryId: string) => {
		await gradebookStore.selectClass(categoryId);
		await goto('/gradebook');
	}, 150);

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}

	function toggleClassesDropdown() {
		console.log('🔍 Toggle classes dropdown - before:', classesDropdownOpen);
		classesDropdownOpen = !classesDropdownOpen;
		console.log('🔍 Toggle classes dropdown - after:', classesDropdownOpen);
	}

	function toggleGamesDropdown() {
		gamesDropdownOpen = !gamesDropdownOpen;
	}

	async function handleSelectClass(categoryId: string) {
		classesDropdownOpen = false;
		debouncedClassSelect(categoryId);
	}

	async function handleSignOut() {
		try {
			userMenuOpen = false;
			await authStore.signOut();
		} catch (error) {
			console.error('Sign out error:', error);
		}
	}

	// Close dropdowns when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as Element;
		if (!target.closest('.classes-dropdown')) {
			classesDropdownOpen = false;
		}
		if (!target.closest('.games-dropdown')) {
			gamesDropdownOpen = false;
		}
		if (!target.closest('.user-menu')) {
			userMenuOpen = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<nav class="bg-surface backdrop-blur-md border-b border border-border/50 relative z-50">
	<div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
		<!-- Logo and title -->
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

		<!-- Navigation and user menu -->
		<div class="flex items-center gap-8">
			<!-- Main navigation -->
			<div class="flex gap-6">
				<a href="/dashboard" class="nav-button">Dashboard</a>
				<a href="/files" class="nav-button">Files</a>
				<a href="/chat" class="nav-button">Chat</a>

				<!-- Classes dropdown - shown only if authenticated -->
				<div class="relative classes-dropdown">
					<button
						onclick={(e) => {
							e.preventDefault();
							toggleClassesDropdown();
						}}
						class="nav-button flex items-center gap-2"
						aria-expanded={classesDropdownOpen}
						aria-haspopup="true"
						disabled={!$isAuthenticated}
					>
						<span>Classes</span>
						<svg
							class="w-4 h-4 transition-transform duration-200"
							class:rotate-180={classesDropdownOpen}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
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
							class="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-dropdown z-[100] max-h-80 overflow-y-auto"
						>
							<div class="p-2">
								{#if $gradebookStore.classes.length > 0}
									<div class="space-y-1">
										{#each $gradebookStore.classes as category (category.id)}
											<button
												onclick={() => handleSelectClass(category.id)}
												class="w-full text-left p-3 hover:bg-accent rounded-lg transition-all duration-200 flex items-center justify-between group"
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
													>
														{category.name}
													</span>
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

				<!-- Games dropdown -->
				<div class="relative games-dropdown">
					<button
						onclick={(e) => {
							e.preventDefault();
							toggleGamesDropdown();
						}}
						class="nav-button flex items-center gap-2"
						aria-expanded={gamesDropdownOpen}
						aria-haspopup="true"
					>
						<span>Games</span>
						<svg
							class="w-4 h-4 transition-transform duration-200"
							class:rotate-180={gamesDropdownOpen}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</button>

					{#if gamesDropdownOpen}
						<div
							class="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-dropdown z-[100]"
						>
							<div class="p-2">
								<div class="space-y-1">
									<a
										href="/jeopardy"
										onclick={() => (gamesDropdownOpen = false)}
										class="w-full text-left p-3 hover:bg-accent rounded-lg transition-all duration-200 flex items-center gap-3 group"
									>
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
												d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
											/>
										</svg>
										<span class="text-text-hover group-hover:text-highlight transition-colors">
											Jeopardy
										</span>
									</a>
									<a
										href="/scattergories"
										onclick={() => (gamesDropdownOpen = false)}
										class="w-full text-left p-3 hover:bg-accent rounded-lg transition-all duration-200 flex items-center gap-3 group"
									>
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
												d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
											/>
										</svg>
										<span class="text-text-hover group-hover:text-highlight transition-colors">
											Scattergories
										</span>
									</a>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Right side actions -->
			<div class="flex items-center gap-4">
				<ThemeToggle />

				<!-- User menu - only show if authenticated -->
				{#if $isAuthenticated && $authStore.user}
					<div class="relative user-menu">
						<button
							onclick={toggleUserMenu}
							class="flex items-center gap-3 text-sm text-text-hover hover:text-highlight transition-colors duration-200"
							aria-expanded={userMenuOpen}
							aria-haspopup="true"
						>
							<div
								class="w-8 h-8 bg-gradient-to-br from-purple to-purple-light rounded-full flex items-center justify-center text-highlight font-medium shadow-sm"
							>
								{($profile?.full_name?.[0] || $authStore.user.email?.[0] || 'U').toUpperCase()}
							</div>
							<span class="font-medium">
								{$profile?.full_name || $authStore.user.email?.split('@')[0] || 'User'}
							</span>
							<svg
								class="w-4 h-4 text-muted transition-transform duration-200"
								class:rotate-180={userMenuOpen}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
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
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
											/>
										</svg>
										<span>Profile</span>
									</a>
									<a
										href="/settings"
										class="menu-item text-sm"
										onclick={() => (userMenuOpen = false)}
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										<span>Settings</span>
									</a>
									<div class="separator mx-2 my-1"></div>
									<button onclick={handleSignOut} class="menu-item danger text-sm w-full text-left">
										<svg
											class="w-4 h-4 flex-shrink-0"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
											/>
										</svg>
										<span>Sign Out</span>
									</button>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<a href="/auth/login" class="nav-button">Sign In</a>
				{/if}
			</div>
		</div>
	</div>
</nav>

<style>
	.nav-button {
		@apply text-sm text-text-hover hover:text-highlight transition-colors duration-200 relative;
	}

	.nav-button::after {
		@apply absolute -bottom-1 left-0 w-0 h-0.5 bg-purple transition-all duration-200;
		content: '';
	}

	.nav-button:hover::after {
		@apply w-full;
	}

	.menu-item {
		@apply block px-4 py-2 text-text-hover hover:bg-accent hover:text-highlight transition-all duration-200 flex items-center gap-2;
	}

	.menu-item.danger {
		@apply hover:bg-red-500/20 hover:text-red-500;
	}

	.separator {
		@apply h-px bg-border;
	}
</style>
