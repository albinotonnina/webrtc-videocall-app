import { useEffect, useRef } from 'react';
import { cn } from '../lib/utils';

interface VideoPlayerProps {
    stream: MediaStream | null;
    label?: string;
    muted?: boolean;
    className?: string;
}

export function VideoPlayer({ stream, label, muted = false, className }: VideoPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={cn("relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl", className)}>
            {stream ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={muted}
                    className="w-full h-full object-cover transform -scale-x-100" // Mirror local video
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Waiting for video...
                </div>
            )}
            {label && (
                <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-md text-white text-sm backdrop-blur-sm">
                    {label}
                </div>
            )}
        </div>
    );
}
