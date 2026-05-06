import client from '../api/client';
import type { ApiResponse } from '../types/common';

export type ReportType = 'GRADE_ANALYSIS' | 'COUNSELING_SUMMARY' | 'FEEDBACK_SUMMARY';
export type ReportFormat = 'PDF' | 'EXCEL';

export interface Report {
  id: number;
  reportType: ReportType;
  format: ReportFormat;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  createdAt: string;
}

export const reportService = {
  async getReports(): Promise<Report[]> {
    const res = await client.get<ApiResponse<Report[]>>('/reports');
    return res.data.data;
  },

  async create(reportType: ReportType, format: ReportFormat): Promise<Report> {
    const res = await client.post<ApiResponse<Report>>('/reports/grade-analysis', { reportType, format });
    return res.data.data;
  },

  async download(reportId: number): Promise<Blob> {
    const res = await client.get(`/reports/${reportId}/download`, { responseType: 'blob' });
    return res.data;
  },
};
