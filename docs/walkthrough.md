# WebRTC Educative App Walkthrough

This application demonstrates the core concepts of WebRTC:
1.  **Local Media Capture**: Accessing camera/microphone.
2.  **Signaling**: Exchanging connection data (SDP/ICE) via Supabase.
3.  **Peer Connection**: Establishing P2P video/audio stream.
4.  **Data Channels**: Real-time text chat alongside media.

## How to Test

1.  **Start the App**:
    Ensure the dev server is running:
    ```bash
    npm run dev
    ```

2.  **Open Client A**:
    -   Go to `http://localhost:5173` (or the port shown in terminal).
    -   Allow Camera/Microphone permissions.
    -   Enter a Room ID (e.g., `test-room`) and click **Enter Room**.
    -   You will see your local video and a "Waiting for connection" screen.

3.  **Open Client B** (Simulate Peer):
    -   Open a **new browser window** (Incognito or different profile suggested to avoid local storage conflicts, though this app uses memory state so standard new window is fine).
    -   Go to the same URL.
    -   Enter the **SAME** Room ID (`test-room`).
    -   Click **Enter Room**.

4.  **Observe the Magic**:
    -   **Video**: You should see the peer video appear on both screens.
    -   **Protocol Logs**: Look at the "WebRTC Protocol Log" at the bottom. You'll see the history of `User joined` -> `Offer` -> `Answer` -> `ICE Candidate` -> `Connected`. This visualizes the transparent handshake process.
    -   **Chat**: Click the Message icon and send a text. It travels over P2P Data Channels, not the server!

## Key Files for Learning

-   **`src/hooks/useWebRTC.ts`**: The brain. Handles `RTCPeerConnection`, `createOffer`, `createAnswer`, and Data Channels.
-   **`src/lib/signaling.ts`**: The messenger. Uses Supabase Realtime to broadcast signals.
-   **`src/components/ProtocolVisualizer.tsx`**: The teacher. Shows what's happening under the hood.

## Troubleshooting

-   **"Camera Error"**: Ensure your browser has permissions.
-   **No Remote Video**: Check if both peers are in the exact same Room ID. Check console logs for Signaling errors.
-   **Firewalls**: If you are on a restricted corporate network, the public Google STUN server might be blocked. This demo uses basic STUN, not TURN (needed for strict firewalls).
