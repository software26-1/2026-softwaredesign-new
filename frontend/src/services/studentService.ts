import client from '../api/client';
import type { Student, StudentDetail, StudentSearchParams } from '../types/student';
import type { ApiResponse, PageResponse } from '../types/common';

export const studentService = {
  async search(params: StudentSearchParams): Promise<PageResponse<StudentDetail>> {
    const res = await client.get<ApiResponse<PageResponse<StudentDetail>>>('/students', { params });
    return res.data.data;
  },

  async getById(id: number): Promise<StudentDetail> {
    const res = await client.get<ApiResponse<StudentDetail>>(`/students/${id}`);
    return res.data.data;
  },

  async create(data: Omit<Student, 'id'>): Promise<Student> {
    const res = await client.post<ApiResponse<Student>>('/students', data);
    return res.data.data;
  },

  async update(id: number, data: Partial<Student>): Promise<Student> {
    const res = await client.put<ApiResponse<Student>>(`/students/${id}`, data);
    return res.data.data;
  },
};
