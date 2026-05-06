import { useState } from 'react';
import { Button } from '../components/common/Button';

const STUDENTS = [
  { id: 1, name: '김철수', grade: 3, classNum: 5, number: 1 },
  { id: 2, name: '이영희', grade: 3, classNum: 5, number: 2 },
  { id: 3, name: '박민수', grade: 3, classNum: 5, number: 3 },
];

interface RecordItem { id: number; academicYear: number; semester: number; specialNote: string; extracurricular: string; }

const DUMMY_RECORDS: Record<number, RecordItem[]> = {
  1: [
    { id: 1, academicYear: 2026, semester: 1, specialNote: '수학 경시대회 교내 2위. 과학 동아리 회장으로서 실험 계획 및 발표를 주도함.', extracurricular: '수학 경시대회, 과학 탐구 동아리, 학급 부반장' },
    { id: 2, academicYear: 2025, semester: 2, specialNote: '학기 내내 성실한 태도로 수업에 참여함. 독서 기록장 꾸준히 작성.', extracurricular: '독서 토론반, 봉사 활동 32시간' },
  ],
  2: [{ id: 3, academicYear: 2026, semester: 1, specialNote: '영어 말하기 대회 교내 1위. 꾸준한 자기주도 학습 능력 탁월.', extracurricular: '영어 토론반, 봉사 활동 28시간' }],
  3: [],
};

const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };
const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function StudentRecordPage() {
  const [selectedId, setSelectedId] = useState('');
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [form, setForm] = useState({ academicYear: 2026, semester: 1, specialNote: '', extracurricular: '' });
  const [msg, setMsg] = useState('');

  const handleStudentChange = (id: string) => {
    setSelectedId(id);
    setRecords(id ? (DUMMY_RECORDS[Number(id)] ?? []) : []);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    const newRecord: RecordItem = { id: Date.now(), ...form };
    setRecords(prev => [newRecord, ...prev]);
    setForm({ ...form, specialNote: '', extracurricular: '' });
    setMsg('학생부가 저장되었습니다.');
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>STUDENT RECORDS</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학생부 기록</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '20px' }}>학생부 작성</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학생 선택</label>
              <select required style={inputStyle} value={selectedId} onChange={e => handleStudentChange(e.target.value)}>
                <option value="">학생을 선택하세요</option>
                {STUDENTS.map(s => <option key={s.id} value={s.id}>{s.name} ({s.grade}-{s.classNum}-{String(s.number).padStart(2,'0')})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학년도</label>
              <input type="number" style={inputStyle} value={form.academicYear} min={2020} max={2030} onChange={e => setForm({ ...form, academicYear: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학기</label>
              <select style={inputStyle} value={form.semester} onChange={e => setForm({ ...form, semester: Number(e.target.value) })}>
                <option value={1}>1학기</option>
                <option value={2}>2학기</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>특기사항</label>
            <textarea value={form.specialNote} onChange={e => setForm({ ...form, specialNote: e.target.value })} placeholder="특기사항을 입력하세요" style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>비교과 활동</label>
            <textarea value={form.extracurricular} onChange={e => setForm({ ...form, extracurricular: e.target.value })} placeholder="비교과 활동 내역을 입력하세요" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>

          {msg && <div style={{ padding: '10px 14px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: '3px solid #4caf50' }}>{msg}</div>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="submit" size="sm">저장</Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setForm({ ...form, specialNote: '', extracurricular: '' })}>초기화</Button>
          </div>
        </form>
      </div>

      {selectedId && (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>
              {STUDENTS.find(s => String(s.id) === selectedId)?.name} 학생부 내역
            </h2>
          </div>
          {records.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>등록된 학생부 내역이 없습니다.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['학년도','학기','특기사항','비교과 활동'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={tdStyle}>{r.academicYear}학년도</td>
                    <td style={tdStyle}>{r.semester}학기</td>
                    <td style={{ ...tdStyle, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>{r.specialNote || '—'}</td>
                    <td style={{ ...tdStyle, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>{r.extracurricular || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
