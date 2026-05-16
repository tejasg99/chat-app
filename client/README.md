# Real-Time Chat App — Frontend

The client-side of Chat2vent, a real-time messaging application. Built with Next.js 16 App Router, TypeScript, and Socket.io — designed around an "Architectural Whisper" philosophy: premium, editorial, and spatially intentional.

## 🚀 Tech Stack

| Area             | Choice                   | Reason                                 |
| ---------------- | -----------------------  | -------------------------------------- |
| Framework        | Next.js 16 (App Router)  | SSR for auth pages, file-based routing |
| Language         | TypeScript               | End-to-end type safety                 |
| Styling          | Tailwind CSS v4 + Shadcn | Design token system, pre-built accessible components |
| State            | Zustand                  | Lightweight, zero-boilerplate global state |
| Server-State     | TanStack Query v5        | Caching, pagination, background refetch    |
| Forms            | React Hook Form + Zod    | Shared schemas with backend |
| RealTime         | socket.io-client         | Communicates with backend Socket.io server directly |
| HTTP             | Axios                    | Interceptors for silent token refresh |
| Dates            | date-fns                 | Lightweight, tree-shakeable |

## ✨ Features

### Authentication

- Email/password signup and login with full Zod validation
- Google OAuth via backend redirect flow
- Silent JWT access-token refresh with race-condition-safe queue
- Cookie-based route protection via Next.js middleware

### Messaging

- Real-time send and receive via Socket.io
- Text and image messages (image upload via REST multipart)
- Reply-to-message with inline preview banner
- Delete own messages (replaced with "This message was deleted")
- Emoji reactions with optimistic updates and live sync
- Cursor-based infinite scroll for message history (scroll-position preserved on prepend)
- Typing indicators with 2-second inactivity debounce
- Read receipts emitted on open and on new message arrival

### Chats

- Direct messages and group chats
- Chat list with live last-message preview and unread count
- Real-time chat ordering (new messages bubble chat to top)
- New direct chat with user search
- New group chat with multi-member selection

### Groups

- View member list in a slide-in sheet
- Add members (admin only)
- Leave group

### Profiles

- View own profile — edit display name and upload avatar
- View other users' profiles (last seen, member since, online status)
- Block / unblock users
- Report users and individual messages (5 reason categories + optional description)

### Polish

- Skeleton loaders for chat list, message list, and chat window
- Contextual empty states (no chats, no messages, no chat selected)
- Error boundaries with try-again and page-reload options
- Custom 404 page
- Responsive layout (mobile: single-column, desktop: sidebar + chat panel)

## 📁 Project Structure
```text
client/
├── app/
│   ├── (auth)/                   # Login, signup — redirects if already authed
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (main)/                   # Protected — auth guard + socket init
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Redirects to /chats
│   │   └── chats/
│   │       ├── page.tsx          # Chat list + empty panel
│   │       └── [chatId]/page.tsx # Active chat window
│   ├── auth/success/page.tsx     # Google OAuth callback landing
│   ├── not-found.tsx
│   ├── layout.tsx                # Root layout — fonts, QueryClient, Toaster
│   └── globals.css               # Tailwind v4 theme + design tokens
│
├── components/
│   ├── auth/                     # LoginForm, SignupForm
│   ├── chat/                     # ChatList, ChatWindow, MessageBubble, etc.
│   ├── empty-states/             # EmptyChats, EmptyMessages, NoChatSelected
│   ├── modals/                   # NewDirect/Group/AddMembers/Report modals
│   ├── shared/                   # ErrorBoundary, ProtectedRoute, InfiniteScrollTrigger
│   ├── skeletons/                # ChatListSkeleton, MessageListSkeleton, ChatWindowSkeleton
│   ├── user/                     # UserAvatar, ProfilePanel, EditProfileModal
│   ├── providers.tsx             # QueryClientProvider + Toaster
│   └── ui/                       # Shadcn primitives
│
├── hooks/
│   ├── useAuth.ts
│   ├── useMessages.ts            # Cursor pagination logic
│   ├── useOnlinePresence.ts
│   ├── useReactions.ts           # Optimistic reaction toggle
│   ├── useSocket.ts
│   └── useTyping.ts              # Debounced typing events
│
├── lib/
│   ├── axios.ts                  # Axios instance + refresh interceptor
│   ├── queryClient.ts
│   └── socket.ts                 # Socket.io singleton
│
├── stores/
│   ├── authStore.ts              # User session + access token (persisted)
│   ├── chatStore.ts              # Chat list + active chat
│   ├── messageStore.ts           # Messages map keyed by chatId
│   └── presenceStore.ts          # Online users Set
│
├── types/index.ts                # All app types (mirrors backend, no Mongoose)
├── validations/index.ts          # Zod schemas (signup, login)
└── proxy.ts                      # Cookie-based route protection
```

## 🖌️ Design System
The UI follows the "Architectural Whisper" design philosophy — premium, editorial, and minimal
- **No borders** — areas are separated via background colour shifts (surface-container-low, surface-container, etc.), never 1px lines
- **Typography** — `Manrope` for headings, `Inter` for body and labels
- **Colours** — warm orange brand (`#9d4300` / `#f97316`) against a deep neutral base (`#f9f9ff` light, `#111827` dark)
- **Glassmorphism** — `backdrop-filter: blur(24px)` on floating elements only (modals, context menus)
- **Shadows** — ambient only: `0 20px 60px rgba(20,27,43,0.06)` — never combined with a background-colour shift on the same element
- **Dark mode** — full token set defined under `.dark` in globals.css

## ⚙️ Getting Started
### Prerequisites
- Node.js 20+
- Backend server running at http://localhost:5000

### Installation 
1. Install dependencies
```bash
npm install
```
2. Run
```bash
npm run dev
```
3. Open your browser Navigate to http://localhost:3000
