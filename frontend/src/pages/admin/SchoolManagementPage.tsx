import { useState } from 'react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

interface School { id: number; name: string; code: string; type: '중학교' | '고등학교'; teacherCount: number; studentCount: number; }

const DUMMY: School[] = [
  { id: 1, name: '인천대학교사범대학부속고등학교', code: 'ICN001', type: '고등학교', teacherCount: 48, studentCount: 1240 },
  { id: 2, name: '인천대학교사범대학부속중학교', code: 'ICN002', type: '중학교', teacherCount: 32, studentCount: 890 },
  { id: 3, name: '인천과학고등학교', code: 'ICN003', type: '고등학교', teacherCount: 28, studentCount: 480 },
];

const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };
const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function SchoolManagementPage() {
  const [schools, setSchools] = useState<School[]>(DUMMY);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', type: '고등학교' as School['type'] });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSchools(prev => [...prev, { id: Date.now(), ...form, teacherCount: 0, studentCount: 0 }]);
    setForm({ name: '', code: '', type: '고등학교' });
    setIsOpen(false);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>SCHOOL MANAGEMENT</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학교 관리</h1>
        </div>
        <Button size="sm" onClick={() => setIsOpen(true)}>+ 학교 등록</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[['등록 학교', `${schools.length}개교`, '#1e5a99'], ['전체 교사', `${schools.reduce((a, s) => a + s.teacherCount, 0)}명`, '#2ecc71'], ['전체 학생', `${schools.reduce((a, s) => a + s.studentCount, 0).toLocaleString()}명`, '#f39c12']].map(([l, v, c]) => (
          <div key={l as string} style={{ background: '#fff', borderRadius: '10px', padding: '18px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderTop: `3px solid ${c}` }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>{l as string}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: c as string }}>{v}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>등록된 학교</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['학교명','학교 코드','유형','교사 수','학생 수','관리'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {schools.map(s => (
              <tr key={s.id}>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', color: '#64748b' }}>{s.code}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: s.type === '고등학교' ? '#ebf4ff' : '#e8f5e9', color: s.type === '고등학교' ? '#1e5a99' : '#2e7d32' }}>{s.type}</span>
                </td>
                <td style={tdStyle}>{s.teacherCount}명</td>
                <td style={tdStyle}>{s.studentCount.toLocaleString()}명</td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button size="sm" variant="secondary">수정</Button>
                    <Button size="sm" variant="danger">삭제</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isOpen} title="학교 등록" onClose={() => setIsOpen(false)} width={480}>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학교명</label>
              <input required style={inputStyle} placeholder="학교명을 입력하세요" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학교 코드</label>
              <input required style={inputStyle} placeholder="예: ICN001" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학교 유형</label>
              <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value as School['type'] })}>
                <option value="중학교">중학교</option>
                <option value="고등학교">고등학교</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsOpen(false)}>취소</Button>
              <Button type="submit" size="sm">등록</Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
