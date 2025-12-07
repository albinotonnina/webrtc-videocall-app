import { useState } from 'react';
import { Room } from './components/Room';
import { JoinRoom } from './components/JoinRoom';

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="p-4 border-b border-gray-800 flex justify-between items-center">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          Webrtc Educative App
        </h1>
      </header>
      <main className="h-[calc(100vh-65px)] overflow-hidden">
        {roomId ? (
          <Room roomId={roomId} onLeave={() => setRoomId(null)} />
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <JoinRoom onJoin={setRoomId} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
