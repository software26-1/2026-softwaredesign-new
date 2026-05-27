import { useState } from 'react';
import { analyticsService } from '../services/analyticsService';

interface Props {
  studentId: number;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export function AnalyticsChatbot({ studentId }: Props) {
  const [question, setQuestion] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setTurns((prev) => [...prev, { role: 'user', text: trimmed }]);
    setQuestion('');
    setLoading(true);
    try {
      const res = await analyticsService.chat(studentId, trimmed);
      setTurns((prev) => [...prev, { role: 'assistant', text: res.answer ?? '응답이 없습니다.' }]);
    } catch {
      setTurns((prev) => [...prev, { role: 'assistant', text: '오류가 발생했습니다. 다시 시도해 주세요.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div
        style={{
          maxHeight: '240px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '4px',
        }}
      >
        {turns.length === 0 && (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            학습 데이터에 대해 궁금한 점을 물어보세요. 예: "이번 학기 약한 과목은?"
          </p>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            style={{
              alignSelf: t.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '9px 13px',
              borderRadius: '10px',
              fontSize: '13px',
              lineHeight: 1.6,
              background: t.role === 'user' ? '#1e5a99' : '#f1f5f9',
              color: t.role === 'user' ? '#fff' : '#334155',
              whiteSpace: 'pre-wrap',
            }}
          >
            {t.text}
          </div>
        ))}
        {loading && <p style={{ fontSize: '13px', color: '#94a3b8' }}>답변 생성 중...</p>}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="질문을 입력하세요"
          style={{
            flex: 1,
            padding: '9px 14px',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: "'Noto Sans KR', sans-serif",
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: '9px 18px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            background: loading ? '#94a3b8' : '#1e5a99',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}
