import { useState } from 'react';
import { Card } from '../../components/common/Card';

type SchoolType = 'HIGH' | 'MIDDLE';
type ExamType = 'MIDTERM' | 'FINAL';

function calcNaesin(rank: number, total: number): number {
  const pct = (rank / total) * 100;
  if (pct <= 4) return 1;
  if (pct <= 11) return 2;
  if (pct <= 23) return 3;
  if (pct <= 40) return 4;
  if (pct <= 60) return 5;
  if (pct <= 77) return 6;
  if (pct <= 89) return 7;
  if (pct <= 96) return 8;
  return 9;
}

interface GradeRow {
  subject: string;
  course: string;
  score: number;
  avg: number;
  stdDev: number;
  achievement: string;
  rank: number;
  total: number;
  noNaesin?: boolean;
}

type DataKey = string;

const HIGH_DATA: Record<DataKey, GradeRow[]> = {
  '1-1-MIDTERM': [
    { subject: '국어', course: '국어', score: 88, avg: 78.2, stdDev: 9.1, achievement: 'A', rank: 5, total: 30 },
    { subject: '수학', course: '수학I', score: 82, avg: 76.4, stdDev: 10.2, achievement: 'B', rank: 11, total: 30 },
    { subject: '영어', course: '영어I', score: 79, avg: 75.0, stdDev: 8.3, achievement: 'B', rank: 14, total: 30 },
    { subject: '과학', course: '통합과학', score: 91, avg: 80.1, stdDev: 9.5, achievement: 'A', rank: 4, total: 30 },
    { subject: '사회', course: '통합사회', score: 85, avg: 77.3, stdDev: 8.7, achievement: 'A', rank: 8, total: 30 },
    { subject: '체육', course: '체육', score: 88, avg: 82.0, stdDev: 6.1, achievement: 'A', rank: 6, total: 30, noNaesin: true },
  ],
  '1-1-FINAL': [
    { subject: '국어', course: '국어', score: 90, avg: 79.5, stdDev: 8.8, achievement: 'A', rank: 4, total: 30 },
    { subject: '수학', course: '수학I', score: 85, avg: 77.1, stdDev: 9.8, achievement: 'A', rank: 9, total: 30 },
    { subject: '영어', course: '영어I', score: 81, avg: 76.2, stdDev: 8.0, achievement: 'B', rank: 13, total: 30 },
    { subject: '과학', course: '통합과학', score: 88, avg: 79.3, stdDev: 10.1, achievement: 'A', rank: 6, total: 30 },
    { subject: '사회', course: '통합사회', score: 83, avg: 75.8, stdDev: 9.2, achievement: 'A', rank: 10, total: 30 },
    { subject: '체육', course: '체육', score: 90, avg: 83.5, stdDev: 5.9, achievement: 'A', rank: 5, total: 30, noNaesin: true },
  ],
  '2-1-MIDTERM': [
    { subject: '국어', course: '언어와매체', score: 84, avg: 77.0, stdDev: 9.4, achievement: 'B', rank: 10, total: 28 },
    { subject: '수학', course: '수학II', score: 79, avg: 72.5, stdDev: 11.2, achievement: 'B', rank: 13, total: 28 },
    { subject: '수학', course: '미적분', score: 76, avg: 70.1, stdDev: 12.0, achievement: 'B', rank: 15, total: 28 },
    { subject: '영어', course: '영어II', score: 80, avg: 74.3, stdDev: 8.1, achievement: 'B', rank: 12, total: 28 },
    { subject: '과학', course: '물리학I', score: 88, avg: 76.5, stdDev: 10.8, achievement: 'A', rank: 7, total: 28 },
    { subject: '체육', course: '체육', score: 91, avg: 83.0, stdDev: 6.0, achievement: 'A', rank: 4, total: 28, noNaesin: true },
  ],
  '2-2-MIDTERM': [
    { subject: '국어', course: '화법과작문', score: 86, avg: 78.1, stdDev: 8.9, achievement: 'A', rank: 8, total: 28 },
    { subject: '수학', course: '확률과통계', score: 81, avg: 73.2, stdDev: 10.5, achievement: 'B', rank: 12, total: 28 },
    { subject: '영어', course: '영어독해', score: 83, avg: 75.0, stdDev: 8.4, achievement: 'B', rank: 10, total: 28 },
    { subject: '과학', course: '화학I', score: 77, avg: 71.8, stdDev: 11.1, achievement: 'B', rank: 15, total: 28 },
    { subject: '예술', course: '미술', score: 92, avg: 85.0, stdDev: 6.2, achievement: 'A', rank: 3, total: 28, noNaesin: true },
  ],
  '3-1-MIDTERM': [
    { subject: '국어', course: '문학', score: 92, avg: 80.1, stdDev: 9.2, achievement: 'A', rank: 3, total: 28 },
    { subject: '수학', course: '수학I', score: 87, avg: 85.2, stdDev: 8.5, achievement: 'B', rank: 12, total: 28 },
    { subject: '수학', course: '확률과통계', score: 83, avg: 79.0, stdDev: 10.1, achievement: 'B', rank: 14, total: 28 },
    { subject: '영어', course: '영어I', score: 78, avg: 81.0, stdDev: 7.8, achievement: 'C', rank: 18, total: 28 },
    { subject: '과학', course: '통합과학', score: 85, avg: 79.5, stdDev: 10.1, achievement: 'B', rank: 9, total: 28 },
    { subject: '사회', course: '통합사회', score: 80, avg: 76.3, stdDev: 8.9, achievement: 'B', rank: 14, total: 28 },
    { subject: '체육', course: '체육', score: 90, avg: 84.0, stdDev: 6.2, achievement: 'A', rank: 5, total: 28, noNaesin: true },
    { subject: '예술', course: '미술', score: 88, avg: 82.1, stdDev: 7.4, achievement: 'A', rank: 7, total: 28, noNaesin: true },
  ],
};

const MIDDLE_DATA: Record<DataKey, GradeRow[]> = {
  '1-1-MIDTERM': [
    { subject: '국어', course: '국어', score: 91, avg: 78.4, stdDev: 10.2, achievement: 'A', rank: 4, total: 30 },
    { subject: '수학', course: '수학', score: 88, avg: 77.1, stdDev: 11.5, achievement: 'A', rank: 8, total: 30 },
    { subject: '영어', course: '영어', score: 75, avg: 73.2, stdDev: 8.8, achievement: 'B', rank: 16, total: 30 },
    { subject: '과학', course: '과학', score: 82, avg: 75.0, stdDev: 9.3, achievement: 'B', rank: 12, total: 30 },
    { subject: '사회', course: '사회', score: 78, avg: 74.5, stdDev: 8.1, achievement: 'B', rank: 15, total: 30 },
    { subject: '체육', course: '체육', score: 95, avg: 85.0, stdDev: 7.0, achievement: 'A', rank: 2, total: 30 },
  ],
};

const thStyle: React.CSSProperties = {
  padding: '10px 14px',
  textAlign: 'center',
  fontWeight: 600,
  color: '#374151',
  fontSize: '12px',
  borderBottom: '2px solid #d1d5db',
  borderRight: '1px solid #e5e7eb',
  background: '#f3f4f6',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderBottom: '1px solid #e5e7eb',
  borderRight: '1px solid #e5e7eb',
  fontSize: '13px',
  textAlign: 'center',
  color: '#374151',
};

const tdLeft: React.CSSProperties = { ...tdStyle, textAlign: 'left' };

const filterBtn = (active: boolean): React.CSSProperties => ({
  padding: '5px 12px', borderRadius: '5px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  border: '1px solid #d1d5db', fontFamily: "'Noto Sans KR', sans-serif",
  background: active ? '#1e5a99' : '#fff', color: active ? '#fff' : '#64748b', transition: 'all 0.15s',
});

interface Props { schoolType?: SchoolType }

export function MyGradesPage({ schoolType: initialType = 'HIGH' }: Props) {
  const [schoolType, setSchoolType] = useState<SchoolType>(initialType);
  const [grade, setGrade] = useState(3);
  const [semester, setSemester] = useState<1 | 2>(1);
  const [examType, setExamType] = useState<ExamType>('MIDTERM');

  const dataMap = schoolType === 'HIGH' ? HIGH_DATA : MIDDLE_DATA;
  const key: DataKey = `${grade}-${semester}-${examType}`;
  const grades = dataMap[key] ?? [];
  const avg = grades.length > 0
    ? (grades.reduce((s, g) => s + g.score, 0) / grades.length).toFixed(1)
    : '—';

  const naesinGrades = schoolType === 'HIGH'
    ? grades.filter(g => !g.noNaesin).map(g => calcNaesin(g.rank, g.total))
    : [];
  const avgNaesin = naesinGrades.length > 0
    ? (naesinGrades.reduce((a, b) => a + b, 0) / naesinGrades.length).toFixed(1)
    : null;

  const examLabel: Record<ExamType, string> = { MIDTERM: '중간고사', FINAL: '기말고사' };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY GRADES</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>내 성적 조회</h1>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, background: '#f1f5f9', padding: '3px 10px', borderRadius: '4px' }}>
              {schoolType === 'HIGH' ? '고등학교' : '중학교'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['HIGH', 'MIDDLE'] as SchoolType[]).map(t => (
            <button key={t} onClick={() => { setSchoolType(t); setGrade(1); setSemester(1); setExamType('MIDTERM'); }}
              style={filterBtn(schoolType === t)}>
              {t === 'HIGH' ? '고등학교' : '중학교'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '28px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>학년</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map(g => (
              <button key={g} onClick={() => setGrade(g)} style={filterBtn(grade === g)}>{g}학년</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>학기</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {([1, 2] as const).map(s => (
              <button key={s} onClick={() => setSemester(s)} style={filterBtn(semester === s)}>{s}학기</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>시험</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['MIDTERM', 'FINAL'] as ExamType[]).map(e => (
              <button key={e} onClick={() => setExamType(e)} style={filterBtn(examType === e)}>{examLabel[e]}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px' }}>
        <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #1e5a99', display: 'inline-block' }}>
          <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>이번 학기 평균</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>{avg}{avg !== '—' ? '점' : ''}</p>
        </div>
        {avgNaesin && (
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: '3px solid #10b981', display: 'inline-block' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>평균 내신등급</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>{avgNaesin}등급</p>
          </div>
        )}
      </div>

      <Card>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>
            {grade}학년 {semester}학기 — {examLabel[examType]}
          </h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>반 기준 석차</span>
        </div>

        {grades.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            해당 학기 성적 데이터가 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'left' }}>과목</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>교과명</th>
                  <th style={thStyle}>원점수</th>
                  <th style={thStyle}>과목평균</th>
                  <th style={thStyle}>표준편차</th>
                  <th style={thStyle}>성취도</th>
                  <th style={thStyle}>석차/수강자</th>
                  {schoolType === 'HIGH' && <th style={{ ...thStyle, borderRight: 'none' }}>내신등급</th>}
                  {schoolType === 'MIDDLE' && <th style={{ ...thStyle, borderRight: 'none' }}>비고</th>}
                </tr>
              </thead>
              <tbody>
                {grades.map((g, idx) => {
                  const naesin = schoolType === 'HIGH' && !g.noNaesin ? calcNaesin(g.rank, g.total) : null;
                  return (
                    <tr key={`${g.subject}-${g.course}`} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ ...tdLeft, color: '#6b7280', fontSize: '12px' }}>{g.subject}</td>
                      <td style={{ ...tdLeft, fontWeight: 500 }}>{g.course}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{g.score}</td>
                      <td style={tdStyle}>{g.avg.toFixed(1)}</td>
                      <td style={tdStyle}>{g.stdDev.toFixed(1)}</td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{g.achievement}</td>
                      <td style={tdStyle}>{g.rank}/{g.total}</td>
                      {schoolType === 'HIGH' && (
                        <td style={{ ...tdStyle, fontWeight: naesin ? 700 : 400, color: naesin ? '#374151' : '#94a3b8', borderRight: 'none' }}>
                          {naesin ? `${naesin}등급` : '—'}
                        </td>
                      )}
                      {schoolType === 'MIDDLE' && (
                        <td style={{ ...tdStyle, borderRight: 'none' }}>—</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>
          {schoolType === 'HIGH'
            ? '* 내신등급은 석차/수강자 기준 비율로 산출됩니다. (1등급: 상위 4% 이내) / 체육·예술 교과는 내신등급 미산출'
            : '* 중학교 성취도: A(90점 이상) / B(75~89점) / C(74점 이하)'}
        </p>
      </Card>
    </div>
  );
}
