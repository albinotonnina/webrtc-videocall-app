import { Activity } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ProtocolVisualizerProps {
    logs: { time: string; event: string; type: 'info' | 'success' | 'warning' }[];
}

export function ProtocolVisualizer({ logs }: ProtocolVisualizerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col h-full max-h-[300px]">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                <Activity size={16} className="text-emerald-400" />
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">WebRTC Protocol Log</span>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
                {logs.length === 0 && (
                    <p className="text-gray-600 text-center mt-4">Waiting for protocol events...</p>
                )}
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-2 text-gray-400 hover:bg-gray-800/50 p-1 rounded">
                        <span className="opacity-50 select-none">{log.time}</span>
                        <span className={
                            log.type === 'success' ? 'text-green-400' :
                                log.type === 'warning' ? 'text-yellow-400' :
                                    'text-blue-300'
                        }>
                            {log.event}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
