import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Clock, BarChart2, AlertCircle, X } from 'lucide-react';
import { useStore } from '../store';

interface CallStatsProps {
    onClose: () => void;
}

const CallStats = ({ onClose }: CallStatsProps) => {
    const { callStats } = useStore();
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setDuration(d => d + 1), 1000);
        return () => clearInterval(timer);
    }, []);
    
    const formatDuration = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
    const formatBitrate = (b: number) => b > 1000 ? `${(b/1000).toFixed(1)} kbps` : `${b} bps`;

    const stats = [
        { icon: Clock, label: "Duration", value: formatDuration(duration) },
        { icon: Wifi, label: "RTT", value: `${callStats?.connection.roundTripTime.toFixed(0) ?? 0} ms` },
        { icon: BarChart2, label: "Bitrate", value: formatBitrate((callStats?.audio.bitrate ?? 0) + (callStats?.video.bitrate ?? 0)) },
        { icon: AlertCircle, label: "Packet Loss", value: `${callStats?.audio.packetLoss ?? 0}%` },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-0 right-0 h-full w-80 bg-surface-1/80 backdrop-blur-xl border-l border-border-default p-6 z-50"
        >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Call Statistics</h2>
                <button onClick={onClose} className="p-1 text-text-secondary hover:text-text-primary"><X size={20}/></button>
            </div>
            <div className="space-y-4">
                {stats.map(s => (
                    <div key={s.label} className="flex items-center justify-between p-3 bg-surface-2 rounded-lg">
                        <div className="flex items-center gap-3">
                            <s.icon size={16} className="text-accent" />
                            <span className="text-sm text-text-secondary">{s.label}</span>
                        </div>
                        <span className="font-semibold text-sm">{s.value}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default CallStats;
