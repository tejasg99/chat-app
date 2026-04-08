import { Router } from "express";
import {
  getUserChats,
  getChatById,
  createDirectChat,
  createGroupChat,
  addMembers,
  removeMember,
  updateGroupAvatarHandler,
} from "../controllers/chat.controller.ts";
import {
  getMessages,
  sendMessage,
  sendImageMessage,
  markAsRead,
} from "../controllers/message.controller.ts";
import { protect } from "../middlewares/auth.middleware.ts";
import { uploadChatImage } from "../middlewares/upload.middleware.ts";

const router = Router();

// All chat routes are protected
router.use(protect);

// ─── Chat Routes ──────────────────────────────────────────────────────────────
router.get("/", getUserChats);
router.get("/:chatId", getChatById);
router.post("/direct", createDirectChat);
router.post("/group", createGroupChat);
router.post("/:chatId/members", addMembers);
router.delete("/:chatId/members/:memberId", removeMember);

// uploadChatImage middleware parses the multipart body before the controller
router.patch("/:chatId/avatar", uploadChatImage, updateGroupAvatarHandler);

// ─── Message Routes (scoped under chat) ──────────────────────────────────────
router.get("/:chatId/messages", getMessages);
router.post("/:chatId/messages", sendMessage);
router.post("/:chatId/messages/image", uploadChatImage, sendImageMessage);
router.patch("/:chatId/messages/read", markAsRead);

export default router;
