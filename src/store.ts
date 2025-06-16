// src/store.ts - Enhanced State Management
import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { ConnectionState, CallQuality, CallStats } from './types';

interface MediaState {
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
    isScreenSharing: boolean;
}

interface VoIPStore {
    connectionState: ConnectionState;
    callQuality: CallQuality;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    mediaState: MediaState;
    callStats: CallStats | null;
    setConnectionState: (state: ConnectionState) => void;
    setCallQuality: (quality: CallQuality) => void;
    setLocalStream: (stream: MediaStream | null) => void;
    setRemoteStream: (stream: MediaStream | null) => void;
    toggleAudio: () => void;
    toggleVideo: () => void;
    updateCallStats: (stats: CallStats) => void;
    reset: () => void;
}

const initialMediaState: MediaState = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    isScreenSharing: false,
};

export const useStore = create<VoIPStore>()(
    devtools(
        subscribeWithSelector((set) => ({
            connectionState: 'initializing',
            callQuality: 'unknown',
            localStream: null,
            remoteStream: null,
            mediaState: initialMediaState,
            callStats: null,
            setConnectionState: (state) => set({ connectionState: state }),
            setCallQuality: (quality) => set({ callQuality: quality }),
            setLocalStream: (stream) => set({ localStream: stream }),
            setRemoteStream: (stream) => set({ remoteStream: stream }),
            toggleAudio: () => set((state) => ({
                mediaState: { ...state.mediaState, isAudioEnabled: !state.mediaState.isAudioEnabled }
            })),
            toggleVideo: () => set((state) => ({
                mediaState: { ...state.mediaState, isVideoEnabled: !state.mediaState.isVideoEnabled }
            })),
            updateCallStats: (stats) => set({ callStats: stats }),
            reset: () => set({
                connectionState: 'initializing',
                callQuality: 'unknown',
                localStream: null,
                remoteStream: null,
                mediaState: initialMediaState,
                callStats: null,
            }),
        })),
        { name: 'voip-store' }
    )
);
