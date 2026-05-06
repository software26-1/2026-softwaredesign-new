export type ExamType = 'MIDTERM' | 'FINAL' | 'TASK';

export const ExamTypeLabel: Record<ExamType, string> = {
  MIDTERM: '중간고사',
  FINAL: '기말고사',
  TASK: '수행평가',
};

export interface Course {
  id: number;
  courseName: string;
  teacherId: number;
  teacherName?: string;
  academicYear: number;
  semester: number;
  classGroupId: number;
  classGroupName?: string;
}

export interface Grade {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentName?: string;
  studentNumber?: number;
  examType: ExamType;
  score: number;
  maxScore: number;
}

export interface GradeSummary {
  id: number;
  studentId: number;
  studentName?: string;
  studentNumber?: number;
  courseId: number;
  courseName: string;
  rawScore: number;
  subjectAvg: number;
  standardDev: number;
  achievement: string;
  rank: number;
  gradeLevel: string;
  numStudents: number;
}

export interface GradeInputRow {
  studentId: number;
  studentName: string;
  studentNumber: number;
  score: number | '';
  subjectAvg?: number;
  standardDev?: number;
  achievement?: string;
  rank?: string;
}
