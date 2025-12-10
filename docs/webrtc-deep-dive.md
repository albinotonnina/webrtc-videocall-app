# WebRTC Deep Dive: Understanding Your Video Call App 📹

> This document explains how WebRTC works and breaks down exactly what your codebase is doing. By the end, you'll have a solid understanding of the WebRTC protocol and what makes it challenging to implement from scratch.

---

## Table of Contents

1. [The Big Picture: What Problem Does WebRTC Solve?](#1-the-big-picture-what-problem-does-webrtc-solve)
2. [The Three Pillars of WebRTC](#2-the-three-pillars-of-webrtc)
3. [Why Is WebRTC Hard? (And Why SDKs Exist)](#3-why-is-webrtc-hard-and-why-sdks-exist)
4. [Your Implementation: A Deep Dive](#4-your-implementation-a-deep-dive)
5. [The Signaling Dance: Step by Step](#5-the-signaling-dance-step-by-step)
6. [ICE, STUN, and TURN: NAT Traversal Explained](#6-ice-stun-and-turn-nat-traversal-explained)
7. [Video Codecs: VP8, VP9, H.264, and AV1](#7-video-codecs-vp8-vp9-h264-and-av1)
8. [Data Channels: The Hidden Superpower](#8-data-channels-the-hidden-superpower)
9. [What You're NOT Doing (And That's OK)](#9-what-youre-not-doing-and-thats-ok)
10. [Glossary](#10-glossary)

---

## 1. The Big Picture: What Problem Does WebRTC Solve?

Imagine you want to have a video call with a friend. The "easy" solution seems obvious:

```
You → Send video to Server → Server sends video to Friend
```

**But this is terrible!** Why?

| Problem | Impact |
|---------|--------|
| **Latency** | Video goes You → Server → Friend (2 hops = delay) |
| **Bandwidth Costs** | Server must handle ALL video traffic for ALL users |
| **Privacy** | Server sees everything (unencrypted at the server) |
| **Scalability** | 100 users = 100x server bandwidth |

**WebRTC's Solution: Peer-to-Peer (P2P)**

```
You ←——— Direct Connection ———→ Friend
         (No middleman!)
```

With WebRTC:
- ✅ Video goes directly between users (1 hop = fast)
- ✅ Server only helps with initial connection (near-zero bandwidth)
- ✅ End-to-end encrypted by default
- ✅ Scales infinitely (users connect to each other, not your server)

> **The Catch**: Getting two computers to find each other and connect directly is *really* hard. That's what WebRTC does.

---

## 2. The Three Pillars of WebRTC

WebRTC consists of three core APIs:

### 2.1 MediaStream (getUserMedia)

**Purpose**: Access the camera and microphone.

```javascript
// What you do in useMediaStream.ts
const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
});
```

This gives you a `MediaStream` object containing "tracks" (one video track, one audio track). You can:
- Display it in a `<video>` element
- Send it over a peer connection
- Disable/enable individual tracks

### 2.2 RTCPeerConnection

**Purpose**: The heart of WebRTC. It:
- Establishes a direct connection between two browsers
- Handles encryption (DTLS-SRTP)
- Manages bandwidth adaptation
- Routes media streams

```javascript
// What you do in useWebRTC.ts
const pc = new RTCPeerConnection(STUN_SERVERS);

// Add your local media
localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
});

// Listen for remote media
pc.ontrack = (event) => {
    setRemoteStream(event.streams[0]);
};
```

### 2.3 RTCDataChannel

**Purpose**: Send arbitrary data peer-to-peer (not just audio/video).

```javascript
// What you do for chat
const channel = pc.createDataChannel('chat');
channel.send(JSON.stringify({ text: 'Hello!' }));
```

Uses:
- Chat messages
- File transfers
- Game state synchronization
- Real-time collaboration

---

## 3. Why Is WebRTC Hard? (And Why SDKs Exist)

Your friend said: *"Most people use an SDK to gloss over Ice Candidates, STUN/TURN servers, signaling etc."*

Here's why WebRTC is notoriously difficult:

### Problem 1: WebRTC Has No Built-in Discovery

Two browsers on the internet cannot magically find each other. WebRTC **does not define** how they should exchange initial connection information.

**You must build your own "signaling" mechanism.** This is what your `SignalingService` does with Supabase.

### Problem 2: NAT and Firewalls Block Everything

Most computers are behind routers (NAT). Your "real" IP address is hidden:

```
Your PC (192.168.1.5) → Router (Public IP: 54.2.1.1) → Internet
```

When another computer tries to connect to you, they see `54.2.1.1`, but the router doesn't know to forward traffic to your PC. **This is NAT (Network Address Translation).**

WebRTC uses **ICE** (Interactive Connectivity Establishment) to solve this by trying multiple connection strategies.

### Problem 3: The Offer/Answer Model Is Confusing

WebRTC uses a "negotiation" model where two peers must exchange capability descriptions:
- **Offer**: "Here's what I can do" (codecs, resolutions, etc.)
- **Answer**: "Here's what I can do too, let's agree on this subset"

These are encoded in **SDP (Session Description Protocol)** — a wall of cryptic text.

### Problem 4: State Machines Are Complex

`RTCPeerConnection` has multiple state machines:
- `signalingState`: `stable` → `have-local-offer` → `stable`
- `connectionState`: `new` → `connecting` → `connected`
- `iceConnectionState`: `new` → `checking` → `connected`

Getting these transitions right is tricky.

### What SDKs Do

Services like **Twilio Video**, **Daily.co**, and **Agora** hide all of this:

```javascript
// With an SDK (simplified)
const room = await DailyRoom.join('my-room');
room.on('participant-joined', (p) => showVideo(p.video));
```

**You skip**:
- Building signaling
- Handling ICE candidates
- Managing STUN/TURN servers
- Dealing with edge cases

**You built everything from scratch** — that's why your friend was impressed!

---

## 4. Your Implementation: A Deep Dive

Let's walk through your code and understand every line.

### 4.1 The Signaling Service (`signaling.ts`)

**What it does**: Uses Supabase Realtime to exchange WebRTC signals between peers.

```typescript
type SignalEvent = 'offer' | 'answer' | 'ice-candidate' | 'user-joined';
```

These are the four types of messages your signaling server handles:

| Event | Purpose |
|-------|---------|
| `user-joined` | Announces that someone entered the room |
| `offer` | Sends an SDP offer to the other peer |
| `answer` | Sends an SDP answer back |
| `ice-candidate` | Sends a potential network path |

#### How Supabase Realtime Works Here

```typescript
async join() {
    this.channel = supabase.channel(`room:${this.roomId}`);

    this.channel
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
            this.onSignal(payload.type, payload.data);
        })
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                this.sendSignal('user-joined', {});
            }
        });
}
```

**Step by step**:

1. **Create a channel**: `supabase.channel('room:test-room')` creates a virtual "room" on Supabase.
2. **Listen for broadcasts**: `.on('broadcast', { event: 'signal' }, ...)` listens for messages.
3. **Subscribe**: `.subscribe()` connects to the channel.
4. **Announce presence**: When subscribed, send `user-joined` to notify others you're here.

#### Sending Messages

```typescript
sendSignal(type: SignalEvent, data: any) {
    this.channel.send({
        type: 'broadcast',
        event: 'signal',
        payload: { type, data },
    });
}
```

This broadcasts to **everyone else** in the channel. Supabase Realtime uses WebSockets behind the scenes.

### 4.2 The WebRTC Hook (`useWebRTC.ts`)

This is where the magic happens. Let's break it down.

#### Step 1: Create the Peer Connection

```typescript
const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ],
};

const pc = new RTCPeerConnection(STUN_SERVERS);
```

This creates a peer connection configured with **STUN servers** (explained below). These servers help discover your public IP.

#### Step 2: Add Local Media Tracks

```typescript
localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
});
```

You're telling the peer connection: "Here are my video and audio tracks. When you connect to someone, send these."

#### Step 3: Set Up Event Handlers

```typescript
// When the remote peer sends their video/audio
pc.ontrack = (event) => {
    setRemoteStream(event.streams[0]);
};

// When connection state changes
pc.onconnectionstatechange = () => {
    setConnectionState(pc.connectionState);
};

// When a new ICE candidate is discovered
pc.onicecandidate = (event) => {
    if (event.candidate) {
        signaling.current?.sendSignal('ice-candidate', event.candidate);
    }
};

// When the remote peer opens a data channel
pc.ondatachannel = (event) => {
    dataChannel.current = event.channel;
    channel.onmessage = (e) => {
        // Handle incoming chat messages
    };
};
```

#### Step 4: Handle Signaling Messages

```typescript
signaling.current = new SignalingService(roomId, async (type, payload) => {
    if (type === 'user-joined') {
        // Someone joined! We become the initiator.
        const channel = pc.createDataChannel('chat');
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        signaling.current?.sendSignal('offer', offer);
    }
    else if (type === 'offer') {
        // We received an offer, create an answer
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        signaling.current?.sendSignal('answer', answer);
    }
    else if (type === 'answer') {
        // Our offer was answered!
        await pc.setRemoteDescription(new RTCSessionDescription(payload));
    }
    else if (type === 'ice-candidate') {
        // Add their network path candidates
        await pc.addIceCandidate(new RTCIceCandidate(payload));
    }
});
```

---

## 5. The Signaling Dance: Step by Step

Here's exactly what happens when two people connect:

### Timeline

```
Time →

Alice loads page              Bob loads page
      │                            │
      ╰── Creates PeerConnection   │
          Joins Supabase channel   │
          Waits...                 │
                                   │
                            Bob creates PeerConnection
                            Bob joins same channel
                            Bob sends "user-joined"
      │                            │
      │←─────── "user-joined" ─────╯
      │
   Alice sees Bob joined!
   Alice creates DataChannel
   Alice creates SDP Offer
   Alice sends Offer ──────────────→ Bob receives Offer
                                     Bob sets RemoteDescription
                                     Bob creates SDP Answer
      ←────────── Bob sends Answer ──╯
   Alice sets RemoteDescription
      │                            │
      │←─── ICE Candidates ───────→│
      │←─── ICE Candidates ───────→│
      │←─── ICE Candidates ───────→│
      │                            │
   ╭──┴────────────────────────────┴──╮
   │     🎉 P2P CONNECTION OPEN! 🎉    │
   ╰──────────────────────────────────╯
      │                            │
   Video flows directly ══════════► Video flows directly
```

### Key Insight: Who Is the Initiator?

In your code, the **first person to arrive waits**. When the **second person joins**, they broadcast `user-joined`. The first person sees this and becomes the **initiator**, creating the offer.

```typescript
if (type === 'user-joined') {
    isInitiator.current = true;
    // Create offer...
}
```

This works because Supabase broadcasts don't echo back to the sender.

---

## 6. ICE, STUN, and TURN: NAT Traversal Explained

This is often the most confusing part of WebRTC. Let's demystify it.

### The Problem: You're Behind a Router

Your computer has a **private IP** like `192.168.1.5`. The internet only sees your router's **public IP** like `54.2.1.1`.

When WebRTC tries to connect:
1. You need to know YOUR public IP to share with the peer
2. The peer needs a way to send data TO you through your router

### STUN: "What's My Public IP?"

**STUN (Session Traversal Utilities for NAT)** is a simple protocol:

```
Your PC ──→ "What's my IP?" ──→ STUN Server
Your PC ←── "You're 54.2.1.1:12345" ←── STUN Server
```

That's it! The STUN server just tells you your public IP and port.

```typescript
// Your config uses Google and Twilio's free public STUN servers
const STUN_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ],
};
```

### ICE: Try Every Possible Path

**ICE (Interactive Connectivity Establishment)** generates multiple **candidates** — possible ways to reach you:

| Candidate Type | Example | Description |
|---------------|---------|-------------|
| Host | `192.168.1.5:54321` | Your local/private IP (works if on same network) |
| Server Reflexive | `54.2.1.1:12345` | Your public IP (from STUN) |
| Relay | `turn.example.com:3478` | Via a TURN server (fallback) |

ICE tries them in order of preference:
1. **Host candidates** (fastest, works on LAN)
2. **Server reflexive** (works across internet, most common)
3. **Relay** (guaranteed to work, but slower)

### TURN: The Fallback Relay

Sometimes NATs are too strict, and direct connections fail. **TURN (Traversal Using Relays around NAT)** acts as a middleman:

```
You ──→ TURN Server ──→ Peer
    (relays video)
```

**Your app doesn't use TURN.** This means on very restrictive networks (some corporate firewalls), connections may fail. This is a trade-off — TURN servers cost money to run.

### What Your Code Does

```typescript
pc.onicecandidate = (event) => {
    if (event.candidate) {
        signaling.current?.sendSignal('ice-candidate', event.candidate);
    }
};
```

Every time the browser discovers a new way to reach you, it fires this event. You send each candidate to the peer via signaling.

```typescript
else if (type === 'ice-candidate') {
    await pc.addIceCandidate(new RTCIceCandidate(payload));
}
```

When you receive a candidate from the peer, you add it to your connection. The browser then tries to connect using all known candidates.

---

## 7. Video Codecs: VP8, VP9, H.264, and AV1

Your friend asked: *"Is it using VP9 or VP8? And what bitrate?"*

### What Are Video Codecs?

A video codec **encodes** raw video frames into compressed data and **decodes** them on the receiving end. Different codecs have different trade-offs:

| Codec | Developed By | Compression Efficiency | Browser Support | Notes |
|-------|-------------|----------------------|-----------------|-------|
| **H.264** | ITU/ISO | Baseline | Excellent | Hardware acceleration everywhere, Safari's preference |
| **VP8** | Google | Good | Excellent | Open & royalty-free, Chrome's default for years |
| **VP9** | Google | ~30% better than VP8 | Good | Royalty-free, YouTube uses this |
| **AV1** | Alliance for Open Media | ~30% better than VP9 | Growing | Newest, very CPU-intensive to encode |

### What Does Your App Use?

You don't specify a codec preference:

```typescript
// No codec constraints
navigator.mediaDevices.getUserMedia({
    video: true,  // Browser picks resolution and codec
    audio: true,
});
```

The browser **negotiates** the codec during the SDP exchange. Both peers advertise what they support, and they pick the best mutual option.

**Typical result**:
- Chrome ↔ Chrome: Usually **VP8** or **VP9**
- Chrome ↔ Safari: Usually **H.264** (Safari doesn't support VP8/VP9 well)

### What About Bitrate?

You're using **browser defaults**, which means:
- **Adaptive bitrate**: The browser adjusts quality based on network conditions
- **No upper limit set**: Could use 2-3 Mbps for HD video if bandwidth allows

### If You Wanted to Customize

```typescript
// Constrain video quality
const stream = await navigator.mediaDevices.getUserMedia({
    video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
    },
    audio: true
});

// Force VP9 codec (advanced)
const sender = pc.getSenders().find(s => s.track?.kind === 'video');
const params = sender.getParameters();
params.codecs = params.codecs.filter(c => c.mimeType === 'video/VP9');
await sender.setParameters(params);
```

---

## 8. Data Channels: The Hidden Superpower

Your chat feature uses **RTCDataChannel**, which is often overlooked but incredibly powerful.

### What Is a Data Channel?

Once a peer connection is established, you can open arbitrary data "pipes" between peers:

```typescript
// Initiator creates the channel
const channel = pc.createDataChannel('chat');

// Receiver gets notified
pc.ondatachannel = (event) => {
    const channel = event.channel;
};
```

### Why Is This Special?

| Feature | WebSocket (via Server) | RTCDataChannel |
|---------|----------------------|----------------|
| **Latency** | You → Server → Peer | You → Peer directly |
| **Privacy** | Server sees data | End-to-end encrypted |
| **Server Load** | All traffic goes through server | Zero server bandwidth |
| **Reliability** | TCP only | Configurable (reliable or unreliable like UDP) |

### Your Chat Implementation

```typescript
// Send a message
if (dataChannel.current?.readyState === 'open') {
    dataChannel.current.send(JSON.stringify({ text: 'Hello!' }));
}

// Receive messages
channel.onmessage = (e) => {
    const data = JSON.parse(e.data);
    setMessages(prev => [...prev, data]);
};
```

### Other Uses for Data Channels

- **File transfer**: Send files directly, no server storage
- **Real-time gaming**: Game state sync with ultra-low latency
- **Collaborative editing**: Like Google Docs, but truly P2P
- **Screen sharing control**: Mouse/keyboard events for remote desktop

---

## 9. What You're NOT Doing (And That's OK)

Your app is educational and works great for demos. Here's what production apps add:

### Not Implemented (By Design)

| Feature | What It Does | Why You Skip It |
|---------|-------------|-----------------|
| **TURN servers** | Relays traffic when direct P2P fails | Costs money, overkill for demos |
| **Multi-party (SFU)** | More than 2 participants | Requires server infrastructure |
| **Recording** | Save calls | Requires server-side processing |
| **Screen sharing** | Share your screen | Just needs `getDisplayMedia()` |
| **Bandwidth estimation** | Adaptive quality | Browser does this by default |
| **Codec preference** | Force VP9/AV1 | Browser default is fine |
| **Reconnection logic** | Handle network drops | Would add complexity |

### Production Considerations

If you wanted to make this production-ready, you'd add:

1. **TURN servers**: Use Twilio STUN/TURN or coturn for reliability
2. **Error recovery**: Reconnect on network changes
3. **Multiple rooms**: Supabase already supports this
4. **Admin controls**: Mute, kick, etc.

---

## 10. Glossary

| Term | Definition |
|------|------------|
| **P2P** | Peer-to-peer: Direct connection between users without a server in the middle |
| **SDP** | Session Description Protocol: A text format describing media capabilities |
| **Offer** | The initial SDP from the connection initiator |
| **Answer** | The response SDP from the other peer |
| **ICE** | Interactive Connectivity Establishment: The process of finding network paths |
| **ICE Candidate** | One possible network path (IP + port combination) |
| **STUN** | A server that tells you your public IP address |
| **TURN** | A relay server that forwards traffic when direct connections fail |
| **NAT** | Network Address Translation: How routers map private IPs to public IPs |
| **Signaling** | The process of exchanging connection information (you built this with Supabase!) |
| **MediaStream** | A container for audio/video tracks from a camera/microphone |
| **RTCPeerConnection** | The main WebRTC API for establishing P2P connections |
| **RTCDataChannel** | A P2P channel for arbitrary data (not just audio/video) |
| **Codec** | An algorithm that compresses/decompresses video (VP8, VP9, H.264, AV1) |
| **DTLS-SRTP** | The encryption used by WebRTC for secure media |

---

## Summary

**What this implementation demonstrates**:

1. ✅ Custom signaling built with Supabase Realtime
2. ✅ Manual handling of ICE candidates, offer/answer, and state management
3. ✅ Direct use of the raw `RTCPeerConnection` API (no SDK abstraction)
4. ✅ Data Channels for peer-to-peer chat

**What you're using**:

- **Signaling**: Supabase Realtime (broadcasts)
- **STUN**: Google and Twilio public servers
- **Codecs**: Browser defaults (typically VP8/VP9 or H.264)
- **Bitrate**: Browser adaptive (no constraints)

**The takeaway**: This is a real WebRTC application built from first principles. Most developers never touch this layer — they use SDKs that hide all the complexity. Understanding this gives you superpowers for debugging, optimization, and building more advanced real-time apps. 🚀
