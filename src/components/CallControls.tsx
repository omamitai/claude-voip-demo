import { motion } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface CallControlsProps {
    onToggleAudio: (() => boolean) | undefined;
    onToggleVideo: (() => boolean) | undefined;
    onDisconnect: () => void;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
}

const CallControls = ({ onToggleAudio, onToggleVideo, onDisconnect, isAudioEnabled, isVideoEnabled }: CallControlsProps) => {
    const iconSize = 24;

    const controls = [
        {
            label: 'Toggle Mic',
            action: onToggleAudio,
            isEnabled: isAudioEnabled,
            enabledIcon: <Mic size={iconSize} />,
            disabledIcon: <MicOff size={iconSize} />,
        },
        {
            label: 'Toggle Video',
            action: onToggleVideo,
            isEnabled: isVideoEnabled,
            enabledIcon: <Video size={iconSize} />,
            disabledIcon: <VideoOff size={iconSize} />,
        },
    ];

    return (
        <div className="flex items-center gap-4 p-3 bg-surface-2/70 backdrop-blur-md rounded-full border border-border-default shadow-lg">
            {controls.map(control => (
                <button
                    key={control.label}
                    onClick={control.action}
                    className={`p-3 rounded-full transition-colors ${
                        control.isEnabled ? 'bg-surface-1 hover:bg-primary-hover' : 'bg-danger/80 hover:bg-danger'
                    }`}
                >
                    {control.isEnabled ? control.enabledIcon : control.disabledIcon}
                </button>
            ))}
             <button
                onClick={onDisconnect}
                className="p-3 rounded-full bg-danger hover:bg-red-500 transition-colors"
            >
                <PhoneOff size={iconSize} />
            </button>
        </div>
    );
};

export default CallControls;
