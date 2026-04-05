import type { Server, Socket } from "socket.io";
import { setUserOnlineStatus } from "../../repositories/user.repository.ts";
import { addOnlineUser, removeOnlineUser } from "../../config/redis.ts";
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

  const handleConnect = async () => {
    try {
      // Write to both MongoDB (persistent) and Redis (fast lookup)
      await Promise.all([setUserOnlineStatus(userId, true), addOnlineUser(userId)]);

      socket.broadcast.emit("user:online", { userId });
      logger.debug(`User ${userId} is now online`);
    } catch (error) {
      logger.error({ error }, `Failed to set online status for ${userId}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      const lastSeen = new Date();

      await Promise.all([setUserOnlineStatus(userId, false), removeOnlineUser(userId)]);

      socket.broadcast.emit("user:offline", { userId, lastSeen });
      logger.info(`Socket disconnected: ${socket.id} | User: ${userId}`);
    } catch (error) {
      logger.error({ error }, `Failed to set offline status for ${userId}`);
    }
  };

  handleConnect();
  socket.on("disconnect", handleDisconnect);
};
