import { Report } from "../models/report.model.ts";
import type { IReport, ReportStatus } from "../types/index.ts";

export const createReport = async (data: Partial<IReport>): Promise<IReport> => {
  const report = new Report(data);
  return report.save();
};

export const findReportById = async (reportId: string): Promise<IReport | null> =>
  Report.findById(reportId)
    .populate("reportedBy", "name email")
    .populate("reviewedBy", "name email")
    .lean<IReport>()
    .exec();

export const findDuplicateReport = async (
  reportedBy: string,
  targetId: string,
  targetType: string,
): Promise<IReport | null> =>
  Report.findOne({ reportedBy, targetId, targetType }).lean<IReport>().exec();

export const findAllReports = async (
  status?: ReportStatus,
  page = 1,
  limit = 20,
): Promise<{ reports: IReport[]; total: number }> => {
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate("reportedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<IReport[]>()
      .exec(),
    Report.countDocuments(filter).exec(),
  ]);

  return { reports, total };
};

export const updateReportStatus = async (
  reportId: string,
  status: ReportStatus,
  reviewedBy: string,
): Promise<IReport | null> =>
  Report.findByIdAndUpdate(reportId, { status, reviewedBy }, { new: true, runValidators: true })
    .lean<IReport>()
    .exec();

export const findReportsByUser = async (userId: string): Promise<IReport[]> =>
  Report.find({ reportedBy: userId }).sort({ createdAt: -1 }).lean<IReport[]>().exec();
