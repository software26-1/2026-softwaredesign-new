import { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { analyticsService } from '../../services/analyticsService';
import { feedbackService } from '../../services/feedbackService';
import client from '../../api/client';
import type { StudentCourseTerm } from '../../types/analytics';
import type { Feedback } from '../../types/feedback';

const YEAR = new Date().getFullYear();
const SEMESTER = new Date().getMonth() < 7 ? 1 : 2;

interface ChildInfo { id: number; name: string; grade: number; classNumber: number; studentNumber: number; }
interface Props { user: User }

export function ParentDashboard({ user }: Props) {
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [courses, setCourses] = useState<StudentCourseTerm[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<ChildInfo[]>('/parents/me/students')
      .then(res => {
        const first = res.data[0];
        if (!first) return;
        setChild(first);
        return Promise.all([
          analyticsService.getStudentCourses(first.id, YEAR, SEMESTER).then(setCourses).catch(() => setCourses([])),
          feedbackService.getByStudent(first.id).then(setFeedbacks).catch(() => setFeedbacks([])),
        ]);
      }).catch(() => setChild(null)).finally(() => setLoading(false));
  }, [user.id]);

  const avg = courses.length > 0
    ? (courses.reduce((s, c) => s + (c.avgScore ?? 0), 0) / courses.length).toFixed(1)
    : '—';
  const isMiddle = courses.length > 0 && courses.filter(c => c.gradeLevel != null).every(c => /^[A-Za-z]/.test(String(c.gradeLevel)));

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>;

  return (
    <div>
      <style>{`
        .pd-banner { display: flex; gap: 14px; margin-bottom: 20px; align-items: stretch; height: 270px; }
        .pd-mobile-greeting { display: none; }
        .pd-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) {
          .pd-banner { display: none; }
          .pd-mobile-greeting { display: block; background: #fff; border-radius: 10px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
          .pd-mobile-stats { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
          .pd-mobile-stat-item { flex: 1; min-width: 90px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .pd-bottom-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* 데스크탑 배너 */}
      <div className="pd-banner">
        {/* 왼쪽 인사 */}
        <div style={{ borderRadius: '4px', flex: 2, position: 'relative', overflow: 'hidden' }}>
          <img src="/school_building.png" alt="" style={{ position: 'absolute', right: 0, top: 0, width: '60%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #ffffff 35%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.5) 72%, rgba(255,255,255,0.15) 100%)' }}/>
          <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.02em' }}>{today}</p>
              <p style={{ fontSize: '36px', fontWeight: 700, color: '#1B3A7A', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2px' }}>안녕하세요</p>
              <p style={{ fontSize: '26px', fontWeight: 600, color: '#1a2332', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '10px' }}>{user.name} 학부모님</p>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#1B3A7A', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap', fontFamily: "'Noto Sans KR', sans-serif", display: 'inline-block' }}>
                {child ? `자녀: ${child.name} (${child.grade}학년 ${child.classNumber}반)` : '학부모'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: '자녀 학기 평균', value: avg === '—' ? '—' : `${avg}점` },
                { label: '받은 피드백', value: `${feedbacks.length}건` },
                { label: '자녀 학번', value: child ? `${child.studentNumber}번` : '—' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: '10px', width: '120px', border: '1px solid #d1d9e0' }}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '5px', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.label}</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.02em' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 가운데 */}
        <div style={{ flex: 1.3, borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 16px rgba(27,58,122,0.2)' }}>
          <img src="/classroom.png" alt="교실" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(10,31,78,0.82) 0%, rgba(10,31,78,0.5) 50%, rgba(10,31,78,0.1) 100%)' }}/>
          <div style={{ position: 'absolute', top: '22px', left: '24px', color: '#fff' }}>
            <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', letterSpacing: '0.06em' }}>자녀의 성장을 함께</p>
            <h2 style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              모든 가능성의<br/>발견
            </h2>
          </div>
        </div>

        {/* 오른쪽 2개 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ flex: 1, borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 2px 10px rgba(27,58,122,0.12)' }}>
            <img src="/school.jpeg" alt="학교" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,31,78,0.85) 0%, rgba(10,31,78,0.3) 60%, transparent 100%)' }}/>
            <div style={{ position: 'absolute', bottom: '12px', left: '14px', color: '#fff' }}>
              <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '3px', letterSpacing: '0.04em' }}>성적 · 출결 · 피드백</p>
              <p style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>자녀 학습 현황</p>
            </div>
          </div>
          <div style={{ flex: 1, borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 2px 10px rgba(27,58,122,0.12)' }}>
            <img src="/playground.png" alt="운동장" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,31,78,0.85) 0%, rgba(10,31,78,0.25) 60%, transparent 100%)' }}/>
            <div style={{ position: 'absolute', bottom: '12px', left: '14px', color: '#fff' }}>
              <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '3px', letterSpacing: '0.04em' }}>학생부 관리시스템</p>
              <p style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.02em', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>자녀 성장 지원</p>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 인사 카드 */}
      <div className="pd-mobile-greeting">
        <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>{today}</p>
        <p style={{ fontSize: '22px', fontWeight: 700, color: '#1B3A7A', marginBottom: '2px' }}>안녕하세요</p>
        <p style={{ fontSize: '17px', fontWeight: 600, color: '#1a2332', marginBottom: '8px' }}>{user.name} 학부모님</p>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#1B3A7A', padding: '3px 12px', borderRadius: '20px', display: 'inline-block' }}>
          {child ? `자녀: ${child.name} (${child.grade}학년 ${child.classNumber}반)` : '학부모'}
        </span>
        <div className="pd-mobile-stats">
          {[
            { label: '자녀 학기 평균', value: avg === '—' ? '—' : `${avg}점` },
            { label: '받은 피드백', value: `${feedbacks.length}건` },
            { label: '자녀 학번', value: child ? `${child.studentNumber}번` : '—' },
          ].map(s => (
            <div key={s.label} className="pd-mobile-stat-item">
              <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '3px', fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 성적 + 피드백 */}
      {child ? (
        <div className="pd-bottom-grid">
          <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#1B3A7A', flexShrink: 0 }}/>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>자녀 성적 현황</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minHeight: 'calc(100vh - 460px)', maxHeight: 'calc(100vh - 460px)', overflowY: 'auto' }}>
              {courses.length === 0 ? (
                <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>성적 데이터가 없습니다.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead><tr style={{ background: '#f0f5ff' }}>
                    {['과목', '평균', ...(isMiddle ? [] : ['석차'])].map(h => <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#1B3A7A', fontSize: '11px' }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {courses.map(g => (
                      <tr key={g.courseKey} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '11px 16px', fontWeight: 500, color: '#1e293b' }}>{g.courseName ?? `과목${g.courseKey}`}</td>
                        <td style={{ padding: '11px 16px', fontWeight: 700, color: '#1B3A7A' }}>{g.avgScore?.toFixed(1) ?? '—'}</td>
                        {!isMiddle && <td style={{ padding: '11px 16px', color: '#94a3b8' }}>{g.classRank != null ? `${g.classRank}위` : '—'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#F4A000', flexShrink: 0 }}/>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>교사 피드백</h2>
            </div>
            <div style={{ minHeight: 'calc(100vh - 460px)', maxHeight: 'calc(100vh - 460px)', overflowY: 'auto' }}>
              {feedbacks.length === 0 ? (
                <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>피드백이 없습니다.</p>
              ) : feedbacks.slice(0, 5).map(f => (
                <div key={f.id} style={{ padding: '14px 18px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.createdAt?.slice(0, 10)} · {f.teacherName} 선생님</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, background: '#f0f5fb', color: '#1e5a99', padding: '2px 8px', borderRadius: '4px' }}>{f.category}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>{f.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '4px', padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          연결된 자녀 정보가 없습니다. 관리자에게 문의하세요.
        </div>
      )}
    </div>
  );
}
