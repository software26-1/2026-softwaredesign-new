import { useState } from 'react';
import { Button } from '../components/common/Button';

type ExamType = 'MIDTERM' | 'FINAL' | 'TASK';

const EXAM_LABELS: Record<ExamType, string> = { MIDTERM: '중간고사', FINAL: '기말고사', TASK: '수행평가' };

const COURSES = [
  { id: 1, name: '수학I', class: '3학년 5반' },
  { id: 2, name: '확률과 통계', class: '3학년 6반' },
  { id: 3, name: '문학', class: '3학년 5반' },
];

const STUDENTS = [
  { id: 1, name: '김철수', number: 1 },
  { id: 2, name: '이영희', number: 2 },
  { id: 3, name: '박민수', number: 3 },
  { id: 4, name: '최지은', number: 4 },
  { id: 5, name: '정승호', number: 5 },
];

function calcAchievement(score: number, avg: number, std: number): string {
  const z = std > 0 ? (score - avg) / std : 0;
  if (z >= 1.5) return 'A+';
  if (z >= 0.5) return 'A';
  if (z >= -0.5) return 'B+';
  if (z >= -1.5) return 'B';
  return 'C';
}

const achieveBg: Record<string, string> = { 'A+': '#e8f5e9', A: '#ebf4ff', 'B+': '#f3e5f5', B: '#fff3e0', C: '#fdecea' };
const achieveColor: Record<string, string> = { 'A+': '#2e7d32', A: '#1e5a99', 'B+': '#6a1b9a', B: '#e65100', C: '#c62828' };

const thStyle: React.CSSProperties = { padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const selectStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' };

export function GradeManagementPage() {
  const [courseId, setCourseId] = useState('');
  const [examType, setExamType] = useState<ExamType>('MIDTERM');
  const [semester, setSemester] = useState('2026-1');
  const [scores, setScores] = useState<Record<number, number | ''>>(
    Object.fromEntries(STUDENTS.map(s => [s.id, '']))
  );
  const [saved, setSaved] = useState(false);

  const filledScores = STUDENTS.map(s => scores[s.id]).filter(v => v !== '') as number[];
  const avg = filledScores.length ? filledScores.reduce((a, b) => a + b, 0) / filledScores.length : 0;
  const std = filledScores.length > 1
    ? Math.sqrt(filledScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / filledScores.length)
    : 0;

  const sorted = [...STUDENTS].sort((a, b) => (scores[b.id] as number || 0) - (scores[a.id] as number || 0));
  const rankMap = Object.fromEntries(sorted.map((s, i) => [s.id, i + 1]));

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>GRADE MANAGEMENT</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>성적 관리</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '14px' }}>과목 선택</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학기</label>
            <select style={{ ...selectStyle, width: '100%' }} value={semester} onChange={e => setSemester(e.target.value)}>
              <option value="2026-1">2026학년도 1학기</option>
              <option value="2026-2">2026학년도 2학기</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>개설 과목</label>
            <select style={{ ...selectStyle, width: '100%' }} value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">선택하세요</option>
              {COURSES.map(c => <option key={c.id} value={c.id}>{c.name} — {c.class}</option>)}
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
                {COURSES.find(c => String(c.id) === courseId)?.name} — {EXAM_LABELS[examType]}
              </h2>
              {filledScores.length > 0 && (
                <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  평균 {avg.toFixed(1)}점 · 표준편차 {std.toFixed(1)} · {filledScores.length}/{STUDENTS.length}명 입력
                </p>
              )}
            </div>
            <Button size="sm" onClick={handleSave}>전체 저장</Button>
          </div>

          {saved && (
            <div style={{ padding: '12px 24px', background: '#e8f5e9', borderBottom: '1px solid #c8e6c9', fontSize: '13px', color: '#2e7d32', fontWeight: 500 }}>
              성적이 저장되었습니다.
            </div>
          )}

          <div style={{ padding: '12px 24px', background: '#eff6ff', borderBottom: '1px solid #dbeafe', fontSize: '13px', color: '#1e5a99' }}>
            성적 입력 시 평균·표준편차·성취도·석차가 자동 계산됩니다.
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['번호','이름','원점수','과목 평균','표준편차','성취도','석차'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {STUDENTS.map((s) => {
                const score = scores[s.id];
                const achievement = score !== '' ? calcAchievement(score as number, avg, std) : null;
                return (
                  <tr key={s.id}>
                    <td style={{ ...tdStyle, color: '#94a3b8' }}>{String(s.number).padStart(2, '0')}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                    <td style={tdStyle}>
                      <input
                        type="number" min={0} max={100}
                        value={score}
                        onChange={e => setScores(prev => ({ ...prev, [s.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
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
                    <td style={{ ...tdStyle, color: '#475569' }}>
                      {score !== '' ? `${rankMap[s.id]}/${STUDENTS.length}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
