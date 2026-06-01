import { useState, useEffect } from 'react';
import client from '../../api/client';
import { StudentRecordView, type StudentRecordData } from '../../components/common/StudentRecordView';

export function ChildRecordsPage() {
  const [record, setRecord] = useState<StudentRecordData | null>(null);
  const [curGrade, setCurGrade] = useState(1);
  const [childName, setChildName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<any>('/parents/me/students')
      .then(r => {
        const children = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        const child = children[0];
        if (!child?.studentId) { setLoading(false); return; }
        setChildName(child.studentName ?? '');
        setCurGrade(child.grade ?? 1);
        return client.get<any>(`/student-records?student_id=${child.studentId}`).then(rr => {
          const body = rr.data?.data ?? rr.data;
          setRecord(body && body.id ? body : null);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>CHILD RECORDS</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>자녀 학생부{childName && ` · ${childName}`}</h1>
      </div>
      <StudentRecordView key={`${curGrade}-${record?.id ?? 'none'}`} record={record} curGrade={curGrade} loading={loading} />
    </div>
  );
}
