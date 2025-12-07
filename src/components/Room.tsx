import { useState } from 'react';
import { useMediaStream } from '../hooks/useMediaStream';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoPlayer } from './VideoPlayer';
import { Controls } from './Controls';
import { Chat } from './Chat';
import { ProtocolVisualizer } from './ProtocolVisualizer';
import { LogOut, MessageSquare } from 'lucide-react';

interface RoomProps {
    roomId: string;
    onLeave: () => void;
}

export function Room({ roomId, onLeave }: RoomProps) {
    const { stream, error, toggleAudio, toggleVideo, audioEnabled, videoEnabled } = useMediaStream();
    const { remoteStream, connectionState, messages, sendMessage, logs } = useWebRTC(roomId, stream);
    const [isChatOpen, setIsChatOpen] = useState(false);

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="bg-red-900/50 p-6 rounded-lg border border-red-500 text-red-200">
                    <h3 className="font-bold text-lg mb-2">Camera Error</h3>
                    <p>{error.message}</p>
                    <p className="text-sm mt-2 opacity-75">Please ensure you have granted camera/microphone permissions.</p>
                    <button onClick={onLeave} className="mt-4 bg-red-800 hover:bg-red-700 px-4 py-2 rounded">
                        Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 space-y-4">
            <div className="flex justify-between items-center bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${connectionState === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                    <span className="text-gray-400 text-sm font-mono">Room: {roomId} ({connectionState})</span>
                </div>
                <button
                    onClick={onLeave}
                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                    title="Leave Call"
                >
                    <LogOut size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                {/* Local Video */}
                <VideoPlayer
                    stream={stream}
                    label="You"
                    muted={true}
                />

                {/* Remote Video */}
                {remoteStream ? (
                    <VideoPlayer
                        stream={remoteStream}
                        label="Peer"
                        muted={false}
                        className="border-emerald-500/50 border-2"
                    />
                ) : (
                    <div className="relative rounded-xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl flex items-center justify-center">
                        <div className="text-center text-gray-500 space-y-2">
                            <div className="text-6xl animate-pulse">📡</div>
                            <p>Waiting for connection...</p>
                            <p className="text-xs text-gray-600">Share Room ID: {roomId}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="h-48 hidden md:block">
                <ProtocolVisualizer logs={logs} />
            </div>

            <div className="flex justify-center gap-4">
                <Controls
                    toggleAudio={toggleAudio}
                    toggleVideo={toggleVideo}
                    audioEnabled={audioEnabled}
                    videoEnabled={videoEnabled}
                />
                <button
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`relative p-4 rounded-full transition-all duration-200 shadow-lg border border-gray-700 ${isChatOpen
                            ? 'bg-blue-600 text-white hover:bg-blue-500'
                            : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                >
                    <MessageSquare size={24} />
                    {messages.length > 0 && !isChatOpen && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900"></span>
                    )}
                </button>
            </div>

            <Chat
                messages={messages}
                onSendMessage={sendMessage}
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
        </div>
    );
}
