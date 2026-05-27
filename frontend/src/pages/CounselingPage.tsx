import { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { counselingService } from '../services/counselingService';
import { studentService } from '../services/studentService';
import type { Counseling } from '../types/counseling';
import type { Student } from '../types/student';

const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };
const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function CounselingPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [list, setList] = useState<Counseling[]>([]);
  const [selected, setSelected] = useState<Counseling | null>(null);
  const [search, setSearch] = useState({ studentName: '', startDate: '', endDate: '' });
  const [form, setForm] = useState({ studentId: '', counselDate: new Date().toISOString().slice(0, 10), mainContent: '', nextPlan: '', isShared: true });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    studentService.search({}).then(res => setStudents(res.content as Student[])).catch(() => setStudents([]));
    loadShared();
  }, []);

  const loadShared = useCallback(() => {
    setLoading(true);
    counselingService.getShared()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    setLoading(true);
    counselingService.getShared({
      studentName: search.studentName || undefined,
      startDate: search.startDate || undefined,
      endDate: search.endDate || undefined,
    }).then(setList).catch(() => setList([])).finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.studentId) return;
    setSubmitting(true); setError('');
    try {
      const created = await counselingService.create({
        studentId: Number(form.studentId),
        counselDate: form.counselDate,
        mainContent: form.mainContent,
        nextPlan: form.nextPlan,
        isShared: form.isShared,
      });
      setList(prev => [created, ...prev]);
      setForm({ studentId: '', counselDate: new Date().toISOString().slice(0, 10), mainContent: '', nextPlan: '', isShared: true });
      setMsg('상담 내역이 저장되었습니다.');
      setTimeout(() => setMsg(''), 3000);
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = list.filter(c =>
    (!search.studentName || c.studentName?.includes(search.studentName)) &&
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
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade}-{s.classNumber}-{String(s.studentNumber).padStart(2, '0')})</option>
                ))}
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
          {error && <div style={{ padding: '10px 14px', background: '#fdecea', color: '#c62828', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: '3px solid #e57373' }}>{error}</div>}
          <Button type="submit" size="sm" disabled={submitting}>{submitting ? '저장 중...' : '저장'}</Button>
        </form>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '14px' }}>상담 내역 조회</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>학생명</label>
              <input type="text" style={inputStyle} placeholder="학생명 입력" value={search.studentName} onChange={e => setSearch({ ...search, studentName: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>시작일</label>
              <input type="date" style={inputStyle} value={search.startDate} onChange={e => setSearch({ ...search, startDate: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '5px' }}>종료일</label>
              <input type="date" style={inputStyle} value={search.endDate} onChange={e => setSearch({ ...search, endDate: e.target.value })} />
            </div>
          </div>
          <Button size="sm" onClick={handleSearch}>검색</Button>
        </div>
        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['상담일', '학생', '상담교사', '주요내용', '공유', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ ...tdStyle, color: '#94a3b8' }}>{c.counselDate?.slice(0, 10)}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{c.studentName}</td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{c.teacherName}</td>
                  <td style={{ ...tdStyle, maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>{c.mainContent}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: c.isShared ? '#e8f5e9' : '#f5f5f5', color: c.isShared ? '#2e7d32' : '#9e9e9e' }}>
                      {c.isShared ? '공유' : '비공개'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <Button size="sm" onClick={() => setSelected(c)}>상세</Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>상담 내역이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={!!selected} title="상담 상세 내역" onClose={() => setSelected(null)}>
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[['학생', selected.studentName], ['상담 교사', selected.teacherName], ['상담일', selected.counselDate?.slice(0, 10)]].map(([k, v]) => (
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
