import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface Props { onClose: () => void }

export function ChatbotPopup({ onClose }: Props) {
  const { isDark } = useTheme();
  const [input, setInput] = useState('');

  const bg       = isDark ? '#1e293b' : '#ffffff';
  const inputBg  = isDark ? '#111827' : '#f8fafc';
  const border   = isDark ? '#334155' : '#f1f5f9';
  const textSub  = isDark ? '#94a3b8' : '#64748b';

  return (
    <>
      {/* 배경 딤 없음 - 팝업만 */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '340px',
        height: '500px',
        background: bg,
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 2000,
        overflow: 'hidden',
        border: `1px solid ${border}`,
      }}>
        {/* 헤더 */}
        <div style={{ background: 'linear-gradient(135deg, #1B3A7A 0%, #2d7dd2 100%)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #F4A000', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
            <img src="/mascot2.png" alt="마스코트" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '14px', fontFamily: "'Noto Sans KR', sans-serif" }}>학생부 AI 챗봇</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', fontFamily: "'Noto Sans KR', sans-serif" }}>중·고등학교 학생부 관리 어시스턴트</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* 메시지 영역 */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* 봇 인트로 메시지 */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1.5px solid #F4A000', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
              <img src="/mascot2.png" alt="마스코트" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ background: isDark ? '#1f2937' : '#eff6ff', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', maxWidth: '220px' }}>
              <p style={{ fontSize: '13px', color: isDark ? '#e2e8f0' : '#1B3A7A', fontFamily: "'Noto Sans KR', sans-serif", lineHeight: 1.5 }}>
                안녕하세요! 학생부 관리에 대해 무엇이든 물어보세요.
              </p>
            </div>
          </div>

          <p style={{ fontSize: '11px', color: textSub, textAlign: 'center', marginTop: '8px', fontFamily: "'Noto Sans KR', sans-serif" }}>
            서비스 준비 중입니다
          </p>
        </div>

        {/* 입력창 */}
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${border}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled
            style={{ flex: 1, padding: '9px 14px', borderRadius: '20px', border: `1px solid ${border}`, background: inputBg, fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", color: textSub, outline: 'none', cursor: 'not-allowed' }}
          />
          <button disabled style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1e5a99', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', opacity: 0.5, flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
