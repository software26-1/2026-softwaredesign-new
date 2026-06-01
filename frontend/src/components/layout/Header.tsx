import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { User } from '../../types/user';
import { authService } from '../../services/authService';
import client from '../../api/client';

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

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [recentNotis, setRecentNotis] = useState<any[]>([]);

  const fetchUnread = () => {
    client.get<any>('/notifications').then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      const mapped = data.map((n: any) => ({ ...n, isRead: n.isRead ?? n.read ?? false }));
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

  return (
    <header
      style={{
        background: '#fff',
        borderBottom: '1px solid #e8ecf0',
        padding: '0 32px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            background: 'var(--primary-blue)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.02em' }}>
          학생부 관리시스템
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '14px', color: '#2d3748', fontWeight: 500 }}>{user.name}</span>
          <span
            style={{
              background: roleBg[user.role] ?? 'var(--primary-blue)',
              color: '#fff',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}
          >
            {roleLabel[user.role] ?? user.role}
          </span>
        </div>
        {/* 알림 벨 */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPopup(p => !p)}
            style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#718096" strokeWidth={2}>
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
              <div style={{ position: 'absolute', right: '-8px', top: '36px', width: '320px', background: '#fff', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 1000, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a2332' }}>알림</span>
                  {unreadCount > 0 && <span style={{ fontSize: '11px', background: '#e53e3e', color: '#fff', borderRadius: '10px', padding: '2px 7px', fontWeight: 600 }}>{unreadCount}개 안읽음</span>}
                </div>
                {recentNotis.length === 0 ? (
                  <p style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>알림이 없습니다.</p>
                ) : (
                  recentNotis.map((n, i) => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: i < recentNotis.length - 1 ? '1px solid #f8fafc' : 'none', background: n.isRead ? '#fff' : '#fafcff', borderLeft: n.isRead ? '3px solid transparent' : '3px solid #1e5a99', cursor: 'pointer' }}
                      onClick={() => { setShowPopup(false); navigate('/notifications'); }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: n.isRead ? 500 : 700, color: '#1a2332' }}>{n.title ?? n.message}</span>
                        {!n.isRead && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1e5a99', display: 'inline-block', flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{n.createdAt?.slice(0, 16).replace('T', ' ')}</p>
                    </div>
                  ))
                )}
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                  <button onClick={() => { setShowPopup(false); navigate('/notifications'); }}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: '#1e5a99', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                    모두 보기
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => navigate('/mypage')}
          style={{
            padding: '4px 12px',
            background: 'transparent',
            color: '#718096',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 500,
          }}
        >
          마이페이지
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: '4px 12px',
            background: 'transparent',
            color: '#718096',
            border: '1px solid #e2e8f0',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
