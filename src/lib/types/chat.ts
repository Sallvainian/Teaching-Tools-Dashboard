export interface ChatUIConversation {
	id: string;
	name: string;
	displayName: string;
	avatar: string | null;
	displayAvatar: string;
	is_group: boolean;
	last_message_text: string;
	last_message_time: string;
	unread_count: number;
	is_online: boolean;
	created_at: string;
	updated_at: string;
}

export interface ChatUIMessage {
	id: string;
	content: string;
	sender_name: string;
	sender_avatar: string;
	created_at: string;
	is_own_message: boolean;
	sender_id?: string;
	sender?: {
		full_name?: string;
		email?: string;
		avatar_url?: string;
	};
}

export interface ConversationParticipant {
	user_id: string | null;
	user?: {
		full_name?: string;
		email?: string;
		avatar_url?: string;
	};
	full_name?: string;
	email?: string;
	avatar_url?: string;
	is_online?: boolean;
}

export interface ConversationWithDetails {
	id: string;
	name?: string | null;
	avatar?: string | null;
	participants?: ConversationParticipant[];
	sender?: ConversationParticipant;
	last_message?: ChatUIMessage;
	unread_count?: number;
	created_at?: string;
	updated_at?: string;
	is_group?: boolean;
}