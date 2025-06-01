<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { chatStore } from '$lib/stores/chat';
	import { authStore } from '$lib/stores/auth';

	// Props
	let { isOpen = $bindable(false), onClose = () => {} } = $props<{
		isOpen?: boolean;
		onClose?: () => void;
	}>();

	const dispatch = createEventDispatcher<{
		conversationCreated: { conversationId: string };
	}>();

	// State
	let availableUsers = $state<
		Array<{
			user_id: string;
			full_name: string;
			email: string;
			role: string;
			avatar_url?: string;
			relationship_type: string;
			class_names: string[];
		}>
	>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let selectedUsers = $state<Set<string>>(new Set());
	let conversationType = $state<'direct' | 'group'>('direct');
	let groupName = $state('');

	// Filtered users based on search
	let filteredUsers = $derived(
		searchQuery
			? availableUsers.filter(
					(user) =>
						user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
						user.class_names.some((className) =>
							className.toLowerCase().includes(searchQuery.toLowerCase())
						)
				)
			: availableUsers
	);

	// Load available users when modal opens
	$effect(() => {
		if (isOpen) {
			loadAvailableUsers();
		}
	});

	function getInitials(name: string): string {
		return chatStore.getInitials(name);
	}

	function getRelationshipBadgeColor(type: string): string {
		switch (type) {
			case 'teacher':
				return 'bg-blue-100 text-blue-800';
			case 'student':
				return 'bg-green-100 text-green-800';
			case 'classmate':
				return 'bg-purple-100 text-purple-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	async function loadAvailableUsers() {
		try {
			loading = true;
			error = null;
			const users = await chatStore.getAvailableChatUsers();
			availableUsers = users;
		} catch (err) {
			console.error('Error loading available users:', err);
			error = err instanceof Error ? err.message : 'Failed to load users';
		} finally {
			loading = false;
		}
	}

	function toggleUserSelection(userId: string) {
		if (conversationType === 'direct') {
			// For direct messages, only allow one selection
			selectedUsers = new Set([userId]);
		} else {
			// For group chats, allow multiple selections
			if (selectedUsers.has(userId)) {
				selectedUsers.delete(userId);
			} else {
				selectedUsers.add(userId);
			}
			selectedUsers = new Set(selectedUsers); // Trigger reactivity
		}
	}

	async function createConversation() {
		if (selectedUsers.size === 0) return;

		try {
			loading = true;
			error = null;

			let conversationId: string | null = null;

			if (conversationType === 'direct' && selectedUsers.size === 1) {
				const userId = Array.from(selectedUsers)[0];
				conversationId = await chatStore.createDirectConversation(userId);
			} else if (conversationType === 'group' && selectedUsers.size > 0) {
				if (!groupName.trim()) {
					error = 'Please enter a group name';
					return;
				}
				conversationId = await chatStore.createGroupConversation(
					groupName.trim(),
					Array.from(selectedUsers)
				);
			}

			if (conversationId) {
				dispatch('conversationCreated', { conversationId });
				closeModal();
			} else {
				error = 'Failed to create conversation';
			}
		} catch (err) {
			console.error('Error creating conversation:', err);
			error = err instanceof Error ? err.message : 'Failed to create conversation';
		} finally {
			loading = false;
		}
	}

	function closeModal() {
		isOpen = false;
		selectedUsers = new Set();
		searchQuery = '';
		groupName = '';
		conversationType = 'direct';
		error = null;
		onClose();
	}

	// Handle click outside modal
	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			closeModal();
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="modal-title"
	>
		<div class="card-dark max-w-2xl w-full max-h-[80vh] flex flex-col">
			<!-- Header -->
			<div class="p-6 border-b border-border">
				<div class="flex justify-between items-center">
					<h2 id="modal-title" class="text-xl font-semibold text-highlight">Start New Chat</h2>
					<button
						onclick={closeModal}
						class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
						aria-label="Close modal"
					>
						<svg
							class="w-5 h-5"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				</div>

				<!-- Conversation Type Toggle -->
				<div class="mt-4">
					<div class="flex gap-2">
						<button
							class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								conversationType === 'direct'
									? 'bg-purple text-highlight'
									: 'bg-surface text-text-base hover:bg-surface/80'
							}`}
							onclick={() => {
								conversationType = 'direct';
								selectedUsers = new Set();
							}}
						>
							Direct Message
						</button>
						<button
							class={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
								conversationType === 'group'
									? 'bg-purple text-highlight'
									: 'bg-surface text-text-base hover:bg-surface/80'
							}`}
							onclick={() => {
								conversationType = 'group';
								selectedUsers = new Set();
							}}
						>
							Group Chat
						</button>
					</div>
				</div>

				<!-- Group Name Input (for group chats) -->
				{#if conversationType === 'group'}
					<div class="mt-4">
						<label for="group-name" class="block text-sm font-medium text-text-hover mb-2">
							Group Name
						</label>
						<input
							id="group-name"
							type="text"
							bind:value={groupName}
							placeholder="Enter group chat name..."
							class="input w-full"
						/>
					</div>
				{/if}

				<!-- Search -->
				<div class="mt-4">
					<div class="relative">
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search users..."
							class="input w-full pl-10"
						/>
						<svg
							class="w-5 h-5 text-muted absolute left-3 top-1/2 transform -translate-y-1/2"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
						</svg>
					</div>
				</div>
			</div>

			<!-- Error Message -->
			{#if error}
				<div class="mx-6 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
					<p class="text-sm">{error}</p>
				</div>
			{/if}

			<!-- User List -->
			<div class="flex-1 overflow-y-auto p-6">
				{#if loading}
					<div class="text-center py-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple mx-auto"></div>
						<p class="text-text-base mt-2">Loading users...</p>
					</div>
				{:else if filteredUsers.length === 0}
					<div class="text-center py-8">
						<p class="text-text-base">
							{searchQuery
								? 'No users found matching your search.'
								: 'No users available to chat with.'}
						</p>
					</div>
				{:else}
					<div class="space-y-2">
						{#each filteredUsers as user (user.user_id)}
							<button
								class={`w-full text-left p-4 rounded-lg border transition-colors ${
									selectedUsers.has(user.user_id)
										? 'border-purple bg-purple-bg'
										: 'border-border hover:border-border-hover hover:bg-surface/50'
								}`}
								onclick={() => toggleUserSelection(user.user_id)}
							>
								<div class="flex items-center gap-3">
									<div class="relative">
										<div
											class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium"
										>
											{getInitials(user.full_name)}
										</div>
										{#if selectedUsers.has(user.user_id)}
											<div
												class="absolute -top-1 -right-1 w-5 h-5 bg-purple rounded-full flex items-center justify-center"
											>
												<svg
													class="w-3 h-3 text-white"
													viewBox="0 0 24 24"
													fill="none"
													stroke="currentColor"
													stroke-width="2"
												>
													<polyline points="20 6 9 17 4 12"></polyline>
												</svg>
											</div>
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 mb-1">
											<h3 class="font-medium text-highlight truncate">{user.full_name}</h3>
											<span
												class={`px-2 py-1 rounded-full text-xs font-medium ${getRelationshipBadgeColor(user.relationship_type)}`}
											>
												{user.relationship_type}
											</span>
										</div>
										<p class="text-sm text-text-base truncate">{user.email}</p>
										{#if user.class_names.length > 0}
											<p class="text-xs text-muted mt-1">
												Classes: {user.class_names.join(', ')}
											</p>
										{/if}
									</div>
								</div>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="p-6 border-t border-border">
				<div class="flex justify-between items-center">
					<div class="text-sm text-text-base">
						{#if conversationType === 'direct'}
							{selectedUsers.size > 0
								? 'Ready to start direct message'
								: 'Select a user to message'}
						{:else}
							{selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
						{/if}
					</div>
					<div class="flex gap-3">
						<button onclick={closeModal} class="btn btn-secondary"> Cancel </button>
						<button
							onclick={createConversation}
							disabled={selectedUsers.size === 0 ||
								loading ||
								(conversationType === 'group' && !groupName.trim())}
							class="btn btn-primary"
						>
							{loading
								? 'Creating...'
								: conversationType === 'direct'
									? 'Start Chat'
									: 'Create Group'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
