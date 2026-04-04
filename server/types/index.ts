import { Request } from "express";
import { Document, Types } from "mongoose";

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: UserRole;
  isOnline: boolean;
  lastSeen: Date;
  googleId?: string;
  isBlocked: boolean;
  blockedUsers: Types.ObjectId[];
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Passport / Express namespace augmentation ────────────────────────────────
// This makes Express.User = IUser, so req.user is typed correctly everywhere
// without needing a separate AuthenticatedRequest interface
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends IUser {}
  }
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export interface JwtAccessPayload {
  userId: string;
  email: string;
}

export interface JwtRefreshPayload {
  userId: string;
}

// ─── Express ─────────────────────────────────────────────────────────────────

// AuthenticatedRequest no longer needs to redefine user —
// it now inherits the correct type from the namespace augmentation above
export interface AuthenticatedRequest extends Request {
  user?: IUser; // IUser now matches Express.User via the augmentation
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── User Update ─────────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export type ChatType = "direct" | "group";

export interface IChat extends Document {
  _id: Types.ObjectId;
  type: ChatType;
  name?: string; // only for group chats
  avatar?: string; // only for group chats
  members: Types.ObjectId[];
  admins: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdBy: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Message ─────────────────────────────────────────────────────────────────

export type MessageType = "text" | "image" | "system";

export interface IReaction {
  emoji: string;
  reactedBy: Types.ObjectId[];
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  type: MessageType;
  replyTo?: Types.ObjectId;
  reactions: IReaction[];
  readBy: Types.ObjectId[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Chat Service Inputs ──────────────────────────────────────────────────────

export interface CreateDirectChatInput {
  currentUserId: string;
  targetUserId: string;
}

export interface CreateGroupChatInput {
  name: string;
  members: string[];
  createdBy: string;
  avatar?: string;
}

export interface SendMessageInput {
  chatId: string;
  senderId: string;
  content: string;
  type?: MessageType;
  replyTo?: string;
}

export interface GetMessagesInput {
  chatId: string;
  userId: string;
  page?: number;
  limit?: number;
}

// ─── Socket ──────────────────────────────────────────────────────────────────

export interface SocketUser {
  userId: string;
  socketId: string;
}

export interface ServerToClientEvents {
  "message:new": (message: IMessage) => void;
  "message:deleted": (data: { messageId: string; chatId: string }) => void;
  "chat:new": (chat: IChat) => void;
  "user:online": (data: { userId: string }) => void;
  "user:offline": (data: { userId: string; lastSeen: Date }) => void;
  "typing:start": (data: { chatId: string; userId: string; name: string }) => void;
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
  "typing:start": (data: { chatId: string }) => void;
  "typing:stop": (data: { chatId: string }) => void;
  "chat:join": (chatId: string) => void;
  "chat:leave": (chatId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId: string;
  name: string;
  email: string;
}
