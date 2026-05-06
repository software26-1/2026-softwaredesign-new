import { useState } from 'react';
import { Button } from '../components/common/Button';

type FeedbackCategory = 'GRADE' | 'BEHAVIOR' | 'ATTENDANCE' | 'ATTITUDE';
const CATEGORY_LABELS: Record<FeedbackCategory, string> = { GRADE: '성적', BEHAVIOR: '행동', ATTENDANCE: '출결', ATTITUDE: '태도' };
const catBg: Record<FeedbackCategory, string> = { GRADE: '#ebf4ff', BEHAVIOR: '#e8f5e9', ATTENDANCE: '#fff3e0', ATTITUDE: '#f3e5f5' };
const catColor: Record<FeedbackCategory, string> = { GRADE: '#1e5a99', BEHAVIOR: '#2e7d32', ATTENDANCE: '#e65100', ATTITUDE: '#6a1b9a' };

const STUDENTS = [
  { id: 1, name: '김철수', grade: 3, classNum: 5, number: 1 },
  { id: 2, name: '이영희', grade: 3, classNum: 5, number: 2 },
  { id: 3, name: '박민수', grade: 3, classNum: 5, number: 3 },
];

interface FeedbackItem {
  id: number; studentName: string; category: FeedbackCategory;
  content: string; isPublicToStudent: boolean; isPublicToParent: boolean; createdAt: string;
}

const DUMMY: FeedbackItem[] = [
  { id: 1, studentName: '이영희', category: 'GRADE', content: '문제 해결 능력이 뛰어납니다. 특히 적분 파트에서 창의적인 접근법이 인상적이었습니다.', isPublicToStudent: true, isPublicToParent: true, createdAt: '2026-04-19' },
  { id: 2, studentName: '김철수', category: 'ATTITUDE', content: '수업 태도가 성실하고 질문을 적극적으로 하는 점이 좋습니다.', isPublicToStudent: true, isPublicToParent: false, createdAt: '2026-04-15' },
];

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(DUMMY);
  const [form, setForm] = useState({ studentId: '', category: 'GRADE' as FeedbackCategory, content: '', isPublicToStudent: true, isPublicToParent: true });
  const [msg, setMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) return;
    const student = STUDENTS.find(s => s.id === Number(form.studentId));
    const newFb: FeedbackItem = {
      id: Date.now(), studentName: student?.name ?? '', category: form.category,
      content: form.content, isPublicToStudent: form.isPublicToStudent,
      isPublicToParent: form.isPublicToParent, createdAt: new Date().toISOString().slice(0, 10),
    };
    setFeedbacks(prev => [newFb, ...prev]);
    setForm({ studentId: '', category: 'GRADE', content: '', isPublicToStudent: true, isPublicToParent: true });
    setMsg('피드백이 저장되었습니다.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleDelete = (id: number) => setFeedbacks(prev => prev.filter(f => f.id !== id));

  const selectStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>FEEDBACK</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>피드백 작성</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '20px' }}>피드백 작성</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학생 선택</label>
              <select required style={selectStyle} value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                <option value="">학생을 선택하세요</option>
                {STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade}-{s.classNum}-{String(s.number).padStart(2,'0')})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>피드백 유형</label>
              <select style={selectStyle} value={form.category} onChange={e => setForm({ ...form, category: e.target.value as FeedbackCategory })}>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>피드백 내용</label>
            <textarea
              required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              placeholder="피드백 내용을 입력하세요"
              style={{ width: '100%', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", minHeight: '110px', resize: 'vertical', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '10px' }}>공개 설정</label>
            <div style={{ display: 'flex', gap: '20px' }}>
              {([['isPublicToStudent', '학생에게 공개'], ['isPublicToParent', '학부모에게 공개']] as const).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>
                  <input type="checkbox" checked={form[key]} onChange={e => setForm({ ...form, [key]: e.target.checked })} style={{ width: '15px', height: '15px' }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {msg && <div style={{ padding: '10px 14px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: '3px solid #4caf50' }}>{msg}</div>}

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" size="sm">저장</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setForm({ studentId: '', category: 'GRADE', content: '', isPublicToStudent: true, isPublicToParent: true })}>초기화</Button>
          </div>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>작성한 피드백</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['작성일','학생','유형','내용','공개 대상',''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {feedbacks.map(fb => (
              <tr key={fb.id}>
                <td style={{ ...tdStyle, color: '#94a3b8' }}>{fb.createdAt}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{fb.studentName}</td>
                <td style={tdStyle}><span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: catBg[fb.category], color: catColor[fb.category] }}>{CATEGORY_LABELS[fb.category]}</span></td>
                <td style={{ ...tdStyle, maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>{fb.content}</td>
                <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{[fb.isPublicToStudent && '학생', fb.isPublicToParent && '학부모'].filter(Boolean).join(' · ') || '비공개'}</td>
                <td style={tdStyle}><Button size="sm" variant="danger" onClick={() => handleDelete(fb.id)}>삭제</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
