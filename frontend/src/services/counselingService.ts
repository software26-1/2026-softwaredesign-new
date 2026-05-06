import client from '../api/client';
import type { Counseling, CounselingCreateRequest, CounselingSearchParams } from '../types/counseling';
import type { ApiResponse, PageResponse } from '../types/common';

export const counselingService = {
  async search(params: CounselingSearchParams): Promise<PageResponse<Counseling>> {
    const res = await client.get<ApiResponse<PageResponse<Counseling>>>('/counselings/search', { params });
    return res.data.data;
  },

  async getMyCounselings(): Promise<Counseling[]> {
    const res = await client.get<ApiResponse<Counseling[]>>('/counselings');
    return res.data.data;
  },

  async create(data: CounselingCreateRequest): Promise<Counseling> {
    const res = await client.post<ApiResponse<Counseling>>('/counselings', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<CounselingCreateRequest>): Promise<Counseling> {
    const res = await client.put<ApiResponse<Counseling>>(`/counselings/${id}`, data);
    return res.data.data;
  },
};
