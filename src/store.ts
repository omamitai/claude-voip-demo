// src/store.ts - Enhanced State Management
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { ConnectionState, CallQuality, CallStats } from './types';

interface MediaState {
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
    audioLevel: number;
    videoQuality: 'low' | 'medium' | 'high' | 'auto';
}

interface NetworkState {
    bitrate: number;
    packetLoss: number;
    jitter: number;
    roundTripTime: number;
    bandwidth: {
        audio: number;
        video: number;
    };
}

interface VoIPStore {
    // Connection State
    connectionState: ConnectionState;
    callQuality: CallQuality;
    clientId: string | null;
    partnerId: string | null;
    roomId: string | null;
    
    // Media Streams
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    screenStream: MediaStream | null;
    
    // Media State
    mediaState: MediaState;
    
    // Network State
    networkState: NetworkState;
    
    // Call Statistics
    callStats: CallStats | null;
    callStartTime: number | null;
    
    // Settings
    settings: {
        echoCancellation: boolean;
        noiseSuppression: boolean;
        autoGainControl: boolean;
        preferredCodec: 'opus' | 'pcmu' | 'pcma';
        videoBitrate: number;
        audioBitrate: number;
    };
    
    // Actions
    setConnectionState: (state: ConnectionState) => void;
    setCallQuality: (quality: CallQuality) => void;
    setClientId: (id: string) => void;
    setPartnerId: (id: string | null) => void;
    setRoomId: (id: string | null) => void;
    
    // Stream Actions
    setLocalStream: (stream: MediaStream | null) => void;
    setRemoteStream: (stream: MediaStream | null) => void;
    setScreenStream: (stream: MediaStream | null) => void;
    
    // Media Actions
    toggleAudio: () => void;
    toggleVideo: () => void;
    toggleScreenShare: () => void;
    setAudioLevel: (level: number) => void;
    setVideoQuality: (quality: MediaState['videoQuality']) => void;
    
    // Network Actions
    updateNetworkState: (state: Partial<NetworkState>) => void;
    
    // Call Actions
    startCall: () => void;
    endCall: () => void;
    updateCallStats: (stats: CallStats) => void;
    
    // Settings Actions
    updateSettings: (settings: Partial<VoIPStore['settings']>) => void;
    
    // Utility Actions
    reset: () => void;
}

const initialMediaState: MediaState = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
    audioLevel: 0,
    videoQuality: 'auto'
};

const initialNetworkState: NetworkState = {
    bitrate: 0,
    packetLoss: 0,
    jitter: 0,
    roundTripTime: 0,
    bandwidth: {
        audio: 0,
        video: 0
    }
};

const initialSettings = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    preferredCodec: 'opus' as const,
    videoBitrate: 1000000, // 1 Mbps
    audioBitrate: 64000    // 64 kbps
};

export const useStore = create<VoIPStore>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            // Initial State
            connectionState: 'initializing',
            callQuality: 'unknown',
            clientId: null,
            partnerId: null,
            roomId: null,
            
            localStream: null,
            remoteStream: null,
            screenStream: null,
            
            mediaState: initialMediaState,
            networkState: initialNetworkState,
            
            callStats: null,
            callStartTime: null,
            
            settings: initialSettings,
            
            // Connection Actions
            setConnectionState: (state) => set({ connectionState: state }),
            setCallQuality: (quality) => set({ callQuality: quality }),
            setClientId: (id) => set({ clientId: id }),
            setPartnerId: (id) => set({ partnerId: id }),
            setRoomId: (id) => set({ roomId: id }),
            
            // Stream Actions
            setLocalStream: (stream) => set({ localStream: stream }),
            setRemoteStream: (stream) => set({ remoteStream: stream }),
            setScreenStream: (stream) => set({ screenStream: stream }),
            
            // Media Actions
            toggleAudio: () => set((state) => ({
                mediaState: {
                    ...state.mediaState,
                    isAudioEnabled: !state.mediaState.isAudioEnabled
                }
            })),
            
            toggleVideo: () => set((state) => ({
                mediaState: {
                    ...state.mediaState,
                    isVideoEnabled: !state.mediaState.isVideoEnabled
                }
            })),
            
            toggleScreenShare: () => set((state) => ({
                mediaState: {
                    ...state.mediaState,
                    isScreenSharing: !state.mediaState.isScreenSharing
                }
            })),
            
            setAudioLevel: (level) => set((state) => ({
                mediaState: {
                    ...state.mediaState,
                    audioLevel: level
                }
            })),
            
            setVideoQuality: (quality) => set((state) => ({
                mediaState: {
                    ...state.mediaState,
                    videoQuality: quality
                }
            })),
            
            // Network Actions
            updateNetworkState: (newState) => set((state) => ({
                networkState: {
                    ...state.networkState,
                    ...newState
                }
            })),
            
            // Call Actions
            startCall: () => set({
                callStartTime: Date.now(),
                connectionState: 'connecting'
            }),
            
            endCall: () => {
                const state = get();
                
                // Stop all tracks
                state.localStream?.getTracks().forEach(track => track.stop());
                state.screenStream?.getTracks().forEach(track => track.stop());
                
                set({
                    connectionState: 'disconnected',
                    partnerId: null,
                    roomId: null,
                    remoteStream: null,
                    screenStream: null,
                    callStartTime: null,
                    callStats: null,
                    mediaState: {
                        ...initialMediaState,
                        isAudioEnabled: state.mediaState.isAudioEnabled,
                        isVideoEnabled: state.mediaState.isVideoEnabled
                    }
                });
            },
            
            updateCallStats: (stats) => set({ callStats: stats }),
            
            // Settings Actions
            updateSettings: (newSettings) => set((state) => ({
                settings: {
                    ...state.settings,
                    ...newSettings
                }
            })),
            
            // Utility Actions
            reset: () => {
                const state = get();
                
                // Clean up streams
                state.localStream?.getTracks().forEach(track => track.stop());
                state.remoteStream?.getTracks().forEach(track => track.stop());
                state.screenStream?.getTracks().forEach(track => track.stop());
                
                set({
                    connectionState: 'initializing',
                    callQuality: 'unknown',
                    clientId: null,
                    partnerId: null,
                    roomId: null,
                    localStream: null,
                    remoteStream: null,
                    screenStream: null,
                    mediaState: initialMediaState,
                    networkState: initialNetworkState,
                    callStats: null,
                    callStartTime: null,
                    settings: initialSettings
                });
            }
        })),
        {
            name: 'voip-store'
        }
    )
);

// Selectors
export const selectIsInCall = (state: VoIPStore) => 
    state.connectionState === 'connected' || state.connectionState === 'connecting';

export const selectCallDuration = (state: VoIPStore) => 
    state.callStartTime ? Date.now() - state.callStartTime : 0;

export const selectIsMediaReady = (state: VoIPStore) => 
    state.localStream !== null && state.connectionState === 'ready';
