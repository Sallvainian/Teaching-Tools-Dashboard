import type { Database } from './database';

// Base database types
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationParticipant =
	Database['public']['Tables']['conversation_participants']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageAttachment = Database['public']['Tables']['message_attachments']['Row'];

// Extended types with relationships
export type ConversationWithDetails = Conversation & {
	participants: (ConversationParticipant & {
		user: {
			id: string;
			full_name: string;
			email: string;
			avatar_url?: string;
		};
	})[];
	last_message?: MessageWithSender;
	unread_count?: number;
	is_online?: boolean;
};

export type MessageWithSender = Message & {
	sender: {
		id: string;
		full_name: string;
		email: string;
		avatar_url?: string;
	};
	attachments?: MessageAttachment[];
};

// UI specific types
export type ChatUIConversation = {
	id: string;
	name: string;
	unread: number;
	lastMessage: string;
	time: string;
	avatar: string;
	online: boolean;
	isGroup?: boolean;
	members?: number;
};

export type ChatUIMessage = {
	id: string;
	sender: 'me' | 'other';
	senderName: string;
	text: string;
	time: string;
	attachments?: {
		id: string;
		type: 'image' | 'file' | 'video';
		url: string;
		name: string;
	}[];
};

// Conversion utilities
export function conversationToUI(
	conversation: ConversationWithDetails,
	currentUserId: string
): ChatUIConversation {
	const isGroup = conversation.type === 'group';

	let name = conversation.name || '';
	let avatar = '';

	if (!isGroup && conversation.participants.length === 2) {
		// Direct conversation - use other participant's name
		const otherParticipant = conversation.participants.find((p) => p.user_id !== currentUserId);
		if (otherParticipant?.user) {
			name = otherParticipant.user.full_name;
			avatar = getInitials(otherParticipant.user.full_name);
		}
	} else {
		// Group conversation
		name = conversation.name || `Group Chat (${conversation.participants.length})`;
		avatar = name
			.split(' ')
			.map((word) => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	const lastMessage = conversation.last_message
		? conversation.last_message.sender_id === currentUserId
			? `You: ${conversation.last_message.content}`
			: conversation.last_message.content
		: 'No messages yet';

	return {
		id: conversation.id,
		name,
		unread: conversation.unread_count || 0,
		lastMessage,
		time: formatTime(conversation.last_message_at),
		avatar,
		online: conversation.is_online || false,
		isGroup,
		members: isGroup ? conversation.participants.length : undefined
	};
}

export function messageToUI(message: MessageWithSender, currentUserId: string): ChatUIMessage {
	return {
		id: message.id,
		sender: message.sender_id === currentUserId ? 'me' : 'other',
		text: message.content,
		time: formatMessageTime(message.created_at),
		attachments: message.attachments?.map((att) => ({
			id: att.id,
			type: getAttachmentType(att.file_type),
			url: att.file_url,
			name: att.file_name
		}))
	};
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.map((word) => word[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

function formatTime(date: string): string {
	const messageDate = new Date(date);
	const now = new Date();
	const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

	if (diffInHours < 1) {
		return 'Just now';
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

function formatMessageTime(date: string): string {
	const messageDate = new Date(date);
	return messageDate.toLocaleTimeString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
}

function getAttachmentType(mimeType: string): 'image' | 'file' | 'video' {
	if (mimeType.startsWith('image/')) return 'image';
	if (mimeType.startsWith('video/')) return 'video';
	return 'file';
}
