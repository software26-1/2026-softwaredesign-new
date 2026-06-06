import client from '../api/client';
import type {
  LearningSummary,
  StudentCourseTerm,
  ScoreTrendPoint,
  ClassCourseStats,
  ScoreDistribution,
  ChatMessage,
  ChatResponse,
  AtRiskStudent,
} from '../types/analytics';

// NOTE: the new analytics endpoints return raw DTOs (NOT wrapped in ApiResponse),
// so we read res.data directly.
export const analyticsService = {
  async getStudentSummary(studentId: number, year: number, semester: number): Promise<LearningSummary> {
    const res = await client.get<LearningSummary>(`/analytics/students/${studentId}/summary`, {
      params: { year, semester },
    });
    return res.data;
  },

  async getStudentCourses(studentId: number, year: number, semester: number): Promise<StudentCourseTerm[]> {
    const res = await client.get<StudentCourseTerm[]>(`/analytics/students/${studentId}/courses`, {
      params: { year, semester },
    });
    return res.data;
  },

  async getAllStudentCourses(studentId: number): Promise<StudentCourseTerm[]> {
    const res = await client.get<StudentCourseTerm[]>(`/analytics/students/${studentId}/courses/all`);
    return res.data;
  },

  async getStudentTrend(studentId: number, courseId?: number): Promise<ScoreTrendPoint[]> {
    const res = await client.get<ScoreTrendPoint[]>(`/analytics/students/${studentId}/trend`, {
      params: courseId != null ? { course_id: courseId } : undefined,
    });
    return res.data;
  },

  async getClassCourses(classGroupId: number, year: number, semester: number): Promise<ClassCourseStats[]> {
    const res = await client.get<ClassCourseStats[]>(`/analytics/classes/${classGroupId}/courses`, {
      params: { year, semester },
    });
    return res.data;
  },

  async getClassAtRisk(classGroupId: number, year: number, semester: number): Promise<AtRiskStudent[]> {
    const res = await client.get<AtRiskStudent[]>(`/analytics/classes/${classGroupId}/at-risk`, {
      params: { year, semester },
    });
    return res.data;
  },

  async getCourseDistribution(courseId: number, year: number, semester: number): Promise<ScoreDistribution[]> {
    const res = await client.get<ScoreDistribution[]>(`/analytics/courses/${courseId}/distribution`, {
      params: { year, semester },
    });
    return res.data;
  },

  async runEtl(): Promise<{ message?: string }> {
    const res = await client.post<{ message?: string }>('/analytics/etl/run');
    return res.data;
  },

  async chat(studentId: number, question: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    const res = await client.post<ChatResponse>(`/analytics/students/${studentId}/chat`, { question, history });
    return res.data;
  },
};
