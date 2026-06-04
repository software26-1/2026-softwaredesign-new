import { useTheme } from '../contexts/ThemeContext';

export function ChatbotPage() {
  const { isDark } = useTheme();
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textPrimary = isDark ? '#f1f5f9' : '#1B3A7A';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const inputBg = isDark ? '#111827' : '#f8fafc';
  const inputBorder = isDark ? '#334155' : '#e2e8f0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 180px)', padding: '32px' }}>
      <div style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        {/* 마스코트 아바타 */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '110px', height: '110px', borderRadius: '50%',
            border: '3.5px solid #F4A000',
            boxShadow: '0 8px 28px rgba(30,90,153,0.3)',
            overflow: 'hidden',
            background: '#fff',
          }}>
            <img src="/mascot.png" alt="INU 마스코트" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* Title */}
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: textPrimary, marginBottom: '6px', fontFamily: "'Noto Sans KR', sans-serif" }}>
          학생부 AI 챗봇
        </h2>
        <p style={{ fontSize: '13px', color: textSub, marginBottom: '4px', fontFamily: "'Noto Sans KR', sans-serif" }}>
          중·고등학교 학생부 관리 AI 어시스턴트
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isDark ? '#1f2937' : '#eff6ff', borderRadius: '20px', padding: '4px 12px', marginBottom: '36px' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#F4A000' }}/>
          <span style={{ fontSize: '12px', color: isDark ? '#60a5fa' : '#1e5a99', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif" }}>준비 중</span>
        </div>

        {/* Chat area placeholder */}
        <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${inputBorder}`, marginBottom: '16px', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#4b5563' : '#cbd5e0'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
          <p style={{ fontSize: '13px', color: isDark ? '#4b5563' : '#94a3b8', fontFamily: "'Noto Sans KR', sans-serif" }}>
            곧 서비스를 시작합니다
          </p>
        </div>

        {/* Fake input */}
        <div style={{ display: 'flex', gap: '10px', background: inputBg, borderRadius: '14px', padding: '10px 14px', border: `2px solid ${inputBorder}`, alignItems: 'center' }}>
          <span style={{ flex: 1, fontSize: '13.5px', color: isDark ? '#4b5563' : '#94a3b8', fontFamily: "'Noto Sans KR', sans-serif", lineHeight: '1.5' }}>
            메시지를 입력하세요...
          </span>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1e5a99', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, cursor: 'not-allowed' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
