<script lang="ts">
	import { page } from '$app/stores';

	// Props
	let { sidebarCollapsed = $bindable(false) } = $props();

	// All navigation items
	const navItems = [
		{
			href: '/dashboard',
			title: 'Dashboard',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			href: '/files',
			title: 'Files',
			icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'
		},
		{
			href: '/classes',
			title: 'Classes',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
		},
		{
			href: '/gradebook',
			title: 'Gradebook',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
		},
		{
			href: '/jeopardy',
			title: 'Jeopardy',
			icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z'
		},
		{
			href: '/log-entries',
			title: 'Log Entries',
			icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
		},
		{
			href: '/chat',
			title: 'Chat',
			icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
		},
		{
			href: '/class-dojo-remake',
			title: 'Class Dojo',
			icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
		},
		{
			href: '/lesson-planner',
			title: 'Lesson Planner',
			icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
		},
		{
			href: '/scattergories',
			title: 'Scattergories',
			icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
		}
	];

	function isActivePath(path: string): boolean {
		return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
	}
</script>

<aside
	class="hidden md:block border-r min-h-screen transition-[width] duration-150 relative"
	style="width: {sidebarCollapsed
		? '3.5rem'
		: '14rem'}; background-color: var(--surface); border-color: var(--border);"
>
	<!-- Toggle button -->
	<button
		onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
		class="absolute -right-3 top-6 z-10 w-6 h-6 rounded-md transition-colors"
		style="background-color: var(--surface); border: 1px solid var(--border); color: var(--muted);"
	>
		{sidebarCollapsed ? '→' : '←'}
	</button>

	<div class="p-4">
		{#if !sidebarCollapsed}
			<h3 class="uppercase text-xs font-semibold mb-4" style="color: var(--muted);">Menu</h3>
		{/if}

		<div class="space-y-2">
			{#each navItems as item}
				<a
					href={item.href}
					class="flex items-center py-2 text-sm font-medium rounded-md transition-colors"
					class:px-3={!sidebarCollapsed}
					class:justify-center={sidebarCollapsed}
					class:px-1={sidebarCollapsed}
					style="color: {isActivePath(item.href) ? 'var(--highlight)' : 'var(--text-hover)'}; 
							background-color: {isActivePath(item.href) ? 'var(--purple-bg)' : 'transparent'};"
					onmouseenter={(e) => {
						if (!isActivePath(item.href)) {
							e.target.style.backgroundColor = 'var(--purple-bg)';
							e.target.style.color = 'var(--highlight)';
						}
					}}
					onmouseleave={(e) => {
						if (!isActivePath(item.href)) {
							e.target.style.backgroundColor = 'transparent';
							e.target.style.color = 'var(--text-hover)';
						}
					}}
				>
					<svg
						class="w-5 h-5"
						class:mr-3={!sidebarCollapsed}
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d={item.icon} />
					</svg>
					{#if !sidebarCollapsed}
						<span>{item.title}</span>
					{/if}
				</a>
			{/each}
		</div>
	</div>
</aside>
