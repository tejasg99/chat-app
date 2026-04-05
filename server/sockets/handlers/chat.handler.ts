import type { Server, Socket } from "socket.io";
import { sendMessageService, deleteMessageService } from "../../services/message.service.ts";
import { toggleReactionService } from "../../services/reaction.service.ts";
import { isChatMember } from "../../repositories/chat.repository.ts";
import { markMessagesAsRead, findMessagesByChat } from "../../repositories/message.repository.ts";
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

  // ─── Read receipts ────────────────────────────────────────────────────────
  // When a user opens a chat or scrolls through messages, the client
  // emits this event. We mark all unread messages and broadcast to the room
  // so other participants' UIs can update their "seen" indicators.
  socket.on("message:read", async ({ chatId }) => {
    try {
      const isMember = await isChatMember(chatId, userId);
      if (!isMember) return;

      await markMessagesAsRead(chatId, userId);

      // Fetch the IDs of messages that are now read so the client
      // can update only those specific messages, not the entire list
      const recentMessages = await findMessagesByChat(chatId, 1, 50);
      const messageIds = recentMessages
        .filter((m) => m.readBy.map((id) => id.toString()).includes(userId))
        .map((m) => m._id.toString());

      // Broadcast to entire room — sender excluded using socket.to()
      socket.to(chatId).emit("message:read", {
        chatId,
        userId,
        messageIds,
        readAt: new Date(),
      });
    } catch (error) {
      logger.error({ error }, "message:read error");
    }
  });

  // ─── Reactions via socket ─────────────────────────────────────────────────
  // Complementing the REST endpoint — clients can react in real time
  socket.on("message:react", async ({ messageId, chatId, emoji }) => {
    try {
      const { reactions } = await toggleReactionService({
        messageId,
        userId,
        emoji,
      });

      // Broadcast updated reactions to all chat members
      io.to(chatId).emit("message:reaction", {
        messageId,
        chatId,
        reactions,
      });
    } catch (error) {
      logger.error({ error }, "message:react error");
      socket.emit("error", {
        message: error instanceof Error ? error.message : "Failed to update reaction",
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
