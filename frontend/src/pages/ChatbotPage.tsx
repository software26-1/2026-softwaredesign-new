import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import client from '../api/client';
import type { ChatMessage } from '../types/analytics';

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

export function ChatbotPage() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '안녕하세요! 학생 학습 분석 데이터를 기반으로 답변드립니다. 궁금한 점을 물어보세요.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [initLoading, setInitLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const bg = isDark ? '#1e293b' : '#ffffff';
  const pageBg = isDark ? '#0f172a' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const inputBg = isDark ? '#111827' : '#f8fafc';
  const textPrimary = isDark ? '#f1f5f9' : '#1B3A7A';
  const textSub = isDark ? '#94a3b8' : '#64748b';

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      setInitLoading(true);
      if (user.role === 'STUDENT' || user.role === 'PARENT') {
        const id = await resolveStudentId(user.role, user.id);
        setStudentId(id);
      } else if (user.role === 'TEACHER' || user.role === 'ADMIN') {
        try {
          const r = await client.get<any>('/students');
          const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
          setStudents(list.sort((a: any, b: any) =>
            (a.grade - b.grade) || (a.classNumber - b.classNumber) || (a.studentNumber - b.studentNumber)
          ));
        } catch { setStudents([]); }
      }
      setInitLoading(false);
    };
    init();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const effectiveStudentId = user?.role === 'TEACHER' || user?.role === 'ADMIN'
    ? selectedStudentId
    : studentId;

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
        return updated.slice(-20); // 최대 10턴 유지
      });
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'bot', text: '오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  return (
    <div style={{ minHeight: 'calc(100vh - 120px)', background: pageBg, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2.5px solid #F4A000', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
            <img src="/mascot2.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: textPrimary, margin: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>학생부 AI 챗봇</h1>
            <p style={{ fontSize: '13px', color: textSub, margin: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>분석 데이터 기반 학생 학습 어시스턴트</p>
          </div>
        </div>

        {/* 교사/관리자 학생 선택 */}
        {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
          <div style={{ background: bg, borderRadius: '12px', padding: '16px', border: `1px solid ${border}` }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: textSub, display: 'block', marginBottom: '8px', fontFamily: "'Noto Sans KR', sans-serif" }}>학생 선택</label>
            <select
              value={selectedStudentId ?? ''}
              onChange={e => {
                const id = Number(e.target.value) || null;
                setSelectedStudentId(id);
                setHistory([]);
                if (id) setMessages([{ role: 'bot', text: `${students.find(s => s.id === id)?.name ?? '학생'} 학생의 학습 데이터를 불러왔습니다. 궁금한 점을 물어보세요.` }]);
              }}
              style={{ width: '100%', padding: '9px 12px', border: `1px solid ${border}`, borderRadius: '8px', fontSize: '14px', fontFamily: "'Noto Sans KR', sans-serif", background: inputBg, color: textPrimary, outline: 'none' }}
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

        {/* 안내: studentId 없음 */}
        {!initLoading && !effectiveStudentId && (user?.role === 'STUDENT' || user?.role === 'PARENT') && (
          <div style={{ background: isDark ? '#1f2937' : '#fff3cd', border: `1px solid ${isDark ? '#374151' : '#ffc107'}`, borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: isDark ? '#fbbf24' : '#856404', fontFamily: "'Noto Sans KR', sans-serif" }}>
            학생 정보를 찾을 수 없습니다. 프로필 설정이 완료됐는지 확인해주세요.
          </div>
        )}

        {/* 채팅창 */}
        <div style={{ background: bg, borderRadius: '16px', border: `1px solid ${border}`, display: 'flex', flexDirection: 'column', minHeight: '420px', overflow: 'hidden' }}>
          {/* 메시지 영역 */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '480px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {msg.role === 'bot' && (
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #F4A000', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                    <img src="/mascot2.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{
                  maxWidth: '70%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user'
                    ? (isDark ? '#1e40af' : '#1B3A7A')
                    : (isDark ? '#1f2937' : '#eff6ff'),
                  color: msg.role === 'user' ? '#fff' : (isDark ? '#e2e8f0' : '#1B3A7A'),
                  fontSize: '13.5px',
                  lineHeight: 1.6,
                  fontFamily: "'Noto Sans KR', sans-serif",
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', border: '1.5px solid #F4A000', overflow: 'hidden', background: '#fff', flexShrink: 0 }}>
                  <img src="/mascot2.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '10px 16px', borderRadius: '14px 14px 14px 4px', background: isDark ? '#1f2937' : '#eff6ff', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: isDark ? '#60a5fa' : '#1B3A7A', animation: `bounce 1s ${i * 0.2}s infinite`, opacity: 0.7 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${border}`, display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={effectiveStudentId
                ? (selectedStudent ? `${selectedStudent.name} 학생에 대해 질문하세요...` : '메시지를 입력하세요...')
                : '학생을 선택해주세요...'}
              disabled={!effectiveStudentId || loading}
              rows={1}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '12px',
                border: `1px solid ${border}`, background: effectiveStudentId ? inputBg : (isDark ? '#1f2937' : '#f1f5f9'),
                fontSize: '13.5px', fontFamily: "'Noto Sans KR', sans-serif",
                color: effectiveStudentId ? textPrimary : textSub,
                outline: 'none', resize: 'none', lineHeight: 1.5,
                cursor: effectiveStudentId ? 'text' : 'not-allowed',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !effectiveStudentId || loading}
              style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: input.trim() && effectiveStudentId && !loading ? '#1B3A7A' : (isDark ? '#374151' : '#e2e8f0'),
                border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: input.trim() && effectiveStudentId && !loading ? 'pointer' : 'not-allowed',
                flexShrink: 0, transition: 'background 0.2s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>

        <p style={{ fontSize: '11px', color: textSub, textAlign: 'center', fontFamily: "'Noto Sans KR', sans-serif" }}>
          AI는 분석 DB에 집계된 데이터만 사용합니다. ETL 실행 전에는 데이터가 없을 수 있습니다.
        </p>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
