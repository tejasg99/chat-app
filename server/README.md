# Real-Time Chat App — Backend

A production-ready real-time chat backend built with **Node.js**, **Express**, **TypeScript**, **MongoDB**, and **Socket.io**.

---

## 🚀 Tech Stack

| Layer            | Technology                       |
| ---------------- | -------------------------------- |
| Runtime          | Node.js v20+                     |
| Framework        | Express.js v5                    |
| Language         | TypeScript v5                    |
| Database         | MongoDB + Mongoose               |
| Real-time        | Socket.io v4                     |
| Cache / Pub-Sub  | Redis (Upstash)                  |
| Auth             | JWT + Google OAuth 2.0           |
| Validation       | Zod                              |
| Password hashing | bcrypt                           |
| Image uploads    | Cloudinary                       |
| Logging          | Pino + pino-pretty               |
| Security         | Helmet, CORS, express-rate-limit |

---

## 📁 Project Structure

```
server/
├── config/             # DB, Redis, Passport, env config
├── controllers/        # Request handlers (no business logic)
├── middlewares/        # Auth, error, rate limiter, upload
├── models/             # Mongoose schemas
├── repositories/       # Database access layer
├── routes/             # Express route definitions
├── services/           # Business logic layer
├── sockets/            # Socket.io server + event handlers
│   └── handlers/       # Presence, chat, reaction handlers
├── types/              # All TypeScript types and interfaces
├── utils/              # ApiError, ApiResponse, asyncHandler, logger, token
├── validations/        # Zod schemas
├── .env                # Environment variables
├── app.ts              # Express app setup
├── server.ts           # HTTP server entry point
└── tsconfig.json
```

---

## ⚙️ Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```env
PORT=5000
NODE_ENV=development

MONGO_URI=mongodb://localhost:27017/chatapp

JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLIENT_URL=http://localhost:3000

REDIS_URL=rediss://your-upstash-url:6380
REDIS_TOKEN=your_upstash_token

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Run in development

```bash
npm run dev
```

### 4. Build for production

```bash
npm run build
npm start
```

---

## 🌐 API Reference

> All protected routes require a valid JWT.
> Token is read from the `accessToken` HTTP-only cookie **or**
> the `Authorization: Bearer <token>` header.

### Base URL

```
http://localhost:5000/api
```

---

### 🔐 Auth

| Method | Endpoint              | Auth | Body                             | Description                |
| ------ | --------------------- | ---- | -------------------------------- | -------------------------- |
| POST   | /auth/signup          | ❌    | `{ name, email, password }`      | Register a new account     |
| POST   | /auth/login           | ❌    | `{ email, password }`            | Login and receive tokens   |
| POST   | /auth/refresh-token   | ❌    | *(cookie or `{ refreshToken }`)* | Rotate tokens              |
| POST   | /auth/logout          | ✅    | —                                | Revoke refresh token       |
| GET    | /auth/google          | ❌    | —                                | Initiate Google OAuth flow |
| GET    | /auth/google/callback | ❌    | —                                | Google OAuth callback      |

---

### 👤 Users

| Method | Endpoint               | Auth | Body / Params                  | Description              |
| ------ | ---------------------- | ---- | ------------------------------ | ------------------------ |
| GET    | /users/me              | ✅    | —                              | Get current user profile |
| PATCH  | /users/me              | ✅    | `{ name?, avatar? }`           | Update profile           |
| POST   | /users/me/avatar       | ✅    | `multipart/form-data → avatar` | Upload avatar            |
| POST   | /users/block/:targetId | ✅    | —                              | Block a user             |
| DELETE | /users/block/:targetId | ✅    | —                              | Unblock a user           |

---

### 💬 Chats

| Method | Endpoint                         | Auth | Body / Params                  | Description              |
| ------ | -------------------------------- | ---- | ------------------------------ | ------------------------ |
| GET    | /chats                           | ✅    | —                              | Get all chats            |
| GET    | /chats/:chatId                   | ✅    | —                              | Get a single chat        |
| POST   | /chats/direct                    | ✅    | `{ targetUserId }`             | Create/fetch direct chat |
| POST   | /chats/group                     | ✅    | `{ name, members[], avatar? }` | Create group chat        |
| POST   | /chats/:chatId/members           | ✅    | `{ members[] }`                | Add members              |
| DELETE | /chats/:chatId/members/:memberId | ✅    | —                              | Remove member            |

---

### ✉️ Messages

| Method | Endpoint                       | Auth | Body / Query                   | Description     |
| ------ | ------------------------------ | ---- | ------------------------------ | --------------- |
| GET    | /chats/:chatId/messages        | ✅    | `?cursor=<id>&limit=30`        | Fetch messages  |
| POST   | /chats/:chatId/messages        | ✅    | `{ content, type?, replyTo? }` | Send message    |
| POST   | /chats/:chatId/messages/image  | ✅    | `multipart/form-data → image`  | Send image      |
| PATCH  | /chats/:chatId/messages/read   | ✅    | —                              | Mark as read    |
| DELETE | /messages/:messageId           | ✅    | —                              | Soft delete     |
| POST   | /messages/:messageId/reactions | ✅    | `{ emoji }`                    | Toggle reaction |

#### Message Pagination

```
First load  → GET /chats/:id/messages
Scroll up   → GET /chats/:id/messages?cursor=<nextCursor>
Realtime    → Socket.io
```

---

### 🚩 Reports

| Method | Endpoint           | Auth    | Body / Query                                     | Description      |
| ------ | ------------------ | ------- | ------------------------------------------------ | ---------------- |
| POST   | /reports           | ✅       | `{ targetType, targetId, reason, description? }` | Submit report    |
| GET    | /reports/mine      | ✅       | —                                                | Get your reports |
| GET    | /reports           | ✅ Admin | `?status&page&limit`                             | Get all reports  |
| PATCH  | /reports/:reportId | ✅ Admin | `{ status }`                                     | Update status    |

**Report reasons:** `spam`, `harassment`, `hate_speech`, `inappropriate_content`, `other`

**Report statuses:** `pending`, `reviewed`, `resolved`, `dismissed`

---

### ❤️ Health Check

| Method | Endpoint | Description           |
| ------ | -------- | --------------------- |
| GET    | /health  | Server + uptime check |

---

## 🔌 Socket.io Reference

### Connection

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true,
  auth: { token: "<accessToken>" },
});
```

### Events — Client → Server

| Event          | Payload                | Description    |
| -------------- | ---------------------- | -------------- |
| chat:join      | chatId                 | Join room      |
| chat:leave     | chatId                 | Leave room     |
| message:send   | `{ chatId, content }`  | Send message   |
| message:delete | `{ messageId }`        | Delete message |
| message:read   | `{ chatId }`           | Mark read      |
| message:react  | `{ messageId, emoji }` | React          |
| typing:start   | `{ chatId }`           | Typing start   |
| typing:stop    | `{ chatId }`           | Typing stop    |

### Events — Server → Client

| Event            | Payload         | Description     |
| ---------------- | --------------- | --------------- |
| message:new      | IMessage        | New message     |
| message:deleted  | `{ messageId }` | Deleted         |
| message:read     | `{ chatId }`    | Read receipt    |
| message:reaction | `{ messageId }` | Reaction update |
| user:online      | `{ userId }`    | Online          |
| user:offline     | `{ userId }`    | Offline         |
| typing:start     | `{ chatId }`    | Typing          |
| typing:stop      | `{ chatId }`    | Stop typing     |
| error            | `{ message }`   | Error           |

---

## 🏗 Architecture

```
Request → Route → Middleware → Controller → Service → Repository → MongoDB
                                         ↓
                                      Socket.io → Redis pub/sub → All instances
                                         ↓
                                       Redis cache
```

---

## 🔐 Security Notes

* Passwords hashed with bcrypt (12 rounds)
* Access tokens expire in 15 minutes
* Refresh tokens expire in 7 days
* Refresh tokens are rotated and revoked on logout
* Tokens stored in HTTP-only cookies
* Zod validation on all requests
* Helmet for secure headers
* Rate limiting enabled
* MongoDB query sanitization enabled

---

## 📜 Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
npm run lint:fix
npm run format
```
