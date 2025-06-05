import { writable, derived, get } from 'svelte/store';
import type { Notification, Assignment, PrivateMessage, NotificationType, NotificationPriority } from '$lib/types/notifications';

// Core notification store
export const notifications = writable<Notification[]>([]);

// Assignment store
export const assignments = writable<Assignment[]>([]);

// Private messages store
export const privateMessages = writable<PrivateMessage[]>([]);

// Derived stores
export const unreadNotifications = derived(notifications, ($notifications) =>
	$notifications.filter(n => !n.read)
);

export const unreadCount = derived(unreadNotifications, ($unread) => $unread.length);

export const notificationsByType = derived(notifications, ($notifications) => {
	const grouped: Record<NotificationType, Notification[]> = {
		assignment: [],
		calendar: [],
		message: [],
		system: []
	};
	
	$notifications.forEach(notification => {
		grouped[notification.type].push(notification);
	});
	
	return grouped;
});

export const recentNotifications = derived(notifications, ($notifications) =>
	$notifications
		.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
		.slice(0, 10)
);

export const urgentNotifications = derived(notifications, ($notifications) =>
	$notifications.filter(n => n.priority === 'urgent' && !n.read)
);

// Utility functions
export function createNotification(
	type: NotificationType,
	title: string,
	message: string,
	priority: NotificationPriority = 'medium',
	actionUrl?: string,
	metadata?: any
): Notification {
	return {
		id: crypto.randomUUID(),
		type,
		title,
		message,
		timestamp: new Date(),
		read: false,
		priority,
		actionUrl,
		metadata
	};
}

export function addNotification(notification: Notification) {
	notifications.update(n => [notification, ...n]);
	saveNotificationsToStorage();
}

export function markAsRead(notificationId: string) {
	notifications.update(n =>
		n.map(notification =>
			notification.id === notificationId
				? { ...notification, read: true }
				: notification
		)
	);
	saveNotificationsToStorage();
}

export function markAllAsRead() {
	notifications.update(n =>
		n.map(notification => ({ ...notification, read: true }))
	);
	saveNotificationsToStorage();
}

export function deleteNotification(notificationId: string) {
	notifications.update(n => n.filter(notification => notification.id !== notificationId));
	saveNotificationsToStorage();
}

export function clearOldNotifications(daysOld: number = 30) {
	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysOld);
	
	notifications.update(n =>
		n.filter(notification => notification.timestamp > cutoffDate)
	);
	saveNotificationsToStorage();
}

// Assignment-specific functions
export function addAssignment(assignment: Assignment) {
	assignments.update(a => [...a, assignment]);
	
	// Create notification for new assignment
	const daysUntilDue = Math.ceil((assignment.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
	let priority: NotificationPriority = 'medium';
	
	if (daysUntilDue <= 1) priority = 'urgent';
	else if (daysUntilDue <= 3) priority = 'high';
	
	const notification = createNotification(
		'assignment',
		'New Assignment',
		`${assignment.title} is due ${assignment.dueDate.toLocaleDateString()}`,
		priority,
		'/assignments',
		{ assignmentId: assignment.id, dueDate: assignment.dueDate }
	);
	
	addNotification(notification);
	saveAssignmentsToStorage();
}

export function updateAssignmentStatus(assignmentId: string, status: Assignment['status']) {
	assignments.update(a =>
		a.map(assignment =>
			assignment.id === assignmentId
				? { ...assignment, status, updatedAt: new Date() }
				: assignment
		)
	);
	saveAssignmentsToStorage();
}

// Private message functions
export function addPrivateMessage(message: PrivateMessage) {
	privateMessages.update(m => [message, ...m]);
	
	// Create notification for new message
	const notification = createNotification(
		'message',
		'New Message',
		`${message.senderName}: ${message.subject}`,
		message.priority,
		'/messages',
		{ messageId: message.id, senderId: message.senderId }
	);
	
	addNotification(notification);
	saveMessagesToStorage();
}

export function markMessageAsRead(messageId: string) {
	privateMessages.update(m =>
		m.map(message =>
			message.id === messageId
				? { ...message, read: true }
				: message
		)
	);
	saveMessagesToStorage();
}

export function addPrivateMessageNotification(
	senderName: string,
	subject: string,
	message: string,
	priority: NotificationPriority = 'medium',
	senderId?: string,
	messageId?: string
) {
	const notification = createNotification(
		'message',
		'New Message',
		`${senderName}: ${subject}`,
		priority,
		'/chat',
		{ messageId, senderId, subject }
	);
	
	addNotification(notification);
}

// Calendar event notifications
export function addCalendarEventNotification(eventTitle: string, eventDate: Date, eventId: string) {
	const now = new Date();
	const timeUntilEvent = eventDate.getTime() - now.getTime();
	const hoursUntilEvent = timeUntilEvent / (1000 * 60 * 60);
	const daysUntilEvent = Math.ceil(timeUntilEvent / (1000 * 60 * 60 * 24));
	
	// Only create notifications for future events
	if (timeUntilEvent < 0) {
		return;
	}
	
	let priority: NotificationPriority = 'low';
	let title = 'Event Scheduled';
	let message = `${eventTitle} is scheduled for ${eventDate.toLocaleDateString()}`;
	
	// Only create urgent notifications for events happening very soon
	if (hoursUntilEvent <= 1 && hoursUntilEvent > 0) {
		priority = 'urgent';
		title = 'Event Starting Soon';
		message = `${eventTitle} starts in less than 1 hour`;
	} else if (hoursUntilEvent <= 24 && hoursUntilEvent > 1) {
		priority = 'high';
		title = 'Event Today';
		message = `${eventTitle} is today at ${eventDate.toLocaleTimeString()}`;
	} else if (daysUntilEvent <= 7) {
		priority = 'medium';
		title = 'Upcoming Event';
		message = `${eventTitle} is scheduled for ${eventDate.toLocaleDateString()}`;
	} else {
		// For events more than a week away, create a low priority notification
		priority = 'low';
		title = 'Event Scheduled';
		message = `${eventTitle} is scheduled for ${eventDate.toLocaleDateString()}`;
	}
	
	const notification = createNotification(
		'calendar',
		title,
		message,
		priority,
		'/calendar',
		{ calendarEventId: eventId, eventDate }
	);
	
	addNotification(notification);
}

// Check for due assignments and upcoming events
export function checkDueDatesAndEvents() {
	const now = new Date();
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	
	// Check assignments
	const currentAssignments = get(assignments);
	currentAssignments.forEach(assignment => {
		if (assignment.status === 'pending') {
			const daysUntilDue = Math.ceil((assignment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
			
			// Create urgent notification if due today or overdue
			if (daysUntilDue <= 1) {
				const existingNotification = get(notifications).find(n => 
					n.type === 'assignment' && 
					n.metadata?.assignmentId === assignment.id &&
					n.priority === 'urgent'
				);
				
				if (!existingNotification) {
					const notification = createNotification(
						'assignment',
						daysUntilDue < 0 ? 'Assignment Overdue' : 'Assignment Due Today',
						`${assignment.title} ${daysUntilDue < 0 ? 'was due' : 'is due'} ${assignment.dueDate.toLocaleDateString()}`,
						'urgent',
						'/assignments',
						{ assignmentId: assignment.id, dueDate: assignment.dueDate }
					);
					
					addNotification(notification);
				}
			}
		}
	});
}

// Storage functions
function saveNotificationsToStorage() {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('notifications', JSON.stringify(get(notifications)));
	}
}

function saveAssignmentsToStorage() {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('assignments', JSON.stringify(get(assignments)));
	}
}

function saveMessagesToStorage() {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('privateMessages', JSON.stringify(get(privateMessages)));
	}
}

// Load data from storage
export function loadNotificationsFromStorage() {
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem('notifications');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				const notificationsWithDates = parsed.map((n: any) => ({
					...n,
					timestamp: new Date(n.timestamp),
					metadata: n.metadata ? {
						...n.metadata,
						dueDate: n.metadata.dueDate ? new Date(n.metadata.dueDate) : undefined,
						eventDate: n.metadata.eventDate ? new Date(n.metadata.eventDate) : undefined
					} : undefined
				}));
				notifications.set(notificationsWithDates);
			} catch (error) {
				console.error('Failed to load notifications:', error);
			}
		}
		
		const assignmentsStored = localStorage.getItem('assignments');
		if (assignmentsStored) {
			try {
				const parsed = JSON.parse(assignmentsStored);
				const assignmentsWithDates = parsed.map((a: any) => ({
					...a,
					dueDate: new Date(a.dueDate),
					createdAt: new Date(a.createdAt),
					updatedAt: new Date(a.updatedAt)
				}));
				assignments.set(assignmentsWithDates);
			} catch (error) {
				console.error('Failed to load assignments:', error);
			}
		}
		
		const messagesStored = localStorage.getItem('privateMessages');
		if (messagesStored) {
			try {
				const parsed = JSON.parse(messagesStored);
				const messagesWithDates = parsed.map((m: any) => ({
					...m,
					timestamp: new Date(m.timestamp)
				}));
				privateMessages.set(messagesWithDates);
			} catch (error) {
				console.error('Failed to load messages:', error);
			}
		}
	}
}

// Initialize and set up periodic checks
export function initializeNotifications() {
	loadNotificationsFromStorage();
	
	// Check for due dates every 5 minutes
	setInterval(checkDueDatesAndEvents, 5 * 60 * 1000);
	
	// Clean up old notifications daily
	setInterval(() => clearOldNotifications(30), 24 * 60 * 60 * 1000);
	
	// Initial check
	checkDueDatesAndEvents();
}