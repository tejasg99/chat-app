import { Request, Response } from "express";
import { toggleReactionService } from "../services/reaction.service.ts";
import { reactionSchema } from "../validations/chat.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";
import type { ServerToClientEvents } from "../types/index.ts";
import type { Server } from "socket.io";

// The io instance is injected here so the controller can broadcast
// reaction updates via Socket.io after the DB operation succeeds
let ioInstance: Server<ServerToClientEvents> | null = null;

export const setIoInstance = (io: Server): void => {
  ioInstance = io as Server<ServerToClientEvents>;
};

// ─── POST /api/messages/:messageId/reactions — Toggle a reaction ──────────────
export const toggleReaction = asyncHandler(async (req: Request, res: Response) => {
  const parsed = reactionSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { message, reactions } = await toggleReactionService({
    messageId: req.params.messageId as string,
    userId: req.user!._id.toString(),
    emoji: parsed.data.emoji,
  });

  // Broadcast the updated reactions to all members of the chat room
  if (ioInstance) {
    ioInstance.to(message.chat.toString()).emit("message:reaction", {
      messageId: message._id.toString(),
      chatId: message.chat.toString(),
      reactions,
    });
  }

  res.status(200).json(createApiResponse(200, "Reaction updated", { reactions }));
});
