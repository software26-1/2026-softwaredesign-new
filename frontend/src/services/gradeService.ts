import client from '../api/client';
import type { Course, Grade, GradeSummary } from '../types/grade';
import type { ApiResponse } from '../types/common';

export const gradeService = {
  async getCourses(): Promise<Course[]> {
    const res = await client.get<ApiResponse<Course[]>>('/courses');
    return res.data.data;
  },

  async getEnrollments(courseId: number): Promise<GradeSummary[]> {
    const res = await client.get<ApiResponse<GradeSummary[]>>(`/courses/${courseId}/enrollments`);
    return res.data.data;
  },

  async getStudentGrades(studentId: number): Promise<GradeSummary[]> {
    const res = await client.get<ApiResponse<GradeSummary[]>>(`/students/${studentId}/grade-summary`);
    return res.data.data;
  },

  async saveGrade(studentId: number, data: Partial<Grade>): Promise<Grade> {
    const res = await client.post<ApiResponse<Grade>>(`/students/${studentId}/grades`, data);
    return res.data.data;
  },

  async updateGrade(gradeId: number, data: Partial<Grade>): Promise<Grade> {
    const res = await client.patch<ApiResponse<Grade>>(`/grades/${gradeId}`, data);
    return res.data.data;
  },
};
