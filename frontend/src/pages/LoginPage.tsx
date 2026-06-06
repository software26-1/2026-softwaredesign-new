import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AppBadge({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <rect x="0" y="0" width="34" height="34" rx="7" fill="#1B3A7A"/>
      <polygon points="0,0 22,0 13,14 0,14" fill="#F4A000" opacity="0.92"/>
      <polygon points="17,11 24,14.5 17,18 10,14.5" fill="white"/>
      <rect x="23" y="14.5" width="1.8" height="5.5" rx="0.9" fill="white" opacity="0.9"/>
      <circle cx="23.9" cy="21" r="2" fill="#F4A000"/>
    </svg>
  );
}

export function LoginPage() {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isInactive = new URLSearchParams(location.search).get('error') === 'inactive';

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/oauth2/authorization/google`;
  };

  return (
    <>
      <style>{`
        .login-left { display: flex; }
        @media (max-width: 768px) {
          .login-left { display: none !important; }
          .login-right { border-left: none !important; }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        background: '#fff',
        fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      }}>

        {/* 왼쪽: 브랜딩 패널 */}
        <div className="login-left" style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
        }}>
          <img
            src="/school_building.png"
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', filter: 'saturate(0.75) brightness(1.05)' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(200,210,220,0.08)',
          }} />

          <div style={{ position: 'relative', zIndex: 1, padding: '48px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            {/* 상단 로고 */}
            <div>
              <AppBadge size={38} />
            </div>

            {/* 중앙 카피 — 위로 올리기 위해 margin-bottom 제거 */}
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', marginBottom: '16px', letterSpacing: '0.06em', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>교사와 학생이 함께</p>
              <h2 style={{
                fontSize: '54px', fontWeight: 900, color: '#fff',
                lineHeight: 1.15, letterSpacing: '-0.03em',
                textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 4px 24px rgba(0,0,0,0.4)',
                marginBottom: '28px',
              }}>
                모든 가능성의<br/>발견
              </h2>
            </div>
          </div>
        </div>

        {/* 오른쪽: 로그인 패널 */}
        <div style={{
          width: '440px',
          flexShrink: 0,
          background: '#fff',
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 44px',
          boxSizing: 'border-box',
        }}>
          {/* 로고 */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
              <AppBadge size={52} />
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.03em', marginBottom: '8px' }}>
              학생 생활기록부 관리
            </h1>
            <span style={{
              display: 'inline-block',
              fontSize: '11px', fontWeight: 700, color: '#fff',
              background: '#F4A000',
              padding: '3px 12px', borderRadius: '20px',
            }}>
              교사 · 학생 · 학부모 통합 플랫폼
            </span>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', width: '100%', marginBottom: '28px' }} />

          {isInactive && (
            <div style={{
              width: '100%',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '13px',
              color: '#dc2626',
              boxSizing: 'border-box',
            }}>
              비활성화된 계정입니다. 학교 담당자에게 문의하세요.
            </div>
          )}

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
              background: hovered ? '#f0f5ff' : '#fff',
              color: '#1a2332',
              border: hovered ? '1.5px solid #1B3A7A' : '1.5px solid #e2e8f0',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.15s',
              boxShadow: hovered ? '0 2px 12px rgba(27,58,122,0.10)' : '0 1px 3px rgba(0,0,0,0.04)',
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
    </>
  );
}
