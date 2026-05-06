import type { User } from '../../types/user';

interface StatCard {
  label: string;
  value: string;
  color: string;
  sub?: string;
}

const stats: StatCard[] = [
  { label: '담당 학급', value: '3학년 5반', color: '#1e5a99', sub: '2026학년도' },
  { label: '담당 학생 수', value: '28명', color: '#2ecc71', sub: '전원 재적' },
  { label: '미제출 성적', value: '12건', color: '#f39c12', sub: '입력 필요' },
  { label: '미작성 피드백', value: '5건', color: '#e74c3c', sub: '작성 권장' },
];

const recentActivities = [
  { date: '2026-04-20', activity: '성적 입력 — 수학I', student: '김철수 외 27명', type: '성적' },
  { date: '2026-04-19', activity: '피드백 작성', student: '이영희', type: '피드백' },
  { date: '2026-04-18', activity: '상담 내역 등록', student: '박민수', type: '상담' },
  { date: '2026-04-17', activity: '학생부 기록 추가', student: '최지은', type: '학생부' },
];

const typeBg: Record<string, string> = {
  성적: '#ebf4ff',
  피드백: '#e8f5e9',
  상담: '#fff3e0',
  학생부: '#f3e5f5',
};
const typeColor: Record<string, string> = {
  성적: '#1e5a99',
  피드백: '#2e7d32',
  상담: '#e65100',
  학생부: '#6a1b9a',
};

interface Props { user: User }

export function TeacherDashboard({ user }: Props) {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500, letterSpacing: '0.02em' }}>DASHBOARD</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.02em' }}>
          안녕하세요, {user.name} 선생님
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: '#fff',
              borderRadius: '10px',
              padding: '20px 22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              borderTop: `3px solid ${s.color}`,
            }}
          >
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '10px', letterSpacing: '0.02em' }}>
              {s.label.toUpperCase()}
            </p>
            <p style={{ fontSize: '26px', fontWeight: 700, color: '#1a2332', marginBottom: '4px' }}>{s.value}</p>
            {s.sub && <p style={{ fontSize: '12px', color: '#94a3b8' }}>{s.sub}</p>}
          </div>
        ))}
      </div>

      <div
        style={{
          background: '#fff',
          borderRadius: '10px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>최근 활동</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['날짜', '활동 내용', '학생', '구분'].map((h) => (
                <th key={h} style={{ padding: '11px 24px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', letterSpacing: '0.02em', borderBottom: '1px solid #f1f5f9' }}>
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentActivities.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '13px 24px', color: '#64748b' }}>{row.date}</td>
                <td style={{ padding: '13px 24px', color: '#1e293b', fontWeight: 500 }}>{row.activity}</td>
                <td style={{ padding: '13px 24px', color: '#475569' }}>{row.student}</td>
                <td style={{ padding: '13px 24px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: typeBg[row.type],
                    color: typeColor[row.type],
                  }}>
                    {row.type}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
