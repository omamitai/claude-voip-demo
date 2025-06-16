// src/components/Participant.tsx - Enhanced Video Participant Component
import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, User, Monitor } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

interface ParticipantProps {
    stream: MediaStream;
    isLocal?: boolean;
    name?: string;
    audioEnabled?: boolean;
    videoEnabled?: boolean;
    isScreenShare?: boolean;
}

const Participant = ({ 
    stream, 
    isLocal = false, 
    name = 'Participant',
    audioEnabled = true,
    videoEnabled = true,
    isScreenShare = false
}: ParticipantProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasVideo, setHasVideo] = useState(false);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            
            // Check if stream has video tracks
            const videoTracks = stream.getVideoTracks();
            setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
            
            // Get video dimensions once loaded
            videoRef.current.onloadedmetadata = () => {
                if (videoRef.current) {
                    setDimensions({
                        width: videoRef.current.videoWidth,
                        height: videoRef.current.videoHeight
                    });
                }
            };
        }
    }, [stream]);

    // Update video state when tracks change
    useEffect(() => {
        if (!stream) return;

        const handleTrackChange = () => {
            const videoTracks = stream.getVideoTracks();
            setHasVideo(videoTracks.length > 0 && videoTracks[0].enabled);
        };

        stream.addEventListener('addtrack', handleTrackChange);
        stream.addEventListener('removetrack', handleTrackChange);

        return () => {
            stream.removeEventListener('addtrack', handleTrackChange);
            stream.removeEventListener('removetrack', handleTrackChange);
        };
    }, [stream]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-gray-800/50 backdrop-blur rounded-2xl overflow-hidden shadow-2xl group"
        >
            <div className="aspect-video relative">
                {/* Video Element */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                        hasVideo && videoEnabled ? 'opacity-100' : 'opacity-0'
                    }`}
                />

                {/* No Video Placeholder */}
                {(!hasVideo || !videoEnabled) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="relative"
                        >
                            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center">
                                {isScreenShare ? (
                                    <Monitor className="w-12 h-12 text-gray-400" />
                                ) : (
                                    <User className="w-12 h-12 text-gray-400" />
                                )}
                            </div>
                            {!videoEnabled && (
                                <div className="absolute -bottom-2 -right-2 bg-red-500 rounded-full p-1">
                                    <VideoOff className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Name Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-2"
                >
                    <span className="text-sm font-medium">
                        {isLocal ? 'You' : name}
                    </span>
                    {isScreenShare && (
                        <Monitor className="w-3 h-3 text-indigo-400" />
                    )}
                </motion.div>

                {/* Media Indicators */}
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                    {!audioEnabled && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-red-500/80 backdrop-blur p-2 rounded-full"
                        >
                            <MicOff className="w-4 h-4 text-white" />
                        </motion.div>
                    )}
                </div>

                {/* Audio Visualizer */}
                {audioEnabled && (
                    <div className="absolute bottom-4 right-4">
                        <AudioVisualizer 
                            stream={stream} 
                            size="small"
                            color={isLocal ? '#60a5fa' : '#a78bfa'}
                        />
                    </div>
                )}

                {/* Video Stats Overlay (shown on hover) */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg text-xs space-y-1">
                        {dimensions.width > 0 && (
                            <div className="text-gray-300">
                                {dimensions.width}x{dimensions.height}
                            </div>
                        )}
                    </div>
                </div>

                {/* Connection Quality Indicator */}
                <div className="absolute top-4 right-4">
                    <div className="flex space-x-0.5">
                        {[1, 2, 3].map((bar) => (
                            <motion.div
                                key={bar}
                                className="w-1 bg-green-400 rounded-full"
                                style={{ height: `${bar * 4 + 4}px` }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: bar * 0.1 }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default Participant;
