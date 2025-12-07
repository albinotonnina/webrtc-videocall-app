import { useState } from 'react';
import { ArrowRight, Video } from 'lucide-react';

interface JoinRoomProps {
    onJoin: (roomId: string) => void;
}

export function JoinRoom({ onJoin }: JoinRoomProps) {
    const [roomId, setRoomId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roomId.trim()) {
            onJoin(roomId.trim());
        }
    };

    return (
        <div className="max-w-md w-full mx-auto p-6">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700">
                <div className="flex justify-center mb-8">
                    <div className="p-4 bg-gradient-to-tr from-blue-600 to-emerald-600 rounded-full shadow-lg">
                        <Video className="w-8 h-8 text-white" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2">Join a Room</h2>
                <p className="text-gray-400 text-center mb-6">
                    Enter a room ID to start or join a call.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="roomId" className="block text-sm font-medium text-gray-300 mb-1">
                            Room ID
                        </label>
                        <input
                            type="text"
                            id="roomId"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="e.g. room-123"
                            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-white placeholder-gray-500 transition-all"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!roomId.trim()}
                        className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                    >
                        <span>Enter Room</span>
                        <ArrowRight size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
}
