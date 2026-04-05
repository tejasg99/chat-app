import { Router } from "express";
import {
  submitReport,
  getAllReports,
  updateReportStatus,
  getMyReports,
} from "../controllers/report.controller.ts";
import { protect } from "../middlewares/auth.middleware.ts";

const router = Router();

router.use(protect);

router.post("/", submitReport);
router.get("/", getAllReports); // admin only (checked in controller)
router.get("/mine", getMyReports);
router.patch("/:reportId", updateReportStatus); // admin only

export default router;
