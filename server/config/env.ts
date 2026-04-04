import dotenv from "dotenv";
dotenv.config();

const getEnv = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  port: parseInt(getEnv("PORT", "5000"), 10),
  nodeEnv: getEnv("NODE_ENV", "development"),
  mongoUri: getEnv("MONGODB_URI"),

  jwtAccessSecret: getEnv("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: getEnv("JWT_REFRESH_SECRET"),
  jwtAccessExpiresIn: getEnv("JWT_ACCESS_EXPIRES_IN", "15m"),
  jwtRefreshExpiresIn: getEnv("JWT_REFRESH_EXPIRES_IN", "7d"),

  googleClientId: getEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
  googleCallbackUrl: getEnv("GOOGLE_CALLBACK_URL"),

  clientUrl: getEnv("CLIENT_URL", "http://localhost:3000"),

  redisUrl: getEnv("REDIS_URL"),
  redisToken: getEnv("REDIS_TOKEN", ""),

  cloudinaryCloudName: getEnv("CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: getEnv("CLOUDINARY_API_KEY"),
  cloudinaryApiSecret: getEnv("CLOUDINARY_API_SECRET"),
} as const;
