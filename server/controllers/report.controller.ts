import { Request, Response } from "express";
import {
  createReportService,
  getAllReportsService,
  updateReportStatusService,
  getMyReportsService,
} from "../services/report.service.ts";
import {
  createReportSchema,
  updateReportStatusSchema,
  paginationSchema,
} from "../validations/chat.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";
import { ApiError } from "../utils/ApiError.ts";

// ─── POST /api/reports — Submit a report ──────────────────────────────────────
export const submitReport = asyncHandler(async (req: Request, res: Response) => {
  const parsed = createReportSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const report = await createReportService({
    reportedBy: req.user!._id.toString(),
    ...parsed.data,
  });

  res.status(201).json(createApiResponse(201, "Report submitted successfully", report));
});

// ─── GET /api/reports — Get all reports (admin only) ─────────────────────────
export const getAllReports = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }

  const paginationParsed = paginationSchema.safeParse(req.query);
  if (!paginationParsed.success) throw paginationParsed.error;

  const { status } = req.query;
  const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];

  const result = await getAllReportsService(
    validStatuses.includes(status as string)
      ? (status as "pending" | "reviewed" | "resolved" | "dismissed")
      : undefined,
    paginationParsed.data.page,
    paginationParsed.data.limit,
  );

  res.status(200).json(createApiResponse(200, "Reports fetched", result));
});

// ─── PATCH /api/reports/:reportId — Update report status (admin only) ─────────
export const updateReportStatus = asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== "admin") {
    throw new ApiError(403, "Admin access required");
  }

  const parsed = updateReportStatusSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const report = await updateReportStatusService(
    req.params.reportId as string,
    parsed.data.status,
    req.user!._id.toString(),
  );

  res.status(200).json(createApiResponse(200, "Report status updated", report));
});

// ─── GET /api/reports/mine — Get current user's submitted reports ─────────────
export const getMyReports = asyncHandler(async (req: Request, res: Response) => {
  const reports = await getMyReportsService(req.user!._id.toString());
  res.status(200).json(createApiResponse(200, "Your reports fetched", reports));
});
