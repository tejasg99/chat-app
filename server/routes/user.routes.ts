import { Router } from "express";
import {
  getProfile,
  updateProfile,
  blockUserHandler,
  unblockUserHandler,
} from "../controllers/user.controller.ts";
import { protect } from "../middlewares/auth.middleware.ts";

const router = Router();

// All user routes require authentication
router.use(protect);

router.get("/me", getProfile);
router.patch("/me", updateProfile);
router.post("/block/:targetId", blockUserHandler);
router.delete("/block/:targetId", unblockUserHandler);

export default router;
