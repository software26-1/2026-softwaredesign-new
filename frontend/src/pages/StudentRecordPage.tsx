import { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { studentRecordService } from '../services/studentRecordService';
import { studentService } from '../services/studentService';
import type { Student } from '../types/student';

const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };
const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

interface RecordData {
  achievements?: string;
  extracurricular?: string;
  volunteerHours?: number;
  careerAspirations?: string;
}

export function StudentRecordPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [record, setRecord] = useState<RecordData | null>(null);
  const [form, setForm] = useState({ achievements: '', extracurricular: '', volunteerHours: 0, careerAspirations: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    studentService.search({}).then(setStudents).catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    if (!selectedId) { setRecord(null); return; }
    setLoading(true);
    studentRecordService.get(Number(selectedId))
      .then(data => {
        const r = data as RecordData;
        setRecord(r);
        setForm({
          achievements: r.achievements ?? '',
          extracurricular: r.extracurricular ?? '',
          volunteerHours: r.volunteerHours ?? 0,
          careerAspirations: r.careerAspirations ?? '',
        });
      })
      .catch(() => { setRecord(null); setForm({ achievements: '', extracurricular: '', volunteerHours: 0, careerAspirations: '' }); })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSubmitting(true); setError('');
    try {
      const updated = await studentRecordService.upsert(Number(selectedId), {
        achievements: form.achievements,
        extracurricular: form.extracurricular,
        volunteerHours: form.volunteerHours,
        careerAspirations: form.careerAspirations,
      });
      setRecord(updated as RecordData);
      setMsg('학생부가 저장되었습니다.');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedStudent = students.find(s => String(s.id) === selectedId);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>STUDENT RECORDS</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학생부 기록</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '20px' }}>학생부 작성</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학생 선택</label>
            <select required style={inputStyle} value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              <option value="">학생을 선택하세요</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.grade}-{s.classNumber}-{String(s.studentNumber).padStart(2, '0')})</option>
              ))}
            </select>
          </div>

          {loading && <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>불러오는 중...</p>}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>특기사항 / 성취</label>
            <textarea value={form.achievements} onChange={e => setForm({ ...form, achievements: e.target.value })} placeholder="특기사항 및 성취 내역을 입력하세요" style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>비교과 활동</label>
            <textarea value={form.extracurricular} onChange={e => setForm({ ...form, extracurricular: e.target.value })} placeholder="비교과 활동 내역을 입력하세요" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>봉사 시간 (h)</label>
              <input type="number" min={0} style={inputStyle} value={form.volunteerHours} onChange={e => setForm({ ...form, volunteerHours: Number(e.target.value) })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>진로 희망</label>
              <input type="text" style={inputStyle} placeholder="진로 희망 사항" value={form.careerAspirations} onChange={e => setForm({ ...form, careerAspirations: e.target.value })} />
            </div>
          </div>

          {msg && <div style={{ padding: '10px 14px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: '3px solid #4caf50' }}>{msg}</div>}
          {error && <div style={{ padding: '10px 14px', background: '#fdecea', color: '#c62828', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: '3px solid #e57373' }}>{error}</div>}
          <Button type="submit" size="sm" disabled={submitting || !selectedId}>{submitting ? '저장 중...' : '저장'}</Button>
        </form>
      </div>

      {selectedId && record && (
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>{selectedStudent?.name} 학생부 현황</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['특기사항', '비교과 활동', '봉사 시간', '진로 희망'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              <tr>
                <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>{record.achievements || '—'}</td>
                <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>{record.extracurricular || '—'}</td>
                <td style={tdStyle}>{record.volunteerHours ?? 0}h</td>
                <td style={{ ...tdStyle, color: '#475569' }}>{record.careerAspirations || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
