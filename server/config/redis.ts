import Redis from "ioredis";
import { env } from "./env.ts";
import { logger } from "../utils/logger.ts";

// ─── Create a Redis client ────────────────────────────────────────────────────
// We export a factory so the Socket.io adapter can create its own
// pub + sub client pair (required by @socket.io/redis-adapter)
export const createRedisClient = (): Redis => {
  const client = new Redis(env.redisUrl, {
    // Upstash requires TLS
    tls: env.redisUrl.startsWith("rediss://") ? {} : undefined,
    maxRetriesPerRequest: 3,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on("connect", () => logger.info("Redis client connected"));
  client.on("error", (err) => logger.error({ err }, "Redis client error"));

  return client;
};

// ─── Singleton client for general caching ─────────────────────────────────────
export const redisClient = createRedisClient();

// ─── Cache TTL constants (seconds) ───────────────────────────────────────────
export const CACHE_TTL = {
  USER_ONLINE: 60 * 60, // 1 hour
  CHAT_LIST: 60 * 5, // 5 minutes
  USER_PROFILE: 60 * 10, // 10 minutes
} as const;

// ─── Cache helpers ────────────────────────────────────────────────────────────

export const setCache = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const raw = await redisClient.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
};

export const deleteCache = async (key: string): Promise<void> => {
  await redisClient.del(key);
};

export const deleteCacheByPattern = async (pattern: string): Promise<void> => {
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) {
    await redisClient.del(...keys);
  }
};

// ─── Online presence helpers ──────────────────────────────────────────────────
// We track online users in a Redis Set for O(1) lookups

export const ONLINE_USERS_KEY = "online:users";

export const addOnlineUser = async (userId: string): Promise<void> => {
  await redisClient.sadd(ONLINE_USERS_KEY, userId);
};

export const removeOnlineUser = async (userId: string): Promise<void> => {
  await redisClient.srem(ONLINE_USERS_KEY, userId);
};

export const isUserOnline = async (userId: string): Promise<boolean> => {
  const result = await redisClient.sismember(ONLINE_USERS_KEY, userId);
  return result === 1;
};

export const getOnlineUsers = async (): Promise<string[]> => {
  return redisClient.smembers(ONLINE_USERS_KEY);
};
