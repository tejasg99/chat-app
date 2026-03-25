import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { protect } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateProfileSchema, userIdParamSchema } from "../validations/user.validation";

const router = Router();

// All user routes require authentication
router.use(protect);

// GET /api/users/me
router.get("/me", userController.getMyProfile.bind(userController));

// PATCH /api/users/me
router.patch(
  "/me",
  validate(updateProfileSchema),
  userController.updateMyProfile.bind(userController),
);

// GET /api/users/:userId
router.get(
  "/:userId",
  validate(userIdParamSchema),
  userController.getUserProfile.bind(userController),
);

export default router;
