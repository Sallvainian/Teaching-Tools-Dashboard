import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { authStore } from './auth';
import { typedAuthStore, getUser } from '$lib/utils/storeHelpers';
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
const typingUsers = writable<Record<string, string[]>>({});

// Realtime subscriptions
let conversationsChannel: RealtimeChannel | null = null;
let messagesChannel: RealtimeChannel | null = null;
let subscriptionsActive = false;

// Polling fallback
let pollingInterval: number | null = null;
let lastMessageCheck: Date = new Date();

// Derived stores
const activeConversation = derived(
	[conversations, activeConversationId],
	([$conversations, $activeConversationId]) => {
		if (!$activeConversationId) return null;
		return $conversations.find((c) => c.id === $activeConversationId) || null;
	}
);

const activeMessages = derived(
	[messages, activeConversationId],
	([$messages, $activeConversationId]) => {
		if (!$activeConversationId) return [];
		return $messages[$activeConversationId] || [];
	}
);

const activeTypingUsers = derived(
	[typingUsers, activeConversationId],
	([$typingUsers, $activeConversationId]) => {
		if (!$activeConversationId) return [];
		return $typingUsers[$activeConversationId] || [];
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

// Auto-response system for test users
async function handleAutoResponse(conversationId: string, userMessage: string): Promise<void> {
	try {
		const currentUser = getUser(get(authStore));
		if (!currentUser) return;

		// Get conversation participants to find the other user
		const { data: participants } = await supabase
			.from('conversation_participants')
			.select('user_id, user:app_users(id, full_name, email)')
			.eq('conversation_id', conversationId);

		// Type the participants properly
		type ParticipantWithUser = {
			user_id: string;
			user: {
				id: string;
				full_name: string;
				email: string;
			};
		};

  const otherUser = (participants as ParticipantWithUser[] | null)?.find((p) => p.user_id !== currentUser.id);
		if (!otherUser?.user) return;

		// Check if this is a test user (not the real user)
		const testUserEmails = [
			'alice.johnson@school.edu',
			'bob.smith@student.edu',
			'carol.davis@school.edu',
			'david.wilson@student.edu'
		];

		if (!testUserEmails.includes(otherUser.user.email)) return;

		// Generate response based on user personality and message
		const response = generateBotResponse(
			otherUser.user.full_name,
			otherUser.user.email,
			userMessage
		);

		// Show typing indicator
		setUserTyping(conversationId, otherUser.user.full_name);

		// Wait a bit to simulate typing
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000));

		// Remove typing indicator
		setUserNotTyping(conversationId, otherUser.user.full_name);

		// Send the bot response using the server function
		const { data: botMessageData, error: botError } = await supabase.rpc('send_bot_message', {
			p_conversation_id: conversationId,
			p_sender_id: otherUser.user_id,
			p_content: response
		});

		if (botError) throw botError;

		// Format the response to match expected structure
		const botMessage = botMessageData?.[0]
			? {
					id: botMessageData[0].id,
					conversation_id: botMessageData[0].conversation_id,
					sender_id: botMessageData[0].sender_id,
					content: botMessageData[0].content,
					message_type: botMessageData[0].message_type,
					created_at: botMessageData[0].created_at,
					edited_at: null,
					is_deleted: false,
					metadata: {},
					sender: {
						id: botMessageData[0].sender_id,
						full_name: botMessageData[0].sender_full_name,
						email: botMessageData[0].sender_email,
						avatar_url: undefined
					}
				} as Message
			: null;

		if (!botMessage) throw new Error('Failed to create bot message');

		// Add bot message to local state
		messages.update((current) => ({
			...current,
			[conversationId]: [...(current[conversationId] || []), botMessage as Message]
		}));

		// Update conversation's last message
		conversations.update((current) =>
			current.map((conv) =>
				conv.id === conversationId
					? { ...conv, last_message: botMessage as Message, updated_at: botMessage.created_at }
					: conv
			)
		);
	} catch (err) {
		console.error('Error generating auto-response:', err);
	}
}

function generateBotResponse(name: string, email: string, userMessage: string): string {
	const message = userMessage.toLowerCase();

	// Alice Johnson - Helpful Teacher Bot
	if (email === 'alice.johnson@school.edu') {
		if (message.includes('hello') || message.includes('hi')) {
			return "Hello! I'm Alice, your virtual teaching assistant. How can I help you with your educational needs today?";
		}
		if (message.includes('help') || message.includes('assist')) {
			return "Of course! I'd be happy to help. What specific topic or challenge are you working on?";
		}
		if (message.includes('grade') || message.includes('assignment')) {
			return 'Great question about grading! I always recommend clear rubrics and timely feedback. What type of assignment are you working with?';
		}
		if (message.includes('student') || message.includes('class')) {
			return 'Student engagement is so important! Have you tried incorporating interactive activities or group work?';
		}
		if (message.includes('thank')) {
			return "You're very welcome! Teaching is all about supporting each other. Feel free to reach out anytime!";
		}
		return "That's an interesting point! In my experience as an educator, I've found that every situation is unique. What are your thoughts on this?";
	}

	// Bob Smith - Curious Student Bot
	if (email === 'bob.smith@student.edu') {
		if (message.includes('hello') || message.includes('hi')) {
			return "Hey there! I'm Bob, a student here. What's up? Are you working on something cool?";
		}
		if (message.includes('homework') || message.includes('assignment')) {
			return "Oh man, homework! 😅 I'm always looking for study tips. Do you have any good strategies?";
		}
		if (message.includes('test') || message.includes('exam')) {
			return "Tests make me nervous! But I've been trying new study methods. What subjects are you working on?";
		}
		if (message.includes('help')) {
			return 'I could use some help too! Maybe we can figure it out together? What are you stuck on?';
		}
		if (message.includes('game') || message.includes('fun')) {
			return "Games are awesome for learning! Have you tried any of the educational games here? They're pretty cool!";
		}
		return "That's really interesting! I'm always curious to learn new things. Can you tell me more about that?";
	}

	// Carol Davis - Professional Teacher Bot
	if (email === 'carol.davis@school.edu') {
		if (message.includes('hello') || message.includes('hi')) {
			return "Good day! I'm Carol Davis. How may I assist you with your educational objectives today?";
		}
		if (message.includes('curriculum') || message.includes('lesson')) {
			return 'Excellent topic! Curriculum design requires careful consideration of learning outcomes and assessment strategies. What grade level are you planning for?';
		}
		if (message.includes('data') || message.includes('analytics')) {
			return 'Data-driven instruction is crucial for student success. Are you looking at performance metrics or engagement analytics?';
		}
		if (message.includes('standard') || message.includes('requirement')) {
			return 'Meeting educational standards while maintaining engaging instruction is key. Which standards are you focusing on?';
		}
		if (message.includes('professional') || message.includes('development')) {
			return 'Continuous professional development is essential in education. What areas are you looking to strengthen?';
		}
		return "I appreciate your inquiry. Based on current educational best practices, I'd recommend taking a systematic approach to this matter.";
	}

	// David Wilson - Friendly Student Bot
	if (email === 'david.wilson@student.edu') {
		if (message.includes('hello') || message.includes('hi')) {
			return "Hi! I'm David! Nice to meet you! 😊 How's your day going?";
		}
		if (message.includes('study') || message.includes('learn')) {
			return 'I love learning new things! What are you studying? Maybe we can study together sometime!';
		}
		if (message.includes('friend') || message.includes('buddy')) {
			return "Awesome! I'm always looking to make new friends. School is way more fun with good friends!";
		}
		if (message.includes('project') || message.includes('group')) {
			return 'Group projects can be really fun! I like working with others - we always come up with better ideas together!';
		}
		if (message.includes('music') || message.includes('art') || message.includes('creative')) {
			return 'Oh cool! I love creative stuff! Are you into music, art, or other creative activities?';
		}
		if (message.includes('sport') || message.includes('game')) {
			return "Sports and games are great! I think they help with learning too. What's your favorite activity?";
		}
		return "That sounds really cool! I'm always excited to hear about new ideas. Tell me more! 🌟";
	}

	// Default response
	return "Thanks for your message! I'm still learning how to respond better. What would you like to talk about?";
}

// Typing indicator functions
function setUserTyping(conversationId: string, userName: string): void {
	typingUsers.update((current) => {
		const conversationTyping = current[conversationId] || [];
		if (!conversationTyping.includes(userName)) {
			return {
				...current,
				[conversationId]: [...conversationTyping, userName]
			};
		}
		return current;
	});
}

function setUserNotTyping(conversationId: string, userName: string): void {
	typingUsers.update((current) => {
		const conversationTyping = current[conversationId] || [];
		return {
			...current,
			[conversationId]: conversationTyping.filter((name) => name !== userName)
		};
	});
}

function formatTime(date: string | null | undefined): string {
	if (!date) return 'Just now';

	const messageDate = new Date(date);
	if (isNaN(messageDate.getTime())) return 'Just now';

	const now = new Date();
	const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

	if (diffInHours < 1) {
		return messageDate.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	} else if (diffInHours < 24) {
		return messageDate.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
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

		// Load conversations using RPC function to avoid RLS recursion
		const { data: conversationsData, error: conversationsError } =
			await supabase.rpc('get_user_conversations');

		if (conversationsError) throw conversationsError;

 	// Get last message for each conversation
 	const conversationsWithMessages = await Promise.all(
 		(conversationsData || []).map(async (conv: Record<string, unknown>) => {
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

				const lastMessage = lastMessages?.[0] || null;

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
						.gt('created_at', userParticipant.last_read_at || '1970-01-01');

					unreadCount = count || 0;
				}

				return {
					...conv,
					participants: participants || [],
					conversation_participants: participants || [],
					last_message: lastMessage,
					unread_count: unreadCount
				};
			})
		);

		conversations.set(conversationsWithMessages);
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
			[conversationId]: messagesData || []
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
			[conversationId]: [...(current[conversationId] || []), message]
		}));

		// Update conversation's last message
		conversations.update((current) =>
			current.map((conv) =>
				conv.id === conversationId
					? { ...conv, last_message: message, updated_at: message.created_at }
					: conv
			)
		);

		// Trigger auto-response from test users
		await handleAutoResponse(conversationId, content.trim());
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
			.neq('id', getUser(get(authStore))?.id || '');

		if (usersError) throw usersError;

		return (users || []).map((user) => ({
			user_id: user.id,
			full_name: user.full_name,
			email: user.email,
			role: user.role || 'student',
			avatar_url: user.avatar_url || undefined,
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
		// Use the working get_or_create_direct_conversation function
		const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
			other_user_id: otherUserId
		});

		if (error) throw error;

		// Reload conversations to include the new one
		await loadConversations();

		return data;
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

	console.log('🔄 Setting up real-time subscriptions for user:', user.id);
	subscriptionsActive = true;

	// Start polling as reliable fallback
	startMessagePolling();

	// Subscribe to conversations changes (using official documentation pattern)
	conversationsChannel = supabase
		.channel('public:conversations')
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'conversations'
			},
			(payload) => {
				console.log('🔄 Conversation change detected:', payload);
				loadConversations();
			}
		)
		.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log('✅ Conversations subscription active');
			} else if (status === 'CLOSED') {
				console.log('❌ Conversations subscription closed');
			} else if (status === 'CHANNEL_ERROR') {
				console.error('❌ Conversations subscription failed');
			}
		});

	// Subscribe to messages (using official documentation pattern)
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
				console.log('📨 Received new message:', newMessage.id, 'in conversation:', newMessage.conversation_id);

				// Check if user is part of this conversation
				const { data: participation } = await supabase
					.from('conversation_participants')
					.select('conversation_id')
					.eq('conversation_id', newMessage.conversation_id)
					.eq('user_id', user.id)
					.single();

				if (!participation) return; // User not in this conversation

				// Load full message with sender info
				const { data: fullMessage } = await supabase
					.from('messages')
					.select(
						`
						*,
						sender:app_users (id, full_name, email, avatar_url)
					`
					)
					.eq('id', newMessage.id)
					.single();

				if (fullMessage) {
					console.log('✅ Adding message to UI:', fullMessage.content);
					// Add to messages if we have this conversation loaded
					messages.update((current) => {
						if (current[fullMessage.conversation_id]) {
							console.log('📁 Conversation loaded, adding message to chat');
							return {
								...current,
								[fullMessage.conversation_id]: [
									...current[fullMessage.conversation_id],
									fullMessage
								]
							};
						}
						console.log('⚠️ Conversation not loaded, message not displayed');
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
									unread_count: fullMessage.sender_id !== user.id ? (conv.unread_count || 0) + 1 : conv.unread_count
								}
								: conv
						)
					);
				}
			}
		)
		.subscribe((status) => {
			if (status === 'SUBSCRIBED') {
				console.log('✅ Messages subscription active');
			} else if (status === 'CLOSED') {
				console.log('❌ Messages subscription closed');
			} else if (status === 'CHANNEL_ERROR') {
				console.error('❌ Messages subscription failed');
			}
		});
}

function cleanupRealtimeSubscriptions(): void {
	console.log('🧹 Cleaning up real-time subscriptions and polling');
	subscriptionsActive = false;

	// Stop polling
	if (pollingInterval) {
		clearInterval(pollingInterval);
		pollingInterval = null;
	}

	if (conversationsChannel) {
		supabase.removeChannel(conversationsChannel);
		conversationsChannel = null;
	}
	if (messagesChannel) {
		supabase.removeChannel(messagesChannel);
		messagesChannel = null;
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
		cleanupRealtimeSubscriptions();
	}
});

// Cleanup on page unload
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', cleanupRealtimeSubscriptions);
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
	setUserTyping,
	setUserNotTyping,

	// Utilities
	getInitials,
	formatTime
};

// Polling function for reliable message updates
async function pollForNewMessages(): Promise<void> {
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
			console.log('📨 Polling found', newMessages.length, 'new messages');

			// Add new messages to the store
			messages.update((current) => ({
				...current,
				[currentActiveConversationId]: [
					...(current[currentActiveConversationId] || []),
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
							unread_count: latestMessage.sender_id !== user.id ? (conv.unread_count || 0) + newMessages.filter(m => m.sender_id !== user.id).length : conv.unread_count
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

// Start polling for messages
function startMessagePolling(): void {
	console.log('🔄 Starting message polling (3s interval)');
	lastMessageCheck = new Date();

	// Poll every 3 seconds
	pollingInterval = window.setInterval(pollForNewMessages, 3000);
}
