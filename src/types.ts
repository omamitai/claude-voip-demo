// src/types.ts - Type Definitions for VoIP Application

export type ConnectionState =
    | 'initializing'
    | 'ready'
    | 'searching'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'disconnected'
    | 'error';

export type CallQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

export interface AudioStats {
    bitrate: number;
    packetLoss: number;
    jitter: number;
    codec: string;
}

export interface VideoStats {
    bitrate: number;
    frameRate: number;
    resolution: {
        width: number;
        height: number;
    };
    codec: string;
}

export interface ConnectionStats {
    roundTripTime: number;
    localCandidateType: string;
    remoteCandidateType: string;
    protocol: string;
}

export interface CallStats {
    audio: AudioStats;
    video: VideoStats;
    connection: ConnectionStats;
}

export interface MediaConstraints {
    audio: boolean | MediaTrackConstraints;
    video: boolean | MediaTrackConstraints;
}

export interface SignalingMessage {
    type: string;
    payload?: any;
}

export interface Room {
    id: string;
    participants: string[];
    createdAt: number;
}

export interface Participant {
    id: string;
    stream?: MediaStream;
    audioEnabled: boolean;
    videoEnabled: boolean;
    screenSharing: boolean;
    connectionQuality: CallQuality;
}

export interface VoIPSettings {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
    preferredCodec: 'opus' | 'pcmu' | 'pcma';
    videoBitrate: number;
    audioBitrate: number;
}

export interface NetworkInfo {
    type: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
    downlink: number;
    rtt: number;
}

export interface AudioVisualizerData {
    level: number;
    frequency: number[];
    waveform: number[];
}
