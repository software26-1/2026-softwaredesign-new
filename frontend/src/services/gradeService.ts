import client from '../api/client';
import type { Course, Grade, GradeSummary } from '../types/grade';

export const gradeService = {
  async getCourses(year: number, semester: number): Promise<Course[]> {
    const res = await client.get<any>('/courses', {
      params: { academic_year: year, semester },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  },

  async getEnrollments(courseId: number): Promise<GradeSummary[]> {
    const res = await client.get<GradeSummary[]>(`/courses/${courseId}/enrollments`);
    return Array.isArray(res.data) ? res.data : [];
  },

  async getGradesByEnrollment(enrollmentId: number): Promise<Grade[]> {
    const res = await client.get<Grade[]>('/grades', {
      params: { enrollment_id: enrollmentId },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  async getStudentGrades(studentId: number, year?: number, semester?: number): Promise<GradeSummary[]> {
    const res = await client.get<any>(`/grade-summaries/students/${studentId}`, {
      params: { year, semester },
    });
    return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
  },

  async saveGrade(data: { studentId: number; enrollmentId: number; score: number; gradeType: string }): Promise<Grade> {
    const res = await client.post<Grade>('/grades', data);
    return res.data;
  },

  async updateGrade(gradeId: number, data: Partial<Grade>): Promise<Grade> {
    const res = await client.patch<Grade>(`/grades/${gradeId}`, data);
    return res.data;
  },

  async deleteGrade(gradeId: number): Promise<void> {
    await client.delete(`/grades/${gradeId}`);
  },
};
