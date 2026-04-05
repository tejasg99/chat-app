import { Router } from "express";
import { toggleReaction } from "../controllers/reaction.controller.ts";
import { protect } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(protect);

// POST /api/messages/:messageId/reactions
router.post("/:messageId/reactions", toggleReaction);

export default router;
