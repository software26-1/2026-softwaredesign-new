import type { User } from '../../types/user';

const stats = [
  { label: '전체 교사', value: '48명', color: '#1e5a99' },
  { label: '전체 학생', value: '1,240명', color: '#2ecc71' },
  { label: '등록 학부모', value: '986명', color: '#f39c12' },
  { label: '등록 학교', value: '3개교', color: '#6c5ce7' },
];

const recentUsers = [
  { date: '2026-04-20', name: '박지현', role: '교사', action: '계정 생성' },
  { date: '2026-04-19', name: '이수민', role: '학생', action: '계정 활성화' },
  { date: '2026-04-18', name: '최영호', role: '학부모', action: '승인 요청' },
  { date: '2026-04-17', name: '김태연', role: '교사', action: '역할 변경' },
];

const roleBg: Record<string, string> = { 교사: '#ebf4ff', 학생: '#e8f5e9', 학부모: '#fff3e0' };
const roleColor: Record<string, string> = { 교사: '#1e5a99', 학생: '#2e7d32', 학부모: '#e65100' };

interface Props { user: User }

export function AdminDashboard({ user }: Props) {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500, letterSpacing: '0.02em' }}>DASHBOARD</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.02em' }}>
          안녕하세요, {user.name} 관리자님
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {stats.map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${s.color}` }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '10px', letterSpacing: '0.02em' }}>{s.label.toUpperCase()}</p>
            <p style={{ fontSize: '26px', fontWeight: 700, color: '#1a2332' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>최근 사용자 활동</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['날짜', '이름', '역할', '활동'].map((h) => (
                <th key={h} style={{ padding: '11px 24px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={{ padding: '13px 24px', color: '#64748b' }}>{row.date}</td>
                <td style={{ padding: '13px 24px', fontWeight: 500, color: '#1e293b' }}>{row.name}</td>
                <td style={{ padding: '13px 24px' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: roleBg[row.role], color: roleColor[row.role] }}>{row.role}</span>
                </td>
                <td style={{ padding: '13px 24px', color: '#475569' }}>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
