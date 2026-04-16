import { getSocket } from "@/lib/socket";
import type { Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@/types";

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Returns the singleton socket instance.
 * Connection lifecycle is managed by (main)/layout.tsx — this hook
 * is just an accessor so components don't import getSocket() directly.
 */
export function useSocket(): AppSocket {
  return getSocket();
}
