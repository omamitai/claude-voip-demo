import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useStore } from './store';

import VoIPController from './lib/VoIPController';
import ConnectionScreen from './components/ConnectionScreen';
import Participant from './components/Participant';
import CallControls from './components/CallControls';
import CallStats from './components/CallStats';
import { Activity } from 'lucide-react';

const App = () => {
    const {
        connectionState,
        localStream,
        remoteStream,
        setConnectionState,
        setCallQuality,
        setLocalStream,
        setRemoteStream,
        mediaState,
        toggleAudio,
        toggleVideo,
    } = useStore();

    const [isConnecting, setIsConnecting] = useState(false);
    const [localAudioLevel, setLocalAudioLevel] = useState(0);
    const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
    const [showStats, setShowStats] = useState(false);
    
    const controls = useAnimation();
    const voipController = useRef<VoIPController | null>(null);

    // Show/hide floating controls on mouse move
    const handleMouseMove = () => {
        controls.start({
            opacity: 1,
            y: 0,
            transition: { duration: 0.2 }
        });
        setTimeout(() => controls.start({ opacity: 0, y: 20 }), 3000);
    };

    useEffect(() => {
        const initialize = async () => {
            try {
                setConnectionState('initializing');
                voipController.current = new VoIPController({
                    onConnectionStateChange: (state) => {
                        setConnectionState(state);
                        if (state === 'connected' || state === 'disconnected' || state === 'error') {
                            setIsConnecting(false);
                        }
                    },
                    onLocalStream: setLocalStream,
                    onRemoteStream: setRemoteStream,
                    onCallQualityChange: setCallQuality,
                    onError: (error) => toast.error(error.message || 'An unknown error occurred.'),
                });
                await voipController.current.initialize();
                setConnectionState('ready');
            } catch (error) {
                toast.error("Failed to initialize. Please check camera/mic permissions.");
                setConnectionState('error');
            }
        };
        initialize();
        return () => voipController.current?.destroy();
    }, [setConnectionState, setCallQuality, setLocalStream, setRemoteStream]);

    const handleConnect = useCallback(() => {
        if (!voipController.current) return;
        setIsConnecting(true);
        voipController.current.connect();
    }, []);

    const handleDisconnect = useCallback(() => {
        if (!voipController.current) return;
        voipController.current.disconnect();
        setShowStats(false);
    }, []);

    const isSpeaker = (level: number, otherLevel: number) => level > 0.05 && level > otherLevel;
    const isLocalSpeaker = isSpeaker(localAudioLevel, remoteAudioLevel);
    const isRemoteSpeaker = isSpeaker(remoteAudioLevel, localAudioLevel);

    const isInCall = connectionState === 'connected';

    if (!isInCall) {
        return (
            <AnimatePresence mode="wait">
                <ConnectionScreen
                    key="connection-screen"
                    onConnect={handleConnect}
                    isConnecting={isConnecting}
                    status={connectionState}
                />
            </AnimatePresence>
        );
    }
    
    return (
        <div className="w-full h-screen overflow-hidden bg-black" onMouseMove={handleMouseMove}>
            <Toaster position="top-center" toastOptions={{
                style: { background: '#222', color: '#fff' }
            }}/>

            {/* Remote Participant (Main View) */}
            <AnimatePresence>
                {remoteStream && (
                     <Participant
                        key="remote"
                        stream={remoteStream}
                        onAudioLevelChange={setRemoteAudioLevel}
                        isSpeaking={isRemoteSpeaker}
                    />
                )}
            </AnimatePresence>
             {!remoteStream && (
                <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                   <div className="spinner w-8 h-8 mb-4"></div>
                   <p>Connecting to partner...</p>
                </div>
            )}
            
            {/* Local Participant (Draggable PiP) */}
            <motion.div
                drag
                dragConstraints={{ left: 16, right: window.innerWidth - 256, top: 16, bottom: window.innerHeight - 160 }}
                dragMomentum={false}
                className="absolute top-4 right-4 w-56 h-auto cursor-grab active:cursor-grabbing"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {localStream && (
                    <Participant
                        stream={localStream}
                        isLocal
                        isMuted={!mediaState.isAudioEnabled}
                        onAudioLevelChange={setLocalAudioLevel}
                        isSpeaking={isLocalSpeaker}
                    />
                )}
            </motion.div>

            {/* Stats Panel */}
            <AnimatePresence>
                {showStats && <CallStats onClose={() => setShowStats(false)} />}
            </AnimatePresence>

            {/* Floating Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                <motion.div animate={controls} initial={{ opacity: 0, y: 20 }}>
                    <CallControls
                        onToggleAudio={voipController.current?.toggleAudio}
                        onToggleVideo={voipController.current?.toggleVideo}
                        onDisconnect={handleDisconnect}
                        isAudioEnabled={mediaState.isAudioEnabled}
                        isVideoEnabled={mediaState.isVideoEnabled}
                    />
                </motion.div>
            </div>

            {/* Top right buttons */}
            <div className="absolute top-4 right-[240px] z-50">
                <button onClick={() => setShowStats(!showStats)} className="p-2 rounded-full bg-surface-2/50 backdrop-blur-sm hover:bg-surface-2">
                    <Activity size={20} />
                </button>
            </div>
        </div>
    );
};

export default App;
