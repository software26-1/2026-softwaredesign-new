import { useState, useEffect } from 'react';
import client from '../../api/client';
import { analyticsService } from '../../services/analyticsService';

const YEAR = new Date().getFullYear();

function calcNaesin(rank: number, total: number): number {
  const pct = (rank / total) * 100;
  if (pct <= 4) return 1; if (pct <= 11) return 2; if (pct <= 23) return 3;
  if (pct <= 40) return 4; if (pct <= 60) return 5; if (pct <= 77) return 6;
  if (pct <= 89) return 7; if (pct <= 96) return 8; return 9;
}

const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '12px 14px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function ChildGradesPage() {
  const [semester, setSemester] = useState<1 | 2>(1);
  const [child, setChild] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get<any>('/parents/me/students').then(r => {
      const children = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
      setChild(children[0] ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!child?.studentId) return;
    setLoading(true);
    Promise.all([
      analyticsService.getStudentSummary(child.studentId, YEAR, semester).catch(() => null),
      analyticsService.getStudentCourses(child.studentId, YEAR, semester).catch(() => []),
    ]).then(([s, c]) => {
      setSummary(s);
      setCourses(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, [child, semester]);

  const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '5px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid #d1d5db', fontFamily: "'Noto Sans KR', sans-serif", background: active ? '#1e5a99' : '#fff', color: active ? '#fff' : '#64748b' });

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>CHILD GRADES</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>
            자녀 성적 조회{child ? ` — ${child.studentName ?? child.name}` : ''}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([1, 2] as const).map(s => (
            <button key={s} onClick={() => setSemester(s)} style={filterBtn(semester === s)}>{s}학기</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : !child ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>연결된 자녀가 없습니다.</p>
        </div>
      ) : courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>성적 데이터가 없습니다.</p>
          <p style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '8px' }}>ETL 실행 후 확인하세요.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: '평균', value: `${summary?.overallAvgScore?.toFixed(1) ?? '—'}점`, color: '#1e5a99' },
              { label: '반 석차', value: summary?.overallClassRank ? `${summary.overallClassRank}위` : '—', color: '#10b981' },
              { label: '출석률', value: summary?.attendanceRate ? `${summary.attendanceRate.toFixed(1)}%` : '—', color: '#f39c12' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '16px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${s.color}` }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>{s.label}</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['과목', '원점수', '과목평균', '성취도', '석차/수강', '내신등급'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {courses.map((c, i) => {
                  const naesin = c.classRank && c.studentCount ? calcNaesin(c.classRank, c.studentCount) : null;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.courseName ?? '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 700, color: '#1e5a99' }}>{c.avgScore?.toFixed(1) ?? '—'}</td>
                      <td style={tdStyle}>{c.avgScore?.toFixed(1) ?? '—'}</td>
                      <td style={tdStyle}><span style={{ background: '#ebf4ff', color: '#1e5a99', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>{c.achievementLevel ?? '—'}</span></td>
                      <td style={tdStyle}>{c.classRank && c.studentCount ? `${c.classRank}/${c.studentCount}` : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: naesin ? 700 : 400 }}>{naesin ? `${naesin}등급` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
