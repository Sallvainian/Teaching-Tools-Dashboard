/**
 * @ai-context PRESENCE_STORE - Real-time user presence tracking with Supabase Realtime
 * @ai-dependencies supabase, notifications store, auth store
 * @ai-sideEffects Manages Supabase Realtime channel, updates presence tracking, shows toast notifications
 * @ai-exports presenceStore, onlineUsers, joinPresence, leavePresence
 */
import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { showInfoToast } from '$lib/stores/notifications';
import { authStore } from '$lib/stores/auth';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';
import type { UnknownError } from '$lib/types/ai-enforcement';

export interface OnlineUser {
	user_id: string;
	full_name: string;
	email: string;
	avatar_url?: string;
	role: 'teacher' | 'student';
	online_at: string;
}

interface PresencePayload {
	user_id: string;
	full_name: string;
	email: string;
	avatar_url?: string;
	role: 'teacher' | 'student';
	online_at: string;
}

// Stores
export const onlineUsers = writable<OnlineUser[]>([]);
export const isPresenceConnected = writable(false);
export const presenceError = writable<string | null>(null);

// Derived stores
export const onlineCount = derived(onlineUsers, ($users) => $users.length);
export const onlineTeachers = derived(onlineUsers, ($users) => 
	$users.filter(user => user.role === 'teacher')
);
export const onlineStudents = derived(onlineUsers, ($users) => 
	$users.filter(user => user.role === 'student')
);

// Private variables
let presenceChannel: RealtimeChannel | null = null;
let currentUserId: string | null = null;

// Track recent notifications to prevent spam
const recentNotifications = new Map<string, number>();
const NOTIFICATION_COOLDOWN = 30000; // 30 seconds cooldown

/**
 * Check if we should show a notification for this user
 */
function shouldShowNotification(userId: string, eventType: 'join' | 'leave'): boolean {
	const now = Date.now();
	const key = `${userId}-${eventType}`;
	const lastNotification = recentNotifications.get(key);
	
	if (lastNotification && (now - lastNotification) < NOTIFICATION_COOLDOWN) {
		return false; // Still in cooldown period
	}
	
	// Update the last notification time
	recentNotifications.set(key, now);
	
	// Clean up old entries to prevent memory leaks
	for (const [entryKey, timestamp] of recentNotifications.entries()) {
		if (now - timestamp > NOTIFICATION_COOLDOWN) {
			recentNotifications.delete(entryKey);
		}
	}
	
	return true;
}

/**
 * Initialize presence tracking for the current user
 */
export async function joinPresence(): Promise<void> {
	try {
		const authState = get(authStore);
		console.log('🔍 joinPresence called, authState:', { 
			hasUser: !!authState.user, 
			hasProfile: !!authState.profile,
			userId: authState.user?.id 
		});
		
		if (!authState.user || !authState.profile) {
			console.warn('Cannot join presence: user not authenticated');
			presenceError.set('User not authenticated');
			isPresenceConnected.set(false);
			return;
		}

		// Leave any existing channel first
		await leavePresence();

		currentUserId = authState.user.id;
		console.log('🔄 Creating presence channel for user:', currentUserId);
		
		// Create presence channel
		presenceChannel = supabase.channel('online-presence', {
			config: {
				presence: {
					key: currentUserId
				}
			}
		});

		// Handle presence state changes
		presenceChannel
			.on('presence', { event: 'sync' }, () => {
				handlePresenceSync();
			})
			.on('presence', { event: 'join' }, ({ key, newPresences }) => {
				handlePresenceJoin(key, newPresences);
			})
			.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
				handlePresenceLeave(key, leftPresences);
			})
			.on('broadcast', { event: 'poke' }, ({ payload }) => {
				handlePokeReceived(payload);
			});

		// Subscribe to the channel
		console.log('📡 Subscribing to presence channel...');
		const status = await presenceChannel.subscribe(async (status) => {
			console.log('📡 Channel status:', status);
			
			if (status === 'SUBSCRIBED') {
				isPresenceConnected.set(true);
				presenceError.set(null);
				
				// Track current user's presence
				const presencePayload: PresencePayload = {
					user_id: authState.user!.id,
					full_name: authState.profile!.full_name,
					email: authState.profile!.email,
					avatar_url: authState.profile!.avatar_url || undefined,
					role: authState.profile!.role as 'teacher' | 'student',
					online_at: new Date().toISOString()
				};

				console.log('👤 Tracking presence with payload:', presencePayload);
				await presenceChannel?.track(presencePayload);
				console.log('✅ Joined presence channel successfully');
			} else if (status === 'CHANNEL_ERROR') {
				isPresenceConnected.set(false);
				presenceError.set('Failed to connect to presence channel');
				console.error('❌ Presence channel error');
			} else if (status === 'TIMED_OUT') {
				isPresenceConnected.set(false);
				presenceError.set('Connection timed out');
				console.error('⏰ Presence channel timed out');
			} else if (status === 'CLOSED') {
				isPresenceConnected.set(false);
				presenceError.set('Connection closed');
				console.error('🔒 Presence channel closed');
			}
		});

	} catch (error: UnknownError) {
		console.error('Error joining presence:', error);
		presenceError.set(error instanceof Error ? error.message : 'Unknown presence error');
		isPresenceConnected.set(false);
	}
}

/**
 * Leave presence tracking and clean up
 */
export async function leavePresence(): Promise<void> {
	try {
		if (presenceChannel) {
			await presenceChannel.untrack();
			await presenceChannel.unsubscribe();
			presenceChannel = null;
		}
		
		isPresenceConnected.set(false);
		currentUserId = null;
		console.log('✅ Left presence channel');
	} catch (error: UnknownError) {
		console.error('Error leaving presence:', error);
	}
}

/**
 * Handle presence sync - update full online users list
 */
function handlePresenceSync(): void {
	if (!presenceChannel) return;

	const presenceState: RealtimePresenceState = presenceChannel.presenceState();
	const users: OnlineUser[] = [];

	for (const key in presenceState) {
		const presences = presenceState[key];
		// Take the most recent presence for each user
		if (presences && presences.length > 0) {
			const latestPresence = presences[presences.length - 1] as unknown as PresencePayload;
			// Validate that we have the expected data structure
			if (latestPresence && latestPresence.user_id && latestPresence.full_name) {
				users.push({
					user_id: latestPresence.user_id,
					full_name: latestPresence.full_name,
					email: latestPresence.email,
					avatar_url: latestPresence.avatar_url,
					role: latestPresence.role,
					online_at: latestPresence.online_at
				});
			}
		}
	}

	// Sort by online time (most recent first)
	users.sort((a, b) => new Date(b.online_at).getTime() - new Date(a.online_at).getTime());
	
	onlineUsers.set(users);
	console.log(`👥 ${users.length} users online`);
}

/**
 * Handle user joining presence
 */
function handlePresenceJoin(key: string, newPresences: any[]): void {
	if (newPresences && newPresences.length > 0) {
		const presence = newPresences[0] as unknown as PresencePayload;
		
		// Don't show toast for current user
		if (presence.user_id !== currentUserId) {
			// Only show notification if not in cooldown period
			if (shouldShowNotification(presence.user_id, 'join')) {
				showInfoToast(
					`${presence.full_name} came online`,
					'User Online',
					3000
				);
			}
		}
	}
}

/**
 * Handle user leaving presence
 */
function handlePresenceLeave(key: string, leftPresences: any[]): void {
	if (leftPresences && leftPresences.length > 0) {
		const presence = leftPresences[0] as unknown as PresencePayload;
		
		// Don't show toast for current user
		if (presence.user_id !== currentUserId) {
			// Only show notification if not in cooldown period
			if (shouldShowNotification(presence.user_id, 'leave')) {
				showInfoToast(
					`${presence.full_name} went offline`,
					'User Offline',
					3000
				);
			}
		}
	}
}

/**
 * Get current online status
 */
export function isUserOnline(userId: string): boolean {
	const users = get(onlineUsers);
	return users.some(user => user.user_id === userId);
}

/**
 * Send a poke to another user
 */
export async function sendPoke(targetUser: OnlineUser): Promise<void> {
	if (!presenceChannel || !currentUserId) {
		console.warn('Cannot send poke: not connected to presence');
		return;
	}

	const authState = get(authStore);
	if (!authState.profile) {
		console.warn('Cannot send poke: no user profile');
		return;
	}

	try {
		const pokePayload = {
			from_user_id: currentUserId,
			from_name: authState.profile.full_name,
			to_user_id: targetUser.user_id,
			to_name: targetUser.full_name,
			timestamp: new Date().toISOString()
		};

		await presenceChannel.send({
			type: 'broadcast',
			event: 'poke',
			payload: pokePayload
		});

		// Show confirmation to sender
		showInfoToast(
			`👋 You poked ${targetUser.full_name}!`,
			'Poke Sent',
			3000
		);

		console.log('👋 Poke sent to:', targetUser.full_name);
	} catch (error) {
		console.error('Failed to send poke:', error);
		showInfoToast(
			'Failed to send poke',
			'Error',
			3000
		);
	}
}

/**
 * Handle receiving a poke
 */
function handlePokeReceived(payload: any): void {
	// Only show notification if the poke is for the current user
	if (payload.to_user_id === currentUserId) {
		showInfoToast(
			`👋 ${payload.from_name} poked you!`,
			'You got poked!',
			5000
		);
		console.log('👋 Received poke from:', payload.from_name);
	}
}

/**
 * Handle page unload - clean up presence
 */
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', () => {
		// Fire and forget - browser will handle cleanup
		void leavePresence();
	});
}

// Auto-cleanup on visibility change (when user switches tabs)
if (typeof document !== 'undefined') {
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'hidden') {
			// Don't fully leave, just let Supabase handle the timeout
			// This prevents flickering when switching tabs briefly
			console.log('👁️ Tab hidden - presence will timeout naturally');
		} else if (document.visibilityState === 'visible') {
			// Re-track presence if we have a channel but aren't tracking
			if (presenceChannel && currentUserId && get(isPresenceConnected)) {
				console.log('👁️ Tab visible - refreshing presence');
				// The channel should automatically re-establish presence
			}
		}
	});
}

export default {
	onlineUsers,
	onlineCount,
	onlineTeachers,
	onlineStudents,
	isPresenceConnected,
	presenceError,
	joinPresence,
	leavePresence,
	isUserOnline,
	sendPoke
};