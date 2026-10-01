# DevDesk Real-Time Protocols: WebSocket & SSE Guide

> **Full-duplex frame streaming, EventSource subscriptions, memory management, and debugging.**

---

## ⚡ Real-Time Protocol Matrix

DevDesk provides dedicated workbenches for both primary real-time web protocols:

| Feature | WebSocket (`ws://`, `wss://`) | Server-Sent Events (`http://`, `https://`) |
| :--- | :--- | :--- |
| **Communication Mode** | Bi-directional (Full Duplex) | Uni-directional (Server to Client Push) |
| **Underlying Transport** | TCP Upgrade Handshake | Standard HTTP / HTTPS Persistent Stream |
| **Data Format** | Text (JSON, strings) or Binary | UTF-8 Text (`event:`, `data:`, `id:`) |
| **Primary Use Cases** | Chat, collaborative editing, gaming | AI token streaming, logs, live metrics, tickers |
| **Client Manager** | `src/services/webSocketManager.ts` | `src/services/sseManager.ts` |

---

## 🔌 WebSocket Client (`ws://`, `wss://`)

### 1. Connection Lifecycle
The WebSocket client tracks four discrete lifecycle states:
- `disconnected`: Idle state.
- `connecting`: Handshake initiated; latency timer measuring roundtrip response.
- `connected`: Active bi-directional socket ready to send and receive frames.
- `error`: Failed handshake or unexpected socket termination.

### 2. Live Frame Stream
All incoming and outgoing frames are recorded with:
- Direction indicators: `Inbound` (green arrow), `Outbound` (blue arrow), `System` (info badge), or `Error` (red badge).
- Precise millisecond timestamp.
- Byte length metrics.
- Directional filter buttons to isolate incoming data or outgoing messages.

### 3. Message Composer & Variable Resolution
- Supports raw text and formatted JSON messages.
- Environment variables (`{{token}}`, `{{user_id}}`) are resolved prior to frame transmission.
- 1-click **Beautify JSON** and **Minify JSON** buttons.
- Send messages with `⌘ + Enter` (or `Ctrl + Enter`).

### 4. Memory Safeguard (500-Frame Cap)
High-throughput WebSocket streams (e.g. market data tick feeds emitting 100+ msg/sec) can quickly exhaust browser memory. DevDesk enforces a **strict circular buffer cap of 500 messages**, automatically pruning the oldest frames while keeping the UI responsive. You can also click **Clear Stream** at any time.

---

## 📡 Server-Sent Events (SSE) Client

### 1. EventSource Subscriptions
- Connects to any standard SSE endpoint (`http://` or `https://`).
- Listens for generic `message` events, connection `open`/`error` events, and **custom named events** (e.g. `event: price_update`, `event: agent_token`).

### 2. Search & Payload Inspection
- Filter stream entries by event name or content search query.
- Click any entry to format the JSON payload, view event IDs, and copy structured data to clipboard.
- Automatic reconnection resilience handled via native browser `EventSource` mechanics.

---

## 🛠 Troubleshooting Real-Time Connections

### Mixed Content Restrictions
- If DevDesk is running over `https://`, browsers prohibit connecting to unencrypted `ws://` or `http://` streams due to browser Mixed Content Security Policies.
- Use `wss://` or `https://` for remote endpoints, or run DevDesk locally on `http://localhost:5173` when debugging local `ws://` endpoints.

### Self-Signed SSL Certificates
- Browsers reject untrusted certificates on `wss://` connections.
- Ensure your local development server has a trusted certificate (e.g., via `mkcert`) or accept the certificate by visiting the `https://` equivalent in a browser tab first.
