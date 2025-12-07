import { useEffect, useRef, useState } from 'react';
import { SignalingService } from '../lib/signaling';

const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ],
};

export function useWebRTC(roomId: string, localStream: MediaStream | null) {
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
    // Data Channel State
    const [messages, setMessages] = useState<{ sender: 'me' | 'peer'; text: string; timestamp: number }[]>([]);
    // Educational Logs
    const [logs, setLogs] = useState<{ time: string; event: string; type: 'info' | 'success' | 'warning' }[]>([]);

    const addLog = (event: string, type: 'info' | 'success' | 'warning' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, { time, event, type }]);
    };

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const signaling = useRef<SignalingService | null>(null);
    const isInitiator = useRef(false);
    const dataChannel = useRef<RTCDataChannel | null>(null);

    const sendMessage = (text: string) => {
        if (dataChannel.current && dataChannel.current.readyState === 'open') {
            const message = { sender: 'peer', text, timestamp: Date.now() };
            dataChannel.current.send(JSON.stringify(message));
            setMessages(prev => [...prev, { sender: 'me', text, timestamp: Date.now() }]);
        }
    };

    useEffect(() => {
        if (!localStream) return;

        addLog('Initializing WebRTC PeerConnection...', 'info');
        const pc = new RTCPeerConnection(STUN_SERVERS);
        peerConnection.current = pc;

        localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream);
        });

        pc.ontrack = (event) => {
            addLog('Received Remote Track (Video/Audio)', 'success');
            setRemoteStream(event.streams[0]);
        };

        pc.ondatachannel = (event) => {
            addLog('Received Data Channel from Remote Peer', 'success');
            const channel = event.channel;
            dataChannel.current = channel;
            channel.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    setMessages(prev => [...prev, { ...data }]);
                } catch (err) {
                    console.error('Failed to parse message', err);
                }
            };
        };

        pc.onconnectionstatechange = () => {
            addLog(`Connection State: ${pc.connectionState}`, pc.connectionState === 'connected' ? 'success' : 'warning');
            setConnectionState(pc.connectionState);
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // addLog('Generated Local ICE Candidate', 'info'); // Too noisy?
                signaling.current?.sendSignal('ice-candidate', event.candidate);
            }
        };

        signaling.current = new SignalingService(roomId, async (type, payload) => {
            if (!peerConnection.current) return;
            const pc = peerConnection.current;

            try {
                if (type === 'user-joined') {
                    addLog('Peer joined room. Acting as Initiator.', 'info');
                    isInitiator.current = true;

                    addLog('Creating Data Channel...', 'info');
                    const channel = pc.createDataChannel('chat');
                    dataChannel.current = channel;

                    channel.onmessage = (e) => {
                        const data = JSON.parse(e.data);
                        setMessages(prev => [...prev, { ...data }]);
                    };

                    addLog('Creating SDP Offer...', 'info');
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    addLog('Sending SDP Offer to Peer', 'info');
                    signaling.current?.sendSignal('offer', offer);
                }
                else if (type === 'offer') {
                    addLog('Received SDP Offer from Peer', 'info');
                    if (pc.signalingState !== 'stable') return;

                    await pc.setRemoteDescription(new RTCSessionDescription(payload));
                    addLog('Remote Description Set. Creating Answer...', 'info');

                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    addLog('Sending SDP Answer', 'info');
                    signaling.current?.sendSignal('answer', answer);
                }
                else if (type === 'answer') {
                    addLog('Received SDP Answer', 'success');
                    if (pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(payload));
                        addLog('Remote Description Set. Connection should start.', 'success');
                    }
                }
                else if (type === 'ice-candidate') {
                    // addLog('Received ICE Candidate', 'info'); // Too noisy
                    await pc.addIceCandidate(new RTCIceCandidate(payload));
                }
            } catch (err) {
                console.error('Signaling error:', err);
                addLog(`Signaling Error: ${err}`, 'warning');
            }
        });

        addLog('Connecting to Signaling Server...', 'info');
        signaling.current.join();

        return () => {
            signaling.current?.leave();
            pc.close();
            dataChannel.current?.close();
        };
    }, [roomId, localStream]);

    return { remoteStream, connectionState, messages, sendMessage, logs };
}
