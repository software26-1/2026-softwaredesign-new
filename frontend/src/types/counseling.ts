export interface Counseling {
  id: number;
  studentId: number;
  studentName?: string;
  teacherId: number;
  teacherName?: string;
  counseledAt: string;
  content: string;
  nextPlan: string;
  shared: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CounselingCreateRequest {
  studentId: number;
  counseledAt: string;
  content: string;
  nextPlan: string;
  isShared: boolean;
}

export interface CounselingSearchParams {
  studentName?: string;
  teacherName?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}
