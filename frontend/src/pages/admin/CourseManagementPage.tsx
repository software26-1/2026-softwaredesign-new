import { useState, useEffect } from 'react';
import { Button } from '../../components/common/Button';
import client from '../../api/client';

const CURRICULA = [
  { id: 1, name: '국어' }, { id: 2, name: '수학' }, { id: 3, name: '영어' },
  { id: 4, name: '사회' }, { id: 5, name: '한국사' }, { id: 6, name: '과학' },
  { id: 7, name: '체육' }, { id: 8, name: '음악' }, { id: 9, name: '미술' },
  { id: 10, name: '기술가정' }, { id: 11, name: '정보' }, { id: 12, name: '도덕' },
];

const CURRENT_YEAR = new Date().getFullYear();

const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '11px 16px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const inputStyle: React.CSSProperties = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };

export function CourseManagementPage() {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [semester, setSemester] = useState(1);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    courseName: '', curriculumId: 1, grade: 1,
    midtermRatio: 35, finalRatio: 35, taskRatio: 30, evaluationType: 'RELATIVE',
  });

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await client.get<any[]>('/courses', { params: { academic_year: year, semester } });
      setCourses(Array.isArray(res.data) ? res.data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCourses(); }, [year, semester]);

  useEffect(() => {
    client.get('/teachers').then((r: any) => setTeachers(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))).catch(() => {});
  }, []);

  const assignTeacher = async (courseId: number, teacherId: number) => {
    try {
      await client.patch(`/courses/${courseId}`, { teacherId: teacherId || 0 });
      setCourses(prev => prev.map(c => {
        if (c.id !== courseId) return c;
        const t = teachers.find(t => t.id === teacherId);
        return { ...c, teacherId: teacherId || null, teacherName: t?.name ?? null };
      }));
    } catch { }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.midtermRatio + form.finalRatio + form.taskRatio !== 100) {
      setMsg('비율 합계가 100이어야 합니다.'); return;
    }
    try {
      await client.post('/courses', {
        courseName: form.courseName,
        curriculumId: form.curriculumId,
        grade: form.grade,
        academicYear: year,
        semester,
        midtermRatio: form.midtermRatio,
        finalRatio: form.finalRatio,
        taskRatio: form.taskRatio,
        courseType: form.evaluationType === 'ABSOLUTE' ? 'CAREER' : 'ELECTIVE',
        evaluationType: form.evaluationType,
      });
      setMsg('과목이 개설되었습니다.');
      setForm({ courseName: '', curriculumId: 1, grade: 1, midtermRatio: 35, finalRatio: 35, taskRatio: 30, evaluationType: 'RELATIVE' });
      loadCourses();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('개설에 실패했습니다.'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 과목을 삭제하시겠습니까?')) return;
    try {
      await client.delete(`/courses/${id}`);
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch { alert('삭제에 실패했습니다.'); }
  };

  const curriculumName = (id: number) => CURRICULA.find(c => c.id === id)?.name ?? '-';
  const total = form.midtermRatio + form.finalRatio + form.taskRatio;

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .cm-filter-row { flex-direction: column !important; align-items: stretch !important; }
          .cm-filter-row > div { width: 100% !important; }
          .cm-form-grid4 { grid-template-columns: 1fr 1fr !important; }
          .cm-form-grid3 { grid-template-columns: 1fr !important; }
          .cm-table-wrap { overflow-x: auto; }
          .cm-form-pad { padding: 16px !important; }
        }
      `}</style>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>과목 관리</h1>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>관리자가 과목을 개설하면, 교사가 마이페이지에서 담당 과목을 등록합니다.</p>
      </div>

      {/* 학년도/학기 */}
      <div className="cm-filter-row" style={{ background: '#fff', borderRadius: '10px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학년도</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ ...inputStyle, width: '140px' }}>
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}학년도</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학기</label>
          <select value={semester} onChange={e => setSemester(Number(e.target.value))} style={{ ...inputStyle, width: '100px' }}>
            <option value={1}>1학기</option>
            <option value={2}>2학기</option>
          </select>
        </div>
      </div>

      {/* 신규 개설 폼 */}
      <div className="cm-form-pad" style={{ background: '#fff', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '18px' }}>신규 과목 개설</h2>
        <form onSubmit={handleCreate}>
          <div className="cm-form-grid4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>과목명</label>
              <input required style={inputStyle} placeholder="예: 미적분, 수학I" value={form.courseName} onChange={e => setForm({ ...form, courseName: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>교과</label>
              <select style={inputStyle} value={form.curriculumId} onChange={e => setForm({ ...form, curriculumId: Number(e.target.value) })}>
                {CURRICULA.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학년</label>
              <select style={inputStyle} value={form.grade} onChange={e => setForm({ ...form, grade: Number(e.target.value) })}>
                <option value={1}>1학년</option>
                <option value={2}>2학년</option>
                <option value={3}>3학년</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>평가 방식</label>
              <select style={inputStyle} value={form.evaluationType} onChange={e => setForm({ ...form, evaluationType: e.target.value })}>
                <option value="RELATIVE">상대평가 (1~9등급)</option>
                <option value="ABSOLUTE">절대평가 (A~E)</option>
              </select>
            </div>
          </div>
          <div className="cm-form-grid3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
            {([['중간고사', 'midtermRatio', 'finalRatio', 'taskRatio'], ['기말고사', 'finalRatio', 'midtermRatio', 'taskRatio'], ['수행평가', 'taskRatio', 'midtermRatio', 'finalRatio']] as [string, string, string, string][]).map(([label, key, otherA, otherB]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>{label} 비율(%)</label>
                <input type="number" min={0} max={100} style={inputStyle}
                  value={form[key as keyof typeof form]}
                  onChange={e => {
                    const val = Math.min(100, Math.max(0, Number(e.target.value)));
                    const remaining = 100 - val;
                    const half = Math.floor(remaining / 2);
                    setForm({ ...form, [key]: val, [otherA]: half, [otherB]: remaining - half });
                  }} />
              </div>
            ))}
          </div>
          {total !== 100 && <p style={{ fontSize: '12px', color: '#c62828', marginBottom: '8px' }}>비율 합계: {total}% (100%이어야 합니다)</p>}
          {msg && <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', background: msg.includes('개설되었') ? '#e8f5e9' : '#fdecea', color: msg.includes('개설되었') ? '#2e7d32' : '#c62828' }}>{msg}</div>}
          <Button type="submit" size="sm">과목 개설</Button>
        </form>
      </div>

      {/* 학년별 과목 목록 */}
      {loading ? <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>불러오는 중...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map(g => {
            const items = courses.filter(c => c.grade === g);
            return (
              <div key={g} style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1a2332' }}>{g}학년</h2>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{items.length}개 과목</span>
                </div>
                {items.length === 0 ? (
                  <p style={{ padding: '20px 24px', fontSize: '13px', color: '#94a3b8' }}>개설된 과목이 없습니다.</p>
                ) : (
                  <div className="cm-table-wrap">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>{['교과', '과목명', '담당 교사', '중간', '기말', '수행', '평가방식', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {items.map(c => (
                          <tr key={c.id}>
                            <td style={{ ...tdStyle, color: '#64748b' }}>{curriculumName(c.curriculumId)}</td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{c.courseName}</td>
                            <td style={tdStyle}>
                              <select value={c.teacherId ?? 0} onChange={e => assignTeacher(c.id, Number(e.target.value))}
                                style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', color: c.teacherName ? '#475569' : '#94a3b8' }}>
                                <option value={0}>미배정</option>
                                {teachers.map(t => {
                                  const curriculum = CURRICULA.find(cu => cu.id === t.curriculumId);
                                  const label = [t.name, curriculum?.name, t.email].filter(Boolean).join(' · ');
                                  return <option key={t.id} value={t.id}>{label}</option>;
                                })}
                              </select>
                            </td>
                            <td style={tdStyle}>{c.midtermRatio}%</td>
                            <td style={tdStyle}>{c.finalRatio}%</td>
                            <td style={tdStyle}>{c.taskRatio}%</td>
                            <td style={tdStyle}>
                              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: c.evaluationType === 'ABSOLUTE' ? '#e8f5e9' : '#ebf4ff', color: c.evaluationType === 'ABSOLUTE' ? '#2e7d32' : '#1e5a99' }}>
                                {c.evaluationType === 'ABSOLUTE' ? '절대 (A~E)' : '상대 (1~9)'}
                              </span>
                            </td>
                            <td style={{ ...tdStyle }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <Button size="sm" variant="secondary" onClick={async () => {
                                  try {
                                    await client.post('/courses', {
                                      courseName: c.courseName, curriculumId: c.curriculumId,
                                      grade: c.grade, academicYear: year, semester,
                                      midtermRatio: c.midtermRatio, finalRatio: c.finalRatio, taskRatio: c.taskRatio,
                                      courseType: c.evaluationType === 'ABSOLUTE' ? 'CAREER' : 'ELECTIVE',
                                      evaluationType: c.evaluationType,
                                    });
                                    loadCourses();
                                  } catch { }
                                }}>+ 분반</Button>
                                <Button size="sm" variant="secondary" onClick={() => handleDelete(c.id)}>삭제</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
