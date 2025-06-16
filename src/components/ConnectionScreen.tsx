import { useStore } from '../store';
import { motion } from 'framer-motion';
import { Phone, Video, Mic, MicOff, VideoOff } from 'lucide-react';

interface ConnectionScreenProps {
    onConnect: () => void;
    isConnecting: boolean;
    status: string;
}

const ConnectionScreen = ({ onConnect, isConnecting, status }: ConnectionScreenProps) => {
    const { localStream, mediaState, toggleAudio, toggleVideo } = useStore();

    const getStatusText = () => {
        if (isConnecting) return "Connecting...";
        switch (status) {
            case 'initializing': return "Initializing...";
            case 'ready': return "Ready to connect";
            case 'error': return "Connection Error";
            default: return "Join a call";
        }
    };
    
    return (
        <motion.div
            className="w-full h-screen flex items-center justify-center p-8 bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Left Column: Video Preview */}
                <motion.div
                    className="relative aspect-video bg-surface-1 rounded-2xl overflow-hidden shadow-lg"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    {localStream && mediaState.isVideoEnabled ? (
                        <video srcObject={localStream} autoPlay muted playsInline className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center flex-col text-text-secondary">
                            <VideoOff size={48} />
                            <p className="mt-2">Camera is off</p>
                        </div>
                    )}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                        <button onClick={toggleAudio} className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors">
                            {mediaState.isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} className="text-danger"/>}
                        </button>
                        <button onClick={toggleVideo} className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors">
                            {mediaState.isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} className="text-danger"/>}
                        </button>
                    </div>
                </motion.div>

                {/* Right Column: Connection Actions */}
                <motion.div
                    className="flex flex-col items-start"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                        <Phone size={24} />
                    </div>
                    <h1 className="text-4xl font-bold text-text-primary mb-2">Ready to join?</h1>
                    <p className="text-text-secondary mb-8">Connect with peers in crystal-clear HD video.</p>
                    
                    <button
                        onClick={onConnect}
                        disabled={isConnecting || status === 'initializing'}
                        className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConnecting ? (
                            <div className="spinner w-5 h-5 border-white border-t-transparent"></div>
                        ) : (
                            <Phone size={20} />
                        )}
                        <span>{getStatusText()}</span>
                    </button>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ConnectionScreen;
