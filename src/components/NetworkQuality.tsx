// src/components/NetworkQuality.tsx - Network Quality Indicator
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { CallQuality } from '../types';

interface NetworkQualityProps {
    quality: CallQuality;
}

const NetworkQuality = ({ quality }: NetworkQualityProps) => {
    const qualityConfig = {
        excellent: {
            bars: 4,
            color: 'text-green-400',
            bgColor: 'bg-green-400',
            label: 'Excellent',
            icon: Wifi
        },
        good: {
            bars: 3,
            color: 'text-green-400',
            bgColor: 'bg-green-400',
            label: 'Good',
            icon: Wifi
        },
        fair: {
            bars: 2,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-400',
            label: 'Fair',
            icon: Wifi
        },
        poor: {
            bars: 1,
            color: 'text-red-400',
            bgColor: 'bg-red-400',
            label: 'Poor',
            icon: Wifi
        },
        unknown: {
            bars: 0,
            color: 'text-gray-400',
            bgColor: 'bg-gray-400',
            label: 'Unknown',
            icon: WifiOff
        }
    };

    const config = qualityConfig[quality];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur rounded-lg px-3 py-2"
        >
            <Icon className={`w-4 h-4 ${config.color}`} />
            
            {/* Signal bars */}
            <div className="flex items-end space-x-1">
                {[1, 2, 3, 4].map((bar) => (
                    <motion.div
                        key={bar}
                        className={`w-1 rounded-full transition-all duration-300 ${
                            bar <= config.bars ? config.bgColor : 'bg-gray-600'
                        }`}
                        style={{ height: `${bar * 4 + 4}px` }}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ 
                            opacity: bar <= config.bars ? 1 : 0.3,
                            y: 0
                        }}
                        transition={{ delay: bar * 0.05 }}
                    />
                ))}
            </div>
            
            <span className={`text-xs font-medium ${config.color}`}>
                {config.label}
            </span>
        </motion.div>
    );
};

export default NetworkQuality;
