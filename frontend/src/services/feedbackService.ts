import client from '../api/client';
import type { Feedback, FeedbackCategory, FeedbackCreateRequest } from '../types/feedback';

// 프론트(category/isPublicTo*) ↔ 백엔드(type/visibleTo*) 필드/값 매핑
const CAT_TO_TYPE: Record<FeedbackCategory, string> = {
  GRADE: 'ACADEMIC', BEHAVIOR: 'BEHAVIOR', ATTENDANCE: 'ATTENDANCE', ATTITUDE: 'ATTITUDE',
};
const TYPE_TO_CAT: Record<string, FeedbackCategory> = {
  ACADEMIC: 'GRADE', BEHAVIOR: 'BEHAVIOR', ATTENDANCE: 'ATTENDANCE', ATTITUDE: 'ATTITUDE',
};

function mapResponse(raw: any): Feedback {
  return {
    id: raw.id,
    studentId: raw.studentId,
    studentName: raw.studentName,
    teacherId: raw.teacherId,
    teacherName: raw.teacherName,
    courseId: raw.courseId,
    courseName: raw.courseName,
    category: TYPE_TO_CAT[raw.type] ?? raw.category ?? 'BEHAVIOR',
    content: raw.content,
    isPublicToStudent: raw.visibleToStudent ?? raw.isPublicToStudent ?? false,
    isPublicToParent: raw.visibleToParent ?? raw.isPublicToParent ?? false,
    createdAt: raw.createdAt,
  };
}

function unwrap(body: any): any[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  return [];
}

export const feedbackService = {
  async getByStudent(studentId: number, category?: FeedbackCategory): Promise<Feedback[]> {
    const res = await client.get<any>('/feedbacks', {
      params: { student_id: studentId, ...(category ? { category: CAT_TO_TYPE[category] } : {}) },
    });
    return unwrap(res.data).map(mapResponse);
  },

  async create(data: FeedbackCreateRequest): Promise<Feedback> {
    const res = await client.post<any>('/feedbacks', {
      studentId: data.studentId,
      courseId: data.courseId,
      type: CAT_TO_TYPE[data.category],
      content: data.content,
      visibleToStudent: data.isPublicToStudent,
      visibleToParent: data.isPublicToParent,
    });
    return mapResponse(res.data?.data ?? res.data);
  },

  async update(feedbackId: number, data: Partial<FeedbackCreateRequest>): Promise<Feedback> {
    const res = await client.patch<any>(`/feedbacks/${feedbackId}`, {
      type: data.category ? CAT_TO_TYPE[data.category] : undefined,
      content: data.content,
      visibleToStudent: data.isPublicToStudent,
      visibleToParent: data.isPublicToParent,
    });
    return mapResponse(res.data?.data ?? res.data);
  },

  async delete(feedbackId: number): Promise<void> {
    await client.delete(`/feedbacks/${feedbackId}`);
  },
};
