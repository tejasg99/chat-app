import { Router } from "express";
import { deleteMessage } from "../controllers/message.controller.ts";
import { protect } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(protect);

// Standalone message operations (not scoped to a chat)
router.delete("/:messageId", deleteMessage);

export default router;
