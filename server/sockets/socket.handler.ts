import type { Server, Socket } from "socket.io";
import { registerPresenceHandlers } from "./handlers/presence.handler.ts";
import { registerChatHandlers } from "./handlers/chat.handler.ts";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "../types/index.ts";

type IoType = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

// Central registration point — add new handler groups here as features grow
export const registerSocketHandlers = (io: IoType, socket: SocketType): void => {
  registerPresenceHandlers(io, socket);
  registerChatHandlers(io, socket);
};
