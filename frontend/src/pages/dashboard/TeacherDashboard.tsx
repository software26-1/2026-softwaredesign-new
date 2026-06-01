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
        client.get<any[]>(`/courses/for-class`, { params: { academic_year: YEAR, semester: SEMESTER } })
          .then(r => {
            const list: any[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
            setCourseMap(Object.fromEntries(list.map((c: any) => [c.id, c.courseName])));
          }).catch(() => {});
      }
    };
    load();
  }, []);

  const riskCount = atRisk.filter(s => s.riskFlag).length;
  const classGroupName = (teacher as any).classGroupName;
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });


  return (
    <div>
      {/* 헤더 배너 */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563a8 100%)', borderRadius: '14px', padding: '28px 32px', marginBottom: '24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>{today}</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>안녕하세요, {user.name} 선생님</h1>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>
            {classGroupName ? `${classGroupName} 담임` : user.role === 'TEACHER' ? '교과 담당' : ''}
          </p>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: '담당 학급', value: classGroupName ?? '미지정', sub: `${YEAR}학년도`, alert: false },
          { label: '담당 학생 수', value: `${students.length}명`, sub: '', alert: false },
          { label: '위험군 학생', value: riskCount > 0 ? `${riskCount}명` : '없음', sub: '', alert: riskCount > 0 },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.alert ? '#e65100' : '#1e5a99'}` }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, color: s.alert ? '#e65100' : '#1a2332', marginBottom: '4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 학생 명단 */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>
            {classGroupName ? `${classGroupName} 학생 명단` : '학생 명단'}
          </h2>
        </div>
        {students.length === 0 ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            {classGroupName ? '학생이 없습니다.' : '담당 학급이 지정되면 학생 명단이 표시됩니다.'}
          </p>
        ) : (
          <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
            {[...students].sort((a, b) => (a.studentNumber ?? 0) - (b.studentNumber ?? 0)).map((s: any) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px', borderRadius: '4px' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 600, width: '16px', flexShrink: 0 }}>{s.studentNumber}</span>
                <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: 500 }}>{s.name ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 학급 과목별 현황 */}
      {classCourses.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>학급 과목별 현황</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['과목', '수강 인원', '평균', '최고', '최저', '표준편차'].map(h => (
                  <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classCourses.map(row => (
                <tr key={row.courseKey} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '12px 24px', fontWeight: 500 }}>{courseMap[row.courseKey] ?? row.courseName ?? row.courseKey}</td>
                  <td style={{ padding: '12px 24px', color: '#64748b' }}>{row.studentCount ?? '—'}명</td>
                  <td style={{ padding: '12px 24px', fontWeight: 600, color: '#1e5a99' }}>{row.avgScore?.toFixed(1) ?? '—'}</td>
                  <td style={{ padding: '12px 24px', color: '#2e7d32' }}>{row.maxScore?.toFixed(1) ?? '—'}</td>
                  <td style={{ padding: '12px 24px', color: '#c62828' }}>{row.minScore?.toFixed(1) ?? '—'}</td>
                  <td style={{ padding: '12px 24px', color: '#64748b' }}>{row.stddevScore?.toFixed(1) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
