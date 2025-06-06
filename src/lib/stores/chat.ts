import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { authStore } from './auth';
import { typedAuthStore, getUser } from '$lib/utils/storeHelpers';
import { addPrivateMessageNotification } from './notifications';
import type { Database } from '$lib/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Types
type Conversation = Database['public']['Tables']['conversations']['Row'] & {
	participants?: ConversationParticipant[];
	last_message?: Message;
	unread_count?: number;
};

type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row'] & {
	user?: {
		id: string;
		full_name: string;
		email: string;
		avatar_url?: string;
	};
};

type Message = Database['public']['Tables']['messages']['Row'] & {
	sender?: {
		id: string;
		full_name: string;
		email: string;
		avatar_url?: string;
	};
	attachments?: MessageAttachment[];
};

type MessageAttachment = Database['public']['Tables']['message_attachments']['Row'];

// Store state
const conversations = writable<Conversation[]>([]);
const activeConversationId = writable<string | null>(null);
const messages = writable<Record<string, Message[]>>({});
const loading = writable(false);
const error = writable<string | null>(null);
const typingUsers = writable<Record<string, { userId: string; userName: string }[]>>({});

// Realtime subscriptions
let conversationsChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;
let typingChannel: RealtimeChannel | null = null;
let subscriptionsActive = false;

// Polling fallback
const _pollingInterval: number | null = null;
let lastMessageCheck: Date = new Date();

// Derived stores
const activeConversation = derived(
	[conversations, activeConversationId],
	([$conversations, $activeConversationId]) => {
		if (!$activeConversationId) return null;
		return $conversations.find((c) => c.id === $activeConversationId) ?? null;
	}
);

const activeMessages = derived(
	[messages, activeConversationId],
	([$messages, $activeConversationId]) => {
		if (!$activeConversationId) return [];
		return $messages[$activeConversationId] ?? [];
	}
);

const activeTypingUsers = derived(
	[typingUsers, activeConversationId, authStore],
	([$typingUsers, $activeConversationId, $authStore]) => {
		if (!$activeConversationId) return [];
		
		const conversationTyping = $typingUsers[$activeConversationId] ?? [];
		
		// Filter out current user so they don't see their own typing indicator
		if ($authStore.user) {
			const currentUserId = $authStore.user.id;
			
			const filtered = conversationTyping
				.filter(typing => typing.userId !== currentUserId)
				.map(typing => typing.userName);
				
			return filtered;
		}
		
		return conversationTyping.map(typing => typing.userName);
	}
);

// Helper functions
function getInitials(name: string): string {
	return name
		.split(' ')
		.map((word) => word[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}


// Typing indicator functions
function setUserTyping(conversationId: string, userId: string, userName: string): void {
	// Update local state
	typingUsers.update((current) => {
		const conversationTyping = current[conversationId] ?? [];
		if (!conversationTyping.some(typing => typing.userId === userId)) {
			return {
				...current,
				[conversationId]: [...conversationTyping, { userId, userName }]
			};
		}
		return current;
	});

	// Broadcast typing status to other users
	if (typingChannel) {
		typingChannel.send({
			type: 'broadcast',
			event: 'typing',
			payload: {
				conversationId,
				userId,
				userName,
				isTyping: true
			}
		});
	}
}

function setUserNotTyping(conversationId: string, userId: string): void {
	// Update local state
	typingUsers.update((current) => {
		const conversationTyping = current[conversationId] ?? [];
		return {
			...current,
			[conversationId]: conversationTyping.filter((typing) => typing.userId !== userId)
		};
	});

	// Broadcast stop typing status to other users
	if (typingChannel) {
		typingChannel.send({
			type: 'broadcast',
			event: 'typing',
			payload: {
				conversationId,
				userId,
				isTyping: false
			}
		});
	}
}

function formatTime(date: string | null | undefined): string {
	if (!date) return 'Just now';

	const messageDate = new Date(date);
	if (isNaN(messageDate.getTime())) return 'Just now';

	const now = new Date();
	const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

	// Format time for messages less than 24 hours old
	const timeFormat = messageDate.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});

	if (diffInHours < 1 || diffInHours < 24) {
		return timeFormat;
	} else if (diffInHours < 168) {
		// Less than a week
		return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
	} else {
		return messageDate.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}
}

// Store functions
async function loadConversations(): Promise<void> {
	try {
		loading.set(true);
		error.set(null);

		const user = getUser(get(authStore));
		if (!user) {
			throw new Error('User not authenticated');
		}

		// Load conversations using direct queries to respect RLS policies
		// Get conversations the user created
		const { data: ownedConversations, error: ownedError } = await supabase
			.from('conversations')
			.select(`
				id,
				name,
				is_group,
				avatar,
				created_at,
				updated_at,
				created_by
			`)
			.eq('created_by', user.id);

		if (ownedError) throw ownedError;

		// Get conversations the user participates in
		const { data: participantConversations, error: participantError } = await supabase
			.from('conversations')
			.select(`
				id,
				name,
				is_group,
				avatar,
				created_at,
				updated_at,
				created_by,
				conversation_participants!inner(user_id)
			`)
			.eq('conversation_participants.user_id', user.id);

		if (participantError) throw participantError;

		// Combine and deduplicate conversations
		const allConversations = [...(ownedConversations ?? [])];
		const ownedIds = new Set(ownedConversations?.map(c => c.id) ?? []);
		
		(participantConversations ?? []).forEach(conv => {
			if (!ownedIds.has(conv.id)) {
				allConversations.push(conv);
			}
		});

		// Sort by updated_at
		const sortedConversations = [...(allConversations ?? [])];
		sortedConversations.sort((a, b) => 
			new Date(b.updated_at ?? b.created_at).getTime() - 
			new Date(a.updated_at ?? a.created_at).getTime()
		);

	 // Get last message for each conversation
	 const conversationsWithMessages = await Promise.all(
		(sortedConversations ?? []).map(async (conv: Record<string, unknown>) => {
				// Get last message (may not exist for new conversations)
				const { data: lastMessages } = await supabase
					.from('messages')
					.select(
						`
						*,
						sender:app_users (id, full_name, email, avatar_url)
					`
					)
					.eq('conversation_id', conv.id)
					.order('created_at', { ascending: false })
					.limit(1);

				const lastMessage = lastMessages?.[0] ?? null;

				// Get participants separately
				const { data: participants, error: _participantsError } = await supabase
					.from('conversation_participants')
					.select(
						`
						*,
						user:app_users (id, full_name, email, avatar_url)
					`
					)
					.eq('conversation_id', conv.id);


				// Calculate unread count
				const userParticipant = participants?.find((p) => p.user_id === user.id);

				let unreadCount = 0;
				if (userParticipant && lastMessage) {
					const { count } = await supabase
						.from('messages')
						.select('*', { count: 'exact', head: true })
						.eq('conversation_id', conv.id)
						.gt('created_at', userParticipant.last_read_at ?? '1970-01-01');

					unreadCount = count ?? 0;
				}

				return {
					...conv,
					participants: participants ?? [],
					conversation_participants: participants ?? [],
					last_message: lastMessage,
					unread_count: unreadCount
				};
			})
		);

		conversations.set(conversationsWithMessages as unknown as Conversation[]);
	} catch (err) {
		console.error('Error loading conversations:', err);
		error.set(err instanceof Error ? err.message : 'Failed to load conversations');
	} finally {
		loading.set(false);
	}
}

async function loadMessages(conversationId: string): Promise<void> {
	try {
		const { data: messagesData, error: messagesError } = await supabase
			.from('messages')
			.select(
				`
				*,
				sender:app_users (id, full_name, email, avatar_url),
				message_attachments (*)
			`
			)
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true });

		if (messagesError) throw messagesError;

		messages.update((current) => ({
			...current,
			[conversationId]: messagesData ?? []
		}));

		// Mark messages as read
		await markConversationAsRead(conversationId);
	} catch (err) {
		console.error('Error loading messages:', err);
		error.set(err instanceof Error ? err.message : 'Failed to load messages');
	}
}

async function sendMessage(conversationId: string, content: string): Promise<void> {
	try {
		const user = getUser(get(authStore));
		if (!user) throw new Error('User not authenticated');

		const { data: message, error: messageError } = await supabase
			.from('messages')
			.insert({
				conversation_id: conversationId,
				sender_id: user.id,
				content: content.trim(),
				message_type: 'text'
			})
			.select(
				`
				*,
				sender:app_users (id, full_name, email, avatar_url)
			`
			)
			.single();

		if (messageError) throw messageError;

		// Add message to local state
		messages.update((current) => ({
			...current,
			[conversationId]: [...(current[conversationId] ?? []), message]
		}));

		// Update conversation's last message
		conversations.update((current) =>
			current.map((conv) =>
				conv.id === conversationId
					? { ...conv, last_message: message, updated_at: message.created_at }
					: conv
			)
		);
	} catch (err) {
		console.error('Error sending message:', err);
		error.set(err instanceof Error ? err.message : 'Failed to send message');
	}
}

async function getAvailableChatUsers(): Promise<
	Array<{
		user_id: string;
		full_name: string;
		email: string;
		role: string;
		avatar_url?: string;
		relationship_type: string;
		class_names: string[];
	}>
> {
	try {
		// Use direct query since RPC function doesn't exist
		const { data: users, error: usersError } = await supabase
			.from('app_users')
			.select('id, full_name, email, role, avatar_url')
			.neq('id', getUser(get(authStore))?.id ?? '');

		if (usersError) throw usersError;

		return (users ?? []).map((user) => ({
			user_id: user.id,
			full_name: user.full_name,
			email: user.email,
			role: user.role ?? 'student',
			avatar_url: user.avatar_url ?? undefined,
			relationship_type: 'all_users',
			class_names: []
		}));
	} catch (err) {
		console.error('Error loading available users:', err);
		throw new Error(err instanceof Error ? err.message : 'Failed to load available users');
	}
}

async function createDirectConversation(otherUserId: string): Promise<string | null> {
	try {
		const user = getUser(get(authStore));
		if (!user) throw new Error('User not authenticated');

		// Simple approach: create conversation directly
		const { data: conversation, error: convError } = await supabase
			.from('conversations')
			.insert({
				is_group: false,
				created_by: user.id
			})
			.select('id')
			.single();

		if (convError) throw convError;

		// Add participants (handle self-conversation by allowing duplicate)
		const participants = [
			{ conversation_id: conversation.id, user_id: user.id },
			{ conversation_id: conversation.id, user_id: otherUserId }
		];

		const { error: participantsError } = await supabase
			.from('conversation_participants')
			.insert(participants);

		if (participantsError) {
			// If duplicate key error (self-conversation), just add one participant
			if (participantsError.code === '23505' && user.id === otherUserId) {
				const { error: singleParticipantError } = await supabase
					.from('conversation_participants')
					.insert({ conversation_id: conversation.id, user_id: user.id });
				
				if (singleParticipantError) throw singleParticipantError;
			} else {
				throw participantsError;
			}
		}

		// Reload conversations to include the new one
		await loadConversations();

		return conversation.id;
	} catch (err) {
		console.error('Error creating conversation:', err);
		error.set(err instanceof Error ? err.message : 'Failed to create conversation');
		return null;
	}
}

async function createGroupConversation(
	name: string,
	participantIds: string[]
): Promise<string | null> {
	try {
		const { data, error } = await supabase.rpc('create_group_conversation', {
			conversation_name: name,
			participant_ids: participantIds
		});

		if (error) throw error;

		// Reload conversations to include the new one
		await loadConversations();

		return data;
	} catch (err) {
		console.error('Error creating group conversation:', err);
		error.set(err instanceof Error ? err.message : 'Failed to create group conversation');
		return null;
	}
}

async function markConversationAsRead(conversationId: string): Promise<void> {
	try {
		const user = getUser(get(authStore));
		if (!user) return;

		await supabase
			.from('conversation_participants')
			.update({ last_read_at: new Date().toISOString() })
			.eq('conversation_id', conversationId)
			.eq('user_id', user.id);

		// Update local unread count
		conversations.update((current) =>
			current.map((conv) => (conv.id === conversationId ? { ...conv, unread_count: 0 } : conv))
		);
	} catch (err) {
		console.error('Error marking conversation as read:', err);
	}
}

function setActiveConversation(conversationId: string | null): void {
	activeConversationId.set(conversationId);
	if (conversationId) {
		loadMessages(conversationId);
	}
}

// Real-time subscriptions  
function setupRealtimeSubscriptions(): void {
	const user = getUser(get(authStore));
	if (!user || subscriptionsActive) return;

	subscriptionsActive = true;

	// Subscribe to conversations changes
	conversationsChannel = supabase
		.channel('public:conversations')
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'conversations'
			},
			(_payload) => {
				loadConversations();
			}
		)
		.subscribe();

	// Subscribe to messages
	messagesChannel = supabase
		.channel('public:messages')
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'messages'
			},
			async (payload) => {
				const newMessage = payload.new as Message;

				// Check if user is part of this conversation
				const { data: participation } = await supabase
					.from('conversation_participants')
					.select('conversation_id')
					.eq('conversation_id', newMessage.conversation_id)
					.eq('user_id', user.id)
					.single();

				if (!participation) return;

				// Load full message with sender info
				const { data: fullMessage } = await supabase
					.from('messages')
					.select(`*, sender:app_users (id, full_name, email, avatar_url)`)
					.eq('id', newMessage.id)
					.single();

				if (fullMessage) {
					// Create notification for new messages from other users
					if (fullMessage.sender_id !== user.id) {
						const senderName = fullMessage.sender?.full_name ?? fullMessage.sender?.email ?? 'Someone';
						addPrivateMessageNotification(
							senderName,
							fullMessage.content,
							fullMessage.conversation_id,
							fullMessage.id
						);
					}
					
					// Add to messages if we have this conversation loaded
					messages.update((current) => {
						if (current[fullMessage.conversation_id]) {
							const existingMessages = current[fullMessage.conversation_id];
							const isDuplicate = existingMessages.some(msg => msg.id === fullMessage.id);
							
							if (!isDuplicate) {
								return {
									...current,
									[fullMessage.conversation_id]: [...current[fullMessage.conversation_id], fullMessage]
								};
							}
						}
						return current;
					});

					// Update conversation last message and unread count
					conversations.update((current) =>
						current.map((conv) =>
							conv.id === fullMessage.conversation_id
								? { 
									...conv, 
									last_message: fullMessage, 
									updated_at: fullMessage.created_at,
									unread_count: fullMessage.sender_id !== user.id ? (conv.unread_count ?? 0) + 1 : conv.unread_count
								}
								: conv
						)
					);
				}
			}
		)
		.subscribe();

	// Subscribe to typing indicators
	typingChannel = supabase
		.channel('typing-indicators')
		.on('broadcast', { event: 'typing' }, (_payload) => {
			const { conversationId, userId, userName, isTyping } = _payload.payload;
			
			// Don't update for current user's own typing
			if (userId === user.id) return;
			
			if (isTyping) {
				typingUsers.update((current) => {
					const conversationTyping = current[conversationId] ?? [];
					if (!conversationTyping.some(typing => typing.userId === userId)) {
						return {
							...current,
							[conversationId]: [...conversationTyping, { userId, userName }]
						};
					}
					return current;
				});
			} else {
				typingUsers.update((current) => {
					const conversationTyping = current[conversationId] ?? [];
					return {
						...current,
						[conversationId]: conversationTyping.filter((typing) => typing.userId !== userId)
					};
				});
			}
		})
		.subscribe();
}

function cleanupRealtimeSubscriptions(): void {
	subscriptionsActive = false;

	if (conversationsChannel) {
		conversationsChannel.unsubscribe();
		conversationsChannel = null;
	}
	if (messagesChannel) {
		messagesChannel.unsubscribe();
		messagesChannel = null;
	}
	if (typingChannel) {
		typingChannel.unsubscribe();
		typingChannel = null;
	}
}

// Initialize store when auth state changes
authStore.subscribe(async (auth) => {
	const typedAuth = typedAuthStore(auth);
	if (typedAuth.user) {
		if (!subscriptionsActive) {
			await loadConversations();
			setupRealtimeSubscriptions();
		}
	} else {
		// Clear state when user logs out
		conversations.set([]);
		messages.set({});
		activeConversationId.set(null);
		typingUsers.set({});
		cleanupRealtimeSubscriptions();
	}
});

// Cleanup on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', cleanupRealtimeSubscriptions);
}

async function deleteConversation(conversationId: string): Promise<boolean> {
	try {
		// Delete the conversation from the database
		const { error: deleteError } = await supabase
			.from('conversations')
			.delete()
			.eq('id', conversationId);

		if (deleteError) throw deleteError;

		// Remove from local state immediately
		conversations.update(current => 
			current.filter(conv => conv.id !== conversationId)
		);

		// Clear messages for this conversation
		messages.update(current => {
			const newMessages = { ...current };
			delete newMessages[conversationId];
			return newMessages;
		});

		// If this was the active conversation, clear it
		const currentActiveId = get(activeConversationId);
		if (currentActiveId === conversationId) {
			activeConversationId.set(null);
		}

		return true;
	} catch (err) {
		console.error('Error deleting conversation:', err);
		error.set(err instanceof Error ? err.message : 'Failed to delete conversation');
		return false;
	}
}

// Export store
export const chatStore = {
	// State
	conversations: { subscribe: conversations.subscribe },
	activeConversation: { subscribe: activeConversation.subscribe },
	activeMessages: { subscribe: activeMessages.subscribe },
	activeTypingUsers: { subscribe: activeTypingUsers.subscribe },
	loading: { subscribe: loading.subscribe },
	error: { subscribe: error.subscribe },

	// Actions
	loadConversations,
	loadMessages,
	sendMessage,
	getAvailableChatUsers,
	createDirectConversation,
	createGroupConversation,
	setActiveConversation,
	markConversationAsRead,
	deleteConversation,
	setUserTyping,
	setUserNotTyping,

	// Utilities
	getInitials,
	formatTime
};

// Polling function for reliable message updates
// This function is kept for future reference but not currently used
async function _pollForNewMessages(): Promise<void> {
	try {
		const user = getUser(get(authStore));
		const currentActiveConversationId = get(activeConversationId);

		if (!user || !currentActiveConversationId) return;

		// Check for new messages since last check
		const { data: newMessages } = await supabase
			.from('messages')
			.select(`
				*,
				sender:app_users (id, full_name, email, avatar_url)
			`)
			.eq('conversation_id', currentActiveConversationId)
			.gt('created_at', lastMessageCheck.toISOString())
			.order('created_at', { ascending: true });

		if (newMessages && newMessages.length > 0) {

			// Create notifications for new messages from other users
			newMessages.forEach(message => {
				if (message.sender_id !== user.id) {
					const senderName = message.sender?.full_name ?? message.sender?.email ?? 'Someone';
					addPrivateMessageNotification(
						senderName,
						message.content,
						message.conversation_id,
						message.id
					);
				}
			});

			// Add new messages to the store
			messages.update((current) => ({
				...current,
				[currentActiveConversationId]: [
					...(current[currentActiveConversationId] ?? []),
					...newMessages
				]
			}));

			// Update conversations with latest message
			const latestMessage = newMessages[newMessages.length - 1];
			conversations.update((current) =>
				current.map((conv) =>
					conv.id === currentActiveConversationId
						? { 
							...conv, 
							last_message: latestMessage, 
							updated_at: latestMessage.created_at,
							unread_count: latestMessage.sender_id !== user.id ? (conv.unread_count ?? 0) + newMessages.filter(m => m.sender_id !== user.id).length : conv.unread_count
						}
						: conv
				)
			);

			// Update last check time
			lastMessageCheck = new Date(latestMessage.created_at);
		}
	} catch (error) {
		console.error('❌ Polling error:', error);
	}
}