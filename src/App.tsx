// src/App.tsx - Next-Level VoIP Demo Application
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Settings, Activity, Volume2 } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { useStore } from './store';
import ConnectionScreen from './components/ConnectionScreen';
import AudioVisualizer from './components/AudioVisualizer';
import CallStats from './components/CallStats';
import NetworkQuality from './components/NetworkQuality';
import Participant from './components/Participant';
import VoIPController from './lib/VoIPController';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
    const { 
        localStream, 
        remoteStream, 
        connectionState, 
        callQuality,
        mediaState,
        setConnectionState,
        setCallQuality,
        toggleAudio,
        toggleVideo,
        setLocalStream,
        setRemoteStream
    } = useStore();

    const [showStats, setShowStats] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [volume, setVolume] = useState(100);
    const [showConnectionScreen, setShowConnectionScreen] = useState(true);
    const voipController = useRef<VoIPController | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);

    // Initialize VoIP Controller
    useEffect(() => {
        const initializeVoIP = async () => {
            try {
                setConnectionState('initializing');
                
                // Create VoIP controller instance
                voipController.current = new VoIPController({
                    onConnectionStateChange: (state) => {
                        setConnectionState(state);
                        if (state === 'connected') {
                            setShowConnectionScreen(false);
                        } else if (state === 'disconnected' || state === 'error') {
                            setShowConnectionScreen(true);
                        }
                    },
                    onCallQualityChange: setCallQuality,
                    onLocalStream: setLocalStream,
                    onRemoteStream: setRemoteStream,
                    onError: (error) => {
                        console.error('VoIP Error:', error);
                        toast.error(error.message || 'Connection error occurred');
                        setConnectionState('error');
                    }
                });

                // Initialize connection
                await voipController.current.initialize();
                toast.success('Ready to connect!');
                
            } catch (error) {
                console.error('Failed to initialize VoIP:', error);
                toast.error('Failed to initialize. Please check permissions.');
                setConnectionState('error');
            }
        };

        initializeVoIP();

        // Cleanup
        return () => {
            if (voipController.current) {
                voipController.current.destroy();
            }
        };
    }, [setConnectionState, setCallQuality, setLocalStream, setRemoteStream]);

    // Set remote audio volume
    useEffect(() => {
        if (remoteAudioRef.current && remoteStream) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.volume = volume / 100;
        }
    }, [remoteStream, volume]);

    // Handle connection
    const handleConnect = useCallback(() => {
        if (voipController.current) {
            setShowConnectionScreen(false);
            voipController.current.connect();
        }
    }, []);

    // Handle disconnection
    const handleDisconnect = useCallback(() => {
        if (voipController.current) {
            voipController.current.disconnect();
            setShowConnectionScreen(true);
        }
    }, []);

    // Handle audio toggle
    const handleToggleAudio = useCallback(() => {
        if (voipController.current) {
            const newState = voipController.current.toggleAudio();
            toggleAudio();
            toast(newState ? 'Microphone enabled' : 'Microphone muted');
        }
    }, [toggleAudio]);

    // Handle video toggle
    const handleToggleVideo = useCallback(() => {
        if (voipController.current) {
            const newState = voipController.current.toggleVideo();
            toggleVideo();
            toast(newState ? 'Camera enabled' : 'Camera disabled');
        }
    }, [toggleVideo]);

    // Handle screen sharing
    const handleScreenShare = useCallback(async () => {
        if (!voipController.current || connectionState !== 'connected') return;

        try {
            if (isScreenSharing) {
                await voipController.current.stopScreenShare();
                setIsScreenSharing(false);
                toast('Screen sharing stopped');
            } else {
                await voipController.current.startScreenShare();
                setIsScreenSharing(true);
                toast.success('Screen sharing started');
            }
        } catch (error) {
            console.error('Screen share error:', error);
            toast.error('Failed to toggle screen sharing');
        }
    }, [isScreenSharing, connectionState]);

    // Handle volume change
    const handleVolumeChange = useCallback((newVolume: number) => {
        setVolume(newVolume);
        if (remoteAudioRef.current) {
            remoteAudioRef.current.volume = newVolume / 100;
        }
    }, []);

    // Show connection screen if needed
    if (showConnectionScreen && connectionState !== 'connected') {
        return (
            <ErrorBoundary>
                <ConnectionScreen 
                    onConnect={handleConnect} 
                    localStream={localStream}
                />
            </ErrorBoundary>
        );
    }

    // Get status message
    const getStatusMessage = () => {
        switch (connectionState) {
            case 'searching':
                return 'Finding a partner...';
            case 'connecting':
                return 'Establishing secure connection...';
            case 'connected':
                return 'Connected';
            case 'reconnecting':
                return 'Reconnecting...';
            case 'disconnected':
                return 'Call ended';
            default:
                return '';
        }
    };

    // Get connection color
    const getConnectionColor = () => {
        switch (connectionState) {
            case 'connected':
                return 'text-green-400';
            case 'connecting':
            case 'searching':
                return 'text-yellow-400';
            case 'error':
            case 'disconnected':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
                <Toaster 
                    position="top-right"
                    toastOptions={{
                        className: 'toast-enter',
                        style: {
                            background: '#1f2937',
                            color: '#fff',
                            border: '1px solid #374151'
                        }
                    }}
                />
                
                {/* Hidden audio element for remote stream */}
                <audio ref={remoteAudioRef} autoPlay />
                
                {/* Header */}
                <header className="bg-black/20 backdrop-blur-lg border-b border-gray-700/50">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <motion.div
                                    initial={{ rotate: 0 }}
                                    animate={{ rotate: connectionState === 'connected' ? 360 : 0 }}
                                    transition={{ duration: 2, repeat: connectionState === 'connected' ? Infinity : 0, ease: "linear" }}
                                    className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center"
                                >
                                    <Phone className="w-6 h-6" />
                                </motion.div>
                                <div>
                                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                        Starlight VoIP Pro
                                    </h1>
                                    <p className={`text-sm ${getConnectionColor()}`}>
                                        {getStatusMessage()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                <NetworkQuality quality={callQuality} />
                                <button
                                    onClick={() => setShowStats(!showStats)}
                                    className="p-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                                    title="Toggle statistics"
                                >
                                    <Activity className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
                        {/* Local Video */}
                        {localStream && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="relative"
                            >
                                <Participant
                                    stream={localStream}
                                    isLocal={true}
                                    audioEnabled={mediaState.isAudioEnabled}
                                    videoEnabled={mediaState.isVideoEnabled}
                                />
                            </motion.div>
                        )}

                        {/* Remote Video / Waiting State */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="relative"
                        >
                            {remoteStream ? (
                                <Participant
                                    stream={remoteStream}
                                    isLocal={false}
                                    name="Partner"
                                />
                            ) : (
                                <div className="aspect-video bg-gray-800/50 backdrop-blur rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center">
                                    {connectionState === 'searching' ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center"
                                        >
                                            <div className="loading-dots text-4xl text-indigo-400 mb-4">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                            <p className="text-gray-400">Waiting for partner...</p>
                                        </motion.div>
                                    ) : connectionState === 'connecting' ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-center"
                                        >
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"
                                            />
                                            <p className="text-gray-400">Connecting...</p>
                                        </motion.div>
                                    ) : null}
                                </div>
                            )}
                        </motion.div>
                    </div>

                    {/* Controls */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 flex justify-center"
                    >
                        <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-4 shadow-2xl">
                            <div className="flex items-center space-x-4">
                                {/* Audio Toggle */}
                                <button
                                    onClick={handleToggleAudio}
                                    className={`p-4 rounded-full transition-all ${
                                        mediaState.isAudioEnabled 
                                            ? 'bg-gray-700 hover:bg-gray-600' 
                                            : 'bg-red-500/20 hover:bg-red-500/30'
                                    }`}
                                >
                                    {mediaState.isAudioEnabled ? (
                                        <Mic className="w-6 h-6" />
                                    ) : (
                                        <MicOff className="w-6 h-6 text-red-400" />
                                    )}
                                </button>

                                {/* Video Toggle */}
                                <button
                                    onClick={handleToggleVideo}
                                    className={`p-4 rounded-full transition-all ${
                                        mediaState.isVideoEnabled 
                                            ? 'bg-gray-700 hover:bg-gray-600' 
                                            : 'bg-red-500/20 hover:bg-red-500/30'
                                    }`}
                                >
                                    {mediaState.isVideoEnabled ? (
                                        <Video className="w-6 h-6" />
                                    ) : (
                                        <VideoOff className="w-6 h-6 text-red-400" />
                                    )}
                                </button>

                                {/* End Call */}
                                <button
                                    onClick={handleDisconnect}
                                    className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-all"
                                >
                                    <PhoneOff className="w-6 h-6" />
                                </button>

                                {/* Screen Share */}
                                <button
                                    onClick={handleScreenShare}
                                    className={`p-4 rounded-full transition-all ${
                                        isScreenSharing 
                                            ? 'bg-indigo-500 hover:bg-indigo-600' 
                                            : 'bg-gray-700 hover:bg-gray-600'
                                    }`}
                                    disabled={connectionState !== 'connected'}
                                >
                                    <Monitor className="w-6 h-6" />
                                </button>

                                {/* Volume Control */}
                                <div className="flex items-center space-x-2 px-4">
                                    <Volume2 className="w-5 h-5 text-gray-400" />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={volume}
                                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                        className="w-24 accent-indigo-500"
                                        disabled={!remoteStream}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Panel */}
                    <AnimatePresence>
                        {showStats && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="mt-8"
                            >
                                <CallStats />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>

                {/* Footer */}
                <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-gray-500 text-sm">
                    <p>Powered by WebRTC • Encrypted peer-to-peer communication</p>
                </footer>
            </div>
        </ErrorBoundary>
    );
};

export default App;
