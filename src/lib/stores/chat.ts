import { get } from 'svelte/store';
import { createStore, createDerivedStore } from './storeFactory';
import { supabase } from '$lib/supabaseClient';
import { authStore } from './auth';
import { typedAuthStore, getUser } from '$lib/utils/storeHelpers';
import { addPrivateMessageNotification, showInfoToast } from './notifications';
import type { Database } from '$lib/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { UnknownError } from '$lib/types/ai-enforcement';

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

// Create stores using the factory pattern
const conversations = createStore<Conversation[]>({
	initialValue: [],
	name: 'chat-conversations',
	localStorageKey: 'chat-conversations'
});

const activeConversationId = createStore<string | null>({
	initialValue: null,
	name: 'chat-activeConversationId',
	localStorageKey: 'chat-activeConversationId'
});

const messages = createStore<Record<string, Message[]>>({
	initialValue: {},
	name: 'chat-messages'
});

const loading = createStore<boolean>({
	initialValue: false,
	name: 'chat-loading'
});

const error = createStore<string | null>({
	initialValue: null,
	name: 'chat-error'
});

const typingUsers = createStore<Record<string, { userId: string; userName: string }[]>>({
	initialValue: {},
	name: 'chat-typingUsers'
});

// Create derived stores with proper typing
const activeConversation = createDerivedStore({
	name: 'chat-activeConversation',
	stores: [conversations, activeConversationId],
	deriveFn: (values: unknown[]) => {
		if (!Array.isArray(values) || values.length !== 2) {
			throw new Error('Invalid values array for activeConversation');
		}
		const convs = values[0] as Conversation[];
		const activeId = values[1] as string | null;
		if (!activeId) return null;
		return convs.find((c) => c.id === activeId) ?? null;
	}
});

const activeMessages = createDerivedStore({
	name: 'chat-activeMessages',
	stores: [messages, activeConversationId],
	deriveFn: (values: unknown[]) => {
		if (!Array.isArray(values) || values.length !== 2) {
			throw new Error('Invalid values array for activeMessages');
		}
		const msgs = values[0] as Record<string, Message[]>;
		const activeId = values[1] as string | null;
		if (!activeId) return [];
		return msgs[activeId] ?? [];
	}
});

const activeTypingUsers = createDerivedStore({
	name: 'chat-activeTypingUsers',
	stores: [typingUsers, activeConversationId, authStore],
	deriveFn: (values: unknown[]) => {
		if (!Array.isArray(values) || values.length !== 3) {
			throw new Error('Invalid values array for activeTypingUsers');
		}
		const typing = values[0] as Record<string, { userId: string; userName: string }[]>;
		const activeId = values[1] as string | null;
		const auth = values[2] as { user: { id: string } | null };
		
		if (!activeId) return [];
		
		const conversationTyping = typing[activeId] ?? [];
		
		// Filter out current user so they don't see their own typing indicator
		if (auth.user) {
			const currentUserId = auth.user.id;
			
			const filtered = conversationTyping
				.filter(t => t.userId !== currentUserId)
				.map(t => t.userName);
				
			return filtered;
		}
		
		return conversationTyping.map(t => t.userName);
	}
});

// Realtime subscriptions
let conversationsChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;
let typingChannel: RealtimeChannel | null = null;
let subscriptionsActive = false;
let realtimeModule: any = null;

// Polling fallback
const _pollingInterval: number | null = null;
let lastMessageCheck: Date = new Date();

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
	} else {
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
	} else {
	}
}

function formatTime(date: string | null | undefined): string {
	if (!date) return 'Just now';

	const messageDate = new Date(date);
	if (Number.isNaN(messageDate.getTime())) return 'Just now';

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
						sender:app_users!messages_sender_id_fkey (id, full_name, email, avatar_url)
					`
					)
					.eq('conversation_id', conv.id)
					.order('created_at', { ascending: false })
					.limit(1);

				const lastMessage = lastMessages?.[0] ?? null;

				// Get participants separately with better error handling
				const { data: participants, error: participantsError } = await supabase
					.from('conversation_participants')
					.select(
						`
						*,
						user:app_users!conversation_participants_user_id_fkey (id, full_name, email, avatar_url)
					`
					)
					.eq('conversation_id', conv.id)
					.eq('is_active', true);  // Only get active participants

				if (participantsError) {
					console.error('❌ PARTICIPANTS: Error loading participants for conversation', conv.id, participantsError);
				}
				
				

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

				const processedConversation = {
					...conv,
					participants: participants ?? [],
					conversation_participants: participants ?? [],
					last_message: lastMessage,
					unread_count: unreadCount
				};
				
					
				return processedConversation;
			})
		);

		conversations.set(conversationsWithMessages as unknown as Conversation[]);
	} catch (err: UnknownError) {
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
				sender:app_users!messages_sender_id_fkey (id, full_name, email, avatar_url),
				message_attachments (*)
			`
			)
			.eq('conversation_id', conversationId)
			.order('created_at', { ascending: true });

		if (messagesError) {
			console.error('📖 MESSAGES: Database error:', messagesError);
			throw messagesError;
		}


		// Debug sender information and enhance missing data
		if (messagesData && messagesData.length > 0) {
			// Find messages with missing sender data
			const messagesWithMissingSender = messagesData.filter(msg => 
				msg.sender_id && (!msg.sender || (!msg.sender.full_name && !msg.sender.email))
			);
			
			if (messagesWithMissingSender.length > 0) {
				console.warn('📖 MESSAGES: Found messages with missing sender data, fetching manually:', 
					messagesWithMissingSender.map(m => ({ id: m.id, sender_id: m.sender_id }))
				);
				
				// Fetch missing user data manually
				const missingUserIds = [...new Set(messagesWithMissingSender.map(m => m.sender_id))];
				const { data: missingUsers } = await supabase
					.from('app_users')
					.select('id, full_name, email, avatar_url')
					.in('id', missingUserIds);
				
				if (missingUsers) {
					// Patch the missing sender data
					messagesData.forEach(msg => {
						if (msg.sender_id && (!msg.sender || (!msg.sender.full_name && !msg.sender.email))) {
							const userData = missingUsers.find(u => u.id === msg.sender_id);
							if (userData) {
								msg.sender = userData;
							}
						}
					});
				}
			}
			
		}

		messages.update((current) => {
			const updated = {
				...current,
				[conversationId]: messagesData ?? []
			};
				return updated;
		});

		// Mark messages as read
		await markConversationAsRead(conversationId);
	} catch (err: UnknownError) {
		console.error('📖 MESSAGES: Error loading messages:', err);
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
				sender:app_users!messages_sender_id_fkey (id, full_name, email, avatar_url)
			`
			)
			.single();

		if (messageError) throw messageError;


		// Add message to local state
		messages.update((current) => {
			const updated = {
				...current,
				[conversationId]: [...(current[conversationId] ?? []), message]
			};
				return updated;
		});

		// Update conversation's last message and move to top
		conversations.update((current) => {
			const updatedConversations = current.map((conv) =>
				conv.id === conversationId
					? { ...conv, last_message: message, updated_at: message.created_at }
					: conv
			);
			
			// Sort conversations by updated_at to move the active one to the top
			return updatedConversations.sort((a, b) => 
				new Date(b.updated_at ?? b.created_at).getTime() - 
				new Date(a.updated_at ?? a.created_at).getTime()
			);
		});
	} catch (err: UnknownError) {
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
	} catch (err: UnknownError) {
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
	} catch (err: UnknownError) {
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
	} catch (err: UnknownError) {
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
	} catch (err: UnknownError) {
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
let setupInProgress = false;

async function setupRealtimeSubscriptions(): Promise<void> {
	const user = getUser(get(authStore));
	if (!user || subscriptionsActive || setupInProgress) {
		console.log('🚫 Skipping realtime setup:', { 
			hasUser: !!user, 
			subscriptionsActive, 
			setupInProgress 
		});
		return;
	}

	console.log('🚀 Setting up realtime subscriptions for user:', user.id);

	// Prevent multiple simultaneous setup calls
	setupInProgress = true;

	// Clean up any existing subscriptions first
	cleanupRealtimeSubscriptions();

	// Lazy load realtime module if not loaded
	if (!realtimeModule) {
		try {
			const { lazyLoadRealtime } = await import('$lib/utils/lazyLoad');
			realtimeModule = await lazyLoadRealtime(supabase);
		} catch (err) {
			console.error('Failed to load realtime module:', err);
			setupInProgress = false;
			return;
		}
	}

	// Subscribe to conversations changes with unique channel name
	conversationsChannel = supabase
		.channel(`conversations-${user.id}-${Date.now()}`) // Add timestamp to ensure uniqueness
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'conversations'
			},
			(payload) => {
				console.log('🔄 Conversations realtime event:', payload);
				// Only reload conversations if it's a conversation creation/deletion, not updates
				if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
					loadConversations();
				}
				// For UPDATE events, we don't need to reload since message updates handle this
			}
		)
		.subscribe((status) => {
			console.log('📡 Conversations subscription status:', status);
		});

	// Subscribe to messages with unique channel name
	messagesChannel = supabase
		.channel(`messages-${user.id}-${Date.now()}`) // Add timestamp to ensure uniqueness
		.on(
			'postgres_changes',
			{
				event: 'INSERT',
				schema: 'public',
				table: 'messages'
			},
			async (payload) => {
				const newMessage = payload.new as Message;
				
				// Message received via realtime

				// Check if user is part of this conversation
				const { data: participation, error: participationError } = await supabase
					.from('conversation_participants')
					.select('conversation_id')
					.eq('conversation_id', newMessage.conversation_id)
					.eq('user_id', user.id)
					.single();

				if (!participation) {
					console.log('❌ User not participant in conversation, skipping notification');
					return;
				}
				
				console.log('✅ User is participant, proceeding with notification logic');

				// Load full message with sender info
				const { data: fullMessage, error: messageError } = await supabase
					.from('messages')
					.select(`*, sender:app_users!messages_sender_id_fkey (id, full_name, email, avatar_url)`)
					.eq('id', newMessage.id)
					.single();

				console.log('🔍 Loaded full message:', {
					id: fullMessage?.id,
					sender_id: fullMessage?.sender_id,
					sender: fullMessage?.sender,
					error: messageError
				});

				if (fullMessage) {
					// Check if sender data is missing and fetch manually if needed
					if (fullMessage.sender_id && (!fullMessage.sender || (!fullMessage.sender.full_name && !fullMessage.sender.email))) {
						console.log('❗ Missing sender data, fetching manually for:', fullMessage.sender_id);
						const { data: senderData } = await supabase
							.from('app_users')
							.select('id, full_name, email, avatar_url')
							.eq('id', fullMessage.sender_id)
							.single();
						
						console.log('👤 Fetched sender data:', senderData);
						
						if (senderData) {
							fullMessage.sender = senderData;
						}
					}
					
					
					// Create notification for new messages from other users
					console.log('Chat notification check:', {
						senderID: fullMessage.sender_id,
						currentUserID: user.id,
						shouldShowNotification: fullMessage.sender_id !== user.id,
						messageContent: fullMessage.content
					});
					
					if (fullMessage.sender_id !== user.id) {
						const senderName = fullMessage.sender?.full_name ?? fullMessage.sender?.email ?? 'Someone';
						
						console.log('Showing chat notification for message from:', senderName);
						
						addPrivateMessageNotification(
							senderName,
							fullMessage.content,
							fullMessage.content,
							'medium',
							fullMessage.sender_id,
							fullMessage.id
						);
						
						// Show toast notification for new messages
						const messagePreview = fullMessage.content.length > 50 
							? fullMessage.content.substring(0, 50) + '...' 
							: fullMessage.content;
						
						showInfoToast(
							`${messagePreview}`,
							`New message from ${senderName}`,
							5000
						);
					} else {
						console.log('Not showing notification - message from current user');
					}
					
					// Add to messages if we have this conversation loaded
					messages.update((current) => {
						
						if (current[fullMessage.conversation_id]) {
							const existingMessages = current[fullMessage.conversation_id];
							const isDuplicate = existingMessages.some(msg => msg.id === fullMessage.id);
							
							
							if (!isDuplicate) {
								const updated = {
									...current,
									[fullMessage.conversation_id]: [...current[fullMessage.conversation_id], fullMessage]
								};
								return updated;
							}
						} else {
							// Create the conversation in messages store if it doesn't exist
							const updated = {
								...current,
								[fullMessage.conversation_id]: [fullMessage]
							};
							return updated;
						}
						return current;
					});

					// Update conversation last message and unread count
					conversations.update((current) => {
						const updatedConversations = current.map((conv) =>
							conv.id === fullMessage.conversation_id
								? { 
									...conv, 
									last_message: fullMessage, 
									updated_at: fullMessage.created_at,
									unread_count: fullMessage.sender_id !== user.id ? (conv.unread_count ?? 0) + 1 : conv.unread_count
								}
								: conv
						);
						
						// Sort conversations by updated_at to move the active one to the top
						const sorted = updatedConversations.sort((a, b) => 
							new Date(b.updated_at ?? b.created_at).getTime() - 
							new Date(a.updated_at ?? a.created_at).getTime()
						);
						return sorted;
					});
				}
			}
		)
		.subscribe((status) => {
			console.log('📡 Messages subscription status:', status);
		});

	// Subscribe to typing indicators with shared channel name for all users
	typingChannel = supabase
		.channel('typing-global')
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
		.subscribe((status) => {
			console.log('📡 Typing subscription status:', status);
		});

	// Mark subscriptions as active and reset setup flag
	subscriptionsActive = true;
	setupInProgress = false;
}

function cleanupRealtimeSubscriptions(): void {
	subscriptionsActive = false;
	setupInProgress = false;

	if (conversationsChannel) {
		supabase.removeChannel(conversationsChannel);
		conversationsChannel = null;
	}
	if (messagesChannel) {
		supabase.removeChannel(messagesChannel);
		messagesChannel = null;
	}
	if (typingChannel) {
		supabase.removeChannel(typingChannel);
		typingChannel = null;
	}
}

// Initialize store when auth state changes
let authUnsubscribe: (() => void) | null = null;
let reconnectTimeout: number | null = null;
let lastAuthState: { hasUser: boolean; isInitialized: boolean; userId?: string } | null = null;

function initializeAuthSubscription() {
	// Clean up any existing subscription first
	if (authUnsubscribe) {
		authUnsubscribe();
	}
	
	authUnsubscribe = authStore.subscribe(async (auth) => {
		const typedAuth = typedAuthStore(auth);
		
		// Track the new auth state
		const currentAuthState = {
			hasUser: !!typedAuth.user,
			isInitialized: typedAuth.isInitialized,
			userId: typedAuth.user?.id
		};
		
		// Only process if this is a meaningful change
		const isInitialSubscription = lastAuthState === null;
		const hasUserChanged = lastAuthState?.hasUser !== currentAuthState.hasUser;
		const hasInitializationChanged = lastAuthState?.isInitialized !== currentAuthState.isInitialized;
		const hasUserIdChanged = lastAuthState?.userId !== currentAuthState.userId;
		
		const shouldProcess = !isInitialSubscription && (hasUserChanged || hasInitializationChanged || hasUserIdChanged);
		
		// For logging purposes, only log meaningful changes
		if (shouldProcess) {
		}
		
		// Update our tracking state
		lastAuthState = currentAuthState;
		
		// Only process if this isn't the initial subscription read
		if (!shouldProcess && !isInitialSubscription) {
			return;
		}
		
		// Process the auth change (but not on initial subscription)
		if (!isInitialSubscription) {
			// Clear any pending reconnect
			if (reconnectTimeout) {
				clearTimeout(reconnectTimeout);
				reconnectTimeout = null;
			}
			
			if (typedAuth.user && typedAuth.isInitialized) {
				// Only setup subscriptions if they're not already active
				if (!subscriptionsActive) {
					cleanupRealtimeSubscriptions();
					await loadConversations();
					setupRealtimeSubscriptions();
				}
			} else {
				// Clear state when user logs out using reset methods
				conversations.reset();
				messages.reset();
				activeConversationId.reset();
				typingUsers.reset();
				loading.reset();
				error.reset();
				cleanupRealtimeSubscriptions();
			}
		} else if (isInitialSubscription && typedAuth.user && typedAuth.isInitialized && !subscriptionsActive) {
			// Handle the case where auth is already ready on first subscription
			cleanupRealtimeSubscriptions();
			await loadConversations();
			setupRealtimeSubscriptions();
		}
	});
}

// Initialize on page load
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		if (reconnectTimeout) {
			clearTimeout(reconnectTimeout);
		}
		cleanupRealtimeSubscriptions();
		if (authUnsubscribe) {
			authUnsubscribe();
		}
	});

	// Initialize auth subscription
	initializeAuthSubscription();
}

// Cleanup function for components to call
export function cleanupChat(): void {
	// Clean up auth subscription
	if (authUnsubscribe) {
		authUnsubscribe();
		authUnsubscribe = null;
	}
	
	// Clean up reconnect timeout
	if (reconnectTimeout) {
		clearTimeout(reconnectTimeout);
		reconnectTimeout = null;
	}
	
	// Clean up realtime subscriptions
	cleanupRealtimeSubscriptions();
	
	// Clear active conversation to stop polling
	activeConversationId.set(null);
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
		const currentActiveId = activeConversationId.current();
		if (currentActiveId === conversationId) {
			activeConversationId.set(null);
		}

		return true;
	} catch (err: UnknownError) {
		console.error('Error deleting conversation:', err);
		error.set(err instanceof Error ? err.message : 'Failed to delete conversation');
		return false;
	}
}

// Polling function for reliable message updates
// This function is kept for future reference but not currently used
async function _pollForNewMessages(): Promise<void> {
	try {
		const user = getUser(get(authStore));
		const currentActiveConversationId = activeConversationId.current();

		if (!user || !currentActiveConversationId) return;

		// Check for new messages since last check
		const { data: newMessages } = await supabase
			.from('messages')
			.select(`
				*,
				sender:app_users!messages_sender_id_fkey (id, full_name, email, avatar_url)
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
						message.content,
						'medium',
						message.sender_id,
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
	} catch (error: UnknownError) {
		console.error('❌ Polling error:', error);
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
	formatTime,

	// Cleanup
	cleanup: cleanupChat,

	// Reset functions for logout
	resetAllStores: () => {
		// First cleanup all subscriptions
		cleanupChat();
		
		// Then reset stores
		conversations.reset();
		messages.reset();
		activeConversationId.reset();
		typingUsers.reset();
		loading.reset();
		error.reset();
	}
};