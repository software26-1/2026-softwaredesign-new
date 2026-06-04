import { useState, useEffect } from 'react';
import client from '../../api/client';
import { feedbackService } from '../../services/feedbackService';
import { TermFilter } from '../../components/common/TermFilter';
import { gradeToYear, inTerm } from '../../utils/term';
import type { Feedback } from '../../types/feedback';

const TYPE_LABELS: Record<string, string> = { GRADE: '성적', ACADEMIC: '성적', BEHAVIOR: '행동', ATTENDANCE: '출결', ATTITUDE: '태도' };
const typeBg: Record<string, string> = { GRADE: '#ebf4ff', ACADEMIC: '#ebf4ff', BEHAVIOR: '#e8f5e9', ATTENDANCE: '#fff3e0', ATTITUDE: '#f3e5f5' };
const typeColor: Record<string, string> = { GRADE: '#1e5a99', ACADEMIC: '#1e5a99', BEHAVIOR: '#2e7d32', ATTENDANCE: '#e65100', ATTITUDE: '#6a1b9a' };

export function MyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [curGrade, setCurGrade] = useState(1);
  const [selGrade, setSelGrade] = useState(1);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // 학생 데이터는 student PK 기준이라 /users/me의 studentId로 조회해야 한다.
  useEffect(() => {
    client.get<any>('/users/me')
      .then(r => {
        const profile = r.data?.data ?? r.data;
        const g = profile?.grade ?? 1;
        setCurGrade(g); setSelGrade(g);
        if (!profile?.studentId) { setLoading(false); return; }
        return feedbackService.getByStudent(profile.studentId)
          .then(list => setFeedbacks(list.filter(f => f.isPublicToStudent)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const year = gradeToYear(curGrade, selGrade);
  const visible = feedbacks.filter(f => inTerm(f.createdAt, year, semester));

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', marginBottom: '12px' }}>피드백 확인</h1>
        <TermFilter curGrade={curGrade} selGrade={selGrade} semester={semester} onGrade={setSelGrade} onSemester={setSemester} />
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
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
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: typeBg[f.category] ?? '#f5f5f5', color: typeColor[f.category] ?? '#666' }}>
                    {TYPE_LABELS[f.category] ?? f.category}
                  </span>
                  {f.teacherName && <span style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>{f.teacherName} 선생님</span>}
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.createdAt?.slice(0, 10)}</span>
              </div>
              <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.75', padding: '12px 16px', background: '#f8fafc', borderRadius: '6px' }}>
                {f.content && f.content.length > 60 ? (
                  <>
                    {expandedId === f.id ? f.content : f.content.slice(0, 60) + '...'}
                    <button
                      onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
                      style={{ marginLeft: '6px', fontSize: '11px', color: '#1e5a99', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Noto Sans KR', sans-serif" }}
                    >
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
