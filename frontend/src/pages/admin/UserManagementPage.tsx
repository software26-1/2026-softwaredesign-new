import { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';

const users = [
  { id: 1, name: '홍길동', loginId: 'teacher01', role: '교사', school: '인천대사범부고', status: '활성' },
  { id: 2, name: '김철수', loginId: 'student01', role: '학생', school: '인천대사범부고', status: '활성' },
  { id: 3, name: '이영희', loginId: 'student02', role: '학생', school: '인천대사범부고', status: '활성' },
  { id: 4, name: '박영수', loginId: 'parent01', role: '학부모', school: '—', status: '활성' },
  { id: 5, name: '최지현', loginId: 'teacher02', role: '교사', school: '인천대사범부고', status: '비활성' },
];

const roleBg: Record<string, string> = { 교사: '#ebf4ff', 학생: '#e8f5e9', 학부모: '#fff3e0', 관리자: '#f3e5f5' };
const roleColor: Record<string, string> = { 교사: '#1e5a99', 학생: '#2e7d32', 학부모: '#e65100', 관리자: '#6a1b9a' };

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function UserManagementPage() {
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => u.name.includes(search) || u.loginId.includes(search));

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>USER MANAGEMENT</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>사용자 관리</h1>
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="이름 또는 아이디 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', flex: 1 }}
          />
          <Button size="sm">검색</Button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['이름', '아이디', '역할', '학교', '상태', '관리'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{u.name}</td>
                <td style={{ ...tdStyle, color: '#64748b', fontFamily: 'monospace' }}>{u.loginId}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: roleBg[u.role], color: roleColor[u.role] }}>{u.role}</span>
                </td>
                <td style={{ ...tdStyle, color: '#475569' }}>{u.school}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: u.status === '활성' ? '#e8f5e9' : '#f5f5f5', color: u.status === '활성' ? '#2e7d32' : '#9e9e9e' }}>{u.status}</span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button size="sm" variant="secondary">역할 변경</Button>
                    <Button size="sm" variant={u.status === '활성' ? 'danger' : 'success'}>{u.status === '활성' ? '비활성화' : '활성화'}</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
