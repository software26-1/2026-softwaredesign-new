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

const thStyle: React.CSSProperties = { padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#374151', fontSize: '12px', borderBottom: '2px solid #d1d5db', borderRight: '1px solid #e5e7eb', background: '#f3f4f6' };
const tdStyle: React.CSSProperties = { padding: '10px 14px', borderBottom: '1px solid #e5e7eb', borderRight: '1px solid #e5e7eb', fontSize: '13px', textAlign: 'center', color: '#374151' };
const filterBtn = (active: boolean): React.CSSProperties => ({ padding: '5px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid #d1d5db', fontFamily: "'Noto Sans KR', sans-serif", background: active ? '#1e5a99' : '#fff', color: active ? '#fff' : '#64748b' });

export function MyGradesPage() {
  const [semester, setSemester] = useState<1 | 2>(1);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    client.get<any>('/users/me').then(r => {
      const profile = r.data?.data ?? r.data;
      const sid = profile?.studentId;
      if (sid) setStudentId(sid);
      else setNoData(true);
    }).catch(() => setNoData(true));
  }, []);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    Promise.all([
      analyticsService.getStudentSummary(studentId, YEAR, semester).catch(() => null),
      analyticsService.getStudentCourses(studentId, YEAR, semester).catch(() => []),
    ]).then(([s, c]) => {
      setSummary(s);
      setCourses(Array.isArray(c) ? c : []);
      if (!s && (!c || c.length === 0)) setNoData(true);
    }).finally(() => setLoading(false));
  }, [studentId, semester]);

  const avg = summary?.overallAvgScore?.toFixed(1) ?? '—';

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY GRADES</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>내 성적 조회</h1>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {([1, 2] as const).map(s => (
            <button key={s} onClick={() => setSemester(s)} style={filterBtn(semester === s)}>{s}학기</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : noData || courses.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>성적 데이터가 없습니다.</p>
          <p style={{ color: '#cbd5e1', fontSize: '12px', marginTop: '8px' }}>ETL 실행 후 확인하세요.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #1e5a99' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>이번 학기 평균</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>{avg}점</p>
            </div>
            {summary?.overallClassRank && (
              <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #10b981' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>반 석차</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>{summary.overallClassRank}위</p>
              </div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>과목</th>
                  <th style={thStyle}>원점수</th>
                  <th style={thStyle}>과목평균</th>
                  <th style={thStyle}>성취도</th>
                  <th style={thStyle}>석차/수강</th>
                  <th style={{ ...thStyle, borderRight: 'none' }}>내신등급</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c, i) => {
                  const naesin = c.classRank && c.studentCount ? calcNaesin(c.classRank, c.studentCount) : null;
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 500 }}>{c.courseName ?? '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{c.avgScore?.toFixed(1) ?? '—'}</td>
                      <td style={tdStyle}>{c.avgScore?.toFixed(1) ?? '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{c.achievementLevel ?? '—'}</td>
                      <td style={tdStyle}>{c.classRank && c.studentCount ? `${c.classRank}/${c.studentCount}` : '—'}</td>
                      <td style={{ ...tdStyle, fontWeight: naesin ? 700 : 400, borderRight: 'none' }}>{naesin ? `${naesin}등급` : '—'}</td>
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
