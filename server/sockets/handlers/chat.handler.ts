import type { Server, Socket } from "socket.io";
import { sendMessageService, deleteMessageService } from "../../services/message.service.ts";
import { isChatMember } from "../../repositories/chat.repository.ts";
import { logger } from "../../utils/logger.ts";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../../types/index.ts";

type IoType = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const registerChatHandlers = (io: IoType, socket: SocketType): void => {
  const userId = socket.data.userId;

  // ─── Join a chat room ─────────────────────────────────────────────────────
  // Client emits this after opening a chat to subscribe to its messages
  socket.on("chat:join", async (chatId) => {
    try {
      const isMember = await isChatMember(chatId, userId);
      if (!isMember) {
        socket.emit("error", { message: "You are not a member of this chat" });
        return;
      }
      await socket.join(chatId);
      logger.debug(`User ${userId} joined room ${chatId}`);
    } catch (error) {
      logger.error({ error }, "chat:join error");
      socket.emit("error", { message: "Failed to join chat" });
    }
  });

  // ─── Leave a chat room ────────────────────────────────────────────────────
  socket.on("chat:leave", async (chatId) => {
    await socket.leave(chatId);
    logger.debug(`User ${userId} left room ${chatId}`);
  });

  // ─── Send a message ───────────────────────────────────────────────────────
  socket.on("message:send", async ({ chatId, content, type = "text", replyTo }) => {
    try {
      const message = await sendMessageService({
        chatId,
        senderId: userId,
        content,
        type,
        replyTo,
      });

      // Emit to everyone in the chat room (including sender for confirmation)
      io.to(chatId).emit("message:new", message);
    } catch (error) {
      logger.error({ error }, "message:send error");
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to send message",
      });
    }
  });

  // ─── Delete a message ─────────────────────────────────────────────────────
  socket.on("message:delete", async ({ messageId, chatId }) => {
    try {
      await deleteMessageService(messageId, userId);

      // Notify all chat members about the deletion
      io.to(chatId).emit("message:deleted", { messageId, chatId });
    } catch (error) {
      logger.error({ error }, "message:delete error");
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to delete message",
      });
    }
  });

  // ─── Typing indicators ────────────────────────────────────────────────────
  socket.on("typing:start", ({ chatId }) => {
    // Broadcast to everyone else in the room
    socket.to(chatId).emit("typing:start", {
      chatId,
      userId,
      name: socket.data.name,
    });
  });

  socket.on("typing:stop", ({ chatId }) => {
    socket.to(chatId).emit("typing:stop", { chatId, userId });
  });
};
