import type { Server, Socket } from "socket.io";
import { setUserOnlineStatus } from "../../repositories/user.repository.ts";
import { logger } from "../../utils/logger.ts";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../../types/index.ts";

type IoType = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export const registerPresenceHandlers = (io: IoType, socket: SocketType): void => {
  const userId = socket.data.userId;

  // ─── On connect: mark online, broadcast to all ────────────────────────────
  const handleConnect = async () => {
    try {
      await setUserOnlineStatus(userId, true);
      // Broadcast to everyone except this socket
      socket.broadcast.emit("user:online", { userId });
      logger.debug(`User ${userId} is now online`);
    } catch (error) {
      logger.error({ error }, `Failed to set online status for ${userId}`);
    }
  };

  // ─── On disconnect: mark offline, broadcast with lastSeen ─────────────────
  const handleDisconnect = async () => {
    try {
      await setUserOnlineStatus(userId, false);
      const lastSeen = new Date();
      socket.broadcast.emit("user:offline", { userId, lastSeen });
      logger.info(`Socket disconnected: ${socket.id} | User: ${userId}`);
    } catch (error) {
      logger.error({ error }, `Failed to set offline status for ${userId}`);
    }
  };

  handleConnect();
  socket.on("disconnect", handleDisconnect);
};
