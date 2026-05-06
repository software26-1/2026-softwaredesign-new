export interface Counseling {
  id: number;
  studentId: number;
  studentName?: string;
  teacherId: number;
  teacherName?: string;
  counselDate: string;
  mainContent: string;
  nextPlan: string;
  isShared: boolean;
  createdAt: string;
}

export interface CounselingCreateRequest {
  studentId: number;
  counselDate: string;
  mainContent: string;
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
