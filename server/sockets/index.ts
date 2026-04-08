import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "http";
import { env } from "../config/env.ts";
import { logger } from "../utils/logger.ts";
import { verifyAccessToken } from "../utils/token.ts";
import { findUserById } from "../repositories/auth.repository.ts";
import { createRedisClient } from "../config/redis.ts";
import { registerSocketHandlers } from "./socket.handler.ts";
import { setIoInstance } from "../controllers/reaction.controller.ts";
import { setMessageIoInstance } from "../controllers/message.controller.ts";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/index.ts";

export const initSocket = async (
  httpServer: HttpServer,
): Promise<Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>> => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: env.clientUrl,
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    },
  );

  // ─── Redis Pub/Sub Adapter ──────────────────────────────────────────────────
  // Two separate clients are required — one for publishing, one for subscribing.
  // This allows Socket.io to broadcast events across multiple server instances.
  const pubClient = createRedisClient();
  const subClient = createRedisClient();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  io.adapter(createAdapter(pubClient, subClient));
  logger.info("Socket.io Redis adapter initialized");

  // ─── Share io with reaction controller for REST-triggered broadcasts ────────
  setIoInstance(io);

  // Message controller — broadcasts image messages after Cloudinary upload
  setMessageIoInstance(io);

  // ─── JWT Auth Middleware ────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token: string | undefined =
        socket.handshake.auth?.token ??
        socket.handshake.headers?.cookie
          ?.split(";")
          .find((c) => c.trim().startsWith("accessToken="))
          ?.split("=")[1];

      if (!token) return next(new Error("Authentication token missing"));

      const payload = verifyAccessToken(token);
      const user = await findUserById(payload.userId);

      if (!user) return next(new Error("User not found"));
      if (user.isBlocked) return next(new Error("Account is blocked"));

      socket.data.userId = user._id.toString();
      socket.data.name = user.name;
      socket.data.email = user.email;

      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // ─── Register Handlers ──────────────────────────────────────────────────────
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id} | User: ${socket.data.userId}`);
    registerSocketHandlers(io, socket);
  });

  return io;
};
