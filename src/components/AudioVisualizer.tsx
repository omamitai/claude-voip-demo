// src/components/AudioVisualizer.tsx - Real-time Audio Level Visualization
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface AudioVisualizerProps {
    stream: MediaStream;
    color?: string;
    size?: 'small' | 'medium' | 'large';
}

const AudioVisualizer = ({ stream, color = '#60a5fa', size = 'medium' }: AudioVisualizerProps) => {
    const [audioLevel, setAudioLevel] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!stream) return;

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) return;

        // Create audio context and analyser
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.smoothingTimeConstant = 0.8;

        // Connect stream to analyser
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);

        // Start monitoring
        const monitorAudioLevel = () => {
            if (!analyserRef.current) return;

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Calculate average level
            const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
            const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1
            
            setAudioLevel(normalizedLevel);
            setIsActive(normalizedLevel > 0.1);

            animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
        };

        monitorAudioLevel();

        // Cleanup
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [stream]);

    const sizeClasses = {
        small: 'w-16 h-16',
        medium: 'w-20 h-20',
        large: 'w-24 h-24'
    };

    const barCount = size === 'small' ? 3 : size === 'medium' ? 4 : 5;

    return (
        <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
            {/* Background circle */}
            <div className="absolute inset-0 bg-gray-800/50 rounded-full" />
            
            {/* Audio bars */}
            <div className="flex items-center justify-center space-x-1">
                {Array.from({ length: barCount }).map((_, index) => {
                    const height = isActive 
                        ? Math.max(0.3, audioLevel * (1 - index * 0.15)) 
                        : 0.2;
                    
                    return (
                        <motion.div
                            key={index}
                            className="w-1 bg-current rounded-full"
                            style={{ color }}
                            animate={{
                                height: `${height * 100}%`,
                                opacity: isActive ? 1 : 0.5
                            }}
                            transition={{
                                height: {
                                    duration: 0.1,
                                    ease: 'easeOut'
                                }
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default AudioVisualizer;
