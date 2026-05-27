import client from '../api/client';
import type { Counseling, CounselingCreateRequest } from '../types/counseling';

export const counselingService = {
  async getByStudent(studentId: number): Promise<Counseling[]> {
    const res = await client.get<Counseling[]>('/counselings', { params: { student_id: studentId } });
    return res.data;
  },

  async getShared(params?: { studentName?: string; startDate?: string; endDate?: string }): Promise<Counseling[]> {
    const res = await client.get<Counseling[]>('/counselings/shared', { params });
    return res.data;
  },

  async create(data: CounselingCreateRequest): Promise<Counseling> {
    const res = await client.post<Counseling>('/counselings', data);
    return res.data;
  },

  async update(id: number, data: Partial<CounselingCreateRequest>): Promise<Counseling> {
    const res = await client.patch<Counseling>(`/counselings/${id}`, data);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await client.delete(`/counselings/${id}`);
  },
};
