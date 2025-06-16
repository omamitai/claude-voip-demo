import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MicOff } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';

interface ParticipantProps {
    stream: MediaStream;
    isLocal?: boolean;
    isMuted?: boolean;
    isSpeaking: boolean;
    onAudioLevelChange: (level: number) => void;
}

const Participant = ({ stream, isLocal = false, isMuted = false, isSpeaking, onAudioLevelChange }: ParticipantProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const hasVideo = stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled;
    
    return (
        <div className={`relative w-full h-full bg-surface-1 overflow-hidden transition-all duration-300 ${isLocal ? 'rounded-xl' : ''} ${isSpeaking ? 'shadow-glow-primary' : ''}`}>
             <motion.video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`w-full h-full object-cover transition-opacity duration-300 ${hasVideo ? 'opacity-100' : 'opacity-0'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: hasVideo ? 1 : 0 }}
            />
            {!hasVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-1">
                    {/* Placeholder Avatar Here if needed */}
                </div>
            )}
            {isMuted && (
                <div className="absolute top-3 right-3 bg-danger p-2 rounded-full">
                    <MicOff size={16} />
                </div>
            )}
            {!isLocal && (
                <AudioVisualizer stream={stream} onAudioLevelChange={onAudioLevelChange} />
            )}
        </div>
    );
};

export default Participant;
