import type { User } from '../../types/user';

const childInfo = { name: '김철수', grade: 3, classNum: 5, number: 1 };

const gradeData = [
  { subject: '수학I', score: 87, achievement: 'B+' },
  { subject: '문학', score: 92, achievement: 'A' },
  { subject: '영어', score: 78, achievement: 'C+' },
];

const feedbacks = [
  { date: '2026-04-19', teacher: '홍길동', type: '성적', content: '수학 문제 해결 능력이 뛰어납니다.' },
  { date: '2026-04-15', teacher: '김민지', type: '태도', content: '수업 참여도가 매우 적극적입니다.' },
];

interface Props { user: User }

export function ParentDashboard({ user }: Props) {
  const avg = (gradeData.reduce((s, g) => s + g.score, 0) / gradeData.length).toFixed(1);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500, letterSpacing: '0.02em' }}>DASHBOARD</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332', letterSpacing: '-0.02em' }}>
          안녕하세요, {user.name}님
        </h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '24px', borderLeft: '4px solid var(--primary-blue)' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>자녀 정보</p>
          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1a2332' }}>{childInfo.name}</p>
          <p style={{ fontSize: '13px', color: '#64748b' }}>{childInfo.grade}학년 {childInfo.classNum}반 {childInfo.number}번</p>
        </div>
        <div style={{ width: '1px', height: '48px', background: '#e8ecf0' }} />
        <div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>이번 학기 평균</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#1e5a99' }}>{avg}점</p>
        </div>
        <div style={{ width: '1px', height: '48px', background: '#e8ecf0' }} />
        <div>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>최근 피드백</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#2ecc71' }}>2건</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>자녀 성적 현황</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['과목', '점수', '성취도'].map((h) => (
                  <th key={h} style={{ padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gradeData.map((g) => (
                <tr key={g.subject} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 500, color: '#1e293b' }}>{g.subject}</td>
                  <td style={{ padding: '12px 20px', color: '#475569' }}>{g.score}점</td>
                  <td style={{ padding: '12px 20px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: '#ebf4ff', color: '#1e5a99' }}>{g.achievement}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>교사 피드백</h2>
          </div>
          <div style={{ padding: '8px 0' }}>
            {feedbacks.map((f, i) => (
              <div key={i} style={{ padding: '14px 24px', borderBottom: '1px solid #f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.date} · {f.teacher} 선생님</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, background: '#f0f5fb', color: '#1e5a99', padding: '2px 8px', borderRadius: '4px' }}>{f.type}</span>
                </div>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>{f.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
