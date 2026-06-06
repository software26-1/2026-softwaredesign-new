import client from '../api/client';
import type { Student, StudentDetail, StudentSearchParams } from '../types/student';

export const studentService = {
  async search(params: StudentSearchParams): Promise<StudentDetail[]> {
    const res = await client.get<StudentDetail[]>('/students', {
      params: {
        grade: params.grade || undefined,
        class_number: params.classNumber || undefined,
        name: params.name || undefined,
      },
    });
    return res.data;
  },

  async getById(id: number): Promise<StudentDetail> {
    const res = await client.get<StudentDetail>(`/students/${id}`);
    return res.data;
  },

  async create(data: Omit<Student, 'id'>): Promise<Student> {
    const res = await client.post<Student>('/students', data);
    return res.data;
  },

  async update(id: number, data: Partial<Student>): Promise<Student> {
    const res = await client.put<Student>(`/students/${id}`, data);
    return res.data;
  },
};
