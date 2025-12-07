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

## WebRTC Protocol & Architecture

This section explains the "Magic" behind the Video Call app using diagrams.

### 1. High-Level Architecture

WebRTC is **Peer-to-Peer (P2P)**. This means the video and chat data go directly between User A and User B, **skipping the server entirely**.
However, to find each other, they need a "Matchmaker" (Signaling Server). We use **Supabase** for this.

```mermaid
graph TD
    subgraph "Signaling Phase (The Handshake)"
        A[User A] -- "1. Send 'Offer'" --> S((Supabase))
        S -- "2. Forward 'Offer'" --> B[User B]
        B -- "3. Send 'Answer'" --> S
        S -- "4. Forward 'Answer'" --> A
        A -- "5. ICE Candidates" --> S
        B -- "6. ICE Candidates" --> S
    end

    subgraph "P2P Phase (The Call)"
        A == "Video / Audio Stream" ==> B
        B == "Video / Audio Stream" ==> A
        A -. "Data Channel (Chat)" .- B
    end

    classDef peer fill:#f9f,stroke:#333,stroke-width:2px;
    classDef server fill:#bbf,stroke:#333,stroke-width:2px;
    class A,B peer;
    class S server;
```

---

### 2. The Connection Sequence (The "Handshake")

This sequence diagram shows exactly what happens when you join a room. This is the logic inside `useWebRTC.ts`.

```mermaid
sequenceDiagram
    participant Alice as 👤 Alice (Initiator)
    participant Supabase as ⚡ Supabase (Signaling)
    participant Bob as 👤 Bob (Peer)

    Note over Alice, Bob: Both Join "Room-123"

    rect rgb(240, 248, 255)
    Note over Alice, Bob: Step 1: Discovery
    Bob->>Supabase: Sends "user-joined" event
    Supabase->>Alice: Broadcasts "user-joined"
    end

    rect rgb(255, 250, 240)
    Note over Alice: Step 2: Offer Creation
    Alice->>Alice: Creates 'Data Channel'
    Alice->>Alice: Creates SDP Offer
    Alice->>Supabase: Sends Signal: { type: 'offer', sdp: ... }
    Supabase->>Bob: Broadcasts Offer
    end

    rect rgb(240, 255, 240)
    Note over Bob: Step 3: Answer Creation
    Bob->>Bob: Sets Alice's Remote Description
    Bob->>Bob: Creates SDP Answer
    Bob->>Supabase: Sends Signal: { type: 'answer', sdp: ... }
    Supabase->>Alice: Broadcasts Answer
    Alice->>Alice: Sets Bob's Remote Description
    end

    rect rgb(255, 240, 245)
    Note over Alice, Bob: Step 4: ICE Candidates (Finding Paths)
    Alice->>Supabase: Sends ICE Candidate (IP:Port)
    Supabase->>Bob: Forwards Candidate
    Bob->>Bob: Adds Candidate to Connection

    Bob->>Supabase: Sends ICE Candidate (IP:Port)
    Supabase->>Alice: Forwards Candidate
    Alice->>Alice: Adds Candidate to Connection
    end

    rect rgb(200, 255, 200)
    Note over Alice, Bob: 🚀 CONNECTION ESTABLISHED
    Alice->>Bob: P2P Media Stream (Video/Audio)
    Bob->>Alice: P2P Media Stream (Video/Audio)
    Alice->>Bob: P2P Data Channel (Chat Messages)
    Bob->>Alice: P2P Data Channel (Chat Messages)
    end
```

### 3. WebRTC Concepts Explained

#### 📡 Signaling (Supabase)
WebRTC doesn't know how to connect two computers. It needs a mechanism to exchange contact info.
-   **SDP (Session Description Protocol)**: A text file describing "Who I am" and "What I can do" (I have a camera, I support HD video, etc.).
-   **Offer / Answer**: The request/response format of exchanging SDPs.

#### ❄️ ICE (Interactive Connectivity Establishment)
The internet is messy. Firewalls and Routers (NAT) hide computers.
-   **ICE Candidates**: Possible network paths to reach a user (e.g., "Try my local IP 192.168.1.5" or "Try my public IP 54.2.1.1").
-   **STUN Server**: A server that tells you "Hey, this is your Public IP". We use Google's public STUN servers.

#### ⚡ Data Channels
Once connected, WebRTC can open arbitrary data pipes.
-   **Low Latency**: Faster than sending data to a server and back.
-   **Secure**: Encrypted end-to-end (DTLS).
-   **Usage**: We use this for the **Chat** feature in the app.

## License

MIT
