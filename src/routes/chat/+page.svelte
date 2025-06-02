<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { chatStore } from '$lib/stores/chat';
	import UserSelectModal from '$lib/components/UserSelectModal.svelte';
	import TypingIndicator from '$lib/components/TypingIndicator.svelte';
	import type { ChatUIConversation, ChatUIMessage } from '$lib/types/chat';

	// Chat state from stores
	let conversations = $state<ChatUIConversation[]>([]);
	let messages = $state<ChatUIMessage[]>([]);
	let activeConversation = $state<ChatUIConversation | null>(null);
	let typingUsers = $state<string[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	
	// UI state variables (initialize early to prevent reference errors)
	let newMessage = $state('');
	let searchQuery = $state('');
	let showEmojiPicker = $state(false);
	let showAttachMenu = $state(false);
	let showUserSelectModal = $state(false);
	let messagesContainer: HTMLDivElement;
	let typingTimeout: number | null = null;

	// Subscribe to store changes
	const unsubscribeConversations = chatStore.conversations.subscribe((convs) => {
		const user = $authStore.user;
		if (user && convs.length > 0) {
			conversations = convs.map((conv) => ({
				id: conv.id,
				name: getConversationName(conv, user.id),
				unread: conv.unread_count || 0,
				lastMessage: getLastMessageText(conv, user.id),
				time: chatStore.formatTime(conv.last_message?.created_at || conv.updated_at),
				avatar: getConversationAvatar(conv, user.id),
				online: isConversationOnline(conv, user.id),
				isGroup: (conv as any).type === 'group',
				members: (conv as any).type === 'group' ? conv.participants?.length : undefined
			}));

			// Set active conversation to first one if none selected
			if (!activeConversation && conversations.length > 0) {
				selectConversation(conversations[0]);
			}
		}
	});

	const unsubscribeMessages = chatStore.activeMessages.subscribe((msgs) => {
		const user = $authStore.user;
		if (user) {
			messages = msgs.map((msg) => ({
				id: msg.id,
				sender: msg.sender_id === user.id ? 'me' : 'other',
				senderName: msg.sender_id === user.id ? 'You' : (msg.sender?.full_name || 'Unknown User'),
				text: msg.content,
				time: new Date(msg.created_at || '').toLocaleTimeString('en-US', {
					hour: 'numeric',
					minute: '2-digit',
					hour12: true
				})
			}));
		}
	});

	const unsubscribeLoading = chatStore.loading.subscribe((l) => (loading = l));
	const unsubscribeError = chatStore.error.subscribe((e) => (error = e));
	const unsubscribeTyping = chatStore.activeTypingUsers.subscribe((users) => (typingUsers = users));

	// Helper functions
	function getConversationName(conv: any, currentUserId: string): string {
		if (conv.is_group) {
			return conv.name || `Group Chat (${conv.participants?.length || 0})`;
		}

		// Direct conversation - find other participant
		const otherParticipant = conv.participants?.find((p: any) => p.user_id !== currentUserId);
		return otherParticipant?.user?.full_name || 'Unknown User';
	}

	function getConversationAvatar(conv: any, currentUserId: string): string {
		if (conv.is_group) {
			const name = conv.name || 'Group';
			return chatStore.getInitials(name);
		}

		const otherParticipant = conv.participants?.find((p: any) => p.user_id !== currentUserId);
		const name = otherParticipant?.user?.full_name || 'Unknown';
		return chatStore.getInitials(name);
	}

	function getLastMessageText(conv: any, currentUserId: string): string {
		if (!conv.last_message) return 'No messages yet';

		let prefix = '';
		if (conv.last_message.sender_id === currentUserId) {
			prefix = 'You: ';
		} else if (conv.last_message.sender?.full_name) {
			prefix = `${conv.last_message.sender.full_name}: `;
		}
		return prefix + conv.last_message.content;
	}

	function isConversationOnline(conv: any, currentUserId: string): boolean {
		// For now, return false. We can implement proper online status later
		return false;
	}

	// Filtered conversations
	let filteredConversations = $derived(
		searchQuery
			? conversations.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
			: conversations
	);

	onMount(async () => {
		// Load conversations when component mounts
		await chatStore.loadConversations();
		scrollToBottom();
	});

	onDestroy(() => {
		// Clean up subscriptions
		unsubscribeConversations();
		unsubscribeMessages();
		unsubscribeLoading();
		unsubscribeError();
		unsubscribeTyping();
		
		// Clean up typing timeout
		if (typingTimeout) {
			clearTimeout(typingTimeout);
		}
	});

	$effect(() => {
		// Scroll to bottom when messages change
		scrollToBottom();
	});

	function scrollToBottom() {
		if (messagesContainer) {
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 0);
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !activeConversation) return;

		const messageText = newMessage.trim();
		newMessage = '';

		try {
			await chatStore.sendMessage(activeConversation.id, messageText);
		} catch (err) {
			console.error('Error sending message:', err);
			// Restore message text on error
			newMessage = messageText;
		}
	}

	function selectConversation(conversation: ChatUIConversation) {
		activeConversation = conversation;
		chatStore.setActiveConversation(conversation.id);

		// Reset UI states
		showEmojiPicker = false;
		showAttachMenu = false;
	}

	function addEmoji(emoji: string) {
		newMessage += emoji;
		showEmojiPicker = false;
	}

	// Common emojis
	const emojis = ['😊', '👍', '👏', '🎉', '👨‍🏫', '📚', '✏️', '📝', '🧪', '🔍', '⭐', '❤️'];

	// Close dropdown menus when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
			showEmojiPicker = false;
		}

		if (showAttachMenu && !target.closest('.attach-menu-container')) {
			showAttachMenu = false;
		}
	}

	// Handle keydown event for message input
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			sendMessage();
			stopTyping();
		} else {
			handleTyping();
		}
	}

	// Handle typing indicator for real users
	function handleTyping() {
		if (!activeConversation) return;
		
		const user = $authStore.user;
		if (!user) return;

		// Show typing indicator
		chatStore.setUserTyping(activeConversation.id, user.full_name);

		// Clear existing timeout
		if (typingTimeout) {
			clearTimeout(typingTimeout);
		}

		// Set timeout to stop typing after 2 seconds of inactivity
		typingTimeout = window.setTimeout(() => {
			stopTyping();
		}, 2000);
	}

	function stopTyping() {
		if (!activeConversation) return;
		
		const user = $authStore.user;
		if (!user) return;

		chatStore.setUserNotTyping(activeConversation.id, user.full_name);
		
		if (typingTimeout) {
			clearTimeout(typingTimeout);
			typingTimeout = null;
		}
	}

	function handleConversationCreated(conversationId: string) {
		// Find the new conversation and select it
		const newConversation = conversations.find((c) => c.id === conversationId);
		if (newConversation) {
			selectConversation(newConversation);
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="min-h-screen">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-highlight mb-2">Chat</h1>
			<p class="text-text-base">Communicate with students and classes</p>

			{#if error}
				<div class="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
					<p class="font-medium">Error:</p>
					<p class="text-sm">{error}</p>
				</div>
			{/if}
		</div>

		<!-- Chat Interface -->
		<div class="card-dark p-0 overflow-hidden">
			<div class="flex h-[calc(100vh-12rem)]">
				<!-- Sidebar -->
				<div class="w-80 border-r border-border flex flex-col">
					<!-- Search -->
					<div class="p-4 border-b border-border">
						<div class="relative">
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search conversations..."
								class="input w-full pl-10 py-2"
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

					<!-- Conversation List -->
					<div class="flex-1 overflow-y-auto">
						{#if loading}
							<div class="p-4 text-center">
								<div
									class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple mx-auto"
								></div>
								<p class="text-text-base mt-2">Loading conversations...</p>
							</div>
						{:else}
							{#each filteredConversations as conversation (conversation.id)}
								<button
									class={`w-full text-left p-4 border-b border-border/50 hover:bg-surface/50 transition-colors flex items-center gap-3 ${activeConversation?.id === conversation.id ? 'bg-purple-bg' : ''}`}
									onclick={() => selectConversation(conversation)}
									aria-label={`Chat with ${conversation.name}`}
								>
									<div class="relative">
										<div
											class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium"
										>
											{conversation.avatar}
										</div>
										{#if conversation.online}
											<div
												class="absolute bottom-0 right-0 w-3 h-3 bg-purple rounded-full border-2 border-card"
											></div>
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex justify-between items-center mb-1">
											<div class="font-medium text-highlight truncate">
												{conversation.name}
												{#if conversation.isGroup}
													<span class="text-xs text-text-base ml-1">({conversation.members})</span>
												{/if}
											</div>
											<div class="text-xs text-text-base">{conversation.time}</div>
										</div>
										<div class="flex justify-between items-center">
											<div class="text-sm text-text-base truncate">{conversation.lastMessage}</div>
											{#if conversation.unread > 0}
												<div
													class="bg-purple text-highlight text-xs rounded-full w-5 h-5 flex items-center justify-center"
												>
													{conversation.unread}
												</div>
											{/if}
										</div>
									</div>
								</button>
							{/each}

							{#if filteredConversations.length === 0}
								<div class="p-4 text-center text-text-base">No conversations found</div>
							{/if}
						{/if}
					</div>

					<!-- New Chat Button -->
					<div class="p-4 border-t border-border">
						<button
							class="btn btn-primary w-full"
							onclick={() => (showUserSelectModal = true)}
							aria-label="Start new chat"
						>
							<svg
								class="w-5 h-5 mr-2"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<path
									d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
								></path>
								<line x1="12" y1="11" x2="12" y2="17"></line>
								<line x1="9" y1="14" x2="15" y2="14"></line>
							</svg>
							New Chat
						</button>
					</div>
				</div>

				<!-- Chat Area -->
				<div class="flex-1 flex flex-col">
					<!-- Chat Header -->
					<div class="p-4 border-b border-border flex justify-between items-center">
						{#if activeConversation}
							<div class="flex items-center gap-3">
								<div class="relative">
									<div
										class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium"
									>
										{activeConversation?.avatar || '?'}
									</div>
									{#if activeConversation?.online}
										<div
											class="absolute bottom-0 right-0 w-3 h-3 bg-purple rounded-full border-2 border-card"
										></div>
									{/if}
								</div>

								<div>
									<div class="font-medium text-highlight">
										{activeConversation?.name || 'Select a conversation'}
										{#if activeConversation?.isGroup}
											<span class="text-xs text-text-base ml-1"
												>({activeConversation.members} members)</span
											>
										{/if}
									</div>
									{#if activeConversation?.online && !activeConversation?.isGroup}
										<div class="text-xs text-purple">Online</div>
									{/if}
								</div>
							</div>
						{:else}
							<div class="flex items-center gap-3">
								<div class="text-text-base">Select a conversation to start chatting</div>
							</div>
						{/if}

						<div class="flex gap-2">
							<button
								class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
								aria-label="Start voice call"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<path
										d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
									></path>
								</svg>
							</button>
							<button
								class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
								aria-label="Start video call"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<polygon points="23 7 16 12 23 17 23 7"></polygon>
									<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
								</svg>
							</button>
							<button
								class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
								aria-label="View chat information"
							>
								<svg
									class="w-5 h-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="10"></circle>
									<line x1="12" y1="16" x2="12" y2="12"></line>
									<line x1="12" y1="8" x2="12.01" y2="8"></line>
								</svg>
							</button>
						</div>
					</div>

					<!-- Messages -->
					<div class="flex-1 overflow-y-auto p-4 space-y-4" bind:this={messagesContainer}>
						{#each messages as message (message.id)}
							<div class={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
								<div
									class={`max-w-[70%] ${message.sender === 'me' ? 'bg-purple text-highlight' : 'bg-surface text-text-hover'} rounded-lg px-4 py-2 shadow-sm`}
								>
									{#if message.sender !== 'me'}
											<div class="text-xs font-medium text-purple mb-1">{message.senderName}</div>
										{/if}
										<div class="text-sm mb-1">{message.text}</div>
									<div class="text-xs opacity-70 text-right">{message.time}</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Typing Indicator -->
					<TypingIndicator {typingUsers} />

					<!-- Message Input -->
					<div class="p-4 border-t border-border">
						<div class="relative">
							<input
								type="text"
								bind:value={newMessage}
								placeholder="Type a message..."
								class="input w-full pr-24"
								onkeydown={handleKeydown}
								oninput={handleTyping}
							/>

							<div class="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
								<div class="relative emoji-picker-container">
									<button
										class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
										onclick={() => (showEmojiPicker = !showEmojiPicker)}
										aria-label="Open emoji picker"
									>
										<svg
											class="w-5 h-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<circle cx="12" cy="12" r="10"></circle>
											<path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
											<line x1="9" y1="9" x2="9.01" y2="9"></line>
											<line x1="15" y1="9" x2="15.01" y2="9"></line>
										</svg>
									</button>

									{#if showEmojiPicker}
										<div
											class="absolute bottom-10 right-0 bg-card border border-border rounded-lg p-3 shadow-dropdown z-10 w-64"
										>
											<div class="grid grid-cols-6 gap-2">
												{#each emojis as emoji (emoji)}
													<button
														class="w-10 h-10 text-xl hover:bg-surface rounded-lg flex items-center justify-center transition-colors"
														onclick={() => addEmoji(emoji)}
														aria-label={`Add emoji ${emoji}`}
													>
														{emoji}
													</button>
												{/each}
											</div>
										</div>
									{/if}
								</div>

								<div class="relative attach-menu-container">
									<button
										class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
										onclick={() => (showAttachMenu = !showAttachMenu)}
										aria-label="Open attachment menu"
									>
										<svg
											class="w-5 h-5"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<path
												d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
											></path>
										</svg>
									</button>

									{#if showAttachMenu}
										<div
											class="absolute bottom-10 right-0 bg-card border border-border rounded-lg shadow-dropdown z-10"
										>
											<div class="py-1">
												<button
													class="flex items-center gap-2 px-4 py-2 hover:bg-surface w-full text-left"
													aria-label="Attach image"
												>
													<svg
														class="w-5 h-5 text-purple"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
														<circle cx="8.5" cy="8.5" r="1.5"></circle>
														<polyline points="21 15 16 10 5 21"></polyline>
													</svg>
													<span class="text-text-hover">Image</span>
												</button>
												<button
													class="flex items-center gap-2 px-4 py-2 hover:bg-surface w-full text-left"
													aria-label="Attach document"
												>
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
													<span class="text-text-hover">Document</span>
												</button>
												<button
													class="flex items-center gap-2 px-4 py-2 hover:bg-surface w-full text-left"
													aria-label="Attach video"
												>
													<svg
														class="w-5 h-5 text-purple"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="2"
													>
														<polygon points="23 7 16 12 23 17 23 7"></polygon>
														<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
													</svg>
													<span class="text-text-hover">Video</span>
												</button>
											</div>
										</div>
									{/if}
								</div>

								<button
									class="p-2 text-text-base hover:text-purple rounded-full hover:bg-surface transition-colors"
									onclick={sendMessage}
									disabled={!newMessage.trim()}
									aria-label="Send message"
								>
									<svg
										class="w-5 h-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<line x1="22" y1="2" x2="11" y2="13"></line>
										<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- User Selection Modal -->
	<UserSelectModal
		bind:isOpen={showUserSelectModal}
		onConversationCreated={handleConversationCreated}
	/>
</div>
