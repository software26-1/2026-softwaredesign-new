import { useNavigate } from 'react-router-dom';
import type { User } from '../../types/user';
import { authService } from '../../services/authService';

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
        <button
          onClick={() => navigate('/mypage')}
          style={{
            padding: '7px 14px',
            background: 'transparent',
            color: '#718096',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '13px',
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
            padding: '7px 16px',
            background: 'transparent',
            color: '#718096',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '13px',
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
