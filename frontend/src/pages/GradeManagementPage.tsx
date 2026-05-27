import { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { gradeService } from '../services/gradeService';
import type { Course, GradeSummary } from '../types/grade';

type ExamType = 'MIDTERM' | 'FINAL' | 'TASK';
const EXAM_LABELS: Record<ExamType, string> = { MIDTERM: '중간고사', FINAL: '기말고사', TASK: '수행평가' };

const achieveBg: Record<string, string> = { 'A+': '#e8f5e9', A: '#ebf4ff', 'B+': '#f3e5f5', B: '#fff3e0', C: '#fdecea' };
const achieveColor: Record<string, string> = { 'A+': '#2e7d32', A: '#1e5a99', 'B+': '#6a1b9a', B: '#e65100', C: '#c62828' };

const thStyle: React.CSSProperties = { padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const selectStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' };

function calcAchievement(score: number, avg: number, std: number): string {
  const z = std > 0 ? (score - avg) / std : 0;
  if (z >= 1.5) return 'A+';
  if (z >= 0.5) return 'A';
  if (z >= -0.5) return 'B+';
  if (z >= -1.5) return 'B';
  return 'C';
}

export function GradeManagementPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [semester, setSemester] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [examType, setExamType] = useState<ExamType>('MIDTERM');
  const [enrollments, setEnrollments] = useState<GradeSummary[]>([]);
  const [scores, setScores] = useState<Record<number, number | ''>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gradeService.getCourses()
      .then(setCourses)
      .catch(() => setCourses([]));
  }, [year, semester]);

  useEffect(() => {
    if (!courseId) { setEnrollments([]); setScores({}); return; }
    setLoading(true);
    gradeService.getEnrollments(Number(courseId))
      .then(data => {
        setEnrollments(data);
        setScores(Object.fromEntries(data.map(e => [e.studentId, ''])));
      })
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [courseId]);

  const filledScores = enrollments.map(e => scores[e.studentId]).filter(v => v !== '') as number[];
  const avg = filledScores.length ? filledScores.reduce((a, b) => a + b, 0) / filledScores.length : 0;
  const std = filledScores.length > 1
    ? Math.sqrt(filledScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / filledScores.length)
    : 0;
  const sorted = [...enrollments].sort((a, b) => (scores[b.studentId] as number || 0) - (scores[a.studentId] as number || 0));
  const rankMap = Object.fromEntries(sorted.map((e, i) => [e.studentId, i + 1]));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const entries = enrollments.filter(e => scores[e.studentId] !== '');
      await Promise.all(entries.map(e =>
        gradeService.saveGrade(e.studentId, { examType, score: scores[e.studentId] as number, maxScore: 100 })
      ));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCourse = courses.find(c => String(c.id) === courseId);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>GRADE MANAGEMENT</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>성적 관리</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '14px' }}>과목 선택</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학년도</label>
            <select style={{ ...selectStyle, width: '100%' }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}학년도</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학기</label>
            <select style={{ ...selectStyle, width: '100%' }} value={semester} onChange={e => setSemester(Number(e.target.value))}>
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>개설 과목</label>
            <select style={{ ...selectStyle, width: '100%' }} value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">선택하세요</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.courseName}{c.classGroupName ? ` — ${c.classGroupName}` : ''}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>시험 구분</label>
            <select style={{ ...selectStyle, width: '100%' }} value={examType} onChange={e => setExamType(e.target.value as ExamType)}>
              {Object.entries(EXAM_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      {courseId && (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>
                {selectedCourse?.courseName} — {EXAM_LABELS[examType]}
              </h2>
              {filledScores.length > 0 && (
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  평균 {avg.toFixed(1)}점 · 표준편차 {std.toFixed(1)} · {filledScores.length}/{enrollments.length}명 입력
                </p>
              )}
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '전체 저장'}
            </Button>
          </div>

          {saved && <div style={{ padding: '12px 24px', background: '#e8f5e9', borderBottom: '1px solid #c8e6c9', fontSize: '13px', color: '#2e7d32', fontWeight: 500 }}>성적이 저장되었습니다.</div>}
          {error && <div style={{ padding: '12px 24px', background: '#fdecea', borderBottom: '1px solid #f5c6c2', fontSize: '13px', color: '#c62828' }}>{error}</div>}

          <div style={{ padding: '12px 24px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', fontSize: '13px', color: '#1e5a99' }}>
            성적 입력 시 평균·표준편차·성취도·석차가 자동 계산됩니다.
          </div>

          {loading ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['번호', '이름', '원점수', '과목 평균', '표준편차', '성취도', '석차'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {enrollments.map(e => {
                  const score = scores[e.studentId];
                  const achievement = score !== '' ? calcAchievement(score as number, avg, std) : null;
                  return (
                    <tr key={e.studentId}>
                      <td style={{ ...tdStyle, color: '#94a3b8' }}>{String(e.studentNumber).padStart(2, '0')}</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{e.studentName}</td>
                      <td style={tdStyle}>
                        <input
                          type="number" min={0} max={100}
                          value={score}
                          onChange={ev => setScores(prev => ({ ...prev, [e.studentId]: ev.target.value === '' ? '' : Number(ev.target.value) }))}
                          style={{ width: '72px', padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', outline: 'none', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{filledScores.length > 0 ? avg.toFixed(1) : '—'}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{filledScores.length > 1 ? std.toFixed(1) : '—'}</td>
                      <td style={tdStyle}>
                        {achievement ? (
                          <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: achieveBg[achievement], color: achieveColor[achievement] }}>
                            {achievement}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ ...tdStyle, color: '#475569' }}>{score !== '' ? `${rankMap[e.studentId]}/${enrollments.length}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!courseId && (
        <div style={{ background: '#fff', borderRadius: '10px', padding: '60px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>위에서 과목을 선택하면 성적 입력 테이블이 표시됩니다.</p>
        </div>
      )}
    </div>
  );
}
