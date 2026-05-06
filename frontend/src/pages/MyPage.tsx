import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';

const roleLabel: Record<string, string> = { TEACHER: '교사', STUDENT: '학생', PARENT: '학부모', ADMIN: '관리자' };
const roleBg: Record<string, string> = { TEACHER: '#1e5a99', STUDENT: '#2ecc71', PARENT: '#f39c12', ADMIN: '#6c5ce7' };

const inputStyle: React.CSSProperties = {
  padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px',
  fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%',
};

export function MyPage() {
  const { user } = useAuth();
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [notiSettings, setNotiSettings] = useState({ grade: true, feedback: true, counseling: false, system: true });

  if (!user) return null;

  const handlePwChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwMsg('새 비밀번호가 일치하지 않습니다.'); return; }
    if (pwForm.next.length < 8) { setPwMsg('비밀번호는 8자 이상이어야 합니다.'); return; }
    setPwMsg('비밀번호가 변경되었습니다.');
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPwMsg(''), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY PAGE</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>마이페이지</h1>
      </div>

      {/* 프로필 */}
      <div style={{ background: '#fff', borderRadius: '10px', padding: '28px 32px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '28px' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: roleBg[user.role] ?? '#1e5a99', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: 700, flexShrink: 0 }}>
          {user.name[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a2332' }}>{user.name}</h2>
            <span style={{ background: roleBg[user.role], color: '#fff', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
              {roleLabel[user.role]}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>아이디: {user.loginId}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 비밀번호 변경 */}
        <Card title="비밀번호 변경">
          <form onSubmit={handlePwChange}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[['현재 비밀번호', 'current'], ['새 비밀번호', 'next'], ['새 비밀번호 확인', 'confirm']].map(([label, key]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
                  <input type="password" required style={inputStyle} placeholder={label}
                    value={pwForm[key as keyof typeof pwForm]}
                    onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            {pwMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginTop: '12px', marginBottom: '4px', background: pwMsg.includes('변경되었') ? '#e8f5e9' : '#fdecea', color: pwMsg.includes('변경되었') ? '#2e7d32' : '#c62828', borderLeft: `3px solid ${pwMsg.includes('변경되었') ? '#4caf50' : '#f44336'}` }}>
                {pwMsg}
              </div>
            )}
            <div style={{ marginTop: '16px' }}>
              <Button type="submit" size="sm">변경하기</Button>
            </div>
          </form>
        </Card>

        {/* 알림 설정 */}
        <Card title="알림 설정">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {([['grade', '성적 알림', '성적이 입력/수정될 때'], ['feedback', '피드백 알림', '피드백이 작성될 때'], ['counseling', '상담 알림', '상담 내역이 등록될 때'], ['system', '시스템 알림', '공지사항 및 업데이트']] as const).map(([key, label, desc]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>{desc}</p>
                </div>
                <div
                  onClick={() => setNotiSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                  style={{
                    width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
                    background: notiSettings[key] ? 'var(--primary-blue)' : '#e2e8f0',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    left: notiSettings[key] ? '23px' : '3px',
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '20px' }}>
            <Button size="sm" onClick={() => alert('설정이 저장되었습니다.')}>저장</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
