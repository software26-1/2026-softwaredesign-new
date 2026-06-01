import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import client from '../api/client';
import { SCHOOLS } from '../data/schools';

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
  const [pwLoading, setPwLoading] = useState(false);
  const NOTI_KEY = 'noti-settings';
  type NotiSettings = { grade: boolean; feedback: boolean; counseling: boolean; system: boolean };
  const [notiSettings, setNotiSettings] = useState<NotiSettings>(() => {
    const defaults: NotiSettings = { grade: true, feedback: true, counseling: false, system: true };
    try {
      const saved = localStorage.getItem(NOTI_KEY);
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return defaults;
  });
  const [notiSaved, setNotiSaved] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [curriculumId, setCurriculumId] = useState<number>(0);

  // 알림 설정 변경 시 localStorage에 저장(알림 페이지에서 이 설정을 읽어 필터링)
  const updateNoti = (key: string, value: boolean) => {
    setNotiSettings(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(NOTI_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      window.dispatchEvent(new CustomEvent('noti-settings-updated'));
      return next;
    });
    setNotiSaved(true);
    setTimeout(() => setNotiSaved(false), 2000);
  };
  const [curriculumMsg, setCurriculumMsg] = useState('');
  const [transferSchool, setTransferSchool] = useState('');
  const [transferDetail, setTransferDetail] = useState('');
  const [transferMsg, setTransferMsg] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const CURRICULA = [
    { id: 1, name: '국어' }, { id: 2, name: '수학' }, { id: 3, name: '영어' },
    { id: 4, name: '사회' }, { id: 5, name: '한국사' }, { id: 6, name: '과학' },
    { id: 7, name: '체육' }, { id: 8, name: '음악' }, { id: 9, name: '미술' },
    { id: 10, name: '기술가정' }, { id: 11, name: '정보' }, { id: 12, name: '도덕' },
  ];

  useEffect(() => {
    if (!user) return;
    client.get<any>('/users/me').then(r => {
      const profile = r?.data?.data ?? r?.data ?? null;
      if (!profile) return;
      if (profile.email) setEmail(profile.email);
      if (user.role === 'TEACHER' && profile.curriculumId) setCurriculumId(profile.curriculumId);
    }).catch(() => {});
  }, [user]);
  const [schoolQuery, setSchoolQuery] = useState('');
  const [showSchoolList, setShowSchoolList] = useState(false);
  const schoolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (schoolRef.current && !schoolRef.current.contains(e.target as Node)) setShowSchoolList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const schoolResults = schoolQuery.length >= 1 ? SCHOOLS.filter(s => s.includes(schoolQuery)).slice(0, 6) : [];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferSchool) { setTransferMsg('이동할 학교를 선택해주세요.'); return; }
    setTransferLoading(true); setTransferMsg('');
    try {
      const schoolsRes = await client.get<any[]>('/schools');
      const schools = Array.isArray(schoolsRes.data) ? schoolsRes.data : [];
      const target = schools.find((s: any) => s.schoolName === transferSchool);
      if (!target) { setTransferMsg('해당 학교를 시스템에서 찾을 수 없습니다.'); return; }
      await client.post(`/approval-requests/transfer?to_school_id=${target.id}&type=TEACHER_TRANSFER&detail=${encodeURIComponent(transferDetail || '전근 신청합니다.')}`);
      setTransferMsg('전근 신청이 완료되었습니다. 양쪽 학교 관리자 승인 후 처리됩니다.');
      setTransferSchool(''); setSchoolQuery(''); setTransferDetail('');
    } catch {
      setTransferMsg('전근 신청에 실패했습니다.');
    } finally {
      setTransferLoading(false);
    }
  };

  if (!user) return null;

  const handlePwChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwMsg('새 비밀번호가 일치하지 않습니다.'); return; }
    if (pwForm.next.length < 8) { setPwMsg('비밀번호는 8자 이상이어야 합니다.'); return; }

    setPwLoading(true);
    setPwMsg('');
    try {
      await authService.changePassword(pwForm.current, pwForm.next);
      setPwMsg('비밀번호가 변경되었습니다.');
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch {
      setPwMsg('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해 주세요.');
    } finally {
      setPwLoading(false);
    }
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
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>{email || (user as any).email || '—'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 비밀번호 변경 — admin만 */}
        {user.role === 'ADMIN' && (
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
                <Button type="submit" size="sm" disabled={pwLoading}>{pwLoading ? '변경 중...' : '변경하기'}</Button>
              </div>
            </form>
          </Card>
        )}

        {/* 담당 교과 설정 — 교사만 */}
        {user.role === 'TEACHER' && (
          <Card title="담당 교과 설정">
            <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>마이페이지에서 담당 교과를 설정하면 성적 관리에서 해당 교과의 과목만 표시됩니다.</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>담당 교과</label>
              <select value={curriculumId} onChange={e => setCurriculumId(Number(e.target.value))}
                style={{ ...inputStyle, width: '100%' }}>
                <option value={0}>선택하세요</option>
                {CURRICULA.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {curriculumMsg && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', background: curriculumMsg.includes('완료') ? '#e8f5e9' : '#fdecea', color: curriculumMsg.includes('완료') ? '#2e7d32' : '#c62828', borderLeft: `3px solid ${curriculumMsg.includes('완료') ? '#4caf50' : '#f44336'}` }}>
                {curriculumMsg}
              </div>
            )}
            <Button size="sm" onClick={async () => {
              if (!curriculumId) { setCurriculumMsg('교과를 선택해주세요.'); return; }
              try {
                await client.patch('/users/me/curriculum', { curriculumId });
                setCurriculumMsg('담당 교과가 저장되었습니다.');
                setTimeout(() => setCurriculumMsg(''), 3000);
              } catch { setCurriculumMsg('저장에 실패했습니다.'); }
            }}>저장</Button>
          </Card>
        )}

        {/* 알림 설정 */}
        <Card title="알림 설정">
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>끈 알림 유형은 알림 페이지에서 표시되지 않습니다. {notiSaved && <span style={{ color: '#2e7d32', fontWeight: 600 }}>· 저장됨</span>}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {user.role === 'ADMIN' ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>승인 요청 알림</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>가입·전근·전학 신청이 접수될 때</p>
                </div>
                <div onClick={() => updateNoti('system', !notiSettings.system)}
                  style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s', position: 'relative', background: notiSettings.system ? 'var(--primary-blue)' : '#e2e8f0' }}>
                  <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', left: notiSettings.system ? '23px' : '3px' }} />
                </div>
              </div>
            ) : (
              ([
                user.role !== 'PARENT' && ['grade', '성적 알림', '성적이 입력/수정될 때'],
                ['feedback', '피드백 알림', '피드백이 작성될 때'],
              ].filter(Boolean) as [string, string, string][]).map(([key, label, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '2px' }}>{label}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>{desc}</p>
                  </div>
                  <div onClick={() => updateNoti(key, !notiSettings[key as keyof typeof notiSettings])}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'background 0.2s', position: 'relative', background: notiSettings[key as keyof typeof notiSettings] ? 'var(--primary-blue)' : '#e2e8f0' }}>
                    <div style={{ position: 'absolute', top: '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', left: notiSettings[key as keyof typeof notiSettings] ? '23px' : '3px' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* 전근 신청 — 교사만 */}
      {user.role === 'TEACHER' && (
        <div style={{ marginTop: '20px' }}>
          <Card title="전근 신청">
            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>이동할 학교</label>
                <div ref={schoolRef} style={{ position: 'relative' }}>
                  <input style={inputStyle} type="text" placeholder="학교명 검색 (예: 시흥)"
                    value={schoolQuery}
                    onChange={e => { setSchoolQuery(e.target.value); setTransferSchool(''); setShowSchoolList(true); }}
                    onFocus={() => schoolQuery.length >= 1 && setShowSchoolList(true)} />
                  {transferSchool && <p style={{ fontSize: '12px', color: '#1e5a99', marginTop: '4px' }}>선택됨: {transferSchool}</p>}
                  {showSchoolList && schoolResults.length > 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100 }}>
                      {schoolResults.map(school => (
                        <div key={school} onMouseDown={() => { setTransferSchool(school); setSchoolQuery(school); setShowSchoolList(false); }}
                          style={{ padding: '10px 14px', fontSize: '14px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', color: '#1a1a2e' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                          {school}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>신청 사유 (선택)</label>
                <input style={inputStyle} type="text" placeholder="전근 신청 사유를 입력해주세요."
                  value={transferDetail} onChange={e => setTransferDetail(e.target.value)} />
              </div>
              {transferMsg && (
                <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', background: transferMsg.includes('완료') ? '#e8f5e9' : '#fdecea', color: transferMsg.includes('완료') ? '#2e7d32' : '#c62828', borderLeft: `3px solid ${transferMsg.includes('완료') ? '#4caf50' : '#f44336'}` }}>
                  {transferMsg}
                </div>
              )}
              <Button type="submit" size="sm" disabled={transferLoading}>{transferLoading ? '신청 중...' : '전근 신청'}</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
