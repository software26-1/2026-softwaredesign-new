import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { studentService } from '../services/studentService';
import client from '../api/client';
import { feedbackService } from '../services/feedbackService';
import { counselingService } from '../services/counselingService';
import { analyticsService } from '../services/analyticsService';
import { studentRecordService } from '../services/studentRecordService';
import type { StudentDetail } from '../types/student';
import type { Feedback, FeedbackCategory } from '../types/feedback';
import type { Counseling } from '../types/counseling';
import type { StudentCourseTerm } from '../types/analytics';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const YEAR = new Date().getFullYear();
const SEMESTER = new Date().getMonth() < 7 ? 1 : 2;
const MODAL_PAGE = 5;

const CAT_LABELS: Record<string, string> = { GRADE: '성적', BEHAVIOR: '행동', ATTENDANCE: '출결', ATTITUDE: '태도' };
const catBg: Record<string, string> = { GRADE: '#ebf4ff', BEHAVIOR: '#e8f5e9', ATTENDANCE: '#fff3e0', ATTITUDE: '#f3e5f5' };
const catColor: Record<string, string> = { GRADE: '#1e5a99', BEHAVIOR: '#2e7d32', ATTENDANCE: '#e65100', ATTITUDE: '#6a1b9a' };

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' };

export function StudentSearchPage() {
  const [filters, setFilters] = useState({ grade: '', classNumber: '', name: '' });
  const [allClassGroups, setAllClassGroups] = useState<{ id: number; grade: number; classNumber: number }[]>([]);
  const [results, setResults] = useState<StudentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentDetail | null>(null);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'grade' | 'feedback' | 'counseling' | 'record'>((searchParams.get('tab') as 'grade' | 'feedback' | 'counseling' | 'record') ?? 'grade');
  const [modalFeedbacks, setModalFeedbacks] = useState<Feedback[]>([]);
  const [modalCounselings, setModalCounselings] = useState<Counseling[]>([]);
  const [modalCourses, setModalCourses] = useState<StudentCourseTerm[]>([]);
  const [modalRecord, setModalRecord] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [courseMap, setCourseMap] = useState<Record<number, string>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [fbPage, setFbPage] = useState(1);
  const [coPage, setCoPage] = useState(1);
  const [term, setTerm] = useState<{ year: number; semester: '' | '1' | '2' }>({ year: YEAR, semester: '' });

  const effSem = term.semester ? Number(term.semester) : SEMESTER;
  // 학기 날짜 범위: 1학기 3/1~8/31, 2학기 9/1~다음해 2월
  const termRange = (year: number, sem: number): [string, string] =>
    sem === 1 ? [`${year}-03-01`, `${year}-09-01`] : [`${year}-09-01`, `${year + 1}-03-01`];
  const inTerm = (dateStr?: string) => {
    if (!term.semester) return true;
    const [start, end] = termRange(term.year, Number(term.semester));
    const d = (dateStr ?? '').slice(0, 10);
    return d >= start && d < end;
  };

  const toggleExpand = (key: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  const courseName = (key: number, fallback?: string) => courseMap[key] ?? fallback ?? `과목 ${key}`;

  useEffect(() => {
    client.get<any>('/users/me').then(r => {
      const profile = r?.data?.data ?? r?.data ?? null;
      if (profile?.schoolId) {
        client.get(`/schools/${profile.schoolId}/class-groups`)
          .then((r2: any) => {
            const list: any[] = Array.isArray(r2.data) ? r2.data : (r2.data?.data ?? []);
            setAllClassGroups(list.map((cg: any) => ({ id: cg.id, grade: cg.grade, classNumber: cg.classNumber })));
          }).catch(() => {});
      }
    }).catch(() => {});
    // 과목명 매핑(레이더/성적표에서 '과목16' 대신 실제 이름 표시)
    client.get<any>('/courses/for-class', { params: { academic_year: YEAR, semester: SEMESTER } })
      .then((r: any) => {
        const list: any[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setCourseMap(Object.fromEntries(list.map((c: any) => [c.id, c.courseName])));
      }).catch(() => {});
    studentService.search({})
      .then(res => setResults(res))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setFilters(f => ({ ...f, classNumber: '' }));
  }, [filters.grade]);

  const fetchStudents = (params: { grade?: number; classNumber?: number; name?: string }) => {
    setLoading(true);
    studentService.search(params)
      .then(res => setResults(res))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  };

  const handleSearch = () => {
    fetchStudents({
      grade: filters.grade ? Number(filters.grade) : undefined,
      classNumber: filters.classNumber ? Number(filters.classNumber) : undefined,
      name: filters.name || undefined,
    });
  };

  const handleReset = () => {
    setFilters({ grade: '', classNumber: '', name: '' });
    fetchStudents({});
  };

  const handleSelectStudent = (s: StudentDetail) => {
    setSelected(s);
    setModalFeedbacks([]);
    setModalCounselings([]);
    setModalCourses([]);
    setModalRecord(null);
    setExpanded(new Set());
    setFbPage(1);
    setCoPage(1);
    setTerm({ year: YEAR, semester: '' });
    handleTabChange('grade', s);
  };

  const byNewest = (a: string | undefined, b: string | undefined) => (b ?? '').localeCompare(a ?? '');

  const handleTabChange = (tab: 'grade' | 'feedback' | 'counseling' | 'record', student?: StudentDetail) => {
    setActiveTab(tab);
    const target = student ?? selected;
    if (!target) return;
    if (tab === 'record') {
      setDetailLoading(true);
      studentRecordService.get(target.id)
        .then(d => setModalRecord(Array.isArray(d) ? d[0] ?? null : d))
        .catch(() => setModalRecord(null))
        .finally(() => setDetailLoading(false));
    } else if (tab === 'feedback') {
      setDetailLoading(true);
      feedbackService.getByStudent(target.id)
        .then(list => setModalFeedbacks([...list].sort((a, b) => byNewest(a.createdAt, b.createdAt))))
        .catch(() => setModalFeedbacks([]))
        .finally(() => setDetailLoading(false));
    } else if (tab === 'counseling') {
      setDetailLoading(true);
      counselingService.getShared({ studentName: target.name })
        .then(list => setModalCounselings([...list].sort((a, b) => byNewest(a.counseledAt, b.counseledAt))))
        .catch(() => setModalCounselings([]))
        .finally(() => setDetailLoading(false));
    } else if (tab === 'grade') {
      setDetailLoading(true);
      analyticsService.getStudentCourses(target.id, term.year, effSem)
        .then(setModalCourses)
        .catch(() => setModalCourses([]))
        .finally(() => setDetailLoading(false));
    }
  };

  // 학기 변경 시: 성적은 해당 학기로 재조회, 피드백/상담은 클라이언트 필터(페이지 초기화)
  useEffect(() => {
    if (!selected) return;
    setFbPage(1);
    setCoPage(1);
    if (activeTab === 'grade') {
      setDetailLoading(true);
      analyticsService.getStudentCourses(selected.id, term.year, effSem)
        .then(setModalCourses)
        .catch(() => setModalCourses([]))
        .finally(() => setDetailLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term.year, term.semester]);

  const radarData = modalCourses.length > 0 ? {
    labels: modalCourses.slice(0, 6).map(c => courseName(c.courseKey, c.courseName)),
    datasets: [{
      label: '성적',
      data: modalCourses.slice(0, 6).map(c => c.avgScore ?? 0),
      backgroundColor: 'rgba(30,90,153,0.15)',
      borderColor: '#1e5a99',
      borderWidth: 2,
      pointBackgroundColor: '#1e5a99',
    }],
  } : null;

  const filteredFeedbacks = modalFeedbacks.filter(f => inTerm(f.createdAt));
  const filteredCounselings = modalCounselings.filter(c => inTerm(c.counseledAt));
  const pagedFeedbacks = filteredFeedbacks.slice((fbPage - 1) * MODAL_PAGE, fbPage * MODAL_PAGE);
  const pagedCounselings = filteredCounselings.slice((coPage - 1) * MODAL_PAGE, coPage * MODAL_PAGE);

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학생 검색 및 조회</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
          {[
            { label: '학년', key: 'grade', options: ['1','2','3'].map(v => ({ value: v, label: `${v}학년` })) },
            { label: '반', key: 'classNumber', options: allClassGroups
                .filter(cg => !filters.grade || cg.grade === Number(filters.grade))
                .map(cg => cg.classNumber)
                .filter((v, i, a) => a.indexOf(v) === i)
                .sort((a, b) => a - b)
                .map(n => ({ value: String(n), label: `${n}반` })) },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>{label}</label>
              <select
                style={{ ...inputStyle, width: '100%' }}
                value={filters[key as keyof typeof filters]}
                onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
              >
                <option value="">전체</option>
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>학생명</label>
            <input type="text" placeholder="이름 입력" style={{ ...inputStyle, width: '100%' }} value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="sm" onClick={handleSearch}>검색</Button>
          <Button size="sm" variant="secondary" onClick={handleReset}>초기화</Button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>검색 결과</h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>총 {results.length}명</span>
        </div>
        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>{['학년/반/번호','이름','피드백','상담 건수',''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>검색 결과가 없습니다.</td></tr>
              )}
              {results.map((s) => (
                <tr key={s.id}>
                  <td style={{ ...tdStyle, color: '#64748b' }}>{s.grade}-{s.classNumber}-{String(s.studentNumber).padStart(2,'0')}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                  <td style={tdStyle}>{s.feedbackCount != null ? `${s.feedbackCount}건` : '—'}</td>
                  <td style={tdStyle}>{s.counselingCount != null ? `${s.counselingCount}회` : '—'}</td>
                  <td style={tdStyle}>
                    <Button size="sm" onClick={() => handleSelectStudent(s)}>상세보기</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={!!selected} title={selected ? `${selected.name} (${selected.studentNumber}번)` : ''} onClose={() => setSelected(null)} width={700}>
        {selected && (
          <div>
            {/* 학생 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'linear-gradient(135deg, #1e3a5f 0%, #2563a8 100%)', borderRadius: '12px', marginBottom: '20px', color: '#fff' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 700, flexShrink: 0 }}>
                {selected.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{selected.name}</p>
                <p style={{ fontSize: '13px', opacity: 0.8 }}>{selected.grade}학년 {selected.classNumber}반 {selected.studentNumber}번</p>
              </div>
              <div style={{ display: 'flex', gap: '20px', textAlign: 'center' }}>
                {[
                  { label: '피드백', value: selected.feedbackCount != null ? `${selected.feedbackCount}건` : '—' },
                  { label: '상담', value: selected.counselingCount != null ? `${selected.counselingCount}회` : '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px' }}>{item.label}</p>
                    <p style={{ fontSize: '16px', fontWeight: 700 }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '2px solid #f1f5f9' }}>
              {([['grade','성적'],['feedback','피드백'],['counseling','상담'],['record','학생부']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => handleTabChange(tab)}
                  style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? '#1e5a99' : '#94a3b8', borderBottom: activeTab === tab ? '2px solid #1e5a99' : '2px solid transparent', marginBottom: '-2px', fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab !== 'record' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>학기</span>
                <select value={term.year} onChange={(e) => setTerm(t => ({ ...t, year: Number(e.target.value) }))}
                  style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }}>
                  {[YEAR, YEAR - 1, YEAR - 2].map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
                <select value={term.semester} onChange={(e) => setTerm(t => ({ ...t, semester: e.target.value as '' | '1' | '2' }))}
                  style={{ ...inputStyle, padding: '6px 10px', fontSize: '12px' }}>
                  <option value="">{activeTab === 'grade' ? `현재 학기 (${effSem}학기)` : '전체 기간'}</option>
                  <option value="1">1학기</option>
                  <option value="2">2학기</option>
                </select>
              </div>
            )}

            {detailLoading && <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>}

            {!detailLoading && activeTab === 'grade' && (
              <div>
                {radarData ? (
                  <>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>과목별 성적 분포</p>
                    <div style={{ maxWidth: '300px', margin: '0 auto 16px' }}>
                      <Radar data={radarData} options={{ scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } }, plugins: { legend: { display: false } } }} />
                    </div>
                    {/* 과목별 성적 상세표 (작게) */}
                    <p style={{ fontSize: '12px', fontWeight: 700, color: '#1a2332', marginBottom: '8px' }}>과목별 성적 ({term.year} {effSem}학기)</p>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['과목', '원점수', '반 평균', '석차', '등급'].map(h => (
                            <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '11px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...modalCourses].sort((a, b) => (b.avgScore ?? 0) - (a.avgScore ?? 0)).map(c => {
                          const isLetter = c.gradeLevel && isNaN(Number(c.gradeLevel));
                          return (
                            <tr key={c.courseKey} style={{ borderBottom: '1px solid #f8fafc' }}>
                              <td style={{ padding: '7px 10px', fontWeight: 600 }}>{courseName(c.courseKey, c.courseName)}</td>
                              <td style={{ padding: '7px 10px', fontWeight: 700, color: '#1e5a99' }}>{c.avgScore?.toFixed(1) ?? '-'}</td>
                              <td style={{ padding: '7px 10px', color: '#64748b' }}>{c.classAvgScore?.toFixed(1) ?? '-'}</td>
                              <td style={{ padding: '7px 10px', color: '#64748b' }}>{c.classRank != null ? `${c.classRank}위` : '-'}</td>
                              <td style={{ padding: '7px 10px' }}>
                                {c.gradeLevel ? (
                                  <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: '10px', fontSize: '10px', fontWeight: 700, background: isLetter ? '#e8f5e9' : '#ebf4ff', color: isLetter ? '#2e7d32' : '#1e5a99' }}>
                                    {isLetter ? c.gradeLevel : `${c.gradeLevel}등급`}
                                  </span>
                                ) : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>성적 데이터가 없습니다. ETL 실행 후 확인하세요.</p>
                )}
              </div>
            )}

            {!detailLoading && activeTab === 'feedback' && (
              <div>
                {filteredFeedbacks.length === 0 ? (
                  <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{term.semester ? '해당 학기에 작성된 피드백이 없습니다.' : '작성된 피드백이 없습니다.'}</p>
                ) : (
                  <>
                    {pagedFeedbacks.map((f) => {
                      const key = `fb-${f.id}`;
                      const long = (f.content?.length ?? 0) > 60;
                      const open = expanded.has(key);
                      const cat = f.category as FeedbackCategory;
                      return (
                        <div key={f.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.createdAt?.slice(0, 10)} · {f.teacherName} 선생님</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, background: catBg[cat] ?? '#ebf4ff', color: catColor[cat] ?? '#1e5a99', padding: '2px 8px', borderRadius: '4px' }}>{CAT_LABELS[cat] ?? cat}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap', ...(long && !open ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties : {}) }}>{f.content}</p>
                          {long && (
                            <button onClick={() => toggleExpand(key)} style={{ marginTop: '4px', background: 'none', border: 'none', color: '#1e5a99', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>
                              {open ? '접기' : '더보기'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <Pagination page={fbPage} totalItems={filteredFeedbacks.length} pageSize={MODAL_PAGE} onChange={setFbPage} />
                  </>
                )}
              </div>
            )}

            {!detailLoading && activeTab === 'counseling' && (
              <div>
                {filteredCounselings.length === 0 ? (
                  <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{term.semester ? '해당 학기 상담 내역이 없습니다.' : '상담 내역이 없습니다.'}</p>
                ) : (
                  <>
                    {pagedCounselings.map((c) => {
                      const key = `co-${c.id}`;
                      const long = (c.content?.length ?? 0) > 60;
                      const open = expanded.has(key);
                      return (
                        <div key={c.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', gap: '12px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.counseledAt?.slice(0, 10)}</span>
                            <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{c.teacherName} 선생님</span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#334155', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', whiteSpace: 'pre-wrap', ...(long && !open ? { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties : {}) }}>{c.content}</p>
                          {long && (
                            <button onClick={() => toggleExpand(key)} style={{ marginTop: '4px', background: 'none', border: 'none', color: '#1e5a99', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: "'Noto Sans KR', sans-serif" }}>
                              {open ? '접기' : '더보기'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                    <Pagination page={coPage} totalItems={filteredCounselings.length} pageSize={MODAL_PAGE} onChange={setCoPage} />
                  </>
                )}
              </div>
            )}

            {!detailLoading && activeTab === 'record' && (
              <div>
                {!modalRecord ? (
                  <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>작성된 학생부 기록이 없습니다.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {([['특기사항 / 성취', modalRecord.achievements], ['비교과 활동', modalRecord.extracurricular], ['진로 희망', modalRecord.careerAspirations], ['봉사 시간', modalRecord.volunteerHours != null ? `${modalRecord.volunteerHours}h` : null]] as const).map(([label, val]) => (
                      <div key={label}>
                        <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>{label}</p>
                        <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.7', padding: '12px 14px', background: '#f8fafc', borderRadius: '6px' }}>{val || '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
