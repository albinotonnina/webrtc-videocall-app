import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface ControlsProps {
    toggleAudio: () => void;
    toggleVideo: () => void;
    audioEnabled: boolean;
    videoEnabled: boolean;
}

export function Controls({ toggleAudio, toggleVideo, audioEnabled, videoEnabled }: ControlsProps) {
    return (
        <div className="flex gap-4 p-4 bg-gray-800 rounded-full shadow-lg border border-gray-700">
            <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-all duration-200 ${audioEnabled
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
            >
                {audioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
            </button>

            <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-all duration-200 ${videoEnabled
                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
            >
                {videoEnabled ? <Video size={24} /> : <VideoOff size={24} />}
            </button>
        </div>
    );
}
