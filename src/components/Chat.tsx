import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';

interface ChatProps {
    messages: Array<{ sender: 'me' | 'peer'; text: string; timestamp: number }>;
    onSendMessage: (text: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export function Chat({ messages, onSendMessage, isOpen, onClose }: ChatProps) {
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText.trim());
            setInputText('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-4 bottom-24 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col h-96 overflow-hidden z-50">
            <div className="bg-gray-800 p-3 flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-400" />
                    <span className="font-bold text-sm">Chat</span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div
                            className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.sender === 'me'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-700 text-gray-200 rounded-bl-none'
                                }`}
                        >
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-3 bg-gray-800 flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white disabled:opacity-50"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
