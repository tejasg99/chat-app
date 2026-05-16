# Chat2vent — React Native (Expo) Android App Implementation Plan

Backend: `http://<LAN_IP>:5000/api` · Socket: `http://<LAN_IP>:5000`

---

## Tech Stack

| Layer | Library | Version |
|---|---|---|
| Framework | Expo (managed workflow) | SDK 53 |
| Language | TypeScript | 5.x |
| Navigation | Expo Router (file-based) | v4 |
| State (client) | Zustand + `zustand/middleware` persist | 5.x |
| Server state | TanStack React Query | 5.x |
| HTTP client | Axios | 1.x |
| Real-time | socket.io-client | 4.x |
| Secure storage | expo-secure-store | ~14.x |
| Image handling | expo-image-picker, expo-image | latest |
| Forms | react-hook-form + @hookform/resolvers + zod | latest |
| Fonts | expo-font (Manrope + Inter via Google Fonts) | latest |
| Notifications | expo-notifications | latest |
| Haptics | expo-haptics | latest |
| Styling | React Native StyleSheet + design tokens | — |

---

## Backend Changes Required for Mobile App (Auth Token Handling)

> [!IMPORTANT]
> **Problem:** The web client relies on HTTP-only cookies (`accessToken`, `refreshToken`) set via `res.cookie()`. React Native's `fetch`/Axios does **not** reliably handle HTTP-only cookies — there is no browser cookie jar. `withCredentials: true` is a browser-only concept.

### Current Backend Auth Flow (Web)
1. Login/Signup → server sets `accessToken` & `refreshToken` as HTTP-only cookies.
2. Passport JWT strategy extracts token from `req.cookies.accessToken` first, then falls back to `Authorization: Bearer`.
3. Refresh endpoint reads `req.cookies.refreshToken`, with `req.body.refreshToken` as fallback.
4. Socket auth reads cookie header, with `socket.handshake.auth.token` as fallback.

### What Already Works ✅
The backend **already has Bearer token fallbacks** in place:
- **Passport JWT** (`config/passport.ts` L13-16): Uses `ExtractJwt.fromExtractors` — tries cookie first, then `Authorization: Bearer` header. ✅
- **Refresh endpoint** (`controllers/auth.controller.ts` L72): `req.cookies?.refreshToken ?? req.body?.refreshToken`. ✅
- **Socket auth** (`sockets/index.ts` L55-60): `socket.handshake.auth?.token ?? cookie-parse fallback`. ✅
- **Login/Signup responses** already return `accessToken` in the JSON body. ✅

#### Return `refreshToken` in the JSON Response Body
Added refreshToken to JSON response body in signup, login, and refreshToken handlers. Updated googleCallback to detect ?state=mobile and redirect to chat2vent:// deep link with tokens.

#### How the Google OAuth Deep Link Flow Works Now
1. Native app opens http://<LAN_IP>:5000/api/auth/google?platform=mobile in an in-app browser.
2. The route passes state: "mobile" to Google's OAuth flow.
3. After Google auth, the callback detects req.query.state === "mobile".
4. Instead of redirecting to the web client, it redirects to chatapp://auth/success?accessToken=...&refreshToken=....
5. The native app intercepts the deep link, extracts tokens, saves to SecureStore.

All other API endpoints already support `Authorization: Bearer <token>` via the Passport JWT strategy. No further route changes needed.

---

## App Directory Structure

```
app/                          # Expo Router (file-based routing)
├── _layout.tsx               # Root layout: providers (QueryClient, fonts, splash)
├── (auth)/
│   ├── _layout.tsx           # Auth layout: redirect if logged in
│   ├── login.tsx             # Login screen
│   └── signup.tsx            # Signup screen
├── (main)/
│   ├── _layout.tsx           # Main layout: auth guard, socket init, tab navigator
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Bottom tab bar layout
│   │   ├── chats.tsx         # Chat list screen
│   │   └── profile.tsx       # Profile/settings screen
│   └── chat/
│       └── [chatId].tsx      # Chat conversation screen (pushed on top, not tab)
│
components/
├── auth/
│   ├── LoginForm.tsx
│   └── SignupForm.tsx
├── chat/
│   ├── ChatList.tsx
│   ├── ChatListItem.tsx
│   ├── ChatHeader.tsx
│   ├── MessageList.tsx
│   ├── MessageBubble.tsx
│   ├── MessageInput.tsx
│   ├── TypingIndicator.tsx
│   ├── ReplyPreview.tsx
│   └── ReactionPicker.tsx
├── modals/
│   ├── NewDirectChatModal.tsx
│   ├── NewGroupChatModal.tsx
│   ├── AddMembersModal.tsx
│   ├── ReportModal.tsx
│   └── EditProfileModal.tsx
├── user/
│   ├── UserAvatar.tsx
│   └── ProfilePanel.tsx
├── shared/
│   ├── EmptyState.tsx
│   ├── LoadingSkeleton.tsx
│   └── ImagePickerButton.tsx
│
lib/
├── axios.ts                  # Axios instance with Bearer token interceptors
├── socket.ts                 # Socket.io singleton with auth token
├── queryClient.ts            # TanStack Query client
├── secureStore.ts            # expo-secure-store helpers (get/set/delete tokens)
│
stores/
├── authStore.ts              # Zustand: user, tokens, isAuthenticated
├── chatStore.ts              # Zustand: chats, activeChat
├── messageStore.ts           # Zustand: messages record
├── presenceStore.ts          # Zustand: onlineUsers set
│
hooks/
├── useAuth.ts                # Login/signup mutations, auto-hydrate
├── useSocket.ts              # Socket connection lifecycle
├── useMessages.ts            # Infinite query for messages
├── useTyping.ts              # Typing indicators
├── useOnlinePresence.ts      # Online/offline listeners
├── useReactions.ts           # Reaction toggle
│
types/
├── index.ts                  # Mirrored from client/types (same interfaces)
│
validations/
├── index.ts                  # Zod schemas (signup, login)
│
theme/
├── colors.ts                 # DESIGN.md color tokens
├── typography.ts             # Font families, sizes, weights
├── spacing.ts                # 4/8/12/16/20/24px scale
├── shadows.ts                # Tonal shadow presets
├── index.ts                  # Re-export all tokens
```

---

## Phase 1 — Project Setup & Foundation

### Goal
Bootstrap Expo project, install dependencies, set up design tokens, configure Axios with Bearer auth, Socket.io singleton, Zustand stores, and SecureStore.

### Steps

1. **Initialize Expo project:**
   ```bash
   npx create-expo-app@latest ./ --template blank-typescript
   ```

2. **Install dependencies:**
   ```bash
   npx expo install expo-router expo-secure-store expo-image expo-image-picker expo-font expo-haptics expo-notifications expo-splash-screen expo-status-bar react-native-safe-area-context react-native-screens react-native-gesture-handler react-native-reanimated
   npm install zustand @tanstack/react-query axios socket.io-client zod react-hook-form @hookform/resolvers date-fns
   npm install @expo-google-fonts/manrope @expo-google-fonts/inter
   ```

3. **Create files:**

   | File | Purpose |
   |---|---|
   | `theme/colors.ts` | All DESIGN.md color tokens as a JS object |
   | `theme/typography.ts` | Manrope (headlines) + Inter (body) font config |
   | `theme/spacing.ts` | 4px grid spacing scale |
   | `theme/shadows.ts` | Tonal shadows (no harsh drop-shadows) |
   | `theme/index.ts` | Re-export |
   | `lib/secureStore.ts` | Wrappers: `saveTokens()`, `getTokens()`, `clearTokens()` using `expo-secure-store` |
   | `lib/axios.ts` | Axios instance, request interceptor attaches `Authorization: Bearer` from Zustand, response interceptor handles 401 → refresh with body `{ refreshToken }` → save new tokens to SecureStore |
   | `lib/socket.ts` | `io()` singleton, `auth: { token }` from Zustand, no cookies |
   | `lib/queryClient.ts` | TanStack `QueryClient` defaults |
   | `stores/authStore.ts` | Zustand store, `persist` middleware using SecureStore adapter |
   | `stores/chatStore.ts` | Same as web client |
   | `stores/messageStore.ts` | Same as web client |
   | `stores/presenceStore.ts` | Same as web client |
   | `types/index.ts` | Copy from `client/types/index.ts` |
   | `validations/index.ts` | Zod schemas: `signupSchema`, `loginSchema` |
   | `app/_layout.tsx` | Root layout: load fonts, splash screen, `QueryClientProvider` |

### Key Differences from Web Client
- **Token storage:** `expo-secure-store` instead of browser `localStorage`/cookies.
- **Zustand persist:** Custom storage adapter wrapping SecureStore (async).
- **Axios interceptors:** Sends `refreshToken` in the request body, not relying on cookies.
- **Socket auth:** `auth: { token: accessToken }` in handshake, not `withCredentials`.

---

## Phase 2 — Auth Screens

### Goal
Build Login and Signup screens matching the design system.

### Screens
- `app/(auth)/_layout.tsx` — Stack layout, redirect to `/chats` if already authenticated.
- `app/(auth)/login.tsx` — Login screen.
- `app/(auth)/signup.tsx` — Signup screen.

### Components
- `components/auth/LoginForm.tsx` — Email + password, react-hook-form + zod.
- `components/auth/SignupForm.tsx` — Name + email + password.

### API Endpoints
| Action | Method | Endpoint |
|---|---|---|
| Signup | `POST` | `/api/auth/signup` |
| Login | `POST` | `/api/auth/login` |
| Get Profile | `GET` | `/api/users/me` |
| Refresh Token | `POST` | `/api/auth/refresh-token` (body: `{ refreshToken }`) |

### Auth Flow (Native)
1. User submits login/signup form.
2. Server returns `{ accessToken, refreshToken, user }` in JSON body.
3. Save both tokens to `expo-secure-store`.
4. Set tokens in Zustand `authStore`.
5. Axios interceptor auto-attaches `Authorization: Bearer <accessToken>`.
6. Navigate to `(main)/chats`.

### Google OAuth (Native)
- Use `expo-auth-session` or open an in-app browser to `http://<LAN_IP>:5000/api/auth/google?platform=mobile`.
- Server passes `state=mobile` through the Google OAuth flow.
- On callback, the server detects `state === "mobile"` and redirects to `chatapp://auth/success?accessToken=...&refreshToken=...`.
- Native app intercepts the deep link → parse tokens → save to SecureStore → navigate to chats.

---

## Phase 3 — Chat List

### Goal
Display all user chats with real-time updates, new chat creation.

### Screens
- `app/(main)/_layout.tsx` — Auth guard, socket connect, hydrate user via `GET /users/me`.
- `app/(main)/(tabs)/_layout.tsx` — Bottom tabs (Chats, Profile).
- `app/(main)/(tabs)/chats.tsx` — Chat list screen.

### Components
| Component | Description |
|---|---|
| `ChatList.tsx` | `FlatList` rendering chat items, pull-to-refresh |
| `ChatListItem.tsx` | Avatar, name, last message preview, timestamp, unread badge |
| `UserAvatar.tsx` | Reusable avatar with online indicator dot |
| `NewDirectChatModal.tsx` | User search + create DM |
| `NewGroupChatModal.tsx` | Multi-select users + group name |

### API Endpoints
| Action | Method | Endpoint |
|---|---|---|
| Get Chats | `GET` | `/api/chats` |
| Create DM | `POST` | `/api/chats/direct` |
| Create Group | `POST` | `/api/chats/group` |
| Search Users | `GET` | `/api/users/search?q=` |

### Hooks
- `useAuth.ts` — Wrap `GET /users/me`, handle token hydration on app start.
- `useSocket.ts` — Connect socket in main layout, clean up on unmount.

### Socket Events (Listen)
- `chat:new` → add to chat list
- `message:new` → update last message preview + move chat to top
- `user:online` / `user:offline` → update presence dots

---

## Phase 4 — Chat Conversation

### Goal
Full messaging experience: message list, send text, infinite scroll, typing indicators.

### Screens
- `app/(main)/chat/[chatId].tsx` — Conversation screen (stack push from chat list).

### Components
| Component | Description |
|---|---|
| `ChatHeader.tsx` | Back button, chat name/avatar, online status, group members count |
| `MessageList.tsx` | Inverted `FlatList`, infinite scroll (cursor-based), date separators |
| `MessageBubble.tsx` | Sent/received styling per DESIGN.md, reply preview, image messages |
| `MessageInput.tsx` | `TextInput` with send button, reply bar, image picker |
| `TypingIndicator.tsx` | Animated dots when other user is typing |
| `ReplyPreview.tsx` | Inline preview bar when replying to a message |

### API Endpoints
| Action | Method | Endpoint |
|---|---|---|
| Get Messages | `GET` | `/api/chats/:chatId/messages?cursor=&limit=30` |
| Send Message | `POST` | `/api/chats/:chatId/messages` |
| Send Image | `POST` | `/api/chats/:chatId/messages/image` (multipart/form-data) |
| Mark as Read | `PATCH` | `/api/chats/:chatId/messages/read` |
| Delete Message | `DELETE` | `/api/messages/:messageId` |

### Hooks
- `useMessages.ts` — TanStack infinite query with cursor pagination.
- `useTyping.ts` — Emit/listen `typing:start` and `typing:stop` with debounce.

### Socket Events
| Event | Direction | Purpose |
|---|---|---|
| `message:send` | Emit | Send text message |
| `message:new` | Listen | Receive new message |
| `message:delete` | Emit/Listen | Delete message |
| `message:read` | Emit/Listen | Read receipts |
| `typing:start` | Emit/Listen | Typing indicator |
| `typing:stop` | Emit/Listen | Typing stopped |
| `chat:join` | Emit | Join chat room on screen open |
| `chat:leave` | Emit | Leave chat room on screen close |

### Native APIs
- `expo-image-picker` — Pick images for image messages.
- `expo-haptics` — Haptic feedback on send.
- `Keyboard` API — Handle keyboard avoidance for input.

---

## Phase 5 — Reactions, Replies & Group Management

### Goal
Add emoji reactions, reply-to functionality, group member management.

### Components
- `ReactionPicker.tsx` — Emoji picker (long-press on message bubble).
- `AddMembersModal.tsx` — Add users to existing group.
- Enhanced `MessageBubble.tsx` — Show reaction badges, reply context.

### API Endpoints
| Action | Method | Endpoint |
|---|---|---|
| Toggle Reaction | `POST` | `/api/messages/:messageId/reactions` |
| Add Members | `POST` | `/api/chats/:chatId/members` |
| Remove Member | `DELETE` | `/api/chats/:chatId/members/:memberId` |

### Socket Events
- `message:reaction` → Listen — update reaction display in real time.
- `message:react` → Emit — send reaction.

### Hooks
- `useReactions.ts` — Optimistic updates for reaction toggling.

---

## Phase 6 — Profile & Settings

### Goal
User profile view/edit, avatar upload, block/unblock users, report.

### Screens
- `app/(main)/(tabs)/profile.tsx` — Profile tab screen.

### Components
| Component | Description |
|---|---|
| `ProfilePanel.tsx` | Display name, email, avatar, member since |
| `EditProfileModal.tsx` | Edit name, upload avatar |
| `ImagePickerButton.tsx` | Reusable image picker trigger |
| `ReportModal.tsx` | Report user/message form |

### API Endpoints
| Action | Method | Endpoint |
|---|---|---|
| Get Profile | `GET` | `/api/users/me` |
| Update Profile | `PATCH` | `/api/users/me` |
| Upload Avatar | `POST` | `/api/users/me/avatar` (multipart/form-data) |
| Block User | `POST` | `/api/users/block/:targetId` |
| Unblock User | `DELETE` | `/api/users/block/:targetId` |
| Submit Report | `POST` | `/api/reports` |
| My Reports | `GET` | `/api/reports/mine` |
| Logout | `POST` | `/api/auth/logout` |

### Native APIs
- `expo-image-picker` — Avatar photo selection.

---

## Phase 7 — Polish & Production Readiness

### Goal
Loading states, error handling, animations, performance, UX polish.

### Tasks
- **Loading skeletons:** Chat list, message list, profile.
- **Empty states:** No chats yet, no messages yet (use Manrope `display-lg` per DESIGN.md).
- **Error boundaries:** Network error screens, retry buttons.
- **Animations:** Use `react-native-reanimated` for:
  - Message bubble entrance (fade + slide).
  - Chat list item swipe actions (if needed).
  - Typing indicator dot animation.
  - Modal transitions.
- **Keyboard handling:** `KeyboardAvoidingView` for chat input.
- **Pull-to-refresh:** On chat list.
- **Push notifications:** `expo-notifications` — register token, handle incoming.
- **App icon & splash screen:** Branded with design system colors.

---

## Design System Adaptation (from DESIGN.md)

### Colors (Native Token Map)
```ts
export const colors = {
  primary: "#9d4300",
  primaryContainer: "#f97316",
  secondary: "#a73a00",
  secondaryContainer: "#fd651e",
  tertiary: "#006398",
  tertiaryContainer: "#00a2f4",
  background: "#f9f9ff",
  surface: "#f9f9ff",
  surfaceVariant: "#dce2f7",
  error: "#ba1a1a",
  onPrimary: "#ffffff",
  onSecondary: "#ffffff",
  onTertiary: "#ffffff",
  onBackground: "#141b2b",
  onSurface: "#141b2b",
  onSurfaceVariant: "#584237",
};
```

### Typography
- **Headlines:** Manrope (geometric, authoritative).
- **Body / Labels:** Inter (legible at small scales).
- Contact names: `title-md` (Inter, Medium, 16px).
- Message content: `body-md` (Inter, Regular, 14px).
- Timestamps: `label-sm` (Inter, Medium, 11px).

### Key Design Rules for Native
1. **No borders.** Separate sections via background color shifts (`surface` vs `surfaceVariant`).
2. **No dividers in lists.** Use spacing (`12–16px` gaps) between items.
3. **Chat bubbles:** User → `primary` bg, `onPrimary` text. Other → `surfaceContainerHigh` bg. `borderRadius: 20`. No tails.
4. **Buttons:** `primary` bg, `borderRadius: 9999` (full pill).
5. **Inputs:** `surfaceContainerHighest` bg, no border. Focus ring: 2px `primary`.
6. **Shadows:** Use tonal layering, not harsh drop-shadows. `elevation: 0` in most cases. For modals: blur 40–60px, opacity 4–6%.
7. **Unread badges:** `secondary` bg, `label-sm` bold, asymmetric padding (4px V, 8px H).

---

## State Management Summary

| Store | Data | Persistence |
|---|---|---|
| `authStore` | `user`, `accessToken`, `refreshToken`, `isAuthenticated` | `expo-secure-store` (tokens only) |
| `chatStore` | `chats[]`, `activeChat` | Memory only |
| `messageStore` | `messages: Record<chatId, IMessage[]>` | Memory only |
| `presenceStore` | `onlineUsers: Set<userId>` | Memory only |

---

## API Endpoints — Full Reference

### Auth
| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/signup` | Create account |
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/refresh-token` | Refresh tokens (body: `{ refreshToken }`) |
| `POST` | `/api/auth/logout` | Logout |

### Users
| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/users/me` | Get profile |
| `PATCH` | `/api/users/me` | Update profile |
| `POST` | `/api/users/me/avatar` | Upload avatar |
| `GET` | `/api/users/search?q=` | Search users |
| `POST` | `/api/users/block/:targetId` | Block user |
| `DELETE` | `/api/users/block/:targetId` | Unblock user |

### Chats
| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/chats` | List user's chats |
| `GET` | `/api/chats/:chatId` | Get single chat |
| `POST` | `/api/chats/direct` | Create DM |
| `POST` | `/api/chats/group` | Create group |
| `POST` | `/api/chats/:chatId/members` | Add members |
| `DELETE` | `/api/chats/:chatId/members/:memberId` | Remove member |
| `PATCH` | `/api/chats/:chatId/avatar` | Update group avatar |

### Messages
| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/chats/:chatId/messages` | Get messages (cursor paginated) |
| `POST` | `/api/chats/:chatId/messages` | Send text message |
| `POST` | `/api/chats/:chatId/messages/image` | Send image message |
| `PATCH` | `/api/chats/:chatId/messages/read` | Mark as read |
| `DELETE` | `/api/messages/:messageId` | Delete message |
| `POST` | `/api/messages/:messageId/reactions` | Toggle reaction |

### Reports
| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/reports` | Submit report |
| `GET` | `/api/reports/mine` | Get my reports |

---

## Additional Notes & Suggestions

1. **Development Server Access:** Use `expo start` and connect via Expo Go or dev build on a physical Android device over the same LAN. Point the API URL to your machine's LAN IP (e.g., `http://192.168.x.x:5000/api`).

2. **Image Messages:** Use `expo-image-picker` to select from gallery or camera. Upload via `multipart/form-data` to the existing Cloudinary-backed endpoints.

3. **Push Notifications (Future):** Register the Expo push token with the backend. This requires a new endpoint on the server (`POST /api/users/me/push-token`). Mark as a post-MVP enhancement.

4. **Offline Support (Future):** Consider caching the last N messages per chat using MMKV or AsyncStorage for offline viewing. Post-MVP.

5. **Dark Mode:** The DESIGN.md defines a light-mode system. Dark mode adaptation can be a Phase 8 — map `surface` to `#111827`, etc.

6. **Testing:**
   - Run `npx expo start` after each phase.
   - Test on Android emulator + physical device.
   - Verify socket events match `ClientToServerEvents` / `ServerToClientEvents` in `server/types/index.ts`.

---

## Verification Plan

- After each phase, run `npx expo start` and test on an Android device/emulator.
- Verify auth flow: signup → login → token refresh → logout.
- Confirm socket events fire correctly (join room, receive message, typing, presence).
- Test image upload flow end-to-end.
- Validate design system: color tokens, typography, no-border rule, tonal layering.
