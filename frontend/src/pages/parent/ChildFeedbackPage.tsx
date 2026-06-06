import { useState, useEffect } from 'react';
import client from '../../api/client';
import { TermFilter } from '../../components/common/TermFilter';
import { gradeToYear, inTerm } from '../../utils/term';

interface FeedbackItem {
  id: number;
  content: string;
  type: string;
  createdAt: string;
  teacherName?: string;
}

// 백엔드 FeedbackType은 ACADEMIC(=성적)/BEHAVIOR/ATTENDANCE/ATTITUDE. GRADE는 프론트 별칭.
const TYPE_LABELS: Record<string, string> = { ACADEMIC: '성적', GRADE: '성적', BEHAVIOR: '행동', ATTENDANCE: '출결', ATTITUDE: '태도' };
const typeBg: Record<string, string> = { ACADEMIC: '#ebf4ff', GRADE: '#ebf4ff', BEHAVIOR: '#e8f5e9', ATTENDANCE: '#fff3e0', ATTITUDE: '#f3e5f5' };
const typeColor: Record<string, string> = { ACADEMIC: '#1e5a99', GRADE: '#1e5a99', BEHAVIOR: '#2e7d32', ATTENDANCE: '#e65100', ATTITUDE: '#6a1b9a' };

export function ChildFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [curGrade, setCurGrade] = useState(1);
  const [selGrade, setSelGrade] = useState(1);
  const [semester, setSemester] = useState<1 | 2>(1);

  useEffect(() => {
    client.get<any>('/parents/me/students')
      .then(r => {
        const children = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        const firstChild = children[0];
        if (firstChild) {
          setChild(firstChild);
          const g = firstChild.grade ?? 1;
          setCurGrade(g); setSelGrade(g);
          return client.get<any>(`/feedbacks?student_id=${firstChild.studentId ?? firstChild.id}`);
        }
      })
      .then(r => {
        if (r) {
          const data = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
          setFeedbacks(data.filter((f: any) => f.visibleToParent !== false));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const year = gradeToYear(curGrade, selGrade);
  const visible = feedbacks.filter(f => inTerm(f.createdAt, year, semester));

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', marginBottom: '12px' }}>
          자녀 피드백{child ? ` · ${child.studentName ?? child.name}` : ''}
        </h1>
        {child && <TermFilter curGrade={curGrade} selGrade={selGrade} semester={semester} onGrade={setSelGrade} onSemester={setSemester} />}
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : !child ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>연결된 자녀가 없습니다.</p>
        </div>
      ) : visible.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>{selGrade}학년 {semester}학기 피드백이 없습니다.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {visible.map((f, i) => (
            <div key={f.id} style={{ padding: '20px 24px', borderBottom: i < visible.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: typeBg[f.type] ?? '#f5f5f5', color: typeColor[f.type] ?? '#666' }}>
                    {TYPE_LABELS[f.type] ?? f.type}
                  </span>
                  {f.teacherName && <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{f.teacherName} 선생님</span>}
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.createdAt?.slice(0, 10)}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.75', padding: '12px 16px', background: '#f8fafc', borderRadius: '6px' }}>
                {f.content && f.content.length > 60 ? (
                  <>
                    {expandedId === f.id ? f.content : f.content.slice(0, 60) + '...'}
                    <button onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                      style={{ marginLeft: '6px', fontSize: '11px', color: '#1e5a99', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>
                      {expandedId === f.id ? '접기' : '더보기'}
                    </button>
                  </>
                ) : f.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
