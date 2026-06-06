// ============================================================================
// [미사용 / DEAD CODE — 2026-06-06 주석 처리]
//
// 이 서비스는 백엔드 보고서 API(POST /reports, GET /reports/{id}/download)를
// 호출하기 위한 래퍼였다. 그러나 현재 보고서 기능은 전적으로 클라이언트에서
// 생성한다:
//   - PDF  : ReportPage 가 공문서 양식 HTML 을 렌더링 후 window.print() 로 저장
//   - Excel: utils/excelReport.ts (ExcelJS) 로 생성
//
// 즉 보고서는 "지금 시점 데이터의 스냅샷"을 사용자가 버튼 클릭 시 즉석에서 만들어
// 본인 PC 로 바로 내려받는 구조다. 서버나 S3 에 별도 저장할 이유가 없다:
//   1) 동일 파일이 서버에도 중복 적재되어 스토리지 낭비
//   2) 데이터는 계속 바뀌는데 저장된 파일은 과거 값으로 고정 → 혼란
//   3) 성적·상담 등 민감정보 파일을 서버/S3 에 쌓아두면 보안 관리 부담만 증가
//
// 따라서 이 래퍼는 어느 화면에서도 import 하지 않는다. 백엔드 report 도메인과
// 함께 향후 제거 후보이며, 이력 보존을 위해 우선 주석 처리만 해 둔다.
// (S3 는 보고서 저장이 아니라 DB 백업 용도로 재활용되었다 — scripts/db-backup.sh)
// ============================================================================

/*
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
    const res = await client.get<any>('/reports');
    const body = res.data;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    return [];
  },

  async create(reportType: ReportType, format: ReportFormat, scope?: { grade?: number; classNumber?: number }): Promise<Report> {
    const res = await client.post<ApiResponse<Report>>('/reports/grade-analysis', {
      reportType, format,
      grade: scope?.grade,
      classNumber: scope?.classNumber,
    });
    return res.data.data;
  },

  async download(reportId: number): Promise<Blob> {
    const res = await client.get(`/reports/${reportId}/download`, { responseType: 'blob' });
    return res.data;
  },
};
*/

export {};
