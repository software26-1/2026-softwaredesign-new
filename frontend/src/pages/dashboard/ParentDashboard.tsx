import { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { analyticsService } from '../../services/analyticsService';
import { feedbackService } from '../../services/feedbackService';
import client from '../../api/client';
import type { StudentCourseTerm } from '../../types/analytics';
import type { Feedback } from '../../types/feedback';

const YEAR = new Date().getFullYear();
const SEMESTER = new Date().getMonth() < 7 ? 1 : 2;

interface ChildInfo {
  id: number;
  name: string;
  grade: number;
  classNumber: number;
  studentNumber: number;
}

interface Props { user: User }

export function ParentDashboard({ user }: Props) {
  const [child, setChild] = useState<ChildInfo | null>(null);
  const [courses, setCourses] = useState<StudentCourseTerm[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<ChildInfo[]>(`/parents/${user.id}/students`)
      .then(res => {
        const first = res.data[0];
        if (!first) return;
        setChild(first);
        return Promise.all([
          analyticsService.getStudentCourses(first.id, YEAR, SEMESTER).then(setCourses).catch(() => setCourses([])),
          feedbackService.getByStudent(first.id).then(setFeedbacks).catch(() => setFeedbacks([])),
        ]);
      })
      .catch(() => setChild(null))
      .finally(() => setLoading(false));
  }, [user.id]);

  const avg = courses.length > 0
    ? (courses.reduce((s, c) => s + (c.avgScore ?? 0), 0) / courses.length).toFixed(1)
    : '—';

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: '28px' }}>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500, letterSpacing: '0.02em' }}>DASHBOARD</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>안녕하세요, {user.name}님</h1>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500, letterSpacing: '0.02em' }}>DASHBOARD</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>안녕하세요, {user.name}님</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '24px', borderLeft: '4px solid var(--primary-blue)' }}>
        {child ? (
          <>
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>자녀 정보</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1a2332' }}>{child.name}</p>
              <p style={{ fontSize: '13px', color: '#64748b' }}>{child.grade}학년 {child.classNumber}반 {child.studentNumber}번</p>
            </div>
            <div style={{ width: '1px', height: '48px', background: '#e8ecf0' }} />
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>이번 학기 평균</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1e5a99' }}>{avg === '—' ? '—' : `${avg}점`}</p>
            </div>
            <div style={{ width: '1px', height: '48px', background: '#e8ecf0' }} />
            <div>
              <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>최근 피드백</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#2ecc71' }}>{feedbacks.length}건</p>
            </div>
          </>
        ) : (
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>연결된 자녀 정보가 없습니다. 관리자에게 문의하세요.</p>
        )}
      </div>

      {child && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>자녀 성적 현황</h2>
            </div>
            {courses.length === 0 ? (
              <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>성적 데이터가 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['과목', '평균', '석차'].map((h) => (
                      <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.map((g) => (
                    <tr key={g.courseKey} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 500, color: '#1e293b' }}>{g.courseName ?? `과목${g.courseKey}`}</td>
                      <td style={{ padding: '12px 20px', color: '#1e5a99', fontWeight: 600 }}>{g.avgScore != null ? `${g.avgScore.toFixed(1)}점` : '—'}</td>
                      <td style={{ padding: '12px 20px' }}>
                        {g.classRank != null ? (
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: '#ebf4ff', color: '#1e5a99' }}>{g.classRank}위</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>교사 피드백</h2>
            </div>
            <div style={{ padding: '8px 0' }}>
              {feedbacks.length === 0 ? (
                <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>피드백이 없습니다.</p>
              ) : feedbacks.slice(0, 5).map((f) => (
                <div key={f.id} style={{ padding: '14px 24px', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.createdAt?.slice(0, 10)} · {f.teacherName} 선생님</span>
                    <span style={{ fontSize: '11px', fontWeight: 600, background: '#f0f5fb', color: '#1e5a99', padding: '2px 8px', borderRadius: '4px' }}>{f.category}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>{f.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
