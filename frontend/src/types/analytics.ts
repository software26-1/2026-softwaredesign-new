// Analytics DTOs — mirror backend Java records (camelCase serialization).
// Fields are optional where the backend may omit them, since analytics tables
// may be empty until the ETL job has run.

export interface LearningSummary {
  studentKey: number;
  year: number;
  semester: number;
  overallAvgScore?: number;
  overallClassRank?: number;
  attendanceRate?: number;
  absentCount?: number;
  lateCount?: number;
  earlyLeaveCount?: number;
  feedbackTotal?: number;
  positiveFeedback?: number;
  negativeFeedback?: number;
  counselingCount?: number;
  scoreTrend?: number;
  riskFlag?: boolean;
}

export interface StudentCourseTerm {
  courseKey: number;
  courseName?: string;
  year: number;
  semester: number;
  avgScore?: number;
  midtermScore?: number;
  finalScore?: number;
  taskScore?: number;
  weightedScore?: number;
  classRank?: number;
  classAvgScore?: number;
  gradeLevel?: string;
}

export interface ScoreTrendPoint {
  year: number;
  semester: number;
  avgScore?: number;
}

export interface ClassCourseStats {
  courseKey: number;
  courseName?: string;
  year: number;
  semester: number;
  studentCount?: number;
  avgScore?: number;
  maxScore?: number;
  minScore?: number;
  stddevScore?: number;
  avgAttendanceRate?: number;
}

export interface ScoreDistribution {
  bucket: string;
  count: number;
}

export interface ChatResponse {
  answer: string;
}

export interface AtRiskStudent {
  studentKey: number;
  studentName?: string;
  overallAvgScore?: number;
  attendanceRate?: number;
  riskFlag?: boolean;
  [key: string]: unknown;
}
