import { Request, Response } from "express";
import {
  sendMessageService,
  getMessagesService,
  deleteMessageService,
  markAsReadService,
} from "../services/message.service.ts";
import { sendMessageSchema, paginationSchema } from "../validations/chat.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";

// ─── GET /api/chats/:chatId/messages — Get paginated messages ─────────────────
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const parsed = paginationSchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const result = await getMessagesService({
    chatId: req.params.chatId as string,
    userId: req.user!._id.toString(),
    page: parsed.data.page,
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
