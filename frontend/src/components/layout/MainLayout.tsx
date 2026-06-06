import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { ChatbotPopup } from '../common/ChatbotPopup';

function LayoutInner() {
  const { user, isLoading, logout } = useAuth();
  const { isDark } = useTheme();
  const [showChatbot, setShowChatbot] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainMargin = sidebarCollapsed ? 76 : 186;

  const toggleSidebar = () => {
    setSidebarCollapsed(p => !p);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 240);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: isDark ? '#0f172a' : '#f5f7fa' }}>
        <span style={{ color: 'var(--primary-blue)', fontSize: '14px' }}>불러오는 중...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .main-sidebar { display: none !important; }
          .main-content { margin-left: 0 !important; padding: 16px 16px 80px !important; }
          .header-school { display: none !important; }
          .header-right-full { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-hamburger { display: none !important; }
          .mobile-drawer-overlay { display: none !important; }
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: isDark ? '#0f172a' : '#f5f7fa', transition: 'background 0.2s' }}>
        <Header user={user} onLogout={logout} onMobileMenuToggle={() => setMobileMenuOpen(p => !p)} />
        <div className="main-sidebar">
          <Sidebar
            role={user.role}
            classGroupId={(user as any).classGroupId}
            onChatbotToggle={() => setShowChatbot(p => !p)}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        {/* 모바일 드로어 오버레이 */}
        {mobileMenuOpen && (
          <div className="mobile-drawer-overlay">
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
            />
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: '220px',
              background: isDark ? '#111827' : '#ffffff',
              zIndex: 201, boxShadow: '-4px 0 24px rgba(0,0,0,0.18)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '16px 16px 8px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: isDark ? '#9ca3af' : '#64748b' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'auto' }}>
                <Sidebar
                  role={user.role}
                  classGroupId={(user as any).classGroupId}
                  onChatbotToggle={() => { setShowChatbot(p => !p); setMobileMenuOpen(false); }}
                  isCollapsed={false}
                  onToggleCollapse={() => setMobileMenuOpen(false)}
                  onNavigate={() => setMobileMenuOpen(false)}
                  isDrawer={true}
                />
              </div>
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${isDark ? '#1f2937' : '#e8ecf0'}` }}>
                <button
                  onClick={() => { setMobileMenuOpen(false); logout(); }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'transparent', fontSize: '13px', fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="main-content" style={{ marginLeft: `${mainMargin}px`, marginTop: '60px', padding: '28px 120px', minHeight: 'calc(100vh - 60px)', transition: 'margin-left 0.22s ease', minWidth: 0, overflowX: 'hidden' }}>
          <Outlet />
        </main>
        {showChatbot && <ChatbotPopup onClose={() => setShowChatbot(false)} />}
      </div>
    </>
  );
}

export function MainLayout() {
  return (
    <ThemeProvider>
      <LayoutInner />
    </ThemeProvider>
  );
}
