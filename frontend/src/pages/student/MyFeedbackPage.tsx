import { useState, useEffect } from 'react';
import client from '../../api/client';

interface FeedbackItem {
  id: number;
  content: string;
  type: string;
  createdAt: string;
  teacherName?: string;
  visibleToStudent?: boolean;
}

const TYPE_LABELS: Record<string, string> = { GRADE: '성적', BEHAVIOR: '행동', ATTENDANCE: '출결', ATTITUDE: '태도' };
const typeBg: Record<string, string> = { GRADE: '#ebf4ff', BEHAVIOR: '#e8f5e9', ATTENDANCE: '#fff3e0', ATTITUDE: '#f3e5f5' };
const typeColor: Record<string, string> = { GRADE: '#1e5a99', BEHAVIOR: '#2e7d32', ATTENDANCE: '#e65100', ATTITUDE: '#6a1b9a' };

export function MyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<any>('/feedbacks')
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setFeedbacks(data.filter((f: any) => f.visibleToStudent !== false));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY FEEDBACK</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>피드백 확인</h1>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : feedbacks.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>피드백이 없습니다.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {feedbacks.map((f, i) => (
            <div key={f.id} style={{ padding: '20px 24px', borderBottom: i < feedbacks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: typeBg[f.type] ?? '#f5f5f5', color: typeColor[f.type] ?? '#666' }}>
                    {TYPE_LABELS[f.type] ?? f.type}
                  </span>
                  {f.teacherName && <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{f.teacherName} 선생님</span>}
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.createdAt?.slice(0, 10)}</span>
              </div>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.75', padding: '12px 16px', background: '#f8fafc', borderRadius: '6px' }}>{f.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
