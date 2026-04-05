import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.ts";
import { ApiError } from "../utils/ApiError.ts";
import { logger } from "../utils/logger.ts";
import type { UploadResult } from "../types/index.ts";

// ─── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

// ─── Upload a buffer to Cloudinary ────────────────────────────────────────────
export const uploadImageService = async (
  fileBuffer: Buffer,
  folder: string = "chat-app",
): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        max_bytes: 5 * 1024 * 1024, // 5MB cap enforced on Cloudinary side too
        transformation: [
          // Auto-optimize quality and format for web delivery
          { quality: "auto", fetch_format: "auto" },
          // Cap dimensions while preserving aspect ratio
          { width: 1920, height: 1080, crop: "limit" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          logger.error({ error }, "Cloudinary upload failed");
          return reject(new ApiError(500, "Image upload failed"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    uploadStream.end(fileBuffer);
  });
};

// ─── Upload avatar specifically ───────────────────────────────────────────────
export const uploadAvatarService = async (fileBuffer: Buffer): Promise<UploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "chat-app/avatars",
        resource_type: "image",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        transformation: [
          // Avatars are always square and capped at 400px
          { width: 400, height: 400, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (error, result) => {
        if (error || !result) {
          logger.error({ error }, "Cloudinary avatar upload failed");
          return reject(new ApiError(500, "Avatar upload failed"));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    uploadStream.end(fileBuffer);
  });
};

// ─── Delete an image from Cloudinary ─────────────────────────────────────────
export const deleteImageService = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};
