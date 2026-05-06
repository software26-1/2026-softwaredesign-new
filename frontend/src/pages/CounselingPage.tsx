import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

interface CounselingItem {
  id: number; studentName: string; teacherName: string;
  counselDate: string; mainContent: string; nextPlan: string; isShared: boolean;
}

const STUDENTS = [
  { id: 1, name: '김철수', grade: 3, classNum: 5, number: 1 },
  { id: 2, name: '이영희', grade: 3, classNum: 5, number: 2 },
  { id: 3, name: '박민수', grade: 3, classNum: 5, number: 3 },
];

const DUMMY: CounselingItem[] = [
  { id: 1, studentName: '박민수', teacherName: '홍길동', counselDate: '2026-04-18', mainContent: '진로 고민 상담. 이공계 진학을 희망하나 수학 성적에 불안감을 느끼고 있음. 꾸준한 학습 계획 수립을 권장함.', nextPlan: '다음 달 학습 계획 점검 및 모의고사 결과 분석', isShared: true },
  { id: 2, studentName: '이영희', teacherName: '홍길동', counselDate: '2026-04-10', mainContent: '교우 관계 고민. 친구들과의 갈등으로 학교생활에 어려움을 호소함. 적극적인 경청과 공감 태도로 상담 진행.', nextPlan: '2주 후 경과 확인', isShared: false },
];

const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };
const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function CounselingPage() {
  const [list, setList] = useState<CounselingItem[]>(DUMMY);
  const [selected, setSelected] = useState<CounselingItem | null>(null);
  const [search, setSearch] = useState({ studentName: '', teacherName: '', startDate: '', endDate: '' });
  const [form, setForm] = useState({ studentId: '', counselDate: new Date().toISOString().slice(0, 10), mainContent: '', nextPlan: '', isShared: true });
  const [msg, setMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) return;
    const student = STUDENTS.find(s => s.id === Number(form.studentId));
    const newC: CounselingItem = {
      id: Date.now(), studentName: student?.name ?? '', teacherName: '홍길동',
      counselDate: form.counselDate, mainContent: form.mainContent,
      nextPlan: form.nextPlan, isShared: form.isShared,
    };
    setList(prev => [newC, ...prev]);
    setForm({ studentId: '', counselDate: new Date().toISOString().slice(0, 10), mainContent: '', nextPlan: '', isShared: true });
    setMsg('상담 내역이 저장되었습니다.');
    setTimeout(() => setMsg(''), 3000);
  };

  const filtered = list.filter(c =>
    (!search.studentName || c.studentName.includes(search.studentName)) &&
    (!search.teacherName || c.teacherName.includes(search.teacherName)) &&
    (!search.startDate || c.counselDate >= search.startDate) &&
    (!search.endDate || c.counselDate <= search.endDate)
  );

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>COUNSELING</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>상담 내역 관리</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '20px' }}>상담 내역 등록</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학생 선택</label>
              <select required style={inputStyle} value={form.studentId} onChange={e => setForm({ ...form, studentId: e.target.value })}>
                <option value="">학생을 선택하세요</option>
                {STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade}-{s.classNum}-{String(s.number).padStart(2,'0')})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>상담 일자</label>
              <input type="date" required style={inputStyle} value={form.counselDate} onChange={e => setForm({ ...form, counselDate: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>주요 내용</label>
            <textarea required value={form.mainContent} onChange={e => setForm({ ...form, mainContent: e.target.value })} placeholder="상담 주요 내용을 입력하세요" style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>차후 계획</label>
            <textarea value={form.nextPlan} onChange={e => setForm({ ...form, nextPlan: e.target.value })} placeholder="차후 계획을 입력하세요" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#475569' }}>
              <input type="checkbox" checked={form.isShared} onChange={e => setForm({ ...form, isShared: e.target.checked })} style={{ width: '15px', height: '15px' }} />
              다른 교사와 공유 (학교 내 모든 교사가 열람 가능)
            </label>
          </div>
          {msg && <div style={{ padding: '10px 14px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: '3px solid #4caf50' }}>{msg}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" size="sm">저장</Button>
            <Button type="button" size="sm" variant="secondary">초기화</Button>
          </div>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '14px' }}>상담 내역 조회</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '12px' }}>
            {[['학생명', 'studentName', 'text'], ['상담 교사', 'teacherName', 'text'], ['시작일', 'startDate', 'date'], ['종료일', 'endDate', 'date']].map(([label, key, type]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>{label}</label>
                <input type={type} style={{ ...inputStyle }} placeholder={type === 'text' ? `${label} 입력` : undefined}
                  value={search[key as keyof typeof search]}
                  onChange={e => setSearch({ ...search, [key]: e.target.value })} />
              </div>
            ))}
          </div>
          <Button size="sm">검색</Button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['상담일','학생','상담교사','주요내용','공유',''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td style={{ ...tdStyle, color: '#94a3b8' }}>{c.counselDate}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{c.studentName}</td>
                <td style={{ ...tdStyle, color: '#475569' }}>{c.teacherName}</td>
                <td style={{ ...tdStyle, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>{c.mainContent}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: c.isShared ? '#e8f5e9' : '#f5f5f5', color: c.isShared ? '#2e7d32' : '#9e9e9e' }}>
                    {c.isShared ? '공유' : '비공개'}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button size="sm" onClick={() => setSelected(c)}>상세</Button>
                    <Button size="sm" variant="secondary">수정</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selected} title="상담 상세 내역" onClose={() => setSelected(null)}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[['학생', selected.studentName], ['상담 교사', selected.teacherName], ['상담일', selected.counselDate]].map(([k, v]) => (
                <div key={k} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>{k}</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a2332' }}>{v}</p>
                </div>
              ))}
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px' }}>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>공유 여부</p>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: selected.isShared ? '#e8f5e9' : '#f5f5f5', color: selected.isShared ? '#2e7d32' : '#9e9e9e' }}>{selected.isShared ? '공유' : '비공개'}</span>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>주요 내용</p>
              <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.8', padding: '14px', background: '#f8fafc', borderRadius: '8px' }}>{selected.mainContent}</p>
            </div>
            {selected.nextPlan && (
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>차후 계획</p>
                <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.8', padding: '14px', background: '#f8fafc', borderRadius: '8px' }}>{selected.nextPlan}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
