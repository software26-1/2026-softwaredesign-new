import { useState, useEffect } from 'react';
import type { User, Teacher } from '../../types/user';
import { analyticsService } from '../../services/analyticsService';
import type { ClassCourseStats, AtRiskStudent } from '../../types/analytics';
import client from '../../api/client';

interface Props { user: User }

const YEAR = new Date().getFullYear();
const SEMESTER = new Date().getMonth() < 7 ? 1 : 2;

export function TeacherDashboard({ user }: Props) {
  const [teacher, setTeacher] = useState<Teacher>(user as Teacher);
  const [students, setStudents] = useState<any[]>([]);
  const [classCourses, setClassCourses] = useState<ClassCourseStats[]>([]);
  const [atRisk, setAtRisk] = useState<AtRiskStudent[]>([]);
  const [courseMap, setCourseMap] = useState<Record<number, string>>({});
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      const r = await client.get<any>('/users/me').catch(() => null);
      const profile = r?.data?.data ?? r?.data ?? null;
      const cg = profile?.classGroupId ?? (user as any).classGroupId ?? null;

      if (profile) {
        const updated = { ...user, ...profile };
        setTeacher(updated as Teacher);
        localStorage.setItem('user', JSON.stringify(updated));
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
      }
    };
    load();
    client.get<any>('/notifications').then(res => {
      const data = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
      setUnreadCount(data.filter((n: any) => !(n.isRead ?? n.read ?? false)).length);
    }).catch(() => {});
  }, []);

  const riskCount = atRisk.filter(s => s.riskFlag).length;
  const classGroupName = (teacher as any).classGroupName;
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });


  return (
    <div>
      {/* 헤더 배너 + 통계 통합 */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'stretch', height: '270px' }}>
        {/* 왼쪽: 인사 박스 */}
        <div style={{ borderRadius: '4px', flex: 2, position: 'relative', overflow: 'hidden' }}>
          {/* 배경 이미지 - 오른쪽에 하늘만 보이게 */}
          <img src="/school_building.png" alt="" style={{ position: 'absolute', right: 0, top: 0, width: '60%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%', display: 'block' }} />
          {/* 왼→오 그라데이션 (텍스트 가독성 + 건물 숨김) */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #ffffff 35%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.5) 72%, rgba(255,255,255,0.15) 100%)' }}/>
          {/* 텍스트 콘텐츠 */}
          <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.02em' }}>{today}</p>
              <p style={{ fontSize: '36px', fontWeight: 700, color: '#1B3A7A', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2px' }}>안녕하세요</p>
              <p style={{ fontSize: '26px', fontWeight: 600, color: '#1a2332', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '10px' }}>{user.name} 선생님</p>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#1B3A7A', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap', fontFamily: "'Noto Sans KR', sans-serif", display: 'inline-block' }}>
                {classGroupName ? `${classGroupName} 담임` : '교과 담당'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: '담당 학급', value: classGroupName ?? '-' },
                { label: '학생 수', value: `${students.length}명` },
                { label: '미확인 알림', value: unreadCount > 0 ? `${unreadCount}개` : '없음', highlight: unreadCount > 0 },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: '10px', width: '110px', border: '1px solid #d1d9e0' }}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '5px', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.label}</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: (s as any).highlight ? '#1B3A7A' : '#1a2332', letterSpacing: '-0.02em' }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 가운데: 큰 사진 카드 */}
        <div style={{ flex: 1.3, borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 16px rgba(27,58,122,0.2)' }}>
          <img src="/classroom.png" alt="교실" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(10,31,78,0.82) 0%, rgba(10,31,78,0.5) 50%, rgba(10,31,78,0.1) 100%)' }}/>
          <div style={{ position: 'absolute', top: '22px', left: '24px', color: '#fff' }}>
            <p style={{ fontSize: '11px', opacity: 0.8, marginBottom: '8px', fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '0.06em', fontWeight: 400 }}>교사와 학생이 함께</p>
            <h2 style={{ fontSize: '26px', fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em', fontFamily: "'Noto Sans KR', sans-serif", textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              모든 가능성의<br/>발견 공간
            </h2>
          </div>
        </div>

        {/* 오른쪽: 2개 쌓기 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

      {/* 2열: 명단(좌) + 현황(우) */}
      <div style={{ display: 'grid', gridTemplateColumns: classCourses.length > 0 ? '1fr 1.5fr' : '1fr', gap: '16px' }}>

        {/* 학생 명단 */}
        <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
            <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#1B3A7A', flexShrink: 0 }}/>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>
              {classGroupName ? `${classGroupName} 학생 명단` : '학생 명단'}
            </h2>
          </div>
          {students.length === 0 ? (
            <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              {classGroupName ? '학생이 없습니다.' : '담당 학급이 지정되면 학생 명단이 표시됩니다.'}
            </p>
          ) : (
            <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
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

        {/* 학급 과목별 현황 */}
        {classCourses.length > 0 && (
          <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
              <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#F4A000', flexShrink: 0 }}/>
              <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>학급 과목별 현황</h2>
            </div>
            <div style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
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
