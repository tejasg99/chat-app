# Chat2vent - Real-Time Chat App

A production-ready real-time chat application built with an emphasis on design and premium user experience. This full-stack project features a responsive frontend and a robust, scalable backend.

---

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Features](#features)
- [Directory Structure](#directory-structure)
- [Data Models](#data-models)
- [API Reference](#api-reference)
- [Socket.io Events](#socketio-events)
- [Getting Started](#getting-started)

---

## Overview
`Chat2vent` is a comprehensive real-time communication platform designed to offer seamless direct and group messaging experiences. It integrates secure authentication, real-time message syncing, optimistic UI updates, and a sophisticated design system to provide a premium user experience.

---

## Tech Stack

### Frontend
| Area             | Choice                   | Reason                                 |
| ---------------- | -----------------------  | -------------------------------------- |
| Framework        | Next.js 16 (App Router)  | SSR for auth pages, file-based routing |
| Language         | TypeScript               | End-to-end type safety                 |
| Styling          | Tailwind CSS v4 + Shadcn | Design token system, accessible components |
| State            | Zustand                  | Lightweight, zero-boilerplate global state |
| Server-State     | TanStack Query v5        | Caching, pagination, background refetch    |
| Forms            | React Hook Form + Zod    | Shared schemas with backend |
| RealTime         | socket.io-client         | Direct backend communication |
| HTTP             | Axios                    | Interceptors for silent token refresh |

### Backend
| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Runtime          | Node.js v20+                     |
| Framework        | Express.js v5                    |
| Language         | TypeScript v5                    |
| Database         | MongoDB + Mongoose               |
| Real-time        | Socket.io v4                     |
| Cache / Pub-Sub  | Redis (Upstash)                  |
| Auth             | JWT + Google OAuth 2.0           |
| Security         | Helmet, CORS, express-rate-limit |

---

## Features

### Authentication & Profiles
- Email/password signup with Google OAuth support.
- Silent JWT access-token refresh and cookie-based route protection.
- Edit display names, upload avatars, and view user presence (online status, last seen).
- Block/unblock users and submit reports.

### Real-Time Messaging & Chats
- Live send/receive using Socket.io for text and images (via REST multipart).
- Direct messages and multi-member group chats.
- Real-time chat ordering, unread counts, and optimistic emoji reactions.
- Reply-to-message functionality and inline preview banners.
- Read receipts, 2-second debounced typing indicators.
- Infinite scroll with preserved cursor positions.

### UI / UX Polish
- Premium "Architectural Whisper" design (no borders, backdrop blurs, dark/light modes).
- Skeleton loaders and contextual empty states.
- Error boundaries and custom 404 pages.
- Responsive layout bridging mobile single-column and desktop sidebar interfaces.

---

## Directory Structure

```text
Chat2vent/
├── client/                       # Frontend Next.js Application
│   ├── app/                      # App router (auth, main, globals.css)
│   ├── components/               # UI components (auth, chat, modals, skeletons)
│   ├── hooks/                    # Custom React hooks (socket, presence, etc.)
│   ├── lib/                      # Axios, Socket singleton, React Query setup
│   ├── stores/                   # Zustand stores
│   ├── types/                    # Shared typings
│   ├── validations/              # Zod schemas
│   └── proxy.ts                  # Route protection middleware
│
├── server/                       # Backend Express/Node.js Application
│   ├── config/                   # DB, Redis, Passport configs
│   ├── controllers/              # Request handlers
│   ├── middlewares/              # Auth, error, rate limiting
│   ├── models/                   # Mongoose DB schemas
│   ├── repositories/             # Database access layer
│   ├── routes/                   # API routes
│   ├── services/                 # Core business logic
│   ├── sockets/                  # Socket.io handlers
│   ├── types/                    # TypeScript interfaces
│   ├── utils/                    # Error, Response helpers, Logger
│   ├── validations/              # Request validation schemas
│   └── app.ts / server.ts        # App setup & entry points
└── README.md
```

---

## Data Models
*Key entities governing the application flow.*

- **User**: Stores authentication details, profile info (avatar, display name), and active status.
- **Chat**: Represents direct or group conversations, tracking participants, last message, and metadata.
- **Message**: Contains the payload (text/image), sender reference, chat reference, read receipts, and reactions.
- **Report**: Tracks user-submitted reports for moderation.

---

## API Reference

### Auth
| Method | Endpoint              | Description                |
| ------ | --------------------- | -------------------------- |
| POST   | `/api/auth/signup`    | Register a new account     |
| POST   | `/api/auth/login`     | Login and receive tokens   |
| POST   | `/api/auth/logout`    | Revoke refresh token       |
| GET    | `/api/auth/google`    | Initiate Google OAuth flow |

### Users
| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/api/users/me`        | Get current user profile |
| PATCH  | `/api/users/me`        | Update profile           |
| POST   | `/api/users/block/:id` | Block a user             |

### Chats
| Method | Endpoint                         | Description              |
| ------ | -------------------------------- | ------------------------ |
| GET    | `/api/chats`                     | Get all chats            |
| POST   | `/api/chats/direct`              | Create/fetch direct chat |
| POST   | `/api/chats/group`               | Create group chat        |

### Messages
| Method | Endpoint                       | Description     |
| ------ | ------------------------------ | --------------- |
| GET    | `/api/chats/:id/messages`      | Fetch messages (paginated) |
| POST   | `/api/chats/:id/messages`      | Send message    |
| POST   | `/api/chats/:id/messages/image`| Send image      |
| DELETE | `/api/messages/:id`            | Soft delete     |

---

## Socket.io Events

### Client → Server
| Event          | Payload                | Description    |
| -------------- | ---------------------- | -------------- |
| `chat:join`      | `chatId`                 | Join room      |
| `chat:leave`     | `chatId`                 | Leave room     |
| `message:send`   | `{ chatId, content }`  | Send message   |
| `message:delete` | `{ messageId }`        | Delete message |
| `message:read`   | `{ chatId }`           | Mark read      |
| `message:react`  | `{ messageId, emoji }` | React          |
| `typing:start`   | `{ chatId }`           | Typing start   |
| `typing:stop`    | `{ chatId }`           | Typing stop    |

### Server → Client
| Event            | Payload         | Description     |
| ---------------- | --------------- | --------------- |
| `message:new`      | `IMessage`        | New message     |
| `message:deleted`  | `{ messageId }` | Deleted         |
| `message:read`     | `{ chatId }`    | Read receipt    |
| `message:reaction` | `{ messageId }` | Reaction update |
| `user:online`      | `{ userId }`    | Online          |
| `user:offline`     | `{ userId }`    | Offline         |
| `typing:start`     | `{ chatId }`    | Typing          |
| `typing:stop`      | `{ chatId }`    | Stop typing     |

---

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB instance
- Redis instance (Upstash)
- Cloudinary account

### 1. Clone & Setup
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Environment Variables
Create `.env` in the `server` directory:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chatapp
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:3000
REDIS_URL=rediss://your-upstash-url:6380
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run Development Servers
**Backend:**
```bash
cd server
npm run dev
```
Backend runs at `http://localhost:5000`.

**Frontend:**
```bash
cd client
npm run dev
```

Navigate to `http://localhost:3000` to start chatting!
