<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { chatStore } from '$lib/stores/chat';
	import { callStore, hasIncomingCall } from '$lib/stores/call';
	import { confirmationStore } from '$lib/stores/confirmationModal';
	import { supabase } from '$lib/supabaseClient';
	import UserSelectModal from '$lib/components/UserSelectModal.svelte';
	import TypingIndicator from '$lib/components/TypingIndicator.svelte';
	import GifPicker from '$lib/components/GifPicker.svelte';
	import ImagePreviewModal from '$lib/components/ImagePreviewModal.svelte';
	import IncomingCallModal from '$lib/components/IncomingCallModal.svelte';
	import ActiveCallWidget from '$lib/components/ActiveCallWidget.svelte';
	import type { ChatUIConversation, ChatUIMessage, ConversationWithDetails, ConversationParticipant } from '$lib/types/chat';
	import { getUser } from '$lib/utils/storeHelpers';
	import { isHTMLElement, isHTMLInputElement, getEventTargetValue } from '$lib/utils/domHelpers';


	// Chat state from stores
	let conversations = $state<ChatUIConversation[]>([]);
	let messages = $state<ChatUIMessage[]>([]);
	let activeConversation = $state<ChatUIConversation | null>(null);
	let typingUsers = $state<string[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let rawConversations = $state<ConversationWithDetails[]>([]);

	// UI state variables (initialize early to prevent reference errors)
	let newMessage = $state('');
	let searchQuery = $state('');
	let showEmojiPicker = $state(false);
	let showAttachMenu = $state(false);
	let showUserSelectModal = $state(false);
	let showGifPicker = $state(false);
	let showImagePreview = $state(false);
	let previewImageUrl = $state<string | null>(null);
	let messagesContainer: HTMLDivElement;
	let typingTimeout: number | null = null;
	let fileInput: HTMLInputElement;
	
	// Format time ago for conversation list
	function formatTimeAgo(timestamp: string | null): string {
		if (!timestamp) return '';
		
		const now = new Date();
		const messageTime = new Date(timestamp);
		const diffMs = now.getTime() - messageTime.getTime();
		const diffMinutes = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		
		if (diffMinutes < 1) {
			return 'Now';
		} else if (diffMinutes < 60) {
			return `${diffMinutes} Minute${diffMinutes > 1 ? 's' : ''} Ago`;
		} else if (diffHours < 24) {
			return `${diffHours} Hour${diffHours > 1 ? 's' : ''} Ago`;
		} else {
			// For older messages, use the existing formatTime function from chatStore
			return chatStore.formatTime(timestamp);
		}
	}

	// Subscribe to store changes
	const unsubscribeConversations = chatStore.conversations.subscribe((convs) => {
		const user = getUser($authStore);
		if (user && convs.length > 0) {
			// Store raw conversations for participant lookup
			rawConversations = convs as ConversationWithDetails[];
			
			// Process conversations
			const processedConversations = convs.map((conv) => {
				// Determine if it's a group chat: has more than 2 participants
				const isGroupChat = conv.participants && conv.participants.length > 2;
				
				return {
					id: conv.id,
					name: conv.name ?? getConversationDisplayName(conv as ConversationWithDetails),
					displayName: getConversationDisplayName(conv as ConversationWithDetails),
					avatar: conv.avatar ?? getConversationInitials(conv as ConversationWithDetails, user.id),
					displayAvatar: getConversationAvatarUrl(conv as ConversationWithDetails, user.id),
					is_group: isGroupChat,
					last_message_text: getLastMessageText(conv as ConversationWithDetails),
					last_message_time: formatTimeAgo(conv.last_message?.created_at ?? null),
					unread_count: conv.unread_count ?? 0,
					is_online: isConversationOnline(conv as ConversationWithDetails, user.id),
					created_at: conv.created_at ?? new Date().toISOString(),
					updated_at: conv.updated_at ?? new Date().toISOString()
				};
			});

			conversations = processedConversations.map(conv => ({
				...conv,
				displayAvatar: conv.displayAvatar ?? '' // Ensure displayAvatar is always a string
			}));

			// Set active conversation to first one if none selected
			if (!activeConversation && conversations.length > 0) {
				activeConversation = conversations[0];
				chatStore.setActiveConversation(activeConversation.id);
			}
		}
	});

	// Load conversations on mount if not already loaded
	onMount(async () => {
		if (conversations.length === 0) {
			await chatStore.loadConversations();
		}
		// Initialize call system
		await callStore.initialize();
	});

	const unsubscribeMessages = chatStore.activeMessages.subscribe((msgs) => {
		const user = getUser($authStore);
		if (user) {
			
			messages = msgs.map((msg, index) => {
				// Better fallback for sender name
				let senderName = 'Unknown User';
				
				if (msg.sender && (msg.sender.full_name || msg.sender.email)) {
					senderName = msg.sender.full_name || msg.sender.email || 'Unknown User';
				} else if (msg.sender_id === user.id) {
					// If it's the current user but sender is missing
					const profile = $authStore.profile;
					senderName = profile?.full_name || user.email || 'You';
				} else {
					// Enhanced fallback: try to find sender in conversation participants
					// Try to get sender name from conversations data
					const currentConv = conversations.find(c => c.id === activeConversation?.id);
					if (currentConv && msg.sender_id) {
						// Use the sender_id to create a more informative fallback name
						senderName = `User ${msg.sender_id.slice(0, 8)}`;
					} else {
						// Final fallback
						senderName = 'Unknown User';
					}
				}
				
				return {
					id: msg.id,
					content: msg.content,
					sender_name: senderName,
					sender_avatar: msg.sender?.avatar_url ?? '',
					created_at: msg.created_at ?? new Date().toISOString(),
					is_own_message: msg.sender_id === user.id,
					attachments: msg.attachments ?? []
				};
			});
		}
	});

	const unsubscribeLoading = chatStore.loading.subscribe((l) => (loading = l));
	const unsubscribeError = chatStore.error.subscribe((e) => (error = e));
	const unsubscribeTyping = chatStore.activeTypingUsers.subscribe((users) => {
		typingUsers = users;
	});

	// Cleanup subscriptions on destroy
	onDestroy(() => {
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

	// Helper functions
	function getConversationDisplayName(conversation: ConversationWithDetails): string {
		if (conversation.name) {
			return conversation.name;
		}

		if (conversation.is_group) {
			return 'Group Conversation';
		}

		// For direct messages, use last_message sender info if available
		if (conversation.last_message?.sender && conversation.last_message.sender_id !== getUser($authStore)?.id) {
			return conversation.last_message.sender.full_name || conversation.last_message.sender.email || 'Unknown User';
		}

		// Otherwise check participants
		const user = getUser($authStore);
		const otherParticipant = conversation.participants?.find(
			(p: ConversationParticipant) => p.user_id !== user?.id
		);

		if (otherParticipant?.user) {
			return otherParticipant.user.full_name || otherParticipant.user.email || 'Unknown User';
		}

		return 'Unknown User';
	}

	function getConversationInitials(conversation: ConversationWithDetails, currentUserId: string): string {
		const displayName = getConversationDisplayName(conversation);
		return chatStore.getInitials(displayName);
	}

	// Reactive statement to update active conversation when route changes

	function isConversationOnline(conversation: ConversationWithDetails, userId: string): boolean {
		if (conversation.is_group) {
			return false; // Groups don't have online status
		}

		// For direct messages, check if the other participant is online
		const otherParticipant = conversation.participants?.find(
			(p: ConversationParticipant) => p.user_id !== userId
		);

		return otherParticipant?.is_online ?? false;
	}

 async function _getConversationName(conv: ConversationWithDetails, currentUserId: string): Promise<string> {
		if (conv.is_group) {
			return conv.name ?? `Group Conversation (${conv.participants?.length ?? 0})`;
		}

		// Direct conversation - find other participant
		const otherParticipant = conv.participants?.find((p: ConversationParticipant) => p.user_id !== currentUserId);

		// If we have participant data, use it
		if (otherParticipant && otherParticipant.user) {
			return otherParticipant.user.full_name ?? 
				   otherParticipant.user.email ?? 
				   'Unknown User';
		}

		// If we don't have participant data in the expected place, skip this check

		// If participant data is missing, load all messages from this conversation to find the other user
		try {
			const { data: messages } = await supabase
				.from('messages')
				.select(`
					sender_id,
					sender:app_users!messages_sender_id_fkey (id, full_name, email)
				`)
				.eq('conversation_id', conv.id)
				.neq('sender_id', currentUserId)
				.limit(1);

			if (messages && messages.length > 0 && messages[0].sender) {
				const sender = messages[0].sender as { full_name?: string; email?: string; };
				return sender.full_name ?? sender.email ?? 'Unknown User';
			}
		} catch (error: unknown) {
			console.error('Error fetching conversation participant:', error);
		}

		// Fallback: try to get name from last message (any sender, not just others)
		if (conv.last_message?.sender && conv.last_message.sender_id !== currentUserId) {
			const senderName = conv.last_message.sender.full_name ?? 
							   conv.last_message.sender.email ?? 
							   'Unknown User';
			return senderName;
		}

		// Last resort: use conversation name or a more friendly generic name
		return conv.name ?? 'Unknown User';
	}

 function _getConversationAvatar(conv: ConversationWithDetails, currentUserId: string): string {
		if (conv.is_group) {
			const name = conv.name ?? 'Group';
			return chatStore.getInitials(name);
		}

		const otherParticipant = conv.participants?.find((p: ConversationParticipant) => p.user_id !== currentUserId);

		// If we have participant data, use it
		if (otherParticipant && otherParticipant.user) {
			const name = otherParticipant.user.full_name ?? 
						 otherParticipant.user.email ?? 
						 'Unknown';
			return chatStore.getInitials(name);
		}

		// If we don't have participant data in the expected place, skip this check

		// Fallback: try to get name from last message
		if (conv.last_message?.sender && conv.last_message.sender_id !== currentUserId) {
			const name = conv.last_message.sender.full_name ?? 
						 'Unknown';
			return chatStore.getInitials(name);
		}


		// Last resort
		return chatStore.getInitials('Direct Chat');
	}

	function getConversationAvatarUrl(conv: ConversationWithDetails, currentUserId: string): string | null {
		if (conv.is_group) {
			return conv.avatar ?? null;
		}

		// Use last_message sender avatar if available
		if (conv.last_message?.sender && conv.last_message.sender_id !== currentUserId) {
			return conv.last_message.sender.avatar_url || null;
		}

		// Otherwise check participants
		const otherParticipant = conv.participants?.find((p: ConversationParticipant) => p.user_id !== currentUserId);
		if (otherParticipant?.user?.avatar_url) {
			return otherParticipant.user.avatar_url;
		}

		return null;
	}

	function getGroupParticipants(conversationId: string): Array<{name: string, avatar?: string}> {
		const conversation = conversations.find(c => c.id === conversationId);
		if (!conversation?.is_group) return [];

		// Use rawConversations which has the full participant data
		const fullConv = rawConversations.find(c => c.id === conversationId);
		
		if (!fullConv?.participants) return [];

		return fullConv.participants
			.filter((p: any) => p.user)
			.map((p: any) => ({
				name: p.user.full_name || p.user.email || 'Unknown User',
				avatar: p.user.avatar_url
			}));
	}

 function getLastMessageText(conv: ConversationWithDetails): string {
		if (!conv.last_message) return 'No messages yet';

		const user = getUser($authStore);
		const currentUserId = user?.id;
		
		let prefix = '';
		if (conv.last_message.sender_id === currentUserId) {
			prefix = 'You: ';
		} else {
			// Try to get the sender name from the last message
			const senderName = conv.last_message.sender?.full_name;

			if (senderName) {
				prefix = `${senderName}: `;
			} else {
				// If sender name is not available in the last message, try to get it from participants
				const otherParticipant = conv.participants?.find((p: ConversationParticipant) => p.user_id !== currentUserId);
				if (otherParticipant) {
					const participantName = otherParticipant?.user?.full_name ?? 
										   otherParticipant?.user?.email ?? 
										   'Contact';
					prefix = participantName ? `${participantName}: ` : 'Contact: ';
				} else {
					// Try to get name from participants array
					const otherParticipantFromConv = conv.participants?.find((p: ConversationParticipant) => p.user_id !== currentUserId);
					if (otherParticipantFromConv) {
						const participantName = otherParticipantFromConv?.user?.full_name ?? 
											   otherParticipantFromConv?.user?.email ?? 
											   'Contact';
						prefix = participantName ? `${participantName}: ` : 'Contact: ';
					} else {
						prefix = 'Contact: ';
					}
				}
			}
		}
		
		// Check if it's a GIF message
		if (conv.last_message.content.startsWith('[GIF]')) {
			return prefix + '🎬 GIF';
		}
		
		// Check if it's an image message
		if (conv.last_message.content.startsWith('[IMAGE]')) {
			return prefix + '🖼️ Image';
		}
		
		return prefix + conv.last_message.content;
	}

	// Filtered conversations
	let filteredConversations = $derived(
		searchQuery
			? conversations.filter((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
			: conversations
	);

	// Note: messages is already a state variable, no need for activeMessages

	// scrollToBottom will be called by the $effect when messages update

	onDestroy(() => {
		// Clean up subscriptions
		unsubscribeConversations();
		unsubscribeMessages();
		unsubscribeLoading();
		unsubscribeError();
		unsubscribeTyping();
		
		// Clean up chat store realtime subscriptions
		chatStore.cleanup();

		// Clean up call store
		callStore.cleanup();

		// Clean up typing timeout
		if (typingTimeout) {
			clearTimeout(typingTimeout);
		}
	});

	$effect(() => {
		// Track messages changes and scroll if needed
		if (messages.length > 0) {
			scrollToBottomIfNeeded();
		}
	});

	function scrollToBottom() {
		if (messagesContainer) {
			setTimeout(() => {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}, 0);
		}
	}

	function scrollToBottomIfNeeded() {
		if (messagesContainer && messages.length > 0) {
			// Use a longer timeout to ensure DOM has updated
			setTimeout(() => {
				const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
				// Check if user is within 100px of the bottom
				const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
				
				if (isNearBottom) {
					messagesContainer.scrollTop = scrollHeight;
				}
			}, 50); // Increased timeout to allow DOM updates
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !activeConversation) return;

		const messageText = newMessage.trim();
		newMessage = '';

		try {
			await chatStore.sendMessage(activeConversation.id, messageText);
		} catch (err: unknown) {
			console.error('Error sending message:', err);
			// Restore message text on error
			newMessage = messageText;
		}
	}

	async function sendGif(gifUrl: string) {
		if (!activeConversation) return;

		try {
			// Send GIF as a message with special formatting
			const gifMessage = `[GIF]${gifUrl}`;
			await chatStore.sendMessage(activeConversation.id, gifMessage);
		} catch (err: unknown) {
			console.error('Error sending GIF:', err);
		}
	}

	function selectConversation(conversation: ChatUIConversation) {
		activeConversation = conversation;
		chatStore.setActiveConversation(conversation.id);

		// Reset UI states
		showEmojiPicker = false;
		showAttachMenu = false;
		showGifPicker = false;
	}

	function addEmoji(emoji: string) {
		newMessage += emoji;
		showEmojiPicker = false;
	}

	// Common emojis
	const emojis = ['😊', '👍', '👏', '🎉', '👨‍🏫', '📚', '✏️', '📝', '🧪', '🔍', '⭐', '❤️'];

	// Close dropdown menus when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (isHTMLElement(event.target)) {
			if (showEmojiPicker && !event.target.closest('.emoji-picker-container')) {
				showEmojiPicker = false;
			}
		}

		if (isHTMLElement(event.target)) {
			if (showAttachMenu && !event.target.closest('.attach-menu-container')) {
				showAttachMenu = false;
			}
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

		// Get the user's display name with better fallbacks
		const userName = user.user_metadata?.full_name ?? 
						 user.user_metadata?.name ?? 
						 (user.email ? user.email.split('@')[0] : null) ?? 
						 'You';
		
		// Show typing indicator
		chatStore.setUserTyping(activeConversation.id, user.id, userName);

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

		chatStore.setUserNotTyping(activeConversation.id, user.id);

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

	function openImagePreview(url: string) {
		previewImageUrl = url;
		showImagePreview = true;
	}

	function closeImagePreview() {
		showImagePreview = false;
		previewImageUrl = null;
	}

	async function deleteConversation(conversationId: string, event: Event) {
		event.stopPropagation(); // Prevent selecting the conversation

		// Use custom confirmation modal instead of browser's default
		const _confirmed = await confirmationStore.confirm({
			title: 'Delete Conversation',
			message: 'Are you sure you want to delete this conversation? This action cannot be undone.',
			confirmText: 'Delete',
			cancelText: 'Cancel',
			confirmButtonClass: 'bg-red-500 hover:bg-red-600',
			onConfirm: async () => {
				const success = await chatStore.deleteConversation(conversationId);
				
				if (success) {
					// Update local UI state
					conversations = conversations.filter(c => c.id !== conversationId);
					
					// If this was the active conversation, clear it
					if (activeConversation?.id === conversationId) {
						activeConversation = null;
					}
				} else {
					alert('Failed to delete conversation. Please try again.');
				}
			}
		});
	}

	// Handle file attachment
	function handleFileAttachment(type: 'image' | 'document' | 'video') {
		// Initialize fileInput if not already done
		if (!fileInput) {
			fileInput = document.createElement('input');
			fileInput.type = 'file';
			fileInput.style.display = 'none';
			fileInput.addEventListener('change', handleFileSelected);
			document.body.appendChild(fileInput);
		}
		
		// Set accepted file types based on attachment type
		switch (type) {
			case 'image':
				fileInput.accept = 'image/*';
				break;
			case 'document':
				fileInput.accept = '.pdf,.doc,.docx,.txt,.rtf';
				break;
			case 'video':
				fileInput.accept = 'video/*';
				break;
		}
		
		fileInput.click();
		showAttachMenu = false;
	}
	
	async function handleFileSelected(event: Event) {
		if (!isHTMLInputElement(event.target)) return;
		const file = event.target.files?.[0];
		
		if (!file || !activeConversation) return;
		
		// Store the conversation ID to avoid null check issues in async callbacks
		const conversationId = activeConversation.id;
		
		try {
			// Check if the file is an image or video
			const isImage = file.type.startsWith('image/');
			const isVideo = file.type.startsWith('video/');
			
			if (isImage) {
				// Convert image to base64 data URL
				const reader = new FileReader();
				reader.onload = async (e) => {
					const dataUrl = e.target?.result as string;
					
					// Send image as a special message format with base64 data URL
					const imageMessage = `[IMAGE]${dataUrl}|${file.name}|${file.size}`;
					await chatStore.sendMessage(conversationId, imageMessage);
				};
				reader.readAsDataURL(file);
			} else if (isVideo) {
				// Convert video to base64 data URL
				const reader = new FileReader();
				reader.onload = async (e) => {
					const dataUrl = e.target?.result as string;
					
					// Send video as a special message format with base64 data URL
					const videoMessage = `[VIDEO]${dataUrl}|${file.name}|${file.size}`;
					await chatStore.sendMessage(conversationId, videoMessage);
				};
				reader.readAsDataURL(file);
			} else {
				// For non-image/video files, send as before
				const fileMessage = `📎 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
				await chatStore.sendMessage(conversationId, fileMessage);
			}
			
			// Reset the file input
			if (isHTMLInputElement(event.target)) {
				event.target.value = '';
			}
		} catch (err: unknown) {
			console.error('Error sending file:', err);
		}
	}

	// Voice call function
	async function startVoiceCall() {
		if (!activeConversation) {
			console.error('No active conversation for voice call');
			return;
		}

		const user = getUser($authStore);
		if (!user) {
			console.error('User not authenticated');
			return;
		}

		// Get the other participant in the conversation
		const currentConv = rawConversations.find(c => c.id === activeConversation.id);
		if (!currentConv) {
			console.error('Conversation not found');
			return;
		}

		// Find other participant (not current user)
		const otherParticipant = currentConv.participants?.find(
			(p: ConversationParticipant) => p.user_id !== user.id
		);

		if (!otherParticipant?.user) {
			console.error('Other participant not found');
			return;
		}

		const calleeId = otherParticipant.user_id;
		const calleeName = otherParticipant.user.full_name || otherParticipant.user.email || 'Unknown User';

		try {
			await callStore.makeCall(calleeId, calleeName);
		} catch (error: unknown) {
			console.error('Failed to start voice call:', error);
		}
	}
</script>

<svelte:head>
	<title>Messaging - Teacher Dashboard</title>
</svelte:head>

<svelte:window on:click={handleClickOutside} />

<div class="min-h-screen">
	<div class="container mx-auto px-4 py-8">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-highlight mb-2">Messaging</h1>
			<p class="text-text-base">Communicate with students and classes</p>

			{#if error}
				<div class="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
					<p class="font-medium">Error:</p>
					<p class="text-sm">{error}</p>
				</div>
			{/if}
		</div>

		<!-- Messaging Interface -->
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
								<div
									class={`w-full border-b border-border/50 hover:bg-surface/50 transition-colors flex items-center group ${activeConversation?.id === conversation.id ? 'bg-purple-bg' : ''}`}
								>
									<button
										class="flex-1 text-left p-4 flex items-center gap-3"
										onclick={() => selectConversation(conversation)}
										aria-label={`Message ${conversation.name}`}
									>
										<div class="relative">
											{#if conversation.displayAvatar}
												<img
													src={conversation.displayAvatar}
													alt={conversation.name}
													class="w-10 h-10 rounded-full object-cover border border-border"
												/>
											{:else}
												<div
													class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium"
												>
													{conversation.avatar}
												</div>
											{/if}
											{#if conversation.is_online}
												<div
													class="absolute bottom-0 right-0 w-3 h-3 bg-purple rounded-full border-2 border-card"
												></div>
											{/if}
										</div>

										<div class="flex-1 min-w-0 overflow-hidden">
											<div class="mb-1">
												<div class="font-medium text-highlight truncate">
													{conversation.name}
													{#if conversation.is_group}
														<span class="text-xs text-text-base ml-1">(Group)</span>
													{/if}
												</div>
											</div>
											<div class="flex justify-between items-center">
												<div class="text-sm text-text-base truncate flex-1 min-w-0 mr-2">{conversation.last_message_text}</div>
												{#if conversation.unread_count > 0}
													<div
														class="bg-purple text-highlight text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2"
													>
														{conversation.unread_count}
													</div>
												{/if}
											</div>
											<div class="text-xs text-text-base mt-1">
												{conversation.last_message_time}
											</div>
										</div>
									</button>

									<!-- Delete button -->
									<button
										class="p-2 mr-2 text-text-base hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
										onclick={(e) => deleteConversation(conversation.id, e)}
										aria-label="Delete conversation"
										title="Delete conversation"
									>
										<svg
											class="w-4 h-4"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
										>
											<polyline points="3 6 5 6 21 6"></polyline>
											<path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
											<line x1="10" y1="11" x2="10" y2="17"></line>
											<line x1="14" y1="11" x2="14" y2="17"></line>
										</svg>
									</button>
								</div>
							{/each}

							{#if filteredConversations.length === 0}
								<div class="p-4 text-center text-text-base">No conversations found</div>
							{/if}
						{/if}
					</div>

					<!-- New Message Button -->
					<div class="p-4 border-t border-border">
						<button
							class="btn btn-primary w-full"
							onclick={() => (showUserSelectModal = true)}
							aria-label="Start new conversation"
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
							New Message
						</button>
					</div>
				</div>

				<!-- Messaging Area -->
				<div class="flex-1 flex flex-col">
					<!-- Message Header -->
					<div class="p-4 border-b border-border flex justify-between items-center">
						{#if activeConversation}
							<div class="flex items-center gap-3">
								<div class="relative">
									{#if activeConversation?.displayAvatar}
										<img
											src={activeConversation.displayAvatar}
											alt={activeConversation.name}
											class="w-10 h-10 rounded-full object-cover border border-border"
										/>
									{:else}
										<div
											class="w-10 h-10 rounded-full bg-purple-bg text-purple flex items-center justify-center font-medium"
										>
											{activeConversation?.avatar ?? '?'}
										</div>
									{/if}
									{#if activeConversation?.is_online}
										<div
											class="absolute bottom-0 right-0 w-3 h-3 bg-purple rounded-full border-2 border-card"
										></div>
									{/if}
								</div>

								<div>
									<div class="font-medium text-highlight">
										{activeConversation ? getConversationDisplayName(activeConversation) : 'Select a conversation'}
										{#if activeConversation?.is_group}
											<span class="text-xs text-text-base ml-1"
												>(Group conversation)</span
											>
										{/if}
									</div>
									{#if activeConversation?.is_group}
										<!-- Show participant list for group chats -->
										{@const participants = getGroupParticipants(activeConversation.id)}
										{#if participants.length > 0}
											<div class="text-xs text-text-base mt-1 flex items-center gap-1">
												<svg class="w-3 h-3 text-purple" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
													<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
													<circle cx="9" cy="7" r="4"></circle>
													<path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
													<path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
												</svg>
												<span class="text-purple font-medium">{participants.length}</span>
												<span>
													{participants.slice(0, 2).map(p => p.name).join(', ')}
													{#if participants.length > 2}
														<span 
															class="opacity-75 cursor-help underline decoration-dotted hover:opacity-100 transition-opacity" 
															title={participants.slice(2).map(p => p.name).join(', ')}
														>
															+{participants.length - 2} more
														</span>
													{/if}
												</span>
											</div>
										{/if}
									{:else if activeConversation?.is_online}
										<div class="text-xs text-purple">Online</div>
									{/if}
								</div>
							</div>
						{:else}
							<div class="flex items-center gap-3">
								<div class="text-text-base">Select a conversation to start messaging</div>
							</div>
						{/if}

						<div class="flex gap-2">
							<button
								class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
								onclick={startVoiceCall}
								disabled={!activeConversation || activeConversation.is_group}
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
								aria-label="View conversation information"
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
						{#each messages as message, index (message.id)}
							<div class={`flex gap-3 ${message.is_own_message ? 'justify-end' : 'justify-start'}`}>
								{#if !message.is_own_message}
									<!-- Avatar for other users -->
									<div class="flex-shrink-0">
										{#if message.sender_avatar}
											<img
												src={message.sender_avatar}
												alt={message.sender_name}
												class="w-8 h-8 rounded-full object-cover border border-border"
											/>
										{:else}
											<div class="w-8 h-8 rounded-full bg-purple text-highlight flex items-center justify-center text-sm font-medium">
												{message.sender_name?.[0]?.toUpperCase() || 'U'}
											</div>
										{/if}
									</div>
								{/if}
								
								<div class={`flex flex-col gap-1 max-w-[70%] ${message.is_own_message ? 'items-end' : 'items-start'}`}>
									<div
										class={`${message.is_own_message ? 'bg-purple text-highlight' : 'bg-surface text-text-hover'} rounded-lg px-4 py-2 shadow-sm`}
									>
										{#if !message.is_own_message}
											<div class="text-xs font-medium text-purple mb-1">
												{message.sender_name}
											</div>
										{/if}
						{#if message.content.startsWith('[GIF]')}
							<button
								type="button"
								class="block rounded-lg max-w-full hover:opacity-90 transition-opacity cursor-pointer"
								onclick={() => openImagePreview(message.content.slice(5))}
							>
								<img 
									src={message.content.slice(5)} 
									alt="GIF" 
									class="rounded-lg max-w-full max-h-64 object-contain"
								/>
							</button>
						{:else if message.content.startsWith('[IMAGE]')}
							{@const parts = message.content.slice(7).split('|')}
							{@const imageUrl = parts[0]}
							{@const fileName = parts[1] || 'Image'}
							{@const fileSize = parts[2] ? parseInt(parts[2]) : 0}
							<div class="space-y-2">
								<button 
									type="button"
									class="block rounded-lg max-w-full hover:opacity-90 transition-opacity cursor-pointer"
									onclick={() => openImagePreview(imageUrl)}
								>
									<img 
										src={imageUrl} 
										alt={fileName} 
										class="rounded-lg max-w-full max-h-64 object-contain"
									/>
								</button>
								<div class="text-xs opacity-75 flex items-center gap-1">
									<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
									</svg>
									{fileName}
									{#if fileSize > 0}
										({(fileSize / 1024 / 1024).toFixed(2)} MB)
									{/if}
								</div>
							</div>
						{:else if message.content.startsWith('[VIDEO]')}
							{@const parts = message.content.slice(7).split('|')}
							{@const videoUrl = parts[0]}
							{@const fileName = parts[1] || 'Video'}
							{@const fileSize = parts[2] ? parseInt(parts[2]) : 0}
							<div class="space-y-2">
								<video 
									src={videoUrl}
									controls
									preload="metadata"
									class="rounded-lg max-w-full max-h-96 object-contain bg-surface"
								>
									<track kind="captions" />
									Your browser does not support the video tag.
								</video>
								<div class="text-xs opacity-75 flex items-center gap-1">
									<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polygon points="5 3 19 12 5 21 5 3"></polygon>
									</svg>
									{fileName}
									{#if fileSize > 0}
										({(fileSize / 1024 / 1024).toFixed(2)} MB)
									{/if}
								</div>
							</div>
						{:else}
							<div class="text-sm">{message.content}</div>
						{/if}
									</div>
									<!-- Timestamp always visible, positioned opposite to message alignment -->
									<div class={`text-xs opacity-50 ${message.is_own_message ? 'text-left' : 'text-right'}`}>
										{chatStore.formatTime(message.created_at)}
									</div>
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
								placeholder={activeConversation ? "Type a message..." : "Select a conversation to start messaging"}
								class="input w-full pr-24"
								disabled={!activeConversation}
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

								<!-- GIF Button -->
								<button
									class="p-2 text-text-base hover:text-text-hover rounded-full hover:bg-surface transition-colors"
									onclick={() => (showGifPicker = true)}
									aria-label="Open GIF picker"
								>
									<svg
										class="w-5 h-5"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<rect x="2" y="2" width="20" height="20" rx="2" />
										<text x="6" y="16" font-size="10" font-weight="bold" fill="currentColor">GIF</text>
									</svg>
								</button>

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
													onclick={() => handleFileAttachment('image')}
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
													onclick={() => handleFileAttachment('document')}
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
													onclick={() => handleFileAttachment('video')}
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
									onclick={() => sendMessage()}
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

	<!-- GIF Picker Modal -->
	<GifPicker
		bind:isOpen={showGifPicker}
		onSelectGif={sendGif}
	/>

	<!-- Image Preview Modal -->
	<ImagePreviewModal
		bind:isOpen={showImagePreview}
		imageUrl={previewImageUrl}
		onClose={closeImagePreview}
	/>

	<!-- Voice Call Components -->
	<IncomingCallModal bind:isOpen={$hasIncomingCall} />
	<ActiveCallWidget />
</div>
