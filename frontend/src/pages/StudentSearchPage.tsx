import { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
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
import type { StudentDetail } from '../types/student';
import type { Feedback } from '../types/feedback';
import type { Counseling } from '../types/counseling';
import type { StudentCourseTerm } from '../types/analytics';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const YEAR = new Date().getFullYear();
const SEMESTER = new Date().getMonth() < 7 ? 1 : 2;

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' };

export function StudentSearchPage() {
  const [filters, setFilters] = useState({ grade: '', classNumber: '', name: '', contentType: 'all' });
  const [allClassGroups, setAllClassGroups] = useState<{ id: number; grade: number; classNumber: number }[]>([]);
  const [results, setResults] = useState<StudentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'grade' | 'feedback' | 'counseling'>('grade');
  const [modalFeedbacks, setModalFeedbacks] = useState<Feedback[]>([]);
  const [modalCounselings, setModalCounselings] = useState<Counseling[]>([]);
  const [modalCourses, setModalCourses] = useState<StudentCourseTerm[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

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
    setFilters({ grade: '', classNumber: '', name: '', contentType: 'all' });
    fetchStudents({});
  };

  const handleSelectStudent = (s: StudentDetail) => {
    setSelected(s);
    setActiveTab('grade');
    setModalFeedbacks([]);
    setModalCounselings([]);
    setModalCourses([]);
  };

  const handleTabChange = (tab: 'grade' | 'feedback' | 'counseling') => {
    setActiveTab(tab);
    if (!selected) return;
    if (tab === 'feedback') {
      setDetailLoading(true);
      feedbackService.getByStudent(selected.id)
        .then(setModalFeedbacks)
        .catch(() => setModalFeedbacks([]))
        .finally(() => setDetailLoading(false));
    } else if (tab === 'counseling') {
      setDetailLoading(true);
      counselingService.getShared({ studentName: selected.name })
        .then(setModalCounselings)
        .catch(() => setModalCounselings([]))
        .finally(() => setDetailLoading(false));
    } else if (tab === 'grade') {
      setDetailLoading(true);
      analyticsService.getStudentCourses(selected.id, YEAR, SEMESTER)
        .then(setModalCourses)
        .catch(() => setModalCourses([]))
        .finally(() => setDetailLoading(false));
    }
  };

  const radarData = modalCourses.length > 0 ? {
    labels: modalCourses.slice(0, 5).map(c => c.courseName ?? `과목${c.courseKey}`),
    datasets: [{
      label: '성적',
      data: modalCourses.slice(0, 5).map(c => c.avgScore ?? 0),
      backgroundColor: 'rgba(30,90,153,0.15)',
      borderColor: '#1e5a99',
      borderWidth: 2,
      pointBackgroundColor: '#1e5a99',
    }],
  } : null;

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>STUDENT SEARCH</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>학생 검색 및 조회</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '20px 24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
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
            <input type="text" placeholder="이름 입력" style={{ ...inputStyle, width: '100%' }} value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>조회 내용</label>
            <select style={{ ...inputStyle, width: '100%' }} value={filters.contentType} onChange={(e) => setFilters({ ...filters, contentType: e.target.value })}>
              {[['all','전체'],['grade','성적'],['feedback','피드백'],['counseling','상담'],['record','학생부']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
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
              <tr>{['학년/반/번호','이름','최근 성적','피드백','상담 건수',''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {results.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>검색 결과가 없습니다.</td></tr>
              )}
              {results.map((s) => (
                <tr key={s.id}>
                  <td style={{ ...tdStyle, color: '#64748b' }}>{s.grade}-{s.classNumber}-{String(s.studentNumber).padStart(2,'0')}</td>
                  <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                  <td style={tdStyle}>
                    {s.recentGradeScore != null ? (
                      <>
                        <span style={{ fontWeight: 600, color: '#1e5a99' }}>{s.recentGradeScore}점</span>
                        {s.recentGradeLevel && <span style={{ marginLeft: '6px' }}><Badge variant="primary">{s.recentGradeLevel}</Badge></span>}
                      </>
                    ) : <span style={{ color: '#94a3b8' }}>—</span>}
                  </td>
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
                  { label: '최근 성적', value: selected.recentGradeScore != null ? `${selected.recentGradeScore}점` : '—' },
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
              {([['grade','성적'],['feedback','피드백'],['counseling','상담']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => handleTabChange(tab)}
                  style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? '#1e5a99' : '#94a3b8', borderBottom: activeTab === tab ? '2px solid #1e5a99' : '2px solid transparent', marginBottom: '-2px', fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>

            {detailLoading && <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>}

            {!detailLoading && activeTab === 'grade' && (
              <div>
                {radarData ? (
                  <>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>과목별 성적 분포</p>
                    <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                      <Radar data={radarData} options={{ scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } }, plugins: { legend: { display: false } } }} />
                    </div>
                  </>
                ) : (
                  <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>성적 데이터가 없습니다. ETL 실행 후 확인하세요.</p>
                )}
              </div>
            )}

            {!detailLoading && activeTab === 'feedback' && (
              <div>
                {modalFeedbacks.length === 0 ? (
                  <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>작성된 피드백이 없습니다.</p>
                ) : modalFeedbacks.map((f) => (
                  <div key={f.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.createdAt?.slice(0, 10)} · {f.teacherName} 선생님</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, background: '#ebf4ff', color: '#1e5a99', padding: '2px 8px', borderRadius: '4px' }}>{f.category}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#334155' }}>{f.content}</p>
                  </div>
                ))}
              </div>
            )}

            {!detailLoading && activeTab === 'counseling' && (
              <div>
                {modalCounselings.length === 0 ? (
                  <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>상담 내역이 없습니다.</p>
                ) : modalCounselings.map((c) => (
                  <div key={c.id} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.counseledAt?.slice(0, 10)}</span>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{c.teacherName} 선생님</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#334155', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px' }}>{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
