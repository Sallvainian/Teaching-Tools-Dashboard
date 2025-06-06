export type NotificationType = 'assignment' | 'calendar' | 'message' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	timestamp: Date;
	read: boolean;
	priority: NotificationPriority;
	actionUrl?: string;
	metadata?: {
		assignmentId?: string;
		calendarEventId?: string;
		messageId?: string;
		senderId?: string;
		dueDate?: Date;
		eventDate?: Date;
	};
}

export interface Assignment {
	id: string;
	title: string;
	description?: string;
	dueDate: Date;
	subject: string;
	status: 'pending' | 'submitted' | 'graded';
	priority: 'low' | 'medium' | 'high';
	createdAt: Date;
	updatedAt: Date;
}

export interface PrivateMessage {
	id: string;
	senderId: string;
	senderName: string;
	recipientId: string;
	subject: string;
	message: string;
	timestamp: Date;
	read: boolean;
	priority: NotificationPriority;
}

export interface Toast {
	id: string;
	type: ToastType;
	title?: string;
	message: string;
	duration?: number; // milliseconds, 0 means no auto-dismiss
	timestamp: Date;
}