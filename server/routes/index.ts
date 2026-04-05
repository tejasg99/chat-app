import { Router } from "express";
import authRoutes from "./auth.routes.ts";
import userRoutes from "./user.routes.ts";
import chatRoutes from "./chat.routes.ts";
import messageRoutes from "./message.routes.ts";
import reportRoutes from "./report.routes.ts";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/chats", chatRoutes);
router.use("/messages", messageRoutes);
router.use("/reports", reportRoutes);

export default router;
