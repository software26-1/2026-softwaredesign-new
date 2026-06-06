import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { User, Teacher } from '../../types/user';
import { analyticsService } from '../../services/analyticsService';
import type { ClassCourseStats, AtRiskStudent } from '../../types/analytics';
import client from '../../api/client';

interface Props { user: User }

const YEAR = new Date().getFullYear();
const SEMESTER = new Date().getMonth() < 7 ? 1 : 2;

export function TeacherDashboard({ user }: Props) {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [teacher, setTeacher] = useState<Teacher>(user as Teacher);
  const [students, setStudents] = useState<any[]>([]);
  const [classCourses, setClassCourses] = useState<ClassCourseStats[]>([]);
  const [, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [courseMap, setCourseMap] = useState<Record<number, string>>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [schoolName, setSchoolName] = useState<string | null>(null);
  const [totalStudents, setTotalStudents] = useState<number | null>(null);
  const [totalClasses, setTotalClasses] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const r = await client.get<any>('/users/me').catch(() => null);
      const profile = r?.data?.data ?? r?.data ?? null;
      const cg = profile?.classGroupId ?? (user as any).classGroupId ?? null;
      const schoolId = profile?.schoolId ?? (user as any).schoolId ?? null;

      if (profile) {
        const updated = { ...user, ...profile };
        setTeacher(updated as Teacher);
        updateUser(profile);
      }

      if (cg) {
        const sr = await client.get<any>(`/students?class_group_id=${cg}`).catch(() => null);
        if (sr?.data) {
          setStudents(Array.isArray(sr.data) ? sr.data : (sr.data?.data ?? []));
        }
        analyticsService.getClassCourses(cg, YEAR, SEMESTER).then(setClassCourses).catch(() => {});
        analyticsService.getClassAtRisk(cg, YEAR, SEMESTER).then(setAtRisk).catch(() => {});
        client.get(`/courses/for-class`, { params: { academic_year: YEAR, semester: SEMESTER } })
          .then((r: any) => {
            const list: any[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
            setCourseMap(Object.fromEntries(list.map((c: any) => [c.id, c.courseName])));
          }).catch(() => {});
      } else {
        if (schoolId) {
          client.get<any>('/schools').then(res => {
            const list: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
            const school = list.find((s: any) => s.id === schoolId);
            if (school) setSchoolName(school.schoolName ?? school.name ?? null);
          }).catch(() => {});
        }
        client.get<any>('/students').then(res => {
          const list: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          setTotalStudents(list.length);
        }).catch(() => {});
        client.get<any>('/class-groups').then(res => {
          const list: any[] = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
          setTotalClasses(list.length);
        }).catch(() => {});
      }
    };
    load();
    client.get<any>('/notifications').then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      setUnreadCount(data.filter((n: any) => !(n.isRead ?? n.read ?? false)).length);
    }).catch(() => {});
  }, []);

  const classGroupName = (teacher as any).classGroupName;
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div>
      <style>{`
        @media (max-width: 768px) {
          .teacher-banner { flex-direction: column !important; height: auto !important; }
          .teacher-banner-photo { display: none !important; }
          .teacher-banner-greeting { flex: unset !important; width: 100% !important; }
          .teacher-banner-stats { flex-wrap: wrap !important; }
          .teacher-banner-stat-card { width: 80px !important; }
          .teacher-lower-grid { grid-template-columns: 1fr !important; }
          .teacher-student-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .teacher-shortcut-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .teacher-course-table-wrap { overflow-x: auto; }
          .teacher-greeting-title { font-size: 24px !important; }
          .teacher-greeting-name { font-size: 18px !important; }
          .teacher-banner-stat-card { background: #fff !important; width: auto !important; flex: 1 !important; }
        }
      `}</style>

      {/* 헤더 배너 */}
      <div className="teacher-banner" style={{ display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'stretch', height: '270px' }}>
        {/* 왼쪽: 인사 박스 */}
        <div className="teacher-banner-greeting" style={{ borderRadius: '4px', flex: 2, position: 'relative', overflow: 'hidden' }}>
          <img src="/school_building.png" alt="" style={{ position: 'absolute', right: 0, top: 0, width: '60%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #ffffff 35%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.5) 72%, rgba(255,255,255,0.15) 100%)' }}/>
          <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.02em' }}>{today}</p>
              <p className="teacher-greeting-title" style={{ fontSize: '36px', fontWeight: 700, color: '#1B3A7A', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2px' }}>안녕하세요</p>
              <p className="teacher-greeting-name" style={{ fontSize: '26px', fontWeight: 600, color: '#1a2332', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '10px' }}>{user.name} 선생님</p>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#1B3A7A', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap', fontFamily: "'Noto Sans KR', sans-serif", display: 'inline-block' }}>
                {classGroupName ? `${classGroupName} 담임` : '교과 담당'}
              </span>
            </div>
            <div className="teacher-banner-stats" style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: '담당 학급', value: classGroupName ?? '-' },
                { label: '학생 수', value: classGroupName ? `${students.length}명` : '-' },
                { label: '미확인 알림', value: unreadCount > 0 ? `${unreadCount}개` : '없음', highlight: unreadCount > 0 },
              ].map(s => (
                <div key={s.label} className="teacher-banner-stat-card" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: '10px', width: '110px', border: '1px solid #d1d9e0' }}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '5px', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.label}</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: (s as any).highlight ? '#1B3A7A' : '#1a2332', letterSpacing: '-0.02em' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 가운데/오른쪽 사진 카드 */}
        <div className="teacher-banner-photo" style={{ flex: 1.3, borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 16px rgba(27,58,122,0.2)' }}>
          <img src="/classroom.png" alt="교실" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(10,31,78,0.82) 0%, rgba(10,31,78,0.5) 50%, rgba(10,31,78,0.1) 100%)' }}/>
          <div style={{ position: 'absolute', top: '22px', left: '24px', color: '#fff' }}>
            <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '0.06em', fontWeight: 400 }}>교사와 학생이 함께</p>
            <h2 style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em', fontFamily: "'Noto Sans KR', sans-serif", textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              모든 가능성의<br/>발견 공간
            </h2>
          </div>
        </div>

        <div className="teacher-banner-photo" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ flex: 1, borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 2px 10px rgba(27,58,122,0.12)' }}>
            <img src="/school.jpeg" alt="학교" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,31,78,0.85) 0%, rgba(10,31,78,0.3) 60%, transparent 100%)' }}/>
            <div style={{ position: 'absolute', bottom: '12px', left: '14px', color: '#fff' }}>
              <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '3px', fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '0.04em' }}>성적 · 출결 · 생활기록부</p>
              <p style={{ fontSize: '14px', fontWeight: 800, fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '-0.02em', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>통합 관리 공간</p>
            </div>
          </div>
          <div style={{ flex: 1, borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 2px 10px rgba(27,58,122,0.12)' }}>
            <img src="/playground.png" alt="운동장" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,31,78,0.85) 0%, rgba(10,31,78,0.25) 60%, transparent 100%)' }}/>
            <div style={{ position: 'absolute', bottom: '12px', left: '14px', color: '#fff' }}>
              <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '3px', fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '0.04em' }}>학생부 관리시스템</p>
              <p style={{ fontSize: '14px', fontWeight: 800, fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '-0.02em', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>데이터 기반 성장 지원</p>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 2열 */}
      <div className="teacher-lower-grid" style={{ display: 'grid', gridTemplateColumns: classCourses.length > 0 ? '1fr 1.5fr' : '1fr', gap: '16px' }}>

        {classGroupName ? (
          <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#1B3A7A', flexShrink: 0 }}/>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>{classGroupName} 학생 명단</h2>
            </div>
            {students.length === 0 ? (
              <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>학생이 없습니다.</p>
            ) : (
              <div className="teacher-student-grid" style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
                {[...students].sort((a, b) => (a.studentNumber ?? 0) - (b.studentNumber ?? 0)).map((s: any) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '8px', cursor: 'default' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f0f5ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 600, width: '18px', flexShrink: 0 }}>{s.studentNumber}</span>
                    <span style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>{s.name ?? '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#1B3A7A', flexShrink: 0 }}/>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>학교 현황</h2>
            </div>
            <div style={{ padding: '24px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {[
                { label: '학교명', value: schoolName ?? '-' },
                { label: '전체 학생', value: totalStudents != null ? `${totalStudents}명` : '-' },
                { label: '전체 학급', value: totalClasses != null ? `${totalClasses}개` : '-' },
              ].map(item => (
                <div key={item.label} style={{ flex: 1, minWidth: '120px', padding: '16px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e8ecf0' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px', fontWeight: 500 }}>{item.label}</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, color: '#1B3A7A', letterSpacing: '-0.02em' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!classGroupName && (
          <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden', marginTop: '16px' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#F4A000', flexShrink: 0 }}/>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>바로가기</h2>
            </div>
            <div className="teacher-shortcut-grid" style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: '학생 검색', desc: '학생 성적·피드백·상담 조회', path: '/students/search' },
                { label: '성적 관리', desc: '과목별 성적 입력 및 수정', path: '/grades' },
                { label: '피드백 작성', desc: '학생 피드백 작성 및 목록', path: '/feedback' },
                { label: '상담 내역', desc: '상담 등록 및 내역 조회', path: '/counseling' },
                { label: '보고서 생성', desc: '학생부 보고서 출력', path: '/reports' },
                { label: '알림', desc: '미확인 알림 확인', path: '/notifications' },
              ].map(item => (
                <div
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  style={{ padding: '18px 20px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e8ecf0', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#f0f5ff'; (e.currentTarget as HTMLDivElement).style.borderColor = '#1B3A7A'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; (e.currentTarget as HTMLDivElement).style.borderColor = '#e8ecf0'; }}
                >
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#1B3A7A', marginBottom: '6px', letterSpacing: '-0.01em' }}>{item.label}</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {classCourses.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#F4A000', flexShrink: 0 }}/>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>학급 과목별 현황</h2>
            </div>
            <div className="teacher-course-table-wrap" style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                  <tr style={{ background: '#f0f5ff' }}>
                    {['과목', '수강', '평균', '최고', '최저', '표준편차'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#1B3A7A', fontSize: '11px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {classCourses.map((row, i) => (
                    <tr key={row.courseKey} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1a2332' }}>{courseMap[row.courseKey] ?? row.courseName ?? row.courseKey}</td>
                      <td style={{ padding: '11px 14px', color: '#64748b' }}>{row.studentCount ?? '—'}명</td>
                      <td style={{ padding: '11px 14px', fontWeight: 700, color: '#1B3A7A' }}>{row.avgScore?.toFixed(1) ?? '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#16a34a' }}>{row.maxScore?.toFixed(1) ?? '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#dc2626' }}>{row.minScore?.toFixed(1) ?? '—'}</td>
                      <td style={{ padding: '11px 14px', color: '#94a3b8' }}>{row.stddevScore?.toFixed(1) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
