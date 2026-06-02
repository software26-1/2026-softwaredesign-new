import { useState, useEffect } from 'react';
import client from '../../api/client';
import { analyticsService } from '../../services/analyticsService';
import { CourseRadarChart } from '../../components/charts/CourseRadarChart';
import type { LearningSummary, StudentCourseTerm } from '../../types/analytics';

const YEAR = new Date().getFullYear();

const thStyle: React.CSSProperties = { padding: '11px 16px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '12px', borderBottom: '2px solid #d1d5db', borderRight: '1px solid #e5e7eb', background: '#f3f4f6' };
const tdStyle: React.CSSProperties = { padding: '11px 16px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontSize: '13px', textAlign: 'center', color: '#374151' };
const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: active ? '1px solid #1e5a99' : '1px solid #d1d5db', fontFamily: "'Noto Sans KR', sans-serif", background: active ? '#1e5a99' : '#fff', color: active ? '#fff' : '#64748b' });

export function MyGradesPage() {
  const [studentId, setStudentId] = useState<number | null>(null);
  const [curGrade, setCurGrade] = useState<number>(1); // 학생의 현재 학년 (재학 학년도 = 올해)
  const [selGrade, setSelGrade] = useState<number>(1); // 선택한 학년
  const [semester, setSemester] = useState<1 | 2>(1);
  const [summary, setSummary] = useState<LearningSummary | null>(null);
  const [courses, setCourses] = useState<StudentCourseTerm[]>([]);
  const [loading, setLoading] = useState(true);

  // 선택 학년 → 실제 학년도(연도). 현재 학년 = 올해 기준으로 역산.
  const year = YEAR - (curGrade - selGrade);

  useEffect(() => {
    client.get<any>('/users/me').then(r => {
      const profile = r.data?.data ?? r.data;
      if (profile?.studentId) setStudentId(profile.studentId);
      else setLoading(false);
      const g = profile?.grade ?? 1;
      setCurGrade(g);
      setSelGrade(g);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    Promise.all([
      analyticsService.getStudentSummary(studentId, year, semester).catch(() => null),
      analyticsService.getStudentCourses(studentId, year, semester).catch(() => []),
    ]).then(([s, c]) => {
      setSummary(s);
      setCourses(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, [studentId, year, semester]);

  const sorted = [...courses].sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0));
  const avg = summary?.overallAvgScore != null
    ? summary.overallAvgScore.toFixed(1)
    : courses.length > 0
      ? (courses.reduce((s, c) => s + (c.avgScore ?? 0), 0) / courses.length).toFixed(1)
      : '—';

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>내 성적 조회</h1>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {Array.from({ length: curGrade }, (_, i) => i + 1).map(g => (
            <button key={g} onClick={() => setSelGrade(g)} style={filterBtn(selGrade === g)}>{g}학년</button>
          ))}
          <span style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 4px' }} />
          {([1, 2] as const).map(s => (
            <button key={s} onClick={() => setSemester(s)} style={filterBtn(semester === s)}>{s}학기</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>{selGrade}학년 {semester}학기 성적 데이터가 없습니다.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #1e5a99', minWidth: '140px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>전체 평균</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>{avg}점</p>
            </div>
            {summary?.overallClassRank != null && (
              <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #10b981', minWidth: '140px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>반 석차</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>{summary.overallClassRank}위</p>
              </div>
            )}
            <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #2471b8', minWidth: '140px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>수강 과목</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>{courses.length}개</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '20px', alignItems: 'start' }}>
            {/* 레이더 차트: 내 평균 vs 반 평균 */}
            <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '20px 24px' }}>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '12px' }}>과목별 성적 분포</h2>
              <CourseRadarChart courses={sorted.slice(0, 8)} />
            </div>

            {/* 성적 상세표 */}
            <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left' }}>과목</th>
                    <th style={thStyle}>원점수</th>
                    <th style={thStyle}>반 평균</th>
                    <th style={thStyle}>석차</th>
                    <th style={{ ...thStyle, borderRight: 'none' }}>등급</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c, i) => {
                    const isLetter = c.gradeLevel != null && isNaN(Number(c.gradeLevel));
                    return (
                      <tr key={c.courseKey} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600 }}>{c.courseName ?? `과목 ${c.courseKey}`}</td>
                        <td style={{ ...tdStyle, fontWeight: 700, color: '#1e5a99' }}>{c.avgScore?.toFixed(1) ?? '—'}</td>
                        <td style={tdStyle}>{c.classAvgScore?.toFixed(1) ?? '—'}</td>
                        <td style={tdStyle}>{c.classRank != null ? `${c.classRank}위` : '—'}</td>
                        <td style={{ ...tdStyle, borderRight: 'none' }}>
                          {c.gradeLevel != null ? (
                            <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, background: isLetter ? '#e8f5e9' : '#ebf4ff', color: isLetter ? '#2e7d32' : '#1e5a99' }}>
                              {isLetter ? c.gradeLevel : `${c.gradeLevel}등급`}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
