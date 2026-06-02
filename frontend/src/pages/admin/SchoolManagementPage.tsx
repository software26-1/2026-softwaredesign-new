import { useState, useEffect } from 'react';
import client from '../../api/client';

interface SchoolInfo { id: number; schoolName: string; schoolType: string; }
interface ClassGroupInfo { id: number; grade: number; classNumber: number; academicYear: number; teacherName?: string; homeroomTeacherId?: number; }
interface TeacherOption { teacherId: number; name: string; email: string; }
interface UnassignedStudent { id: number; name: string; email: string; }

const TYPE_LABEL: Record<string, string> = { HIGH: '고등학교', MIDDLE: '중학교' };

const thStyle: React.CSSProperties = {
  padding: '8px 20px', textAlign: 'left', fontWeight: 600,
  color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc',
};
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px',
  fontSize: '13px', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif",
};
const btnStyle = (color: string, bg: string): React.CSSProperties => ({
  padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
  fontSize: '12px', fontWeight: 600, color, background: bg, fontFamily: "'Noto Sans KR', sans-serif",
});

export function SchoolManagementPage() {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [classGroups, setClassGroups] = useState<ClassGroupInfo[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<UnassignedStudent[]>([]);
  const [assignForm, setAssignForm] = useState<Record<number, { classGroupId: string; studentNumber: string }>>({});
  const [schoolTab, setSchoolTab] = useState<'classes' | 'unassigned'>('classes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // 학교 정보 수정
  const [editingSchool, setEditingSchool] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ schoolName: '', schoolType: '' });
  const [schoolSaving, setSchoolSaving] = useState(false);

  // 학급 추가
  const [addingGrade, setAddingGrade] = useState<number | null>(null);
  const [classForm, setClassForm] = useState({ grade: '', classNumber: '' });
  const [classSaving, setClassSaving] = useState(false);


  const loadData = async () => {
    setLoading(true);
    try {
      const schoolsRes = await client.get<SchoolInfo[]>('/schools');
      const schools = Array.isArray(schoolsRes.data) ? schoolsRes.data : (schoolsRes.data as any).data ?? [];
      const mySchool = schools[0];
      if (!mySchool) { setLoading(false); return; }
      setSchool(mySchool);
      setSchoolForm({ schoolName: mySchool.schoolName, schoolType: mySchool.schoolType });
      const cgRes = await client.get<ClassGroupInfo[]>(`/schools/${mySchool.id}/class-groups`);
      const cg = Array.isArray(cgRes.data) ? cgRes.data : ((cgRes.data as any).data ?? []);
      setClassGroups(cg);

      const teacherRes = await client.get<any>('/admin/users?status=ACTIVE');
      const teacherList = teacherRes.data.data ?? [];
      setTeachers(teacherList.filter((t: any) => t.teacherId).map((t: any) => ({ teacherId: t.teacherId, name: t.name, email: t.email })));

      const unassignedRes = await client.get<any[]>(`/students/unassigned`);
      const unassigned = Array.isArray(unassignedRes.data) ? unassignedRes.data : (unassignedRes.data as any).data ?? [];
      setUnassignedStudents(unassigned.map((s: any) => ({ id: s.id, name: s.userName ?? s.name, email: s.userEmail ?? s.email })));
    } catch { setError('데이터를 불러오지 못했습니다.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const saveSchool = async () => {
    if (!school) return;
    setSchoolSaving(true);
    try {
      await client.put(`/schools/${school.id}`, { schoolName: schoolForm.schoolName, schoolType: schoolForm.schoolType });
      await loadData();
      setEditingSchool(false);
    } catch { setError('학교 정보 수정 실패'); }
    finally { setSchoolSaving(false); }
  };

  const addClass = async () => {
    if (!school) return;
    const duplicate = classGroups.some(c => c.grade === addingGrade && c.classNumber === Number(classForm.classNumber));
    if (duplicate) { showToast(`${addingGrade}학년 ${classForm.classNumber}반이 이미 존재합니다.`); return; }
    setClassSaving(true);
    try {
      await client.post(`/schools/${school.id}/class-groups`, {
        grade: addingGrade,
        classNumber: Number(classForm.classNumber),
        academicYear: new Date().getFullYear(),
      });
      setClassForm({ grade: '', classNumber: '' });
      setAddingGrade(null);
      await loadData();
    } catch { setError('학급 추가 실패'); }
    finally { setClassSaving(false); }
  };

  const deleteClass = async (id: number) => {
    if (!confirm('학급을 삭제하시겠습니까?')) return;
    try {
      await client.delete(`/class-groups/${id}`);
      await loadData();
    } catch { setError('학급 삭제 실패'); }
  };

  if (loading) return <p style={{ color: '#94a3b8', fontSize: '13px', padding: '40px' }}>불러오는 중...</p>;
  if (!school) return <p style={{ color: '#94a3b8', fontSize: '13px', padding: '40px' }}>학교 정보가 없습니다.</p>;

  const Toast = toast ? (
    <div style={{
      position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
      background: '#1a2332', color: '#fff', padding: '12px 24px', borderRadius: '8px',
      fontSize: '14px', fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>{toast}</div>
  ) : null;

  return (
    <div>
      {Toast}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학교 관리</h1>
      </div>

      {error && <p style={{ color: '#c62828', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

      {/* 학교 기본 정보 */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>학교 기본 정보</h2>
          {!editingSchool ? (
            <button onClick={() => setEditingSchool(true)} style={btnStyle('#1e5a99', '#ebf4ff')}>수정</button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveSchool} disabled={schoolSaving} style={btnStyle('#fff', '#1e5a99')}>
                {schoolSaving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setEditingSchool(false)} style={btnStyle('#64748b', '#f1f5f9')}>취소</button>
            </div>
          )}
        </div>
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>학교명</p>
            {editingSchool ? (
              <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                value={schoolForm.schoolName}
                onChange={e => setSchoolForm(p => ({ ...p, schoolName: e.target.value }))} />
            ) : (
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a2332' }}>{school.schoolName}</p>
            )}
          </div>
          <div>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>학교 구분</p>
            {editingSchool ? (
              <select style={inputStyle} value={schoolForm.schoolType}
                onChange={e => setSchoolForm(p => ({ ...p, schoolType: e.target.value }))}>
                <option value="HIGH">고등학교</option>
                <option value="MIDDLE">중학교</option>
              </select>
            ) : (
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a2332' }}>{TYPE_LABEL[school.schoolType] ?? school.schoolType}</p>
            )}
          </div>
        </div>
      </div>

      {/* 학급 목록 */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>학급 목록 <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 400 }}>{classGroups.length}개</span></h2>
        </div>
        {/* 탭 */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '6px' }}>
          {([['classes', '학급 관리'], ['unassigned', `전학 배정 ${unassignedStudents.length}명`]] as const).map(([key, label]) => (
            <button key={key} onClick={() => setSchoolTab(key)}
              style={{
                padding: '6px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '12px', fontWeight: 600, fontFamily: "'Noto Sans KR', sans-serif",
                background: schoolTab === key ? '#1e5a99' : '#f1f5f9',
                color: schoolTab === key ? '#fff' : '#64748b',
              }}>
              {label}
            </button>
          ))}
        </div>

        {schoolTab === 'unassigned' && (
          unassignedStudents.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>배정 대기 학생이 없습니다.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['이름', '이메일', '학급 배정', '번호', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {unassignedStudents.map(s => {
                  const form = assignForm[s.id] ?? { classGroupId: '', studentNumber: '' };
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{s.email}</td>
                      <td style={tdStyle}>
                        <select value={form.classGroupId}
                          onChange={e => setAssignForm(p => ({ ...p, [s.id]: { ...form, classGroupId: e.target.value } }))}
                          style={{ ...inputStyle, minWidth: '120px' }}>
                          <option value="">학급 선택</option>
                          {[1,2,3].map(g => {
                            const gc = classGroups.filter(c => c.grade === g);
                            return gc.length > 0 ? (
                              <optgroup key={g} label={`${g}학년`}>
                                {gc.map(c => <option key={c.id} value={c.id}>{g}학년 {c.classNumber}반</option>)}
                              </optgroup>
                            ) : null;
                          })}
                        </select>
                      </td>
                      <td style={tdStyle}>
                        <input type="number" min={1} placeholder="번호" value={form.studentNumber}
                          onChange={e => setAssignForm(p => ({ ...p, [s.id]: { ...form, studentNumber: e.target.value } }))}
                          style={{ ...inputStyle, width: '70px' }} />
                      </td>
                      <td style={tdStyle}>
                        <button disabled={!form.classGroupId || !form.studentNumber}
                          onClick={async () => {
                            const selectedClass = classGroups.find(c => c.id === Number(form.classGroupId));
                            const confirmMsg = selectedClass
                              ? `${selectedClass.grade}학년 ${selectedClass.classNumber}반 ${form.studentNumber}번으로 배정하시겠습니까?`
                              : '배정하시겠습니까?';
                            if (!confirm(confirmMsg)) return;
                            try {
                              await client.patch(`/students/${s.id}/assign`, { classGroupId: Number(form.classGroupId), studentNumber: Number(form.studentNumber) });
                              await loadData();
                            } catch { setError('배정 실패'); }
                          }}
                          style={btnStyle('#fff', !form.classGroupId || !form.studentNumber ? '#94a3b8' : '#1e5a99')}>
                          배정
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {schoolTab === 'classes' && (classGroups.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>등록된 학급이 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', borderTop: '1px solid #f1f5f9' }}>
            {[1, 2, 3].map((grade, gi) => {
              const gradeClasses = classGroups.filter(c => c.grade === grade).sort((a, b) => a.classNumber - b.classNumber);
              return (
                <div key={grade} style={{ borderRight: gi < 2 ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ padding: '10px 16px', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e5a99' }}>{grade}학년</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '6px' }}>{gradeClasses.length}반</span>
                    </div>
                    <button onClick={() => { setAddingGrade(grade); setClassForm({ grade: String(grade), classNumber: '' }); }} style={btnStyle('#1e5a99', '#ebf4ff')}>+ 반 추가</button>
                  </div>
                  {addingGrade === grade && (
                    <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                      <input style={{ ...inputStyle, width: '60px' }} type="number" min={1} placeholder="반"
                        value={classForm.classNumber} onChange={e => setClassForm(p => ({ ...p, classNumber: e.target.value }))} />
                      <button onClick={addClass} disabled={classSaving || !classForm.classNumber} style={btnStyle('#fff', '#1e5a99')}>
                        {classSaving ? '...' : '추가'}
                      </button>
                      <button onClick={() => setAddingGrade(null)} style={btnStyle('#64748b', '#f1f5f9')}>취소</button>
                    </div>
                  )}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['반', '담임', ''].map(h => <th key={h} style={{ ...thStyle, padding: '8px 12px' }}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {gradeClasses.map(c => (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ ...tdStyle, padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{c.classNumber}반</td>
                          <td style={{ ...tdStyle, padding: '10px 8px' }}>
                            <select value={c.homeroomTeacherId ?? ''}
                              onChange={async e => {
                                const val = e.target.value;
                                const teacher = teachers.find(t => t.teacherId === Number(val));
                                const msg = teacher
                                  ? `${teacher.name}님을 ${grade}학년 ${c.classNumber}반 담임으로 지정하시겠습니까?`
                                  : `${grade}학년 ${c.classNumber}반 담임을 해제하시겠습니까?`;
                                if (!confirm(msg)) return;
                                await client.patch(`/class-groups/${c.id}/homeroom-teacher`, { teacherId: val ? Number(val) : null });
                                await loadData();
                              }}
                              style={{ ...inputStyle, width: '100%', fontSize: '12px', padding: '6px 8px' }}>
                              <option value="">미지정</option>
                              {teachers.map(t => <option key={t.teacherId} value={t.teacherId}>{t.name} ({t.email})</option>)}
                            </select>
                          </td>
                          <td style={{ ...tdStyle, padding: '10px 8px' }}>
                            <button onClick={() => deleteClass(c.id)} style={{ ...btnStyle('#c62828', '#fdecea'), padding: '4px 10px' }}>삭제</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        ))}
      </div>

    </div>
  );
}
