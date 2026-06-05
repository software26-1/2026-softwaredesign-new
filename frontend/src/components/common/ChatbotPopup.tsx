import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import client from '../../api/client';
import type { ChatMessage } from '../../types/analytics';

interface Message {
  role: 'user' | 'bot';
  text: string;
}

interface StudentOption {
  id: number;
  name: string;
  grade: number;
  classNumber: number;
  studentNumber: number;
}

interface Props { onClose: () => void }

async function resolveStudentId(role: string, userId: number): Promise<number | null> {
  try {
    if (role === 'STUDENT') {
      const r = await client.get<any>('/students', { params: { user_id: userId } });
      const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
      return list[0]?.id ?? null;
    }
    if (role === 'PARENT') {
      const r = await client.get<any>('/parents/me/students');
      const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
      return list[0]?.id ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

export function ChatbotPopup({ onClose }: Props) {
  const { isDark } = useTheme();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '안녕하세요! 학습 데이터를 기반으로 답변드립니다.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [initDone, setInitDone] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bg        = isDark ? '#1e293b' : '#ffffff';
  const inputBg   = isDark ? '#111827' : '#f8fafc';
  const border    = isDark ? '#334155' : '#f1f5f9';
  const textSub   = isDark ? '#94a3b8' : '#64748b';
  const textPrimary = isDark ? '#f1f5f9' : '#1B3A7A';
  const msgBg     = isDark ? '#1f2937' : '#eff6ff';

  const isStaff = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  useEffect(() => {
    if (!user) return;
    if (isStaff) {
      client.get<any>('/students').then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setStudents(list.sort((a: any, b: any) =>
          (a.grade - b.grade) || (a.classNumber - b.classNumber) || (a.studentNumber - b.studentNumber)
        ));
        setInitDone(true);
      }).catch(() => setInitDone(true));
    } else {
      resolveStudentId(user.role, user.id).then(id => {
        setStudentId(id);
        setInitDone(true);
      });
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const effectiveStudentId = isStaff ? studentId : studentId;

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading || !effectiveStudentId) return;

    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const res = await client.post<any>(`/analytics/students/${effectiveStudentId}/chat`, { question: q, history });
      const answer = res.data?.answer ?? res.data?.data?.answer ?? '응답을 받지 못했습니다.';
      setMessages(prev => [...prev, { role: 'bot', text: answer }]);
      setHistory(prev => {
        const updated = [...prev,
          { role: 'user' as const, content: q },
          { role: 'assistant' as const, content: answer },
        ];
        return updated.slice(-20);
      });
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: '오류가 발생했습니다. 다시 시도해주세요.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (id: number | null) => {
    setStudentId(id);
    setHistory([]);
    if (id) {
      const s = students.find(s => s.id === id);
      setMessages([{ role: 'bot', text: `${s?.name ?? '학생'} 학생에 대해 질문하세요.` }]);
    }
  };

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      width: '340px', height: '500px',
      background: bg, borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      display: 'flex', flexDirection: 'column',
      zIndex: 2000, overflow: 'hidden', border: `1px solid ${border}`,
    }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #1B3A7A 0%, #2d7dd2 100%)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid #F4A000', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
          <img src="/mascot2.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif" }}>학생부 AI 챗봇</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', fontFamily: "'Noto Sans KR', sans-serif" }}>학습 데이터 기반 상담 AI</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* 교사/관리자 학생 선택 */}
      {isStaff && initDone && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
          <select
            value={studentId ?? ''}
            onChange={e => handleStudentChange(Number(e.target.value) || null)}
            style={{ width: '100%', padding: '7px 10px', border: `1px solid ${border}`, borderRadius: '8px', fontSize: '12px', fontFamily: "'Noto Sans KR', sans-serif", background: inputBg, color: textPrimary, outline: 'none' }}
          >
            <option value="">학생을 선택하세요...</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>
                {s.grade}학년 {s.classNumber}반 {String(s.studentNumber).padStart(2, '0')}번 {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 학생/학부모: studentId 없음 */}
      {!isStaff && initDone && !studentId && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <p style={{ fontSize: '13px', color: textSub, fontFamily: "'Noto Sans KR', sans-serif", textAlign: 'center', lineHeight: 1.6 }}>
            학생 정보를 찾을 수 없습니다.<br/>프로필 설정을 확인해주세요.
          </p>
        </div>
      )}

      {/* 메시지 영역 */}
      {initDone && (isStaff ? true : !!studentId) && (
        <>
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {!isStaff || studentId ? messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'bot' && (
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #F4A000', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                    <img src="/mascot2.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '8px 12px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? (isDark ? '#1e40af' : '#1B3A7A') : msgBg,
                  color: msg.role === 'user' ? '#fff' : (isDark ? '#e2e8f0' : '#1B3A7A'),
                  fontSize: '12.5px', lineHeight: 1.6,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            )) : (
              <p style={{ fontSize: '13px', color: textSub, fontFamily: "'Noto Sans KR', sans-serif", textAlign: 'center', marginTop: '20px' }}>
                위에서 학생을 선택해주세요.
              </p>
            )}
            {loading && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1.5px solid #F4A000', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                  <img src="/mascot2.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '8px 12px', borderRadius: '12px 12px 12px 4px', background: msgBg, display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '5px', height: '5px', borderRadius: '50%', background: isDark ? '#60a5fa' : '#1B3A7A', animation: `bounce 1s ${i * 0.2}s infinite`, opacity: 0.7 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: '8px 10px', borderTop: `1px solid ${border}`, display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              placeholder={effectiveStudentId ? '메시지를 입력하세요...' : '학생을 선택해주세요...'}
              disabled={loading || !effectiveStudentId}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: `1px solid ${border}`, background: inputBg, fontSize: '12.5px', fontFamily: "'Noto Sans KR', sans-serif", color: textPrimary, outline: 'none' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || !effectiveStudentId}
              style={{ width: '34px', height: '34px', borderRadius: '50%', background: input.trim() && !loading && effectiveStudentId ? '#1B3A7A' : (isDark ? '#374151' : '#e2e8f0'), border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading && effectiveStudentId ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'background 0.2s' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
