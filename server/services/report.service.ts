import { ApiError } from "../utils/ApiError.ts";
import {
  createReport,
  findReportById,
  findDuplicateReport,
  findAllReports,
  updateReportStatus,
  findReportsByUser,
} from "../repositories/report.repository.ts";
import { findMessageById } from "../repositories/message.repository.ts";
import { findUserById } from "../repositories/auth.repository.ts";
import type { IReport, ReportStatus, ReportTargetType, ReportReason } from "../types/index.ts";

// ─── Submit a new report ──────────────────────────────────────────────────────

export const createReportService = async (input: {
  reportedBy: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  description?: string;
}): Promise<IReport> => {
  const { reportedBy, targetType, targetId, reason, description } = input;

  // Prevent self-reporting
  if (targetType === "user" && targetId === reportedBy) {
    throw new ApiError(400, "You cannot report yourself");
  }

  // Verify the reported target actually exists
  if (targetType === "user") {
    const target = await findUserById(targetId);
    if (!target) throw new ApiError(404, "Reported user not found");
  } else {
    const message = await findMessageById(targetId);
    if (!message) throw new ApiError(404, "Reported message not found");
  }

  // Prevent duplicate reports
  const duplicate = await findDuplicateReport(reportedBy, targetId, targetType);
  if (duplicate) {
    throw new ApiError(409, "You have already reported this content");
  }

  return createReport({
    reportedBy: reportedBy as unknown as never,
    targetType,
    targetId: targetId as unknown as never,
    reason,
    description,
  });
};

// ─── Get all reports (admin only) ─────────────────────────────────────────────

export const getAllReportsService = async (
  status?: ReportStatus,
  page?: number,
  limit?: number,
): Promise<{ reports: IReport[]; total: number; totalPages: number }> => {
  const { reports, total } = await findAllReports(status, page, limit);
  const totalPages = Math.ceil(total / (limit ?? 20));
  return { reports, total, totalPages };
};

// ─── Update report status (admin only) ───────────────────────────────────────

export const updateReportStatusService = async (
  reportId: string,
  status: ReportStatus,
  adminId: string,
): Promise<IReport> => {
  const report = await findReportById(reportId);
  if (!report) throw new ApiError(404, "Report not found");

  if (report.status === "resolved" || report.status === "dismissed") {
    throw new ApiError(400, "This report has already been closed");
  }

  const updated = await updateReportStatus(reportId, status, adminId);
  return updated!;
};

// ─── Get reports submitted by a user ─────────────────────────────────────────

export const getMyReportsService = async (userId: string): Promise<IReport[]> =>
  findReportsByUser(userId);
