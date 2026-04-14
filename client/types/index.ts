// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: UserRole;
  isOnline: boolean;
  lastSeen: string;
  googleId?: string;
  isBlocked: boolean;
  blockedUsers: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export type ChatType = "direct" | "group";

export interface IChat {
  _id: string;
  type: ChatType;
  name?: string;
  avatar?: string;
  members: IUser[]; // always populated from backend
  admins: string[];
  lastMessage?: IMessage; // always populated from backend
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export type MessageType = "text" | "image" | "system";

export interface IReaction {
  emoji: string;
  reactedBy: string[];
}

export interface IMessage {
  _id: string;
  chat: string;
  sender: Pick<IUser, "_id" | "name" | "avatar">;
  content: string;
  type: MessageType;
  replyTo?: Pick<IMessage, "_id" | "content" | "sender" | "type" | "isDeleted">;
  reactions: IReaction[];
  readBy: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedMessages {
  messages: IMessage[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

// ─── Report ──────────────────────────────────────────────────────────────────

export type ReportReason =
  | "spam"
  | "harassment"
  | "hate_speech"
  | "inappropriate_content"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";
export type ReportTargetType = "user" | "message";

export interface IReport {
  _id: string;
  reportedBy: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Socket ──────────────────────────────────────────────────────────────────

export interface ReadReceiptPayload {
  chatId: string;
  userId: string;
  messageIds: string[];
  readAt: string;
}

export interface ServerToClientEvents {
  "message:new": (message: IMessage) => void;
  "message:deleted": (data: { messageId: string; chatId: string }) => void;
  "message:reaction": (data: {
    messageId: string;
    chatId: string;
    reactions: IReaction[];
  }) => void;
  "message:read": (data: ReadReceiptPayload) => void;
  "chat:new": (chat: IChat) => void;
  "user:online": (data: { userId: string }) => void;
  "user:offline": (data: { userId: string; lastSeen: string }) => void;
  "typing:start": (data: {
    chatId: string;
    userId: string;
    name: string;
  }) => void;
  "typing:stop": (data: { chatId: string; userId: string }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  "message:send": (data: {
    chatId: string;
    content: string;
    type?: MessageType;
    replyTo?: string;
  }) => void;
  "message:delete": (data: { messageId: string; chatId: string }) => void;
  "message:read": (data: { chatId: string }) => void;
  "message:react": (data: {
    messageId: string;
    chatId: string;
    emoji: string;
  }) => void;
  "typing:start": (data: { chatId: string }) => void;
  "typing:stop": (data: { chatId: string }) => void;
  "chat:join": (chatId: string) => void;
  "chat:leave": (chatId: string) => void;
}
