import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { authService } from '../../services/authService';
import client from '../../api/client';
import { useTheme } from '../../contexts/ThemeContext';

const roleLabel: Record<string, string> = {
  TEACHER: '교사',
  STUDENT: '학생',
  PARENT: '학부모',
  ADMIN: '관리자',
};

const roleBg: Record<string, string> = {
  TEACHER: '#1e5a99',
  STUDENT: '#1e5a99',
  PARENT: '#92400e',
  ADMIN: '#4f46e5',
};

/* ── 오리지널 배지 로고 (INU 스타일 참고, 네이비+골드) ── */
function AppBadge() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      {/* 네이비 라운드 사각형 베이스 */}
      <rect x="0" y="0" width="34" height="34" rx="7" fill="#1B3A7A"/>
      {/* 골드 대각 액센트 (INU 스타일 기하학 밴드) */}
      <polygon points="0,0 22,0 13,14 0,14" fill="#F4A000" opacity="0.92"/>
      {/* 흰색 졸업모자 상단 마름모 */}
      <polygon points="17,11 24,14.5 17,18 10,14.5" fill="white"/>
      {/* 졸업모자 술 기둥 */}
      <rect x="23" y="14.5" width="1.8" height="5.5" rx="0.9" fill="white" opacity="0.9"/>
      {/* 골드 술 볼 */}
      <circle cx="23.9" cy="21" r="2" fill="#F4A000"/>
    </svg>
  );
}

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [recentNotis, setRecentNotis] = useState<any[]>([]);

  const fetchUnread = () => {
    client.get<any>('/notifications').then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      const mapped = data.map((n: any) => ({ ...n, isRead: n.isRead ?? n.read ?? false }))
        .sort((a: any, b: any) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
      setUnreadCount(mapped.filter((n: any) => !n.isRead).length);
      setRecentNotis(mapped.slice(0, 5));
    }).catch(() => {});
  };

  useEffect(() => {
    fetchUnread();
    window.addEventListener('notification-updated', fetchUnread);
    return () => window.removeEventListener('notification-updated', fetchUnread);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } finally {
      onLogout();
      navigate('/login');
    }
  };

  const headerBg     = isDark ? '#1e293b' : '#ffffff';
  const headerBorder = isDark ? '#1f2937' : '#e8ecf0';
  const headerShadow = isDark ? 'none' : '0 1px 4px rgba(0,0,0,0.06)';
  const nameColor    = isDark ? '#e2e8f0' : '#2d3748';
  const btnBorder    = isDark ? '#374151' : '#e2e8f0';
  const btnColor     = isDark ? '#9ca3af' : '#718096';
  const popupBg      = isDark ? '#1e293b' : '#ffffff';
  const popupBorder  = isDark ? '#334155' : '#e2e8f0';
  const popupText    = isDark ? '#f1f5f9' : '#1a2332';
  const popupSub     = isDark ? '#94a3b8' : '#64748b';

  return (
    <header style={{
      background: headerBg,
      borderBottom: `1px solid ${headerBorder}`,
      padding: '0 32px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 1000,
      boxShadow: headerShadow,
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      {/* 로고 */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
      >
        <AppBadge />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#f1f5f9' : '#1B3A7A', lineHeight: 1.2, fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '-0.02em' }}>
            학생부
          </div>
          <div style={{ fontSize: '10px', fontWeight: 500, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 1.2, fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '-0.01em' }}>
            관리시스템
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* 유저 정보 pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: isDark ? '#1f2937' : '#f8fafc', padding: '6px 14px', borderRadius: '24px', border: `1px solid ${isDark ? '#374151' : '#e8ecf0'}`, lineHeight: 1 }}>
          <span style={{ fontSize: '13px', color: nameColor, fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1 }}>{user.name}</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: roleBg[user.role] ?? '#1e5a99', background: isDark ? '#1f2937' : `${roleBg[user.role]}15`, padding: '3px 9px', borderRadius: '20px', fontFamily: "'Noto Sans KR', sans-serif", border: `1px solid ${roleBg[user.role]}40`, lineHeight: 1, display: 'flex', alignItems: 'center' }}>
            {roleLabel[user.role] ?? user.role}
          </span>
        </div>

        {/* 알림 벨 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPopup(p => !p)}
            style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={isDark ? '#9ca3af' : '#718096'} strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#e53e3e', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showPopup && (
            <>
              <div onClick={() => setShowPopup(false)} style={{ position: 'fixed', inset: 0, zIndex: 999 }} />
              <div style={{ position: 'absolute', right: '-8px', top: '36px', width: '320px', background: popupBg, borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden', border: `1px solid ${popupBorder}` }}>
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${popupBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: popupText }}>알림</span>
                  {unreadCount > 0 && <span style={{ fontSize: '11px', background: '#e53e3e', color: '#fff', borderRadius: '10px', padding: '2px 7px', fontWeight: 600 }}>{unreadCount}개 안읽음</span>}
                </div>
                {recentNotis.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>알림이 없습니다.</p>
                ) : (
                  recentNotis.map((n, i) => (
                    <div key={n.id}
                      style={{ padding: '12px 16px', borderBottom: i < recentNotis.length - 1 ? `1px solid ${popupBorder}` : 'none', background: n.isRead ? 'transparent' : (isDark ? '#1e3a5f22' : '#fafcff'), borderLeft: n.isRead ? '3px solid transparent' : '3px solid #1e5a99', cursor: 'pointer' }}
                      onClick={() => { setShowPopup(false); navigate('/notifications'); }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: n.isRead ? 500 : 700, color: popupText }}>{n.title ?? n.message}</span>
                        {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1e5a99', display: 'inline-block', flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: '12px', color: popupSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{n.createdAt?.slice(0, 16).replace('T', ' ')}</p>
                    </div>
                  ))
                )}
                <div style={{ padding: '10px 16px', borderTop: `1px solid ${popupBorder}`, textAlign: 'center' }}>
                  <button onClick={() => { setShowPopup(false); navigate('/notifications'); }}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: '#1e5a99', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                    모두 보기
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={() => navigate('/mypage')}
          style={{ padding: '4px 12px', background: 'transparent', color: btnColor, border: `1px solid ${btnBorder}`, borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500 }}>
          마이페이지
        </button>
        <button onClick={handleLogout}
          style={{ padding: '4px 12px', background: 'transparent', color: btnColor, border: `1px solid ${btnBorder}`, borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 500, transition: 'all 0.15s' }}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
