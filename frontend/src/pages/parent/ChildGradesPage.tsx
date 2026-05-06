import { Card } from '../../components/common/Card';

const grades = [
  { subject: '수학I', score: 87, avg: 85.2, achievement: 'B+', rank: '12/28' },
  { subject: '문학', score: 92, avg: 80.1, achievement: 'A', rank: '3/28' },
  { subject: '영어', score: 78, avg: 81.0, achievement: 'C+', rank: '18/28' },
];

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function ChildGradesPage() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>CHILD GRADES</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>자녀 성적 조회</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '32px', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>자녀</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a2332' }}>김철수</p>
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>학년/반</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a2332' }}>3학년 5반</p>
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>평균 점수</p>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#1e5a99' }}>85.7점</p>
        </div>
      </div>

      <Card title="2026학년도 1학기 성적">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['과목', '원점수', '과목 평균', '성취도', '석차'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.subject}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{g.subject}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1e5a99' }}>{g.score}점</td>
                <td style={tdStyle}>{g.avg}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: '#ebf4ff', color: '#1e5a99' }}>{g.achievement}</span>
                </td>
                <td style={tdStyle}>{g.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
