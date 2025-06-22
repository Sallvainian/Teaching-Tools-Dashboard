/**
 * @ai-context CALL_STORE - Voice call state management and WebRTC handling
 * @ai-dependencies PeerJS, Supabase realtime, auth store
 * @ai-sideEffects Modifies call state, manages peer connections
 * @ai-exports callStore, initializeVoiceCalls, makeCall, answerCall, endCall
 */

import { writable, derived, get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import { authStore } from './auth';
import Peer from 'peerjs';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' | 'failed';
export type CallType = 'voice' | 'video';

export interface CallSession {
	id: string;
	callerId: string;
	callerName: string;
	calleeId: string;
	calleeName: string;
	type: CallType;
	state: CallState;
	startedAt?: Date;
	endedAt?: Date;
	duration?: number;
}

interface CallStoreState {
	currentCall: CallSession | null;
	incomingCall: CallSession | null;
	peer: Peer | null;
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;
	isInitialized: boolean;
	isMuted: boolean;
	isSpeakerOn: boolean;
	error: string | null;
}

// Create the call store
function createCallStore() {
	const { subscribe, set, update } = writable<CallStoreState>({
		currentCall: null,
		incomingCall: null,
		peer: null,
		localStream: null,
		remoteStream: null,
		isInitialized: false,
		isMuted: false,
		isSpeakerOn: false,
		error: null
	});

	let realtimeChannel: RealtimeChannel | null = null;

	// Initialize PeerJS and setup realtime subscriptions
	async function initialize(): Promise<void> {
		const user = get(authStore).user;
		if (!user) {
			console.error('Cannot initialize calls: user not authenticated');
			return;
		}

		try {
			// Initialize PeerJS with user ID using free cloud server
			const peer = new Peer(user.id, {
				debug: 2,
				config: {
					iceServers: [
						{ urls: 'stun:stun.l.google.com:19302' },
						{ urls: 'stun:stun1.l.google.com:19302' }
					]
				}
			});

			peer.on('open', (id) => {
				console.log('🎙️ PeerJS connected with ID:', id);
				update(state => ({ ...state, peer, isInitialized: true, error: null }));
			});

			peer.on('error', (error) => {
				console.error('PeerJS error:', error);
				update(state => ({ ...state, error: error.message, isInitialized: false }));
			});

			// Handle incoming calls
			peer.on('call', async (call) => {
				console.log('📞 Incoming call from:', call.peer);
				
				// Get caller info from database
				const { data: callerData } = await supabase
					.from('app_users')
					.select('full_name, email')
					.eq('id', call.peer)
					.single();

				const callerName = callerData?.full_name || callerData?.email || 'Unknown User';
				
				const incomingCallSession: CallSession = {
					id: call.connectionId || `call-${Date.now()}`,
					callerId: call.peer,
					callerName,
					calleeId: user.id,
					calleeName: get(authStore).profile?.full_name || 'You',
					type: 'voice',
					state: 'ringing'
				};

				update(state => ({ ...state, incomingCall: incomingCallSession }));

				// Store the PeerJS call object for later use
				(incomingCallSession as any).peerCall = call;
			});

			// Setup Supabase realtime for call signaling
			realtimeChannel = supabase.channel('call-signals')
				.on('broadcast', { event: 'call-request' }, (payload) => {
					handleCallRequest(payload.payload);
				})
				.on('broadcast', { event: 'call-response' }, (payload) => {
					handleCallResponse(payload.payload);
				})
				.on('broadcast', { event: 'call-ended' }, (payload) => {
					handleCallEnded(payload.payload);
				})
				.subscribe();

		} catch (error: any) {
			console.error('Failed to initialize call system:', error);
			update(state => ({ ...state, error: error.message }));
		}
	}

	// Make a voice call
	async function makeCall(calleeId: string, calleeName: string): Promise<void> {
		const state = get({ subscribe });
		const user = get(authStore).user;
		
		if (!state.peer || !user) {
			console.error('Cannot make call: peer not initialized or user not authenticated');
			return;
		}

		try {
			// Get user media (microphone)
			const localStream = await navigator.mediaDevices.getUserMedia({ 
				audio: true, 
				video: false 
			});

			const callSession: CallSession = {
				id: `call-${Date.now()}`,
				callerId: user.id,
				callerName: get(authStore).profile?.full_name || 'You',
				calleeId,
				calleeName,
				type: 'voice',
				state: 'calling',
				startedAt: new Date()
			};

			update(state => ({ 
				...state, 
				currentCall: callSession,
				localStream 
			}));

			// Send call request via Supabase realtime
			await realtimeChannel?.send({
				type: 'broadcast',
				event: 'call-request',
				payload: {
					callId: callSession.id,
					callerId: user.id,
					callerName: callSession.callerName,
					calleeId,
					type: 'voice'
				}
			});

			// Make the PeerJS call
			const call = state.peer.call(calleeId, localStream);
			
			call.on('stream', (remoteStream) => {
				console.log('📻 Received remote stream');
				update(state => ({ 
					...state, 
					remoteStream,
					currentCall: state.currentCall ? {
						...state.currentCall,
						state: 'connected'
					} : null
				}));
			});

			call.on('close', () => {
				console.log('📞 Call closed');
				endCall();
			});

		} catch (error: any) {
			console.error('Failed to make call:', error);
			update(state => ({ 
				...state, 
				error: error.message,
				currentCall: null 
			}));
		}
	}

	// Answer an incoming call
	async function answerCall(): Promise<void> {
		const state = get({ subscribe });
		
		if (!state.incomingCall || !state.peer) {
			console.error('Cannot answer call: no incoming call or peer not initialized');
			return;
		}

		try {
			// Get user media (microphone)
			const localStream = await navigator.mediaDevices.getUserMedia({ 
				audio: true, 
				video: false 
			});

			// Answer the PeerJS call
			const peerCall = (state.incomingCall as any).peerCall;
			peerCall.answer(localStream);

			peerCall.on('stream', (remoteStream: MediaStream) => {
				console.log('📻 Received remote stream on answer');
				update(state => ({ 
					...state, 
					remoteStream,
					localStream,
					currentCall: {
						...state.incomingCall!,
						state: 'connected',
						startedAt: new Date()
					},
					incomingCall: null
				}));
			});

			peerCall.on('close', () => {
				console.log('📞 Call closed after answer');
				endCall();
			});

			// Send call response via Supabase realtime
			await realtimeChannel?.send({
				type: 'broadcast',
				event: 'call-response',
				payload: {
					callId: state.incomingCall.id,
					accepted: true,
					calleeId: state.incomingCall.calleeId
				}
			});

		} catch (error: any) {
			console.error('Failed to answer call:', error);
			update(state => ({ 
				...state, 
				error: error.message,
				incomingCall: null 
			}));
		}
	}

	// Decline an incoming call
	async function declineCall(): Promise<void> {
		const state = get({ subscribe });
		
		if (!state.incomingCall) {
			return;
		}

		// Send call response via Supabase realtime
		await realtimeChannel?.send({
			type: 'broadcast',
			event: 'call-response',
			payload: {
				callId: state.incomingCall.id,
				accepted: false,
				calleeId: state.incomingCall.calleeId
			}
		});

		update(state => ({ ...state, incomingCall: null }));
	}

	// End the current call
	function endCall(): void {
		const state = get({ subscribe });
		
		// Stop local stream
		if (state.localStream) {
			state.localStream.getTracks().forEach(track => track.stop());
		}

		// Stop remote stream
		if (state.remoteStream) {
			state.remoteStream.getTracks().forEach(track => track.stop());
		}

		// Send call ended signal
		if (state.currentCall) {
			realtimeChannel?.send({
				type: 'broadcast',
				event: 'call-ended',
				payload: {
					callId: state.currentCall.id
				}
			});
		}

		update(state => ({ 
			...state, 
			currentCall: null,
			incomingCall: null,
			localStream: null,
			remoteStream: null,
			isMuted: false
		}));
	}

	// Toggle mute
	function toggleMute(): void {
		const state = get({ subscribe });
		
		if (state.localStream) {
			const audioTrack = state.localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = state.isMuted;
				update(state => ({ ...state, isMuted: !state.isMuted }));
			}
		}
	}

	// Toggle speaker
	function toggleSpeaker(): void {
		update(state => ({ ...state, isSpeakerOn: !state.isSpeakerOn }));
	}

	// Handle call request from realtime
	function handleCallRequest(payload: any): void {
		// This is handled by PeerJS 'call' event
		console.log('📞 Call request received via realtime:', payload);
	}

	// Handle call response from realtime
	function handleCallResponse(payload: any): void {
		console.log('📞 Call response received:', payload);
		
		if (!payload.accepted) {
			// Call was declined
			update(state => ({ 
				...state, 
				currentCall: null,
				error: 'Call declined'
			}));
		}
	}

	// Handle call ended from realtime
	function handleCallEnded(payload: any): void {
		console.log('📞 Call ended signal received:', payload);
		endCall();
	}

	// Cleanup function
	function cleanup(): void {
		const state = get({ subscribe });
		
		if (state.peer) {
			state.peer.destroy();
		}
		
		if (realtimeChannel) {
			realtimeChannel.unsubscribe();
		}
		
		endCall();
	}

	return {
		subscribe,
		initialize,
		makeCall,
		answerCall,
		declineCall,
		endCall,
		toggleMute,
		toggleSpeaker,
		cleanup
	};
}

export const callStore = createCallStore();

// Derived stores for easier access
export const isInCall = derived(callStore, $call => 
	$call.currentCall?.state === 'connected'
);

export const hasIncomingCall = derived(callStore, $call => 
	$call.incomingCall !== null
);

export const callState = derived(callStore, $call => 
	$call.currentCall?.state || 'idle'
);