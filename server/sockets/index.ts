import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { env } from "../config/env.ts";
import { logger } from "../utils/logger.ts";
import { verifyAccessToken } from "../utils/token.ts";
import { findUserById } from "../repositories/auth.repository.ts";
import { registerSocketHandlers } from "./socket.handler.ts";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/index.ts";

export const initSocket = (
  httpServer: HttpServer,
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.clientUrl,
        methods: ["GET", "POST"],
        credentials: true,
      },
      // Ping timeout/interval for detecting dropped connections
      pingTimeout: 60000,
      pingInterval: 25000,
    },
  );

  // ─── JWT Authentication Middleware ──────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      // Token can arrive as a cookie or in the handshake auth object
      const token: string | undefined =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.cookie
          ?.split(";")
          .find((c) => c.trim().startsWith("accessToken="))
          ?.split("=")[1];

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const payload = verifyAccessToken(token);
      const user = await findUserById(payload.userId);

      if (!user) return next(new Error("User not found"));
      if (user.isBlocked) return next(new Error("Account is blocked"));

      // Attach user data to socket for use in handlers
      socket.data.userId = user._id.toString();
      socket.data.name = user.name;
      socket.data.email = user.email;

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // ─── Register Event Handlers on Connection ──────────────────────────────────
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.data.userId}`);
    registerSocketHandlers(io, socket);
  });

  return io;
};
