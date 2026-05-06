import { Card } from '../../components/common/Card';

const feedbacks = [
  { date: '2026-04-19', teacher: '홍길동', type: '성적', content: '수학 문제 해결 능력이 뛰어납니다. 특히 적분 파트에서 창의적인 접근법이 인상적이었습니다.' },
  { date: '2026-04-15', teacher: '김민지', type: '태도', content: '수업 참여도가 매우 적극적입니다. 앞으로도 꾸준히 유지해 주세요.' },
];

const typeBg: Record<string, string> = { 성적: '#ebf4ff', 태도: '#f3e5f5', 출결: '#fff3e0', 행동: '#e8f5e9' };
const typeColor: Record<string, string> = { 성적: '#1e5a99', 태도: '#6a1b9a', 출결: '#e65100', 행동: '#2e7d32' };

export function ChildFeedbackPage() {
  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>CHILD FEEDBACK</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>자녀 피드백 확인</h1>
      </div>

      <Card>
        {feedbacks.map((f, i) => (
          <div key={i} style={{ padding: '20px 0', borderBottom: i < feedbacks.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.date}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>{f.teacher} 선생님</span>
              </div>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: typeBg[f.type], color: typeColor[f.type] }}>{f.type}</span>
            </div>
            <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.75', padding: '12px 16px', background: '#f8fafc', borderRadius: '6px' }}>{f.content}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}
