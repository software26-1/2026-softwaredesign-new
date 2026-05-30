import client from '../api/client';
import type { Counseling, CounselingCreateRequest } from '../types/counseling';
import type { ApiResponse } from '../types/common';

export const counselingService = {
  async getByStudent(studentId: number): Promise<Counseling[]> {
    const res = await client.get<ApiResponse<Counseling[]>>('/counselings', {
      params: { student_id: studentId },
    });
    return res.data.data;
  },

  async getShared(params?: {
    studentName?: string;
    teacherId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Counseling[]> {
    const res = await client.get<ApiResponse<Counseling[]>>('/counselings/shared', {
      params: {
        student_name: params?.studentName || undefined,
        teacher_id: params?.teacherId || undefined,
        start_date: params?.startDate ? `${params.startDate}T00:00:00` : undefined,
        end_date: params?.endDate ? `${params.endDate}T23:59:59` : undefined,
      },
    });
    return res.data.data;
  },

  async create(data: CounselingCreateRequest): Promise<Counseling> {
    const res = await client.post<ApiResponse<Counseling>>('/counselings', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<CounselingCreateRequest>): Promise<Counseling> {
    const res = await client.patch<ApiResponse<Counseling>>(`/counselings/${id}`, data);
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await client.delete(`/counselings/${id}`);
  },
};
