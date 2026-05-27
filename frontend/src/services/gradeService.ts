import client from '../api/client';
import type { Course, Grade, GradeSummary } from '../types/grade';

export const gradeService = {
  async getCourses(academicYear: number, semester: number, teacherId?: number): Promise<Course[]> {
    const res = await client.get<Course[]>('/courses', {
      params: { academic_year: academicYear, semester, ...(teacherId ? { teacher_id: teacherId } : {}) },
    });
    return res.data;
  },

  async getEnrollments(courseId: number): Promise<{ id: number; studentId: number; studentName: string; studentNumber: number }[]> {
    const res = await client.get(`/courses/${courseId}/enrollments`);
    return res.data;
  },

  async getGradesByEnrollment(enrollmentId: number): Promise<Grade[]> {
    const res = await client.get<Grade[]>('/grades', { params: { enrollment_id: enrollmentId } });
    return res.data;
  },

  async getGradesByStudent(studentId: number): Promise<Grade[]> {
    const res = await client.get<Grade[]>('/grades', { params: { student_id: studentId } });
    return res.data;
  },

  async getStudentSummary(studentId: number, year: number, semester: number): Promise<GradeSummary> {
    const res = await client.get<GradeSummary>(`/grade-summaries/students/${studentId}`, {
      params: { year, semester },
    });
    return res.data;
  },

  async getClassSummary(classGroupId: number, year: number, semester: number): Promise<GradeSummary[]> {
    const res = await client.get<GradeSummary[]>('/grade-summaries', {
      params: { class_group_id: classGroupId, year, semester },
    });
    return res.data;
  },

  async createGrade(data: { enrollmentId: number; examType: string; score: number; maxScore: number }): Promise<Grade> {
    const res = await client.post<Grade>('/grades', data);
    return res.data;
  },

  async updateGrade(gradeId: number, data: { score?: number; maxScore?: number }): Promise<Grade> {
    const res = await client.patch<Grade>(`/grades/${gradeId}`, data);
    return res.data;
  },

  async deleteGrade(gradeId: number): Promise<void> {
    await client.delete(`/grades/${gradeId}`);
  },
};
