export type FeedbackCategory = 'GRADE' | 'BEHAVIOR' | 'ATTENDANCE' | 'ATTITUDE';

export const FeedbackCategoryLabel: Record<FeedbackCategory, string> = {
  GRADE: '성적',
  BEHAVIOR: '행동',
  ATTENDANCE: '출결',
  ATTITUDE: '태도',
};

export interface Feedback {
  id: number;
  studentId: number;
  studentName?: string;
  teacherId: number;
  teacherName?: string;
  courseId?: number;
  courseName?: string;
  category: FeedbackCategory;
  content: string;
  isPublicToStudent: boolean;
  isPublicToParent: boolean;
  createdAt: string;
}

export interface FeedbackCreateRequest {
  studentId: number;
  courseId?: number;
  category: FeedbackCategory;
  content: string;
  isPublicToStudent: boolean;
  isPublicToParent: boolean;
}
