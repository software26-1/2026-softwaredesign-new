import { useState, useEffect } from 'react';
import client from '../../api/client';

interface AttendanceItem {
  id: number;
  date: string;
  status: string;
  reason?: string;
}

const STATUS_LABELS: Record<string, string> = { PRESENT: '출석', ABSENT: '결석', LATE: '지각', EARLY_LEAVE: '조퇴', SICK: '병결' };
const statusStyle: Record<string, { bg: string; color: string }> = {
  PRESENT:     { bg: '#f1f5f9', color: '#475569' },
  ABSENT:      { bg: '#fef2f2', color: '#991b1b' },
  LATE:        { bg: '#fff7ed', color: '#9a3412' },
  EARLY_LEAVE: { bg: '#f5f3ff', color: '#5b21b6' },
  SICK:        { bg: '#eff6ff', color: '#1d4ed8' },
};

export function ChildAttendancePage() {
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [childName, setChildName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    client.get<any>('/parents/me/students')
      .then(r => {
        const children = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        const child = children[0];
        if (!child?.studentId) { setLoading(false); return; }
        setChildName(child.studentName ?? '');
        return client.get<any>(`/attendances?student_id=${child.studentId}`)
          .then(rr => setAttendances(Array.isArray(rr.data) ? rr.data : (rr.data?.data ?? [])));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const summary = attendances.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sorted = [...attendances].sort((a, b) => b.date?.localeCompare(a.date ?? '') ?? 0);

  return (
    <div>
      <style>{`
        .ca-stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 24px; }
        @media (max-width: 768px) { .ca-stats-grid { grid-template-columns: repeat(3, 1fr); } }
      `}</style>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>자녀 출결{childName && ` · ${childName}`}</h1>
      </div>

      <div className="ca-stats-grid">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <div key={key} style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>{label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: statusStyle[key]?.color ?? '#1a2332' }}>{summary[key] ?? 0}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : attendances.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>출결 내역이 없습니다.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {sorted.map((a, idx) => {
            const isExpanded = expandedId === a.id;
            const reason = a.reason || '';
            const truncated = reason.length > 20 ? reason.slice(0, 20) + '...' : reason;
            return (
              <div key={a.id} style={{ borderBottom: idx < sorted.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', color: '#64748b', minWidth: '84px' }}>{a.date?.slice(0, 10)}</span>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: statusStyle[a.status]?.bg ?? '#f1f5f9', color: statusStyle[a.status]?.color ?? '#475569', minWidth: '44px', textAlign: 'center' }}>
                    {STATUS_LABELS[a.status] ?? a.status}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#94a3b8' }}>
                    {reason.length > 20 ? (
                      <>
                        {isExpanded ? reason : truncated}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : a.id)}
                          style={{ marginLeft: '6px', fontSize: '11px', color: '#1e5a99', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Noto Sans KR', sans-serif" }}
                        >
                          {isExpanded ? '접기' : '더보기'}
                        </button>
                      </>
                    ) : (reason || '—')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
