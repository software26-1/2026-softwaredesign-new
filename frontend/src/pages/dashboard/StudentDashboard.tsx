import { useState } from 'react';
import type { User } from '../../types/user';

const gradeData = [
  { subject: '수학I', score: 87, achievement: 'B', rank: 12, total: 28 },
  { subject: '문학', score: 92, achievement: 'A', rank: 3, total: 28 },
  { subject: '영어', score: 78, achievement: 'C', rank: 18, total: 28 },
  { subject: '물리학', score: 85, achievement: 'B', rank: 9, total: 28 },
];

const feedbacks = [
  { date: '2026-04-19', teacher: '홍길동', type: '성적', content: '수학 문제 해결 능력이 뛰어납니다.' },
  { date: '2026-04-15', teacher: '김민지', type: '태도', content: '수업 참여도가 매우 적극적입니다.' },
];

const inputStyle: React.CSSProperties = {
  padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px',
  fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%',
};

interface Props { user: User }

export function StudentDashboard({ user }: Props) {
  const avg = (gradeData.reduce((s, g) => s + g.score, 0) / gradeData.length).toFixed(1);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [notiSettings, setNotiSettings] = useState({ grade: true, feedback: true, counseling: false, system: true });
  const [showNotiModal, setShowNotiModal] = useState(false);

  const handlePwChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwMsg('새 비밀번호가 일치하지 않습니다.'); return; }
    if (pwForm.next.length < 8) { setPwMsg('비밀번호는 8자 이상이어야 합니다.'); return; }
    setPwMsg('비밀번호가 변경되었습니다.');
    setPwForm({ current: '', next: '', confirm: '' });
    setTimeout(() => { setPwMsg(''); setShowPwModal(false); }, 1500);
  };

  return (
    <div>
      {/* 프로필 헤더 */}
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '22px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        borderLeft: '4px solid #1e5a99',
      }}>
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: '#1e5a99',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 700, color: '#fff', flexShrink: 0,
        }}>
          {user.name[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1a2332' }}>{user.name}</h1>
            <span style={{ background: '#1e5a99', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
              학생
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            아이디: {user.loginId} &nbsp;·&nbsp; 2026학년도 1학기
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[['알림 설정', () => setShowNotiModal(true)], ['비밀번호 변경', () => setShowPwModal(true)]].map(([label, handler]) => (
            <button key={label as string} onClick={handler as () => void}
              style={{
                padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 500,
                background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
                fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '-0.01em',
              }}>{label as string}</button>
          ))}
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: '이번 학기 평균', value: `${avg}점`, color: '#1e5a99', sub: '4개 과목 기준' },
          { label: '받은 피드백', value: '2건', color: '#2471b8', sub: '이번 달' },
          { label: '상담 횟수', value: '3회', color: '#3b82f6', sub: '이번 학기' },
        ].map((s) => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${s.color}` }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px', letterSpacing: '0.02em' }}>{s.label.toUpperCase()}</p>
            <p style={{ fontSize: '26px', fontWeight: 700, color: '#1a2332', marginBottom: '4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 성적 + 피드백 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>과목별 성적</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>중간고사</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['과목', '점수', '성취도', '석차'].map((h) => (
                  <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gradeData.map((g) => (
                <tr key={g.subject} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '11px 20px', fontWeight: 500, color: '#1e293b', fontSize: '13px' }}>{g.subject}</td>
                  <td style={{ padding: '11px 20px', color: '#374151', fontWeight: 700, fontSize: '13px' }}>{g.score}</td>
                  <td style={{ padding: '11px 20px', color: '#374151', fontWeight: 600, fontSize: '13px' }}>{g.achievement}</td>
                  <td style={{ padding: '11px 20px', color: '#94a3b8', fontSize: '13px' }}>{g.rank}/{g.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>최근 피드백</h2>
          </div>
          <div style={{ padding: '8px 0' }}>
            {feedbacks.map((f, i) => (
              <div key={i} style={{ padding: '14px 24px', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.date} · {f.teacher} 선생님</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, background: '#f0f5fb', color: '#1e5a99', padding: '2px 8px', borderRadius: '4px' }}>{f.type}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>{f.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 비밀번호 변경 모달 */}
      {showPwModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a2332' }}>비밀번호 변경</h3>
              <button onClick={() => { setShowPwModal(false); setPwMsg(''); setPwForm({ current: '', next: '', confirm: '' }); }}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <form onSubmit={handlePwChange}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {([['현재 비밀번호', 'current'], ['새 비밀번호', 'next'], ['새 비밀번호 확인', 'confirm']] as const).map(([label, key]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
                    <input type="password" required style={inputStyle} placeholder={label}
                      value={pwForm[key]}
                      onChange={e => setPwForm({ ...pwForm, [key]: e.target.value })} />
                  </div>
                ))}
              </div>
              {pwMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginTop: '12px', background: pwMsg.includes('변경되었') ? '#e8f5e9' : '#fdecea', color: pwMsg.includes('변경되었') ? '#2e7d32' : '#c62828', borderLeft: `3px solid ${pwMsg.includes('변경되었') ? '#4caf50' : '#f44336'}` }}>
                  {pwMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => { setShowPwModal(false); setPwMsg(''); setPwForm({ current: '', next: '', confirm: '' }); }}
                  style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                  취소
                </button>
                <button type="submit"
                  style={{ padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: '#1e5a99', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                  변경하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 알림 설정 모달 */}
      {showNotiModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: '400px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a2332' }}>알림 설정</h3>
              <button onClick={() => setShowNotiModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {([
                ['grade', '성적 알림', '성적이 입력/수정될 때'],
                ['feedback', '피드백 알림', '피드백이 작성될 때'],
                ['counseling', '상담 알림', '상담 내역이 등록될 때'],
                ['system', '시스템 알림', '공지사항 및 업데이트'],
              ] as const).map(([key, label, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>{label}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{desc}</p>
                  </div>
                  <div
                    onClick={() => setNotiSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s', position: 'relative', background: notiSettings[key] ? '#1e5a99' : '#e2e8f0' }}
                  >
                    <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', left: notiSettings[key] ? '23px' : '3px' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button onClick={() => { alert('설정이 저장되었습니다.'); setShowNotiModal(false); }}
                style={{ padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, background: '#1e5a99', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
