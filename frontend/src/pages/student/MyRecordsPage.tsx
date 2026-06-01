import { useState, useEffect } from 'react';
import client from '../../api/client';

interface RecordItem {
  id: number;
  achievements?: string;
  extracurricular?: string;
  volunteerHours?: number;
  careerAspirations?: string;
  updatedAt?: string;
}

export function MyRecordsPage() {
  const [record, setRecord] = useState<RecordItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<any>('/student-records')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setRecord(data[0] ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fields = [
    { label: '특기사항 / 수상', value: record?.achievements },
    { label: '비교과 활동', value: record?.extracurricular },
    { label: '봉사 시간', value: record?.volunteerHours != null ? `${record.volunteerHours}시간` : null },
    { label: '진로 희망', value: record?.careerAspirations },
  ];

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY RECORDS</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학생부 조회</h1>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : !record ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>학생부 기록이 없습니다.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {fields.map(f => (
              <div key={f.label} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>{f.label}</p>
                <p style={{ fontSize: '14px', color: '#1a2332', lineHeight: '1.6' }}>{f.value || '—'}</p>
              </div>
            ))}
          </div>
          {record.updatedAt && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '16px', textAlign: 'right' }}>
              최종 수정: {record.updatedAt.slice(0, 10)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
