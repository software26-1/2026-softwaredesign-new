export interface Student {
  id: number;
  name: string;
  grade: number;
  classNumber: number;
  studentNumber: number;
  schoolId: number;
  schoolName?: string;
}

export interface StudentSearchParams {
  grade?: number;
  classNumber?: number;
  name?: string;
  contentType?: 'all' | 'grade' | 'feedback' | 'counseling' | 'record';
  page?: number;
  size?: number;
}

export interface StudentDetail extends Student {
  recentGradeScore?: number;
  recentGradeLevel?: string;
  feedbackCount?: number;
  counselingCount?: number;
}
