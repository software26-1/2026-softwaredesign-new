import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/oauth2/authorization/google`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #e8f4f8 0%, #f0fafa 50%, #e6f2f8 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >

      {/* 로그인 카드 */}
      <div
        style={{
          position: 'relative',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '52px 48px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 8px 40px rgba(0, 100, 160, 0.10)',
          border: '1px solid rgba(255,255,255,0.9)',
        }}
      >
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.3px' }}>
            학생 생활기록부 관리
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', letterSpacing: '0.3px' }}>
            Student Record Management System
          </p>
        </div>

        {/* 구분선 */}
        <div style={{ borderTop: '1px solid #f1f5f9', marginBottom: '32px' }} />

        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', textAlign: 'center' }}>
          Google 계정으로 로그인하여 시작하세요
        </p>

        <button
          onClick={handleGoogleLogin}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            width: '100%',
            padding: '13px',
            background: hovered ? '#f8fafc' : '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.15s',
            boxShadow: hovered ? '0 2px 10px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
            boxSizing: 'border-box',
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: '18px', height: '18px' }}
          />
          Google 계정으로 계속하기
        </button>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => navigate('/admin-login')}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '12px',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px 8px',
              textDecoration: 'underline',
            }}
          >
            학교 담당자 로그인
          </button>
        </div>

      </div>
    </div>
  );
}
