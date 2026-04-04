import multer from "multer";
import { ApiError } from "../utils/ApiError.ts";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Use memory storage — we pipe the buffer directly to Cloudinary ───────────
// Avoids writing temp files to disk
const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(415, `Unsupported file type: ${file.mimetype}. Allowed: JPEG, PNG, GIF, WEBP`),
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Only one file per request
  },
});

// ─── Named presets ────────────────────────────────────────────────────────────

// For chat image messages
export const uploadChatImage = upload.single("image");

// For avatar uploads
export const uploadAvatar = upload.single("avatar");
