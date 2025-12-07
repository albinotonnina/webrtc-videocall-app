# WebRTC Educative App 📹

A real-time video calling application built to demonstrate the core concepts of the **WebRTC** protocol. This project was created as an educational tool to understand how peer-to-peer connections, signaling, and data channels work in modern web development.

🔗 **Live Demo:** [webrtc-videocall-app.vercel.app](https://webrtc-videocall-app.vercel.app)

## Features

-   **🎥 Peer-to-Peer Video**: High-quality video and audio streaming directly between clients.
-   **💬 Real-time Chat**: Text messaging using WebRTC Data Channels (no server storage for messages!).
-   **📡 Protocol Visualization**: A built-in log visualizer to see the internal handshake events (`Offer`, `Answer`, `ICE Candidate`) in real-time.
-   **🔒 Secure Signaling**: Uses Supabase Realtime for the initial connection handshake.

## Tech Stack

-   **Frontend**: React, TypeScript, Vite
-   **Styling**: Tailwind CSS
-   **Signaling Server**: Supabase (PostgreSQL + Realtime)
-   **WebRTC API**: Native Browser API (`RTCPeerConnection`, `RTCDataChannel`)

## Getting Started

### Prerequisites

1.  Node.js installed.
2.  A [Supabase](https://supabase.com) project.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/albinotonnina/webrtc-videocall-app.git
    cd webrtc-videocall-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment:
    Create a `.env` file (copy from `.env.example`) and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
    *Note: You need to run the SQL from `supabase_schema.sql` in your Supabase SQL Editor to create the necessary tables.*

4.  Run the development server:
    ```bash
    npm run dev
    ```

## License

MIT
