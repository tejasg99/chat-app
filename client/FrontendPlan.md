# Real-Time Chat App — Frontend Plan

## Tech Stack
```text
| Area	          |    	Choice		     |		Reason
| Framework       |  Next.js 16 (App Router) |	SSR for auth pages, easy routing
| Language  	  |  TypeScript	             |  Consistent with backend
| State Management|  Zustand		     |	Lightweight, no boilerplate
| Server State	  |  TanStack Query v5	     |	Caching, pagination, refetch
| Forms	          |  React Hook Form + Zod   |	Same Zod schemas as backend
| Socket Client	  |  socket.io-client	     |	Matches backend exactly
| HTTP Client	  |  Axios		     |	Interceptors for token refresh
| File Uploads	  |  Native FormData	     |	Simple, no extra lib needed
| Real-time Dates |  date-fns		     |	Lightweight date formatting
| Components	  |  Shadcn		     |	Pre built components for rapid building
| Styling	  |  Tailwind CSS v4 	     |	Comes inbuilt with next js
```
## Project Structure (for reference you can change it as per the need)
```text

ChatApp/client/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # Redirect if already logged in
│   ├── (main)/
│   │   ├── layout.tsx            # Auth guard + socket init
│   │   ├── page.tsx              # Redirect to /chats
│   │   └── chats/
│   │       ├── page.tsx          # Chat list (empty state if none)
│   │       └── [chatId]/
│   │           └── page.tsx      # Active chat window
│   └── auth/
│       └── success/
│           └── page.tsx          # Google OAuth redirect landing
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── chat/
│   │   ├── ChatList.tsx          # Left sidebar
│   │   ├── ChatListItem.tsx      # Single chat preview
│   │   ├── ChatWindow.tsx        # Right panel
│   │   ├── ChatHeader.tsx        # Name, avatar, online status
│   │   ├── MessageBubble.tsx     # Single message
│   │   ├── MessageList.tsx       # Scrollable message container
│   │   ├── MessageInput.tsx      # Text input + send button
│   │   ├── TypingIndicator.tsx
│   │   ├── ReplyPreview.tsx      # Banner above input when replying
│   │   └── ReactionPicker.tsx    # Emoji picker popover
│   ├── modals/
│   │   ├── NewDirectChatModal.tsx
│   │   ├── NewGroupChatModal.tsx
│   │   ├── AddMembersModal.tsx
│   │   └── ReportModal.tsx
│   ├── user/
│   │   ├── UserAvatar.tsx        # Avatar with online dot
│   │   ├── ProfilePanel.tsx      # Right sidebar on chat info click
│   │   └── EditProfileModal.tsx
│   └── shared/
│       ├── ProtectedRoute.tsx
│       ├── ImageUploadButton.tsx
│       └── InfiniteScrollTrigger.tsx  # Intersection observer for cursor pagination
├── lib/
│   ├── axios.ts                  # Axios instance + interceptors
│   ├── socket.ts                 # Socket.io client singleton
│   └── queryClient.ts            # TanStack Query client config
├── hooks/
│   ├── useAuth.ts
│   ├── useSocket.ts
│   ├── useMessages.ts            # Cursor pagination logic
│   ├── useTyping.ts              # Debounced typing events
│   ├── useOnlinePresence.ts
│   └── useReactions.ts
├── stores/
│   ├── authStore.ts              # User session, tokens
│   ├── chatStore.ts              # Active chat, chat list
│   ├── messageStore.ts           # Messages map by chatId
│   └── presenceStore.ts          # Online users Set
├── types/
│   └── index.ts                  # Mirror backend types (no mongoose)
├── validations/
│   └── index.ts                  # Zod schemas (same as backend)
└── middleware.ts                  # Next.js middleware for route protection
```

## Types to Mirror from Backend
- Create these in types/index.ts — strip Mongoose Document extends, use plain interfaces:
- Refer to the backend types file at ChatApp/server/types/index.ts for more details
```typescript

// Key differences from backend types:
// - No extends Document
// - _id is string (serialized from ObjectId)
// - Dates are string (serialized from Date)

interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "user" | "admin";
  isOnline: boolean;
  lastSeen: string;
  isBlocked: boolean;
  blockedUsers: string[];
}

interface IChat {
  _id: string;
  type: "direct" | "group";
  name?: string;
  avatar?: string;
  members: IUser[];        // always populated from backend
  admins: string[];
  lastMessage?: IMessage;  // always populated from backend
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IMessage {
  _id: string;
  chat: string;
  sender: Pick<IUser, "_id" | "name" | "avatar">;
  content: string;
  type: "text" | "image" | "system";
  replyTo?: Pick<IMessage, "_id" | "content" | "sender" | "type" | "isDeleted">;
  reactions: { emoji: string; reactedBy: string[] }[];
  readBy: string[];
  isDeleted: boolean;
  createdAt: string;
}

interface PaginatedMessages {
  messages: IMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}
```
##  Pages & Feature Breakdown

### 1. Auth Pages (/login and /signup)

| Feature                 | API               | Notes                                                              |
| ----------------------- | ----------------- | ------------------------------------------------------------------ |
| Signup form             | POST /auth/signup | name, email, password — same Zod schema as backend                 |
| Login form              | POST /auth/login  | email, password                                                    |
| Google OAuth button     | GET /auth/google  | Simple link/redirect — no Axios needed                             |
| Token storage           | —                 | Cookies set by backend automatically, store accessToken in Zustand |
| Redirect after auth     | —                 | Push to /chats on success                                          |
| Google callback landing | GET /auth/success | Page reads cookie, fetches /users/me, hydrates store               |

**Validation:** Mirror backend Zod schemas exactly — same error messages.

---

### 2. Chat List — /chats

| Feature                      | API                         | Notes                                                                                |
| ---------------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| Fetch all chats              | GET /chats                  | On mount via TanStack Query                                                          |
| Display last message preview | —                           | From lastMessage in chat object                                                      |
| Unread count                 | —                           | Count messages where readBy doesn't include current user — derive from message store |
| New direct chat              | POST /chats/direct          | Open modal → search user via GET /users/search?q=                                    |
| New group chat               | POST /chats/group           | Modal with name + member selection                                                   |
| Online indicator             | —                           | Cross-reference members[0] with presenceStore                                        |
| Real-time last message       | —                           | Socket message:new → chatStore.updateLastMessage + moveToTop                         |
| Update group avatar          | PATCH /chats/:chatId/avatar | Only admins can change (enforced in backend)                                         |

---

### 3. Chat Window — /chats/[chatId]

#### Initial Load

| Feature          | API                                               | Notes                           |
| ---------------- | ------------------------------------------------- | ------------------------------- |
| Fetch chat info  | GET /chats/:chatId                                | Members, name, avatar           |
| Fetch messages   | GET /chats/:chatId/messages                       | No cursor — first load          |
| Join socket room | chat:join                                         | Emit after chat info loads      |
| Mark as read     | PATCH /chats/:chatId/messages/read + message:read | Call on open and on new message |

#### Messaging

| Feature            | API / Event                                         | Notes                                                      |
| ------------------ | --------------------------------------------------- | ---------------------------------------------------------- |
| Send text message  | Socket message:send                                 | Primary path — REST fallback                               |
| Send image message | POST /chats/:chatId/messages/image                  | Multipart — REST only                                      |
| Display image      | —                                                   | Render <img src={message.content} /> when type === "image" |
| Receive message    | Socket message:new                                  | Append + scroll to bottom                                  |
| Delete message     | Socket message:delete                               | Only for own messages                                      |
| Receive deletion   | Socket message:deleted                              | Replace with "This message was deleted"                    |
| Reply to message   | Socket message:send (replyTo)                       | Show reply preview                                         |
| Reactions          | Socket message:react / POST /messages/:id/reactions | Toggle on hover/long press                                 |
| Receive reaction   | Socket message:reaction                             | Update specific message                                    |

#### Scroll & Pagination

| Feature                | API                                             | Notes                                    |
| ---------------------- | ----------------------------------------------- | ---------------------------------------- |
| Load older messages    | GET /chats/:chatId/messages?cursor=<nextCursor> | Triggered at top scroll                  |
| Prepend older messages | —                                               | Maintain scroll position                 |
| Scroll to bottom       | —                                               | Auto-scroll only if near bottom (~100px) |

#### Typing Indicators

| Event                | Notes                     |
| -------------------- | ------------------------- |
| Emit typing:start    | Debounced on input change |
| Emit typing:stop     | On clear or 2s inactivity |
| Receive typing:start | Show indicator            |
| Receive typing:stop  | Hide indicator            |

**Implementation note:** Use a custom hook with timer reset per keystroke.

#### Read Receipts

| Event                | Notes                               |
| -------------------- | ----------------------------------- |
| Emit message:read    | On open + new message (focused tab) |
| Receive message:read | Update readBy and show "Seen"       |

---

### 4. Group Chat Features

| Feature             | API                                     | Notes                          |
| ------------------- | --------------------------------------- | ------------------------------ |
| View members        | —                                       | From chat.members              |
| Add members (admin) | POST /chats/:chatId/members             | Only admins                    |
| Remove member       | DELETE /chats/:chatId/members/:memberId | Leave (self) or remove (admin) |
| Group avatar        | —                                       | Use chat.avatar                |

---

### 5. User Profile & Settings

| Feature            | API                           | Notes               |
| ------------------ | ----------------------------- | ------------------- |
| View own profile   | GET /users/me                 | Load on app start   |
| Edit name          | PATCH /users/me               | Inline edit         |
| Upload avatar      | POST /users/me/avatar         | multipart/form-data |
| View other profile | —                             | From chat.members   |
| Block user         | POST /users/block/:targetId   | From profile panel  |
| Unblock user       | DELETE /users/block/:targetId | From settings       |

---

### 6. Reporting

| Feature          | API               | Notes                 |
| ---------------- | ----------------- | --------------------- |
| Report user      | POST /reports     | targetType: "user"    |
| Report message   | POST /reports     | targetType: "message" |
| View own reports | GET /reports/mine | In settings           |

**Note:** Admin dashboard (/admin) can be added later with role-based access.


### 7. Next.js Middleware (now called proxy) — Route Protection
proxy.ts covers:
  /login, /signup  → if accessToken cookie exists → redirect to /chats
  /(main)/*        → if no accessToken cookie    → redirect to /login
Note: Middleware/proxy only checks cookie existence (fast, no network call).
Full user validation happens client-side on (main) layout mount
via GET /users/me — if that returns 401, trigger the refresh flow.

## Key Implementation Notes
1. Message ordering: Backend returns messages newest-first. Always .reverse() before storing/displaying. New socket messages are appended to the end (bottom).

2. Cursor pagination scroll: Before prepending older messages, save listRef.scrollHeight. After prepend, set scrollTop = newScrollHeight - savedScrollHeight to prevent the view jumping.

3. Socket singleton: Initialize once in (main)/layout.tsx. Pass via a React context or reference from the useSocket hook. Never create multiple instances.

4. Token refresh race condition: If multiple 401s fire simultaneously, use a flag + promise queue in the Axios interceptor so only one refresh call goes out — others wait and retry with the new token.

5. Optimistic updates on reactions: Update the message in the store immediately on emoji click, then let the socket message:reaction event confirm/correct it. Avoids visible lag.

6. Image messages: Upload via REST (POST .../messages/image), then emit message:send via socket with type: "image" so other users see it in real time — OR rely on the REST response and socket broadcast from the backend (which calls io.to(chatId).emit after saving). The latter is simpler — no double emit.

7. Blocked users: If a user is in currentUser.blockedUsers, hide their messages or show "Blocked user" placeholder. Do not show the direct chat option for blocked users.

8. user:online / user:offline: On app load, the presence store is empty. Derive initial online state from user.isOnline field in chat.members (populated by backend from MongoDB). Socket events keep it updated after that.

9. Group chat socket room on creation: When a new group chat is created via REST, the creator should emit chat:join immediately after to subscribe to its socket room.

## Development order - for reference
```text
Phase 1 — Foundation
  [ ] Axios instance + interceptors (with refresh logic)
  [ ] Socket singleton
  [ ] Zustand stores (auth, chat, message, presence)
  [ ] Next.js middleware (route protection)
  [ ] TanStack Query client setup

Phase 2 — Auth
  [ ] Signup page
  [ ] Login page
  [ ] Google OAuth button + /auth/success landing
  [ ] Hydrate authStore on app load (GET /users/me)

Phase 3 — Chat List
  [ ] ChatList sidebar
  [ ] NewDirectChatModal (needs user search — add backend endpoint first)
  [ ] NewGroupChatModal

Phase 4 — Chat Window
  [ ] MessageList with initial load
  [ ] MessageBubble (text, image, deleted states)
  [ ] MessageInput + send via socket
  [ ] Real-time receive via socket
  [ ] Cursor pagination on scroll up
  [ ] Typing indicators
  [ ] Read receipts

Phase 5 — Advanced Features
  [ ] Reactions (picker + toggle + real-time update)
  [ ] Reply to message
  [ ] Image message upload
  [ ] Delete message

Phase 6 — Profile & Settings
  [ ] View / edit own profile
  [ ] Avatar upload
  [ ] View other user profile panel
  [ ] Block / unblock
  [ ] Report user / message

Phase 7 — Polish
  [ ] Empty states (no chats, no messages)
  [ ] Loading skeletons
  [ ] Error boundaries
  [ ] Toast notifications for errors
  [ ] Mobile responsive layout
```

## Additional Instructions
- Refer to the backend code in ChatApp/server in case you are not sure of something
- Make sure the frontend and backend integration is fully functional
- Make no mistakes
- DO NOT one shot it, develop the frontend phase by phase and ask before proceeding to the next one.