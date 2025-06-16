// src/components/ConnectionScreen.tsx - Initial Connection Screen
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Settings, Mic, MicOff, Video, VideoOff, Headphones, Github, Info } from 'lucide-react';
import { useStore } from '../store';

interface ConnectionScreenProps {
    onConnect: () => void;
    localStream: MediaStream | null;
}

const ConnectionScreen = ({ onConnect, localStream }: ConnectionScreenProps) => {
    const { mediaState, toggleAudio, toggleVideo, updateSettings } = useStore();
    const [showSettings, setShowSettings] = useState(false);
    const [previewVideo, setPreviewVideo] = useState<HTMLVideoElement | null>(null);

    // Set video source when ref is available
    const setVideoRef = (ref: HTMLVideoElement | null) => {
        if (ref && localStream) {
            ref.srcObject = localStream;
            setPreviewVideo(ref);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full"
            >
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4"
                    >
                        <Phone className="w-10 h-10 text-white" />
                    </motion.div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Starlight VoIP Pro
                    </h1>
                    <p className="text-gray-400 mt-2">Crystal clear voice calls, powered by WebRTC</p>
                </div>

                {/* Main Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="card"
                >
                    {/* Video Preview */}
                    <div className="aspect-video relative bg-gray-900 rounded-xl overflow-hidden mb-6">
                        {localStream && mediaState.isVideoEnabled ? (
                            <video
                                ref={setVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <VideoOff className="w-16 h-16 mx-auto mb-2 text-gray-600" />
                                    <p className="text-gray-500">Camera is off</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Preview Label */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full">
                            <span className="text-sm">Preview</span>
                        </div>
                    </div>

                    {/* Media Controls */}
                    <div className="flex justify-center space-x-4 mb-8">
                        <button
                            onClick={toggleAudio}
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

                        <button
                            onClick={toggleVideo}
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

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 transition-all"
                        >
                            <Settings className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Settings Panel */}
                    {showSettings && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 bg-gray-800/50 rounded-xl p-6 space-y-4"
                        >
                            <h3 className="text-lg font-semibold mb-4">Audio Settings</h3>
                            
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 rounded"
                                    defaultChecked
                                    onChange={(e) => updateSettings({ echoCancellation: e.target.checked })}
                                />
                                <span>Echo Cancellation</span>
                            </label>
                            
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 rounded"
                                    defaultChecked
                                    onChange={(e) => updateSettings({ noiseSuppression: e.target.checked })}
                                />
                                <span>Noise Suppression</span>
                            </label>
                            
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-indigo-600 rounded"
                                    defaultChecked
                                    onChange={(e) => updateSettings({ autoGainControl: e.target.checked })}
                                />
                                <span>Auto Gain Control</span>
                            </label>
                        </motion.div>
                    )}

                    {/* Connect Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onConnect}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center space-x-3"
                    >
                        <Phone className="w-5 h-5" />
                        <span>Start Call</span>
                    </motion.button>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="grid grid-cols-3 gap-4 mt-8"
                >
                    {[
                        { icon: Headphones, label: 'HD Audio', description: 'Crystal clear voice' },
                        { icon: Video, label: 'HD Video', description: 'Up to 1080p quality' },
                        { icon: Phone, label: 'Low Latency', description: 'Real-time communication' }
                    ].map((feature, index) => (
                        <motion.div
                            key={feature.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="text-center"
                        >
                            <feature.icon className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                            <h3 className="font-semibold">{feature.label}</h3>
                            <p className="text-sm text-gray-400">{feature.description}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center mt-8 text-gray-500 text-sm"
                >
                    <p>Encrypted peer-to-peer communication</p>
                    <div className="flex items-center justify-center space-x-4 mt-2">
                        <a href="#" className="hover:text-gray-300 transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        <a href="#" className="hover:text-gray-300 transition-colors">
                            <Info className="w-5 h-5" />
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default ConnectionScreen;
