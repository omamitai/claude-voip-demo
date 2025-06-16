// src/components/CallStats.tsx - Real-time Call Statistics Display
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Clock, Cpu, HardDrive } from 'lucide-react';
import { useStore } from '../store';

const CallStats = () => {
    const { callStats, networkState, callStartTime, connectionState } = useStore();
    const [callDuration, setCallDuration] = useState('00:00');

    // Update call duration
    useEffect(() => {
        if (!callStartTime || connectionState !== 'connected') return;

        const updateDuration = () => {
            const duration = Math.floor((Date.now() - callStartTime) / 1000);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            setCallDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        updateDuration();
        const interval = setInterval(updateDuration, 1000);

        return () => clearInterval(interval);
    }, [callStartTime, connectionState]);

    const formatBitrate = (bitrate: number): string => {
        if (bitrate > 1000000) {
            return `${(bitrate / 1000000).toFixed(2)} Mbps`;
        } else if (bitrate > 1000) {
            return `${(bitrate / 1000).toFixed(0)} kbps`;
        }
        return `${bitrate} bps`;
    };

    const formatLatency = (ms: number): string => {
        return `${Math.round(ms)} ms`;
    };

    if (!callStats) {
        return (
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6">
                <p className="text-center text-gray-400">No statistics available</p>
            </div>
        );
    }

    const statCards = [
        {
            icon: Clock,
            label: 'Duration',
            value: callDuration,
            color: 'text-blue-400'
        },
        {
            icon: Wifi,
            label: 'RTT',
            value: formatLatency(callStats.connection.roundTripTime),
            color: 'text-green-400',
            status: callStats.connection.roundTripTime < 150 ? 'good' : 
                    callStats.connection.roundTripTime < 300 ? 'fair' : 'poor'
        },
        {
            icon: Activity,
            label: 'Audio Bitrate',
            value: formatBitrate(callStats.audio.bitrate),
            color: 'text-purple-400'
        },
        {
            icon: Cpu,
            label: 'Video Bitrate',
            value: formatBitrate(callStats.video.bitrate),
            color: 'text-indigo-400'
        },
        {
            icon: HardDrive,
            label: 'Packet Loss',
            value: `${callStats.audio.packetLoss}%`,
            color: 'text-yellow-400',
            status: callStats.audio.packetLoss < 1 ? 'good' : 
                    callStats.audio.packetLoss < 3 ? 'fair' : 'poor'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 shadow-2xl"
        >
            <h3 className="text-xl font-semibold mb-6 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-indigo-400" />
                Call Statistics
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-700/50 rounded-xl p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            {stat.status && (
                                <div className={`w-2 h-2 rounded-full ${
                                    stat.status === 'good' ? 'bg-green-400' :
                                    stat.status === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                                }`} />
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-lg font-semibold">{stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Advanced Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Audio Details</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Codec</span>
                            <span className="font-mono">{callStats.audio.codec}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Jitter</span>
                            <span className="font-mono">{callStats.audio.jitter.toFixed(2)} ms</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-700/30 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-3">Video Details</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Resolution</span>
                            <span className="font-mono">
                                {callStats.video.resolution.width}x{callStats.video.resolution.height}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">FPS</span>
                            <span className="font-mono">{callStats.video.frameRate}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Info */}
            <div className="mt-4 bg-gray-700/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Connection</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-400">Protocol</span>
                        <span className="font-mono uppercase">{callStats.connection.protocol}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-400">Type</span>
                        <span className="font-mono">{callStats.connection.localCandidateType}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default CallStats;
