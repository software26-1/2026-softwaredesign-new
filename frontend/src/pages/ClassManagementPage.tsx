import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import client from '../api/client';

const YEAR = new Date().getFullYear();
const SEMESTER = new Date().getMonth() < 7 ? 1 : 2;

const thStyle: React.CSSProperties = { padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '11px 16px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' };

type Tab = 'students' | 'courses' | 'approvals' | 'transfer';

type MoveType = 'transfer' | 'class-change';

interface MoveModal {
  student: any;
  step: 'choose' | 'transfer-school' | 'transfer-detail' | 'class-change';
}

function TransferTab({ classGroupId, students, schoolId }: {
  classGroupId: number;
  students: any[];
  schoolId: number;
}) {
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [msgOk, setMsgOk] = useState(true);

  const [moveModal, setMoveModal] = useState<MoveModal | null>(null);

  const [schoolSearch, setSchoolSearch] = useState('');
  const [schoolResults, setSchoolResults] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any | null>(null);
  const [transferDetail, setTransferDetail] = useState('');
  const [schoolSearching, setSchoolSearching] = useState(false);

  const [classGroups, setClassGroups] = useState<any[]>([]);
  const [selectedClassGroup, setSelectedClassGroup] = useState<any | null>(null);
  const [classGroupsLoading, setClassGroupsLoading] = useState(false);

  const showMsg = (text: string, ok = true) => {
    setMsg(text); setMsgOk(ok);
    setTimeout(() => setMsg(''), 4000);
  };

  const loadIncoming = () => {
    client.get<any[]>('/approval-requests/class')
      .then(r => {
        const all = Array.isArray(r.data) ? r.data : [];
        setIncomingRequests(all.filter((a: any) => a.requestType === 'CLASS_CHANGE'));
      }).catch(() => setIncomingRequests([]));
  };

  useEffect(() => { loadIncoming(); }, [classGroupId]);

  const processIncoming = async (id: number, approve: boolean) => {
    try {
      await client.post(`/approval-requests/${id}/process-class?approve=${approve}`);
      loadIncoming();
      showMsg(approve ? '승인 완료. 학생 반이 변경되었습니다.' : '거절 완료.', approve);
    } catch { showMsg('처리에 실패했습니다.', false); }
  };

  const openMoveModal = (student: any) => {
    setMoveModal({ student, step: 'choose' });
    setSchoolSearch(''); setSchoolResults([]); setSelectedSchool(null); setTransferDetail('');
    setSelectedClassGroup(null); setClassGroups([]);
  };

  const closeMoveModal = () => setMoveModal(null);

  const searchSchools = async () => {
    if (!schoolSearch.trim()) return;
    setSchoolSearching(true);
    try {
      const r = await client.get<any[]>('/schools');
      const list = Array.isArray(r.data) ? r.data : [];
      setSchoolResults(list.filter((s: any) => s.schoolName?.includes(schoolSearch.trim())));
    } catch { setSchoolResults([]); }
    finally { setSchoolSearching(false); }
  };

  const loadClassGroups = async () => {
    if (!schoolId) return;
    setClassGroupsLoading(true);
    try {
      const r = await client.get<any[]>(`/schools/${schoolId}/class-groups`);
      const list = Array.isArray(r.data) ? r.data : [];
      setClassGroups(list.filter((cg: any) => cg.id !== classGroupId).sort((a: any, b: any) => (a.grade - b.grade) || (a.classNumber - b.classNumber)));
    } catch { setClassGroups([]); }
    finally { setClassGroupsLoading(false); }
  };

  const submitTransfer = async () => {
    if (!moveModal || !selectedSchool) return;
    try {
      await client.post(
        `/approval-requests/student-transfer?studentId=${moveModal.student.id}&toSchoolId=${selectedSchool.id}&detail=${encodeURIComponent(transferDetail)}`
      );
      showMsg(`${moveModal.student.name} 전학 신청이 완료되었습니다. 양쪽 학교 관리자의 승인을 기다립니다.`);
      closeMoveModal();
    } catch (e: any) {
      showMsg(e?.response?.data?.message ?? '전학 신청에 실패했습니다.', false);
    }
  };

  const submitClassChange = async () => {
    if (!moveModal || !selectedClassGroup) return;
    try {
      await client.post(
        `/approval-requests/class-change?studentId=${moveModal.student.id}&toClassGroupId=${selectedClassGroup.id}`
      );
      showMsg(`${moveModal.student.name} 학급 이동 신청이 완료되었습니다. 목적지 반 담임의 승인을 기다립니다.`);
      loadIncoming();
      closeMoveModal();
    } catch (e: any) {
      showMsg(e?.response?.data?.message ?? '학급 이동 신청에 실패했습니다.', false);
    }
  };

  const sectionBox: React.CSSProperties = {
    background: '#f8fafc', borderRadius: '10px', padding: '16px 20px',
    marginBottom: '20px', border: '1px solid #e8ecf0',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px',
  };

  const renderModalContent = () => {
    if (!moveModal) return null;
    const { student, step } = moveModal;

    if (step === 'choose') {
      return (
        <div>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            <strong style={{ color: '#1e293b' }}>{student.name}</strong> 학생의 이동 유형을 선택하세요.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setMoveModal({ student, step: 'transfer-school' })}
              style={{ flex: 1, minWidth: '140px', padding: '20px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: "'Noto Sans KR', sans-serif" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1B3A7A'; (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#fff'; }}
            >
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1B3A7A', marginBottom: '6px' }}>전학</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>다른 학교로 전학 신청<br/>양쪽 학교 관리자 승인 필요</div>
            </button>
            <button
              onClick={() => { setMoveModal({ student, step: 'class-change' }); loadClassGroups(); }}
              style={{ flex: 1, minWidth: '140px', padding: '20px 16px', border: '2px solid #e2e8f0', borderRadius: '10px', background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: "'Noto Sans KR', sans-serif" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#F4A000'; (e.currentTarget as HTMLElement).style.background = '#fffbf0'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#fff'; }}
            >
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#F4A000', marginBottom: '6px' }}>학급 이동</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>같은 학교 내 다른 반으로<br/>목적지 담임교사 승인 필요</div>
            </button>
          </div>
        </div>
      );
    }

    if (step === 'transfer-school') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            <strong style={{ color: '#1e293b' }}>{student.name}</strong> 학생이 전학 갈 학교를 검색하세요.
          </p>
          <div>
            <label style={labelStyle}>학교 검색</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={schoolSearch}
                onChange={e => setSchoolSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchSchools()}
                placeholder="학교 이름 입력"
                style={{ ...inputStyle, flex: 1 }}
              />
              <Button size="sm" onClick={searchSchools}>{schoolSearching ? '...' : '검색'}</Button>
            </div>
          </div>
          {schoolResults.length > 0 && (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxHeight: '180px', overflowY: 'auto' }}>
              {schoolResults.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => { setSelectedSchool(s); setMoveModal({ student, step: 'transfer-detail' }); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedSchool?.id === s.id ? '#ebf4ff' : '#fff' }}
                  onMouseEnter={e => { if (selectedSchool?.id !== s.id) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (selectedSchool?.id !== s.id) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                >
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#1a2332' }}>{s.schoolName}</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{s.schoolType === 'MIDDLE' ? '중학교' : '고등학교'}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button size="sm" variant="secondary" onClick={closeMoveModal}>취소</Button>
          </div>
        </div>
      );
    }

    if (step === 'transfer-detail') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#ebf4ff', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#1e5a99' }}>
            목적지 학교: <strong>{selectedSchool?.schoolName}</strong>
          </div>
          <div>
            <label style={labelStyle}>전학 사유 (선택)</label>
            <textarea
              value={transferDetail}
              onChange={e => setTransferDetail(e.target.value)}
              placeholder="전학 사유를 입력하세요"
              rows={3}
              style={{ ...inputStyle, width: '100%', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button size="sm" variant="secondary" onClick={() => setMoveModal({ student, step: 'transfer-school' })}>이전</Button>
            <Button size="sm" onClick={submitTransfer}>전학 신청</Button>
          </div>
        </div>
      );
    }

    if (step === 'class-change') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            <strong style={{ color: '#1e293b' }}>{student.name}</strong> 학생이 이동할 반을 선택하세요.
          </p>
          {classGroupsLoading ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>반 목록 불러오는 중...</p>
          ) : classGroups.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '13px' }}>같은 학교에 이동 가능한 반이 없습니다.</p>
          ) : (
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', maxHeight: '220px', overflowY: 'auto' }}>
              {classGroups.map((cg: any) => (
                <div
                  key={cg.id}
                  onClick={() => setSelectedClassGroup(cg)}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedClassGroup?.id === cg.id ? '#fffbf0' : '#fff', borderLeft: selectedClassGroup?.id === cg.id ? '3px solid #F4A000' : '3px solid transparent' }}
                  onMouseEnter={e => { if (selectedClassGroup?.id !== cg.id) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                  onMouseLeave={e => { if (selectedClassGroup?.id !== cg.id) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                >
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#1a2332' }}>{cg.grade}학년 {cg.classNumber}반</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{cg.teacherName ? `담임: ${cg.teacherName}` : '담임 미지정'}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button size="sm" variant="secondary" onClick={closeMoveModal}>취소</Button>
            <Button size="sm" onClick={submitClassChange} disabled={!selectedClassGroup}>이동 신청</Button>
          </div>
        </div>
      );
    }

    return null;
  };

  const modalTitle = () => {
    if (!moveModal) return '';
    const { step } = moveModal;
    if (step === 'choose') return '학생 이동 유형 선택';
    if (step === 'transfer-school') return '전학 - 목적지 학교 검색';
    if (step === 'transfer-detail') return '전학 - 신청 확인';
    if (step === 'class-change') return '학급 이동 - 목적지 반 선택';
    return '';
  };

  return (
    <div>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
        전학은 양쪽 학교 관리자 승인이 필요하며, 학급 이동은 목적지 반 담임교사의 승인이 필요합니다.
      </p>

      {msg && (
        <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', background: msgOk ? '#e8f5e9' : '#fdecea', color: msgOk ? '#2e7d32' : '#c62828' }}>{msg}</div>
      )}

      <div style={sectionBox}>
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332', marginBottom: '12px' }}>
          내 반 학생 이동 신청
          <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '8px', fontSize: '12px' }}>
            학생을 클릭하면 전학 또는 학급 이동을 신청할 수 있습니다.
          </span>
        </p>
        {students.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>반에 배정된 학생이 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {students.map((s: any) => (
              <button
                key={s.id}
                onClick={() => openMoveModal(s)}
                style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '13px', color: '#1e293b', fontFamily: "'Noto Sans KR', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1B3A7A'; (e.currentTarget as HTMLElement).style.background = '#f0f4ff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.background = '#fff'; }}
              >
                <span style={{ color: '#94a3b8', fontSize: '11px' }}>{String(s.studentNumber).padStart(2, '0')}</span>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332', marginBottom: '10px' }}>
        대기 중인 학급 이동 승인 요청
        <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: '8px', fontSize: '12px' }}>
          다른 반에서 내 반으로 이동 신청한 학생 목록
        </span>
      </p>
      {incomingRequests.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e8ecf0' }}>
          대기 중인 학급 이동 신청이 없습니다.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['학생 이름', '이동 내용', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {incomingRequests.map(r => {
                const detail = r.requestDetail ?? '';
                const toGrade = detail.match(/학년:(\d+)/)?.[1];
                const toClass = detail.match(/반:(\d+)/)?.[1];
                const toSchoolName = detail.match(/학교:([^|]+)/)?.[1];
                const detailText = toGrade && toClass
                  ? `→ ${toSchoolName ? toSchoolName + ' ' : ''}${toGrade}학년 ${toClass}반`
                  : detail;
                return (
                  <tr key={r.id}>
                    <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{r.requesterName}</td>
                    <td style={{ ...tdStyle, color: '#64748b', fontSize: '12px' }}>{detailText}</td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button size="sm" onClick={() => processIncoming(r.id, true)}>승인</Button>
                        <Button size="sm" variant="secondary" onClick={() => processIncoming(r.id, false)}>거절</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={!!moveModal} title={modalTitle()} onClose={closeMoveModal} width={480}>
        {renderModalContent()}
      </Modal>
    </div>
  );
}

export function ClassManagementPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) ?? 'students');
  const [classGroupId, setClassGroupId] = useState<number>(0);
  const [classGroupName, setClassGroupName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [schoolId, setSchoolId] = useState<number>(0);
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [enrollmentMap, setEnrollmentMap] = useState<Record<number, { enrollmentId: number; studentId: number }[]>>({});
  const [loading, setLoading] = useState(false);

  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ name: '', studentNumber: '' });

  const [parentStudent, setParentStudent] = useState<any | null>(null);
  const [parentSearch, setParentSearch] = useState('');
  const [parentResults, setParentResults] = useState<any[]>([]);
  const [linkedParents, setLinkedParents] = useState<any[]>([]);
  const [parentMsg, setParentMsg] = useState('');

  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [courseEnrolled, setCourseEnrolled] = useState<any[]>([]);
  const [enrollMsg, setEnrollMsg] = useState('');

  const [approvals, setApprovals] = useState<any[]>([]);
  const [approvalMsg, setApprovalMsg] = useState('');

  useEffect(() => {
    client.get<any>('/users/me').then(r => {
      const profile = r?.data?.data ?? r?.data ?? null;
      if (profile?.classGroupId) {
        setClassGroupId(profile.classGroupId);
        setClassGroupName(profile.classGroupName ?? '');
      }
      if (profile?.schoolName) setSchoolName(profile.schoolName);
      if (profile?.schoolId) setSchoolId(profile.schoolId);
    }).catch(() => {});
  }, []);

  const loadStudents = useCallback(() => {
    if (!classGroupId) return;
    setLoading(true);
    client.get<any[]>(`/students`, { params: { class_group_id: classGroupId } })
      .then(r => setStudents(Array.isArray(r.data) ? r.data.sort((a, b) => a.studentNumber - b.studentNumber) : []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [classGroupId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const loadCourses = useCallback(() => {
    if (!classGroupId) return;
    const gradeNum = parseInt(classGroupName) || 1;
    client.get<any[]>('/courses/for-class', { params: { academic_year: YEAR, semester: SEMESTER, grade: gradeNum } })
      .then(async r => {
        const list: any[] = Array.isArray(r.data) ? r.data : [];
        setCourses(list);
        const map: Record<number, { enrollmentId: number; studentId: number }[]> = {};
        await Promise.all(list.map(async c => {
          const er = await client.get<any[]>(`/courses/${c.id}/enrollments`).catch(() => ({ data: [] }));
          const enrolled = (Array.isArray(er.data) ? er.data : [])
            .filter((e: any) => students.some(s => s.id === e.studentId))
            .map((e: any) => ({ enrollmentId: e.id, studentId: e.studentId }));
          map[c.id] = enrolled;
        }));
        setEnrollmentMap(map);
      }).catch(() => {});
  }, [classGroupId, students]);

  useEffect(() => { if (students.length > 0) loadCourses(); }, [loadCourses, students]);

  useEffect(() => { if (tab === 'approvals') loadApprovals(); }, [tab]);

  const loadApprovals = () => {
    client.get<any[]>('/approval-requests/class')
      .then(r => setApprovals(Array.isArray(r.data) ? r.data : []))
      .catch(() => setApprovals([]));
  };

  const processApproval = async (id: number, approve: boolean) => {
    try {
      await client.post(`/approval-requests/${id}/process-class?approve=${approve}`);
      setApprovals(prev => prev.filter(a => a.id !== id));
      setApprovalMsg(approve ? '승인 완료. 학생이 반에 배정되었습니다.' : '거절되었습니다.');
      if (approve) loadStudents();
      setTimeout(() => setApprovalMsg(''), 4000);
    } catch { setApprovalMsg('처리에 실패했습니다.'); }
  };

  const openEdit = (s: any) => {
    setEditStudent(s);
    setEditForm({ name: s.name, studentNumber: String(s.studentNumber) });
  };

  const saveStudent = async () => {
    if (!editStudent) return;
    const newNum = Number(editForm.studentNumber);
    const duplicate = students.find(s => s.id !== editStudent.id && s.studentNumber === newNum);
    if (duplicate) { alert(`${newNum}번은 이미 ${duplicate.name} 학생이 사용 중입니다.`); return; }
    try {
      await client.patch(`/students/${editStudent.id}`, { name: editForm.name, studentNumber: newNum });
      setStudents(prev => prev.map(s => s.id === editStudent.id
        ? { ...s, name: editForm.name, studentNumber: Number(editForm.studentNumber) }
        : s).sort((a, b) => a.studentNumber - b.studentNumber));
      setEditStudent(null);
    } catch { alert('저장에 실패했습니다.'); }
  };

  const openParentModal = async (s: any) => {
    setParentStudent(s);
    setParentSearch(''); setParentResults([]); setParentMsg('');
    const r = await client.get<any[]>(`/students/${s.id}/parents`).catch(() => ({ data: [] }));
    setLinkedParents(Array.isArray(r.data) ? r.data : []);
  };

  const searchParents = async () => {
    if (!parentSearch.trim()) return;
    const r = await client.get<any[]>('/parents/search', { params: { name: parentSearch, schoolName } }).catch(() => ({ data: [] }));
    setParentResults(Array.isArray(r.data) ? r.data : []);
  };

  const linkParent = async (parentId: number) => {
    if (!parentStudent) return;
    try {
      await client.post('/parent-students', { parentId, studentId: parentStudent.id, relationship: 'GUARDIAN' });
      const r = await client.get<any[]>(`/students/${parentStudent.id}/parents`);
      setLinkedParents(Array.isArray(r.data) ? r.data : []);
      setParentMsg('연결 완료');
      setTimeout(() => setParentMsg(''), 3000);
    } catch { setParentMsg('이미 연결된 학부모이거나 실패했습니다.'); }
  };

  const unlinkParent = async (mappingId: number) => {
    try {
      await client.delete(`/parent-students/${mappingId}`);
      setLinkedParents(prev => prev.filter((p: any) => p.mappingId !== mappingId));
    } catch { alert('삭제에 실패했습니다.'); }
  };

  const openCourseModal = (c: any) => {
    setSelectedCourse(c);
    setCourseEnrolled(enrollmentMap[c.id] ?? []);
    setEnrollMsg('');
  };

  const toggleEnroll = async (studentId: number) => {
    if (!selectedCourse) return;
    const existing = courseEnrolled.find(e => e.studentId === studentId);
    try {
      if (existing) {
        await client.delete(`/enrollments/${existing.enrollmentId}`);
        setCourseEnrolled(prev => prev.filter(e => e.studentId !== studentId));
        setEnrollmentMap(prev => ({ ...prev, [selectedCourse.id]: (prev[selectedCourse.id] ?? []).filter(e => e.studentId !== studentId) }));
      } else {
        const r = await client.post<any>(`/courses/${selectedCourse.id}/enrollments`, { studentId });
        const newEntry = { enrollmentId: r.data?.id ?? r.data?.data?.id, studentId };
        setCourseEnrolled(prev => [...prev, newEntry]);
        setEnrollmentMap(prev => ({ ...prev, [selectedCourse.id]: [...(prev[selectedCourse.id] ?? []), newEntry] }));
      }
    } catch { setEnrollMsg('처리에 실패했습니다.'); }
  };

  const enrollAllStudents = async () => {
    if (!selectedCourse) return;
    const toAdd = students.filter(s => !courseEnrolled.some(e => e.studentId === s.id));
    for (const s of toAdd) await toggleEnroll(s.id);
    setEnrollMsg(`전원 배정 완료`);
    setTimeout(() => setEnrollMsg(''), 3000);
  };

  const TabBtn = ({ id, label }: { id: Tab; label: string }) => (
    <button onClick={() => setTab(id)} style={{
      padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer',
      fontSize: '13px', fontWeight: tab === id ? 700 : 400,
      color: tab === id ? '#1e5a99' : '#94a3b8',
      borderBottom: tab === id ? '2px solid #1e5a99' : '2px solid transparent',
      marginBottom: '-2px', fontFamily: "'Noto Sans KR', sans-serif",
      whiteSpace: 'nowrap',
    }}>{label}</button>
  );

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .cm-tab-row { overflow-x: auto; }
          .cm-student-grid { grid-template-columns: 1fr !important; }
          .cm-student-table-wrap { overflow-x: auto; }
          .cm-course-table-wrap { overflow-x: auto; }
          .cm-approval-table-wrap { overflow-x: auto; }
          .cm-enroll-grid { grid-template-columns: 1fr !important; }
          .cm-pad { padding: 16px !important; }
        }
      `}</style>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>
          학급 관리 {classGroupName && <span style={{ fontSize: '16px', fontWeight: 500, color: '#94a3b8', marginLeft: '10px' }}>{classGroupName}</span>}
        </h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div className="cm-tab-row" style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', padding: '0 24px', overflowX: 'auto' }}>
          <TabBtn id="students" label="학생 명단" />
          <TabBtn id="courses" label="과목 배정" />
          <TabBtn id="approvals" label={`가입 승인${approvals.length > 0 ? ` (${approvals.length})` : ''}`} />
          <TabBtn id="transfer" label="학생 이동" />
        </div>

        <div className="cm-pad" style={{ padding: '24px' }}>
          {/* 학생 명단 */}
          {tab === 'students' && (
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>총 {students.length}명</p>
              {loading ? <p style={{ color: '#94a3b8' }}>불러오는 중...</p> : (
                <div className="cm-student-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                  {[students.slice(0, Math.ceil(students.length / 2)), students.slice(Math.ceil(students.length / 2))].map((half, hi) => (
                    <div key={hi} className="cm-student-table-wrap">
                      <table style={{ width: 'auto', minWidth: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>
                          <th style={{ ...thStyle, width: '44px' }}>번호</th>
                          <th style={{ ...thStyle, width: '90px' }}>이름</th>
                          <th style={{ ...thStyle, width: '64px' }}>피드백</th>
                          <th style={{ ...thStyle, width: '64px' }}>상담</th>
                          <th style={{ ...thStyle, width: '150px' }}></th>
                        </tr></thead>
                        <tbody>
                          {half.map(s => (
                            <tr key={s.id}>
                              <td style={{ ...tdStyle, color: '#94a3b8' }}>{String(s.studentNumber).padStart(2, '0')}</td>
                              <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                              <td style={tdStyle}>{s.feedbackCount != null ? `${s.feedbackCount}건` : '—'}</td>
                              <td style={tdStyle}>{s.counselingCount != null ? `${s.counselingCount}회` : '—'}</td>
                              <td style={{ ...tdStyle }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>수정</Button>
                                  <Button size="sm" variant="secondary" onClick={() => openParentModal(s)}>학부모</Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 과목 배정 */}
          {tab === 'courses' && (
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>{YEAR}학년도 {SEMESTER}학기 · 과목을 클릭하면 학생별 수강 배정을 관리합니다.</p>
              <div className="cm-course-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['과목명', '학년', '평가방식', '수강 인원', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody>
                    {courses.length === 0 && <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>개설된 과목이 없습니다.</td></tr>}
                    {courses.map(c => {
                      const enrolled = (enrollmentMap[c.id] ?? []).filter(e => students.some(s => s.id === e.studentId));
                      return (
                        <tr key={c.id} style={{ cursor: 'pointer' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background = '')}>
                          <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{c.courseName}</td>
                          <td style={tdStyle}>{c.grade}학년</td>
                          <td style={tdStyle}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, background: c.evaluationType === 'ABSOLUTE' ? '#e8f5e9' : '#ebf4ff', color: c.evaluationType === 'ABSOLUTE' ? '#2e7d32' : '#1e5a99' }}>
                              {c.evaluationType === 'ABSOLUTE' ? 'A~E' : '1~9등급'}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 600, color: '#1a2332' }}>{enrolled.length}/{students.length}명</span>
                          </td>
                          <td style={tdStyle}><Button size="sm" variant="secondary" onClick={() => openCourseModal(c)}>배정 관리</Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 가입 승인 */}
          {tab === 'approvals' && (
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>우리 반으로 가입 신청한 학생·학부모</p>
              {approvalMsg && <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', background: approvalMsg.includes('완료') ? '#e8f5e9' : '#fdecea', color: approvalMsg.includes('완료') ? '#2e7d32' : '#c62828' }}>{approvalMsg}</div>}
              {approvals.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <p>대기 중인 가입 신청이 없습니다.</p>
                </div>
              ) : (
                <div className="cm-approval-table-wrap">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['유형', '이름', '이메일', '신청 내용', ''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                    <tbody>
                      {approvals.map(a => {
                        const isStudent = a.requestType === 'STUDENT_REGISTRATION';
                        const detail = a.requestDetail ?? '';
                        const grade = detail.match(/학년:(\d+)/)?.[1];
                        const classNum = detail.match(/반:(\d+)/)?.[1];
                        const num = detail.match(/번호:(\d+)/)?.[1];
                        return (
                          <tr key={a.id}>
                            <td style={tdStyle}>
                              <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: isStudent ? '#ebf4ff' : '#f3e5f5', color: isStudent ? '#1e5a99' : '#6a1b9a' }}>
                                {isStudent ? '학생' : '학부모'}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{a.requesterName}</td>
                            <td style={{ ...tdStyle, color: '#64748b', fontSize: '12px' }}>{a.requesterEmail}</td>
                            <td style={{ ...tdStyle, color: '#64748b', fontSize: '12px' }}>
                              {grade && classNum ? `${grade}학년 ${classNum}반 ${num ? num + '번' : ''}` : detail}
                            </td>
                            <td style={{ ...tdStyle }}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <Button size="sm" onClick={() => processApproval(a.id, true)}>승인</Button>
                                <Button size="sm" variant="secondary" onClick={() => processApproval(a.id, false)}>거절</Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 학생 이동 */}
          {tab === 'transfer' && (
            <TransferTab classGroupId={classGroupId} students={students} schoolId={schoolId} />
          )}
        </div>
      </div>

      {/* 학생 수정 모달 */}
      <Modal isOpen={!!editStudent} title={editStudent ? `${editStudent.name} 정보 수정` : ''} onClose={() => setEditStudent(null)} width={400}>
        {editStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>이름</label>
                <input style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>번호</label>
                <input type="number" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} value={editForm.studentNumber} onChange={e => setEditForm({ ...editForm, studentNumber: e.target.value })} />
              </div>
            </div>
            <Button size="sm" onClick={saveStudent}>저장</Button>
          </div>
        )}
      </Modal>

      {/* 학부모 연결 모달 */}
      <Modal isOpen={!!parentStudent} title={parentStudent ? `${parentStudent.name} 학부모 관리` : ''} onClose={() => setParentStudent(null)} width={500}>
        {parentStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332', marginBottom: '10px' }}>연결된 학부모</p>
              {linkedParents.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>연결된 학부모가 없습니다. 학부모가 가입 신청하면 가입 승인 탭에서 처리됩니다.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {linkedParents.map((p: any) => (
                    <div key={p.mappingId ?? p.parentId} style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a2332' }}>{p.parentName}</span>
                          {p.relationship && <span style={{ fontSize: '11px', marginLeft: '8px', padding: '1px 7px', borderRadius: '10px', background: '#ebf4ff', color: '#1e5a99', fontWeight: 600 }}>
                            {({'FATHER':'아버지','MOTHER':'어머니','GUARDIAN':'보호자'} as any)[p.relationship] ?? p.relationship}
                          </span>}
                          <div style={{ marginTop: '4px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {p.parentEmail && <span style={{ fontSize: '12px', color: '#64748b' }}>{p.parentEmail}</span>}
                            {p.parentPhone && <span style={{ fontSize: '12px', color: '#64748b' }}>{p.parentPhone}</span>}
                          </div>
                        </div>
                        <button onClick={() => unlinkParent(p.mappingId ?? p.id)} style={{ background: 'none', border: '1px solid #fca5a5', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: '#c62828', cursor: 'pointer', flexShrink: 0 }}>연결 해제</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#1a2332', marginBottom: '4px' }}>직접 연결 <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>(이미 가입된 학부모 계정 연결)</span></p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="학부모 이름 검색" value={parentSearch}
                  onChange={e => setParentSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchParents()} />
                <Button size="sm" variant="secondary" onClick={searchParents}>검색</Button>
              </div>
              {parentResults.length > 0 && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  {parentResults.map(p => (
                    <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: '#1a2332' }}>{p.name}</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '8px' }}>{p.email}</span>
                      </div>
                      <Button size="sm" onClick={() => linkParent(p.parentId)}>연결</Button>
                    </div>
                  ))}
                </div>
              )}
              {parentMsg && <p style={{ fontSize: '13px', marginTop: '8px', color: parentMsg.includes('완료') ? '#2e7d32' : '#c62828' }}>{parentMsg}</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* 과목 배정 모달 */}
      <Modal isOpen={!!selectedCourse} title={selectedCourse ? `${selectedCourse.courseName} 수강 배정` : ''} onClose={() => setSelectedCourse(null)} width={480}>
        {selectedCourse && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '13px', color: '#64748b' }}>수강: {courseEnrolled.length}/{students.length}명</p>
              <Button size="sm" variant="secondary" onClick={enrollAllStudents}>전원 배정</Button>
            </div>
            {enrollMsg && <p style={{ fontSize: '13px', color: '#2e7d32', marginBottom: '10px' }}>{enrollMsg}</p>}
            <div className="cm-enroll-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {students.map(s => {
                const enrolled = courseEnrolled.some(e => e.studentId === s.id);
                return (
                  <div key={s.id} onClick={() => toggleEnroll(s.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: enrolled ? '#ebf4ff' : '#f8fafc', border: `1px solid ${enrolled ? '#bfdbfe' : '#e2e8f0'}`, transition: 'all 0.1s' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: enrolled ? '#1e5a99' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {enrolled && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: enrolled ? 600 : 400, color: enrolled ? '#1e5a99' : '#475569' }}>
                      {String(s.studentNumber).padStart(2, '0')} {s.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
