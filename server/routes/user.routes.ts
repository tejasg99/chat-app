import { Router } from "express";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  blockUserHandler,
  unblockUserHandler,
  searchUsers,
  getUserProfile,
} from "../controllers/user.controller.ts";
import { protect } from "../middlewares/auth.middleware.ts";
import { uploadAvatar as uploadAvatarMiddleware } from "../middlewares/upload.middleware.ts";

const router = Router();

// All user routes require authentication
router.use(protect);

router.get("/me", getProfile);
router.patch("/me", updateProfile);
router.post("/me/avatar", uploadAvatarMiddleware, uploadAvatar); // Multer middleware runs before the controller to parse the multipart form

// Search must come before /:userId to avoid route shadowing
router.get("/search", searchUsers);

router.get("/:userId", getUserProfile);

router.post("/block/:targetId", blockUserHandler);
router.delete("/block/:targetId", unblockUserHandler);

export default router;
