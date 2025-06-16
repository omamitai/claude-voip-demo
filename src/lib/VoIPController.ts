// src/lib/VoIPController.ts - Advanced WebRTC VoIP Controller
import Peer from 'simple-peer';
import { ConnectionState, CallQuality, CallStats } from '../types';

interface VoIPControllerOptions {
    onConnectionStateChange: (state: ConnectionState) => void;
    onCallQualityChange: (quality: CallQuality) => void;
    onLocalStream: (stream: MediaStream) => void;
    onRemoteStream: (stream: MediaStream) => void;
    onError: (error: Error) => void;
}

export default class VoIPController {
    private ws: WebSocket | null = null;
    private peer: Peer.Instance | null = null;
    private localStream: MediaStream | null = null;
    private screenStream: MediaStream | null = null;
    private options: VoIPControllerOptions;
    private clientId: string = '';
    private partnerId: string | null = null;
    private statsInterval: NodeJS.Timer | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private iceServers: RTCIceServer[] = [];
    private qualityMonitor: QualityMonitor;
    private heartbeatInterval: NodeJS.Timer | null = null;

    constructor(options: VoIPControllerOptions) {
        this.options = options;
        this.qualityMonitor = new QualityMonitor(this.handleQualityChange.bind(this));
    }

    async initialize(): Promise<void> {
        try {
            // Fetch ICE servers configuration
            await this.fetchICEServers();
            
            // Get user media with optimized constraints
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { min: 640, ideal: 1280, max: 1920 },
                    height: { min: 480, ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000,
                    channelCount: 2
                }
            });

            this.options.onLocalStream(this.localStream);
            
            // Connect to signaling server
            await this.connectToSignalingServer();
            
            this.options.onConnectionStateChange('ready');
        } catch (error) {
            console.error('Initialization error:', error);
            this.options.onError(new Error('Failed to initialize VoIP system'));
            throw error;
        }
    }

    private async fetchICEServers(): Promise<void> {
        try {
            const response = await fetch('/api/ice-servers');
            const data = await response.json();
            this.iceServers = data.iceServers;
        } catch (error) {
            console.warn('Failed to fetch ICE servers, using defaults:', error);
            this.iceServers = [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ];
        }
    }

    private async connectToSignalingServer(): Promise<void> {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('Connected to signaling server');
            this.startHeartbeat();
        };
        
        this.ws.onmessage = this.handleSignalingMessage.bind(this);
        
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.options.onError(new Error('Signaling connection error'));
        };
        
        this.ws.onclose = () => {
            console.log('Disconnected from signaling server');
            this.stopHeartbeat();
            this.handleDisconnection();
        };
    }

    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'heartbeat' }));
            }
        }, 30000);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private handleSignalingMessage(event: MessageEvent): void {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'connected':
                this.clientId = data.payload.clientId;
                break;
                
            case 'waiting':
                this.options.onConnectionStateChange('searching');
                break;
                
            case 'matched':
                this.partnerId = data.payload.partnerId;
                this.createPeerConnection(data.payload.initiator);
                break;
                
            case 'signal':
                if (this.peer) {
                    this.peer.signal(data.payload.signal);
                }
                break;
                
            case 'partner-disconnected':
                this.handlePartnerDisconnection();
                break;
                
            case 'partner-media-toggle':
                this.handlePartnerMediaToggle(data.payload);
                break;
                
            case 'partner-quality':
                this.handlePartnerQuality(data.payload.stats);
                break;
        }
    }

    private createPeerConnection(initiator: boolean): void {
        if (!this.localStream) return;
        
        this.options.onConnectionStateChange('connecting');
        
        this.peer = new Peer({
            initiator,
            stream: this.localStream,
            trickle: true,
            config: {
                iceServers: this.iceServers
            },
            offerOptions: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            }
        });
        
        this.peer.on('signal', (signal) => {
            this.ws?.send(JSON.stringify({
                type: 'signal',
                payload: { to: this.partnerId, signal }
            }));
        });
        
        this.peer.on('stream', (stream) => {
            this.options.onRemoteStream(stream);
            this.options.onConnectionStateChange('connected');
            this.startQualityMonitoring();
        });
        
        this.peer.on('error', (error) => {
            console.error('Peer error:', error);
            this.options.onError(new Error('Connection failed'));
            this.handleDisconnection();
        });
        
        this.peer.on('close', () => {
            this.handlePartnerDisconnection();
        });
        
        // Advanced peer events
        this.peer.on('connect', () => {
            console.log('Peer connection established');
        });
        
        this.peer.on('data', (data) => {
            this.handleDataChannel(data);
        });
    }

    private startQualityMonitoring(): void {
        if (!this.peer) return;
        
        this.statsInterval = setInterval(async () => {
            if (this.peer && this.peer.connected) {
                const stats = await this.getConnectionStats();
                this.qualityMonitor.updateStats(stats);
                
                // Send quality report to partner
                this.ws?.send(JSON.stringify({
                    type: 'quality-report',
                    payload: { stats }
                }));
            }
        }, 2000);
    }

    private async getConnectionStats(): Promise<CallStats> {
        if (!this.peer?._pc) {
            return this.getDefaultStats();
        }
        
        const stats = await this.peer._pc.getStats();
        let audioStats: any = null;
        let videoStats: any = null;
        let candidatePair: any = null;
        
        stats.forEach((report) => {
            if (report.type === 'inbound-rtp' && report.mediaType === 'audio') {
                audioStats = report;
            } else if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                videoStats = report;
            } else if (report.type === 'candidate-pair' && report.nominated) {
                candidatePair = report;
            }
        });
        
        return {
            audio: {
                bitrate: audioStats?.bytesReceived ? this.calculateBitrate(audioStats.bytesReceived, audioStats.timestamp) : 0,
                packetLoss: audioStats?.packetsLost || 0,
                jitter: audioStats?.jitter || 0,
                codec: audioStats?.codecId || 'unknown'
            },
            video: {
                bitrate: videoStats?.bytesReceived ? this.calculateBitrate(videoStats.bytesReceived, videoStats.timestamp) : 0,
                frameRate: videoStats?.framesPerSecond || 0,
                resolution: {
                    width: videoStats?.frameWidth || 0,
                    height: videoStats?.frameHeight || 0
                },
                codec: videoStats?.codecId || 'unknown'
            },
            connection: {
                roundTripTime: candidatePair?.currentRoundTripTime || 0,
                localCandidateType: candidatePair?.localCandidateType || 'unknown',
                remoteCandidateType: candidatePair?.remoteCandidateType || 'unknown',
                protocol: candidatePair?.protocol || 'unknown'
            }
        };
    }
    
    private previousBytes = 0;
    private previousTimestamp = 0;
    
    private calculateBitrate(currentBytes: number, currentTimestamp: number): number {
        if (this.previousTimestamp === 0) {
            this.previousBytes = currentBytes;
            this.previousTimestamp = currentTimestamp;
            return 0;
        }
        
        const bytes = currentBytes - this.previousBytes;
        const time = (currentTimestamp - this.previousTimestamp) / 1000; // Convert to seconds
        const bitrate = (bytes * 8) / time;
        
        this.previousBytes = currentBytes;
        this.previousTimestamp = currentTimestamp;
        
        return Math.round(bitrate);
    }
    
    private getDefaultStats(): CallStats {
        return {
            audio: { bitrate: 0, packetLoss: 0, jitter: 0, codec: 'unknown' },
            video: { bitrate: 0, frameRate: 0, resolution: { width: 0, height: 0 }, codec: 'unknown' },
            connection: { roundTripTime: 0, localCandidateType: 'unknown', remoteCandidateType: 'unknown', protocol: 'unknown' }
        };
    }

    private handleQualityChange(quality: CallQuality): void {
        this.options.onCallQualityChange(quality);
        
        // Adapt bitrate based on quality
        if (this.peer && quality !== 'excellent') {
            this.adaptBitrate(quality);
        }
    }

    private adaptBitrate(quality: CallQuality): void {
        // Implement adaptive bitrate logic
        const bitrateMap = {
            good: { video: 800000, audio: 48000 },
            fair: { video: 500000, audio: 32000 },
            poor: { video: 250000, audio: 16000 },
            unknown: { video: 500000, audio: 32000 }
        };
        
        const settings = bitrateMap[quality as keyof typeof bitrateMap];
        if (settings && this.peer?._pc) {
            // Apply bitrate constraints
            this.applyBitrateConstraints(settings);
        }
    }

    private async applyBitrateConstraints(settings: { video: number; audio: number }): Promise<void> {
        if (!this.peer?._pc) return;
        
        const senders = this.peer._pc.getSenders();
        for (const sender of senders) {
            if (sender.track?.kind === 'video') {
                const params = sender.getParameters();
                if (!params.encodings) params.encodings = [{}];
                params.encodings[0].maxBitrate = settings.video;
                await sender.setParameters(params);
            } else if (sender.track?.kind === 'audio') {
                const params = sender.getParameters();
                if (!params.encodings) params.encodings = [{}];
                params.encodings[0].maxBitrate = settings.audio;
                await sender.setParameters(params);
            }
        }
    }

    private handleDataChannel(data: any): void {
        try {
            const message = JSON.parse(data.toString());
            console.log('Data channel message:', message);
        } catch (error) {
            console.error('Failed to parse data channel message:', error);
        }
    }

    private handlePartnerMediaToggle(payload: any): void {
        console.log('Partner toggled media:', payload);
    }

    private handlePartnerQuality(stats: CallStats): void {
        console.log('Partner quality:', stats);
    }

    private handlePartnerDisconnection(): void {
        this.options.onConnectionStateChange('disconnected');
        this.cleanupPeerConnection();
    }

    private handleDisconnection(): void {
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.partnerId) {
            this.reconnectAttempts++;
            this.options.onConnectionStateChange('reconnecting');
            setTimeout(() => this.reconnect(), 2000 * this.reconnectAttempts);
        } else {
            this.options.onConnectionStateChange('disconnected');
            this.cleanupPeerConnection();
        }
    }

    private async reconnect(): Promise<void> {
        try {
            await this.connectToSignalingServer();
            this.reconnectAttempts = 0;
        } catch (error) {
            this.handleDisconnection();
        }
    }

    private cleanupPeerConnection(): void {
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
            this.statsInterval = null;
        }
        
        if (this.peer) {
            this.peer.destroy();
            this.peer = null;
        }
        
        this.partnerId = null;
        this.qualityMonitor.reset();
    }

    // Public methods
    async connect(): Promise<void> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.options.onConnectionStateChange('searching');
            this.ws.send(JSON.stringify({ type: 'join-queue', payload: {} }));
        }
    }

    disconnect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'leave-queue' }));
        }
        this.cleanupPeerConnection();
        this.options.onConnectionStateChange('ready');
    }

    toggleAudio(): boolean {
        if (this.localStream) {
            const audioTracks = this.localStream.getAudioTracks();
            const newState = !audioTracks[0]?.enabled;
            audioTracks.forEach(track => track.enabled = newState);
            
            // Notify partner
            this.ws?.send(JSON.stringify({
                type: 'toggle-media',
                payload: { type: 'audio', enabled: newState }
            }));
            
            return newState;
        }
        return false;
    }

    toggleVideo(): boolean {
        if (this.localStream) {
            const videoTracks = this.localStream.getVideoTracks();
            const newState = !videoTracks[0]?.enabled;
            videoTracks.forEach(track => track.enabled = newState);
            
            // Notify partner
            this.ws?.send(JSON.stringify({
                type: 'toggle-media',
                payload: { type: 'video', enabled: newState }
            }));
            
            return newState;
        }
        return false;
    }

    async startScreenShare(): Promise<void> {
        try {
            this.screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always',
                    displaySurface: 'window'
                },
                audio: false
            });
            
            if (this.peer && this.localStream) {
                const videoTrack = this.screenStream.getVideoTracks()[0];
                const sender = this.peer._pc?.getSenders().find(
                    s => s.track?.kind === 'video'
                );
                
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
                
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };
            }
        } catch (error) {
            console.error('Screen share error:', error);
            throw error;
        }
    }

    async stopScreenShare(): Promise<void> {
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
            
            if (this.peer && this.localStream) {
                const videoTrack = this.localStream.getVideoTracks()[0];
                const sender = this.peer._pc?.getSenders().find(
                    s => s.track?.kind === 'video'
                );
                
                if (sender && videoTrack) {
                    await sender.replaceTrack(videoTrack);
                }
            }
        }
    }

    destroy(): void {
        this.stopHeartbeat();
        this.cleanupPeerConnection();
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        if (this.screenStream) {
            this.screenStream.getTracks().forEach(track => track.stop());
            this.screenStream = null;
        }
        
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Quality monitoring helper class
class QualityMonitor {
    private history: CallStats[] = [];
    private maxHistory = 10;
    private onQualityChange: (quality: CallQuality) => void;

    constructor(onQualityChange: (quality: CallQuality) => void) {
        this.onQualityChange = onQualityChange;
    }

    updateStats(stats: CallStats): void {
        this.history.push(stats);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        const quality = this.calculateQuality();
        this.onQualityChange(quality);
    }

    private calculateQuality(): CallQuality {
        if (this.history.length === 0) return 'unknown';
        
        const recent = this.history.slice(-3);
        const avgRtt = recent.reduce((sum, s) => sum + s.connection.roundTripTime, 0) / recent.length;
        const avgPacketLoss = recent.reduce((sum, s) => sum + s.audio.packetLoss, 0) / recent.length;
        const avgJitter = recent.reduce((sum, s) => sum + s.audio.jitter, 0) / recent.length;
        
        if (avgRtt < 150 && avgPacketLoss < 1 && avgJitter < 30) {
            return 'excellent';
        } else if (avgRtt < 300 && avgPacketLoss < 3 && avgJitter < 50) {
            return 'good';
        } else if (avgRtt < 500 && avgPacketLoss < 5 && avgJitter < 100) {
            return 'fair';
        } else {
            return 'poor';
        }
    }

    reset(): void {
        this.history = [];
    }
}
