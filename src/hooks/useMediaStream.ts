import { useState, useEffect, useCallback } from 'react';

export function useMediaStream() {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let mounted = true;

        async function enableStream() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                if (mounted) {
                    setStream(stream);
                }
            } catch (err) {
                if (mounted) {
                    console.error('Failed to get user media', err);
                    setError(err instanceof Error ? err : new Error('Failed to get user media'));
                }
            }
        }

        enableStream();

        return () => {
            mounted = false;
            // Cleanup stream on unmount
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const [videoEnabled, setVideoEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);

    const toggleAudio = useCallback(() => {
        if (stream) {
            setAudioEnabled(prev => {
                const newState = !prev;
                stream.getAudioTracks().forEach(track => {
                    track.enabled = newState;
                });
                return newState;
            });
        }
    }, [stream]);

    const toggleVideo = useCallback(() => {
        if (stream) {
            setVideoEnabled(prev => {
                const newState = !prev;
                stream.getVideoTracks().forEach(track => {
                    track.enabled = newState;
                });
                return newState;
            });
        }
    }, [stream]);

    return { stream, error, toggleAudio, toggleVideo, videoEnabled, audioEnabled };
}
