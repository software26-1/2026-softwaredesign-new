import client from '../api/client';

export interface StudentRecord {
  id?: number;
  studentId?: number;
  achievements?: string;
  extracurricular?: string;
  volunteerHours?: number;
  careerAspirations?: string;
  [key: string]: unknown;
}

export interface StudentRecordUpsertBody {
  academicYear?: number;
  semester?: number;
  achievements?: string;
  extracurricular?: string;
  volunteerHours?: number;
  careerAspirations?: string;
}

// New student-record endpoints return raw DTOs (read res.data directly).
export const studentRecordService = {
  async get(studentId: number, academicYear?: number, semester?: number): Promise<StudentRecord | StudentRecord[]> {
    // 학년/학기 지정 시 해당 학기 학생부, 미지정 시 가장 최근 학생부
    const res = await client.get<StudentRecord | StudentRecord[]>('/student-records', {
      params: { student_id: studentId, academic_year: academicYear, semester },
    });
    return res.data;
  },

  async upsert(studentId: number, body: StudentRecordUpsertBody): Promise<StudentRecord> {
    const res = await client.post<StudentRecord>('/student-records', body, {
      params: { student_id: studentId },
    });
    return res.data;
  },

  async remove(studentId: number, academicYear?: number, semester?: number): Promise<void> {
    await client.delete('/student-records', { params: { student_id: studentId, academic_year: academicYear, semester } });
  },
};
