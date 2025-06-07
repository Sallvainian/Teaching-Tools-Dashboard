<script lang="ts">
	import { onMount } from 'svelte';
	import { fly, fade } from 'svelte/transition';
	import { 
		notifications, 
		unreadCount, 
		recentNotifications, 
		markAsRead, 
		markAllAsRead, 
		deleteNotification,
		initializeNotifications
	} from '$lib/stores/notifications';
	import type { Notification } from '$lib/types/notifications';

	let showDropdown = $state(false);
	let dropdownElement: HTMLDivElement;

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			showDropdown = false;
		}
	}

	onMount(() => {
		initializeNotifications();
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function handleNotificationClick(notification: Notification) {
		markAsRead(notification.id);
		if (notification.actionUrl) {
			window.location.href = notification.actionUrl;
		}
		showDropdown = false;
	}

	function handleMarkAllRead() {
		markAllAsRead();
	}

	function handleDeleteNotification(event: Event, notificationId: string) {
		event.stopPropagation();
		deleteNotification(notificationId);
	}

	function getNotificationIcon(type: Notification['type']) {
		switch (type) {
			case 'assignment':
				return '📚';
			case 'calendar':
				return '📅';
			case 'message':
				return '💬';
			case 'system':
				return '⚙️';
			default:
				return '🔔';
		}
	}

	function getPriorityColor(priority: Notification['priority']) {
		switch (priority) {
			case 'urgent':
				return 'text-red-400';
			case 'high':
				return 'text-orange-400';
			case 'medium':
				return 'text-yellow-400';
			case 'low':
				return 'text-blue-400';
			default:
				return 'text-muted';
		}
	}

	function formatTimestamp(timestamp: Date) {
		const now = new Date();
		const diff = now.getTime() - timestamp.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return timestamp.toLocaleDateString();
	}
</script>

<div class="relative" bind:this={dropdownElement}>
	<!-- Notification Button -->
	<button
		onclick={toggleDropdown}
		class="relative p-2 text-muted hover:text-text-base transition-colors rounded-lg hover:bg-purple-bg"
		class:text-text-base={showDropdown}
		class:bg-purple-bg={showDropdown}
	>
		<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.828-3.828a4.472 4.472 0 01-1.172-3.008V10a4.5 4.5 0 00-9 0v.164a4.472 4.472 0 01-1.172 3.008L2 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H9" />
		</svg>
		
		<!-- Unread Count Badge -->
		{#if $unreadCount > 0}
			<span 
				class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
				transition:fade={{ duration: 200 }}
			>
				{$unreadCount > 99 ? '99+' : $unreadCount}
			</span>
		{/if}
	</button>

	<!-- Dropdown -->
	{#if showDropdown}
		<div 
			class="absolute right-0 mt-2 w-96 bg-card border border-border rounded-lg shadow-xl z-50"
			transition:fly={{ y: -10, duration: 200 }}
		>
			<!-- Header -->
			<div class="flex items-center justify-between p-4 border-b border-border">
				<h3 class="text-lg font-semibold text-text-base">Notifications</h3>
				{#if $unreadCount > 0}
					<button
						onclick={handleMarkAllRead}
						class="text-sm text-purple-400 hover:text-purple-300 transition-colors"
					>
						Mark all read
					</button>
				{/if}
			</div>

			<!-- Notifications List -->
			<div class="max-h-96 overflow-y-auto">
				{#if $recentNotifications.length === 0}
					<div class="p-8 text-center text-muted">
						<svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-3.828-3.828a4.472 4.472 0 01-1.172-3.008V10a4.5 4.5 0 00-9 0v.164a4.472 4.472 0 01-1.172 3.008L2 17h5m8 0v1a3 3 0 11-6 0v-1m6 0H9" />
						</svg>
						<p class="text-sm">No notifications yet</p>
					</div>
				{:else}
					{#each $recentNotifications as notification (notification.id)}
						<div
							class="w-full border-b border-border last:border-b-0 group flex items-center"
							class:bg-purple-bg={!notification.read}
						>
							<div
								onclick={() => handleNotificationClick(notification)}
								class="flex-1 p-4 text-left hover:bg-purple-bg transition-colors cursor-pointer"
								role="button"
								tabindex="0"
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleNotificationClick(notification);
									}
								}}
							>
								<div class="flex items-start gap-3">
									<!-- Icon -->
									<div class="flex-shrink-0 w-8 h-8 rounded-full bg-bg-base flex items-center justify-center text-lg">
										{getNotificationIcon(notification.type)}
									</div>

									<!-- Content -->
									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2">
											<div class="flex-1 min-w-0">
												<h4 class="text-sm font-medium text-text-base truncate">
													{notification.title}
												</h4>
												<p class="text-sm text-muted mt-1 line-clamp-2">
													{notification.message}
												</p>
											</div>
											
											<!-- Priority indicator -->
											<div class="flex items-center gap-2">
												<span class="w-2 h-2 rounded-full {getPriorityColor(notification.priority)}"></span>
												{#if !notification.read}
													<span class="w-2 h-2 bg-blue-500 rounded-full"></span>
												{/if}
											</div>
										</div>

										<div class="flex items-center justify-between mt-2">
											<span class="text-xs text-muted">
												{formatTimestamp(notification.timestamp)}
											</span>
										</div>
									</div>
								</div>
							</div>
							
							<!-- Delete button -->
							<button
								onclick={(e) => handleDeleteNotification(e, notification.id)}
								class="opacity-0 group-hover:opacity-100 transition-opacity p-3 text-muted hover:text-red-400"
								aria-label="Delete notification"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
								</svg>
							</button>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Footer -->
			{#if $notifications.length > 10}
				<div class="p-3 border-t border-border">
					<button
						onclick={() => window.location.href = '/notifications'}
						class="w-full text-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
					>
						View all notifications
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>