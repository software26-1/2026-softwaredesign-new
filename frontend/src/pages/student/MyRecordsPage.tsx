import { useState, useEffect } from 'react';
import client from '../../api/client';
import { StudentRecordView, type StudentRecordData } from '../../components/common/StudentRecordView';

export function MyRecordsPage() {
  const [record, setRecord] = useState<StudentRecordData | null>(null);
  const [curGrade, setCurGrade] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 학생부 GET은 단일 객체를 반환하며, 학생 본인은 토큰으로 식별돼 student_id가 필요 없다.
    Promise.all([
      client.get<any>('/users/me').then(r => (r.data?.data ?? r.data)?.grade ?? 1).catch(() => 1),
      client.get<any>('/student-records').then(r => {
        const body = r.data?.data ?? r.data;
        return body && body.id ? body : null;
      }).catch(() => null),
    ]).then(([g, rec]) => {
      setCurGrade(g);
      setRecord(rec);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY RECORDS</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학생부 조회</h1>
      </div>
      <StudentRecordView key={`${curGrade}-${record?.id ?? 'none'}`} record={record} curGrade={curGrade} loading={loading} />
    </div>
  );
}
