# 📶 WiFi Text Share

A modern, responsive web app for sharing text instantly in real time — two ways:

- **Mode 1 — Local WiFi Broadcast:** everyone who opens the app on the same
  WiFi/LAN is automatically dropped into the same shared space. No login,
  no room code.
- **Mode 2 — Private Room:** create a password-protected room (or join one
  with a Room ID + password) and share text with anyone, anywhere — not
  limited to the local network.

- **Frontend:** React + TypeScript + Tailwind CSS (Vite) + React Router
- **Backend:** Node.js + Express + Socket.IO + Helmet + rate limiting
- **Storage:** In-memory (structured so Redis/Postgres can be swapped in later)

---

## ✨ Features

### Shared by both modes
- Real-time messaging & shared editable notes with live sync
- Online users list, typing indicators, join/leave notifications
- Name-only identification stored in `localStorage` — no accounts
- Light/dark theme toggle, message search, one-click clipboard copy
- QR code to open the current page on another device
- Message timestamps, edit/delete own messages, emoji + lightweight Markdown
- Connection status indicator (Connected / Reconnecting / Offline)
- Fully responsive, glassmorphism UI

### Mode 1 — Local WiFi Broadcast (`/wifi`)
- Auto-detects users on the same subnet and groups them into a shared room
- Clear-board control with confirmation

### Mode 2 — Private Room (`/room`, `/room/:roomId`)
- **Create Room:** set a Room Name and optional password (auto-generated if
  left blank); server returns a unique 6-character **Room ID**, the
  **password**, and a shareable **Invite Link**
- **Join Room:** enter a Room ID + password directly, or open an invite
  link (`/room/<ROOM_ID>`), which prompts for name + password
- Room info panel: Room Name, Room ID, Owner, Member count, Online members,
  lock indicator, copy Room ID / Password / Invite Link
- **Leave Room** for anyone, **Delete Room** for the owner only (kicks
  everyone and wipes the room)
- Only users with the correct Room ID **and** password can join; outside
  users never see room messages
- Empty private rooms are automatically reclaimed after 30 minutes

---

## 🧠 How "same WiFi" works (Mode 1)

There's no login, so the app groups people into a shared room using the
network itself:

1. Every device on the same WiFi reaches the backend at the **same LAN
   address** (e.g. `http://192.168.1.20:4000`) printed in the server's
   startup logs — so simply pointing everyone at that address already scopes
   them to the same physical network.
2. As a second safety net, the backend also buckets each connecting socket
   into a room keyed by the **/24 subnet of its IP address**
   (`backend/src/network.ts`).

Private rooms (Mode 2) bypass subnet bucketing entirely — they're keyed by
their generated Room ID and gated by password, so they work over the
internet as well as on a LAN.

---

## 📁 Project structure

```
wifi-text-share/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Express + Socket.IO bootstrap, Helmet, rate limiting
│   │   ├── socketHandlers.ts  # All real-time event handlers (LAN + private rooms)
│   │   ├── roomStore.ts       # In-memory data layer (swappable for Redis/Postgres)
│   │   ├── network.ts         # LAN/subnet room resolution (Mode 1)
│   │   └── types.ts           # Shared socket event & data contracts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── public/
│   │   ├── manifest.json      # PWA manifest
│   │   ├── service-worker.js  # App-shell caching + offline fallback
│   │   ├── offline.html
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   ├── favicon.svg
│   │   └── icons/              # PWA icons (placeholder SVGs — swap for real PNGs before shipping)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx              # Landing page: choose Mode 1 or Mode 2
│   │   │   ├── LanRoomPage.tsx           # Mode 1 UI (`/wifi`)
│   │   │   ├── PrivateRoomLanding.tsx    # Create/Join forms (`/room`)
│   │   │   ├── PrivateRoomInvitePage.tsx # Invite-link join gate (`/room/:roomId`)
│   │   │   └── NotFoundPage.tsx
│   │   ├── components/
│   │   │   ├── ads/                      # AdSlot + AdPageShell (AdSense placeholders)
│   │   │   ├── PrivateRoomSession.tsx    # Shared room UI once connected (Mode 2)
│   │   │   ├── RoomInfoPanel.tsx         # Room Name/ID/Owner/Members/lock + controls
│   │   │   └── ...                       # SharedTextArea, MessageBoard, OnlineUsers, etc.
│   │   ├── hooks/
│   │   │   ├── useSocketRoom.ts   # Generalized socket hook (LAN + private, create + join)
│   │   │   ├── useRoom.ts         # Thin LAN-mode wrapper around useSocketRoom
│   │   │   ├── useTheme.ts
│   │   │   └── useDisplayName.ts
│   │   ├── lib/                    # format helpers, server URL resolver
│   │   ├── App.tsx                 # Route table
│   │   └── main.tsx                # Router + PWA service worker registration
│   ├── index.html                  # SEO meta, Open Graph, Twitter cards, JSON-LD
│   ├── package.json
│   └── vite.config.ts
├── package.json                # root convenience scripts
└── README.md
```

---

## 🚀 Getting started (development)

**Requirements:** Node.js 18+ and npm.

```bash
# 1. Install dependencies for both apps (react-router-dom, helmet, and
#    express-rate-limit were added — re-run this even if you installed before)
npm run install:all

# 2. Start backend (port 4000) and frontend (port 5173) together
npm run dev
```

The backend prints the LAN URLs it's reachable on, e.g.:

```
WiFi Text Share backend running on port 4000
Reachable on your local network at:
  http://192.168.1.20:4000
```

Open the **frontend** dev server from other devices using your machine's LAN
IP and the Vite port, e.g. `http://192.168.1.20:5173`. The frontend
auto-detects the backend at the same hostname on port `4000`
(see `frontend/src/lib/serverUrl.ts`).

> Tip: use the 📱 QR button in the header to instantly open the exact page
> URL on another phone. In a private room, use the **Copy Link** button in
> the room panel to share the exact invite URL instead.

---

## 🏗️ Production build

```bash
npm run build
```

This compiles the backend to `backend/dist` and builds the optimized static
frontend into `frontend/dist`.

Run in production:

```bash
# Terminal 1 — backend
npm run start:backend

# Terminal 2 — serve the built frontend (any static file server works)
npm run preview:frontend
# or copy frontend/dist to nginx/serve/etc.
```

**Client-side routing note:** because this is a single-page app with routes
like `/wifi`, `/room`, and `/room/:roomId`, your static host must rewrite
all unknown paths to `/index.html` (e.g. Netlify `_redirects`, Vercel
rewrites, or nginx `try_files $uri /index.html;`). The dev server (Vite)
and the included service worker already handle this automatically.

If you serve the frontend from a different host/port than the backend, set
`VITE_SERVER_URL` in `frontend/.env` (copy from `frontend/.env.example`)
before building, e.g.:

```
VITE_SERVER_URL=http://192.168.1.20:4000
```

---

## ⚙️ Environment variables

**backend/.env** (copy from `backend/.env.example`)
```
PORT=4000
```

**frontend/.env** (copy from `frontend/.env.example`)
```
VITE_SERVER_PORT=4000
# VITE_SERVER_URL=http://192.168.1.20:4000   # optional override
```

---

## 🔌 Real-time events (Socket.IO contract)

| Event (client → server) | Payload | Purpose |
|---|---|---|
| `user:join` | `{ name }` | Join the LAN room (Mode 1) with a display name |
| `room:create` | `{ name, roomName, password? }` | Create a new private room (Mode 2) |
| `room:join` | `{ name, roomId, password }` | Join an existing private room |
| `room:delete` | – | Delete the current private room (owner only) |
| `text:update` | `{ content }` | Broadcast shared textarea changes |
| `message:send` | `{ text }` | Post a new board message |
| `message:edit` | `{ id, text }` | Edit your own message |
| `message:delete` | `{ id }` | Delete your own message |
| `typing:start` / `typing:stop` | – | Typing indicator |
| `board:clear` | – | Clear all messages & shared text (with confirmation on the client) |

| Event (server → client) | Payload | Purpose |
|---|---|---|
| `room:state` | `{ roomId, users, messages, sharedText, meta }` | Full state sent on join |
| `room:created` | `{ roomId, roomName, password }` | Sent to the creator right after `room:create` succeeds |
| `room:error` | `{ message }` | Join/create failed (bad password, room not found, rate limited) |
| `room:deleted` | `{ byName }` | The room was deleted by its owner |
| `user:joined` / `user:left` | user info + count | Presence notifications |
| `users:update` | `{ users }` | Refreshed online users list |
| `text:updated` | `SharedText` | Shared text changed |
| `message:new` / `message:updated` / `message:removed` | message data | Board sync |
| `typing:update` | `{ userId, name, isTyping }` | Typing indicator |
| `board:cleared` | `{ byName }` | Board was cleared |
| `error:message` | `{ message }` | Non-fatal error (e.g. sending too fast) |

---

## 🗺️ Frontend routes

| Route | Purpose |
|---|---|
| `/` | Home — choose Local WiFi or Private Room |
| `/wifi` | Mode 1: Local WiFi broadcast room |
| `/room` | Mode 2: Create Room / Join Room forms |
| `/room/:roomId` | Invite-link entry point — prompts for name + password |

---

## 📢 AdSense layout

Every ad placement from the spec is reserved with a reusable
`<AdSlot slot="..." width={..} height={..} />` component
(`frontend/src/components/ads/AdSlot.tsx`) so real units can be dropped in
without touching layout code:

- Desktop: 970×90 header banner, 728×90 below-header banner, 160×600 left/
  right sidebars, native in-feed ad every 12 chat messages, 970×250 bottom
  banner, responsive footer ad
- Mobile: 320×100 top banner, 300×250 mid-content banner, 320×50 sticky
  bottom banner, responsive footer ad

To go live with real AdSense:
1. Uncomment the AdSense loader `<script>` in `frontend/index.html` and set
   your `ca-pub-XXXXXXXXXXXXXXXX` client ID.
2. Swap the placeholder `<div>` in `AdSlot.tsx` for a real
   `<ins class="adsbygoogle">` tag and push `(adsbygoogle = window.adsbygoogle || []).push({})`
   in a `useEffect` — every call site in the app stays the same.

---

## 🔍 SEO & PWA

- `index.html` — full meta title/description/keywords, canonical URL, Open
  Graph + Twitter Card tags, and JSON-LD for `WebApplication`,
  `Organization`, `FAQPage`, and `BreadcrumbList`
- `public/robots.txt` and `public/sitemap.xml` (update the placeholder
  `wifitextshare.example.com` domain before deploying)
- `public/manifest.json` + `public/service-worker.js` + `public/offline.html`
  make the app installable with basic offline app-shell support
- **Before shipping:** replace `public/favicon.svg` and `public/icons/*.svg`
  with real branded PNG/SVG icons, and generate an `og-image.png`
  (1200×630) referenced in `index.html`'s Open Graph tags

---

## 🔐 Security

- `helmet` sets secure HTTP headers (CSP, etc.) on the Express app
- `express-rate-limit` throttles the plain HTTP `/api/*` routes
- Per-socket in-memory rate limiting on message sending, room creation, and
  room-join attempts (guards against chat flooding and password
  brute-forcing) in `backend/src/socketHandlers.ts`
- All user input (names, messages, room names, passwords) is trimmed and
  length-capped server-side before storage/broadcast
- Private rooms require an exact Room ID + password match; outside users
  never receive room state or messages

---

## 🗄️ Swapping in Redis/Postgres later

All persistence goes through `backend/src/roomStore.ts`. Its exported
functions (`getOrCreateRoom`, `addUser`, `removeUser`, `addMessage`,
`editMessage`, `deleteMessage`, `setSharedText`, `clearBoard`,
`createPrivateRoom`, `checkPrivateRoomPassword`, `deleteRoom`, …) are the
only things `socketHandlers.ts` calls — swap the internals for Redis
hashes/lists or Postgres queries (e.g. `rooms`, `room_users`, `messages`,
`shared_text` tables) without changing any socket/event code.

---

## 📈 Performance notes

- Socket.IO broadcasts are scoped to each room (`io.to(roomId)`), so
  traffic for one LAN or private room never reaches unrelated clients.
- Ping interval/timeout are tuned low (5s) for fast "Reconnecting/Offline"
  detection on flaky networks.
- Message history is capped in memory per room (500 messages).
- Empty private rooms are swept every 5 minutes and reclaimed after 30
  minutes of inactivity.

---

## 📜 License

MIT — do whatever you'd like with this.
