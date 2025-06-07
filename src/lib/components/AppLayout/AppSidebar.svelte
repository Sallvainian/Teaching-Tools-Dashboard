<script lang="ts">
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth';

	// Props
	let { sidebarCollapsed = $bindable(false) } = $props();

	// All navigation items
	const allNavItems = [
		{
			href: '/dashboard',
			title: 'Dashboard',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
			roles: ['teacher', 'student']
		},
		{
			href: '/files',
			title: 'Files',
			icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
			roles: ['teacher', 'student']
		},
		{
			href: '/classes',
			title: 'Classes',
			icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
			roles: ['teacher']
		},
		{
			href: '/gradebook',
			title: 'Gradebook',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
			roles: ['teacher']
		},
		{
			href: '/calendar',
			title: 'Calendar',
			icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
			roles: ['teacher', 'student']
		},
		{
			href: '/chat',
			title: 'Chat',
			icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
			roles: ['teacher', 'student']
		}
	];

	// Filter navigation items based on user role
	let navItems = $derived(
		allNavItems.filter(item => {
			const userRole = $authStore.role;
			return !userRole || item.roles.includes(userRole);
		})
	);

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
   {#each navItems as item (item.href)}
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
							const target = e.target as HTMLElement;
							target.style.backgroundColor = 'var(--purple-bg)';
							target.style.color = 'var(--highlight)';
						}
					}}
					onmouseleave={(e) => {
						if (!isActivePath(item.href)) {
							const target = e.target as HTMLElement;
							target.style.backgroundColor = 'transparent';
							target.style.color = 'var(--text-hover)';
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
