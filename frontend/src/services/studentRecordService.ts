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
  achievements?: string;
  extracurricular?: string;
  volunteerHours?: number;
  careerAspirations?: string;
}

// New student-record endpoints return raw DTOs (read res.data directly).
export const studentRecordService = {
  async get(studentId: number): Promise<StudentRecord | StudentRecord[]> {
    const res = await client.get<StudentRecord | StudentRecord[]>('/student-records', {
      params: { student_id: studentId },
    });
    return res.data;
  },

  async upsert(studentId: number, body: StudentRecordUpsertBody): Promise<StudentRecord> {
    const res = await client.post<StudentRecord>('/student-records', body, {
      params: { student_id: studentId },
    });
    return res.data;
  },
};
