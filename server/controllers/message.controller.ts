import { Request, Response } from "express";
import type { Server } from "socket.io";
import {
  sendMessageService,
  getMessagesService,
  deleteMessageService,
  markAsReadService,
} from "../services/message.service.ts";
import { uploadImageService } from "../services/upload.service.ts";
import { sendMessageSchema, messagePaginationSchema } from "../validations/chat.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";
import { ApiError } from "../utils/ApiError.ts";
import type { ServerToClientEvents } from "../types/index.ts";

// ─── io injection ─────────────────────────────────────────────────────────────
// Injected after Socket.io initializes in sockets/index.ts
// Allows this REST controller to broadcast socket events
let ioInstance: Server<ServerToClientEvents> | null = null;

export const setMessageIoInstance = (io: Server): void => {
  ioInstance = io as Server<ServerToClientEvents>;
};

// ─── GET /api/chats/:chatId/messages ─────────────────────────────────────────
// Query params:
//   cursor  — _id of the oldest message the client has (omit for first load)
//   limit   — number of messages to fetch (default 30, max 50)
//
// Usage flow:
//   1. Open chat  → GET /messages              (no cursor)
//   2. Scroll up  → GET /messages?cursor=<id>  (cursor from previous response)
//   3. New msgs   → delivered via Socket.io, no polling needed
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const parsed = messagePaginationSchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const result = await getMessagesService({
    chatId: req.params.chatId as string,
    userId: req.user!._id.toString(),
    cursor: parsed.data.cursor,
    limit: parsed.data.limit,
  });

  res.status(200).json(createApiResponse(200, "Messages fetched", result));
});

// ─── POST /api/chats/:chatId/messages — Send a message via REST ───────────────
// Note: Real-time sending is done via Socket.io; this is a REST fallback
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const parsed = sendMessageSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const message = await sendMessageService({
    chatId: req.params.chatId as string,
    senderId: req.user!._id.toString(),
    content: parsed.data.content,
    type: parsed.data.type,
    replyTo: parsed.data.replyTo,
  });

  res.status(201).json(createApiResponse(201, "Message sent", message));
});

// ─── POST /api/chats/:chatId/messages/image ───────────────────────────────────
// Flow:
//   1. Multer parses the multipart body → file lands in req.file.buffer
//   2. Upload buffer to Cloudinary → get back a CDN URL
//   3. Save a message doc with type: "image" and the CDN URL as content
//   4. Broadcast the saved message to the chat room via Socket.io
//      so all connected members see the image in real time without polling
export const sendImageMessage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No image file provided");

  // Upload to Cloudinary first
  const uploadResult = await uploadImageService(req.file.buffer, "chat-app/messages");

  // Then create the message with the CDN URL as content
  const message = await sendMessageService({
    chatId: req.params.chatId as string,
    senderId: req.user!._id.toString(),
    content: uploadResult.url,
    type: "image",
    replyTo: req.body.replyTo,
  });

  // Broadcast to the chat room so real-time clients receive the image message
  // without needing a separate socket emit from the client side
  if (ioInstance) {
    ioInstance.to(req.params.chatId).emit("message:new", message);
  }

  res.status(201).json(createApiResponse(201, "Image message sent", message));
});

// ─── DELETE /api/messages/:messageId — Soft delete a message ─────────────────
export const deleteMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await deleteMessageService(
    req.params.messageId as string,
    req.user!._id.toString(),
  );

  res.status(200).json(createApiResponse(200, "Message deleted", message));
});

// ─── PATCH /api/chats/:chatId/messages/read — Mark all as read ───────────────
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  await markAsReadService(req.params.chatId as string, req.user!._id.toString());
  res.status(200).json(createApiResponse(200, "Messages marked as read"));
});
