import { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    stream: MediaStream;
    onAudioLevelChange: (level: number) => void;
}

const AudioVisualizer = ({ stream, onAudioLevelChange }: AudioVisualizerProps) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!stream || stream.getAudioTracks().length === 0) return;

        audioContextRef.current = new AudioContext();
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;

        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const monitor = () => {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((s, v) => s + v, 0) / dataArray.length;
            const normalized = average / 128; // Normalize to 0-1 range
            onAudioLevelChange(normalized);
            animationFrameRef.current = requestAnimationFrame(monitor);
        };
        monitor();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            source.disconnect();
            audioContextRef.current?.close();
        };
    }, [stream, onAudioLevelChange]);

    return null; // This component is now for logic only
};

export default AudioVisualizer;
