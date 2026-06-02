import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../types/user';
import { analyticsService } from '../../services/analyticsService';
import client from '../../api/client';
import type { ApiResponse } from '../../types/common';

interface Props { user: User }

export function AdminDashboard({ user }: Props) {
  const navigate = useNavigate();
  const [etlRunning, setEtlRunning] = useState(false);
  const [stats, setStats] = useState({ teachers: 0, pending: 0, classGroups: 0, schoolName: '—', schoolType: '—' });

  useEffect(() => {
    const load = async () => {
      try {
        const [teachersRes, pendingRes, schoolsRes] = await Promise.all([
          client.get<ApiResponse<unknown[]>>('/admin/users?status=ACTIVE'),
          client.get<ApiResponse<unknown[]>>('/admin/users/pending'),
          client.get<any[]>('/schools'),
        ]);
        const teachers = teachersRes.data.data?.length ?? 0;
        const pending = pendingRes.data.data?.length ?? 0;
        const schools = Array.isArray(schoolsRes.data) ? schoolsRes.data : (schoolsRes.data as any).data ?? [];
        const mySchool = schools[0];
        const schoolName = mySchool?.schoolName ?? '—';
        const schoolType = mySchool?.schoolType === 'HIGH' ? '고등학교' : mySchool?.schoolType === 'MIDDLE' ? '중학교' : '—';
        let classGroups = 0;
        if (mySchool?.id) {
          const cgRes = await client.get<any[]>(`/schools/${mySchool.id}/class-groups`);
          const cg = Array.isArray(cgRes.data) ? cgRes.data : (cgRes.data as any).data ?? [];
          classGroups = cg.length;
        }
        setStats({ teachers, pending, classGroups, schoolName, schoolType });
      } catch {}
    };
    load();
  }, []);

  const handleEtl = async () => {
    setEtlRunning(true);
    try {
      await analyticsService.runEtl();
      alert('분석 데이터 갱신을 완료했습니다.');
    } catch {
      alert('ETL 실행에 실패했습니다.');
    } finally {
      setEtlRunning(false);
    }
  };

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <div>
      {/* 헤더 배너 - 교사 대시보드와 동일한 레이아웃 */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'stretch', height: '270px' }}>
        {/* 왼쪽: 인사 박스 */}
        <div style={{ borderRadius: '4px', flex: 2, position: 'relative', overflow: 'hidden' }}>
          <img src="/school_building.png" alt="" style={{ position: 'absolute', right: 0, top: 0, width: '60%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #ffffff 35%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.5) 72%, rgba(255,255,255,0.15) 100%)' }}/>
          <div style={{ position: 'relative', zIndex: 1, padding: '24px 28px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', letterSpacing: '0.02em' }}>{today}</p>
              <p style={{ fontSize: '36px', fontWeight: 700, color: '#1B3A7A', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '2px' }}>안녕하세요</p>
              <p style={{ fontSize: '26px', fontWeight: 600, color: '#1a2332', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: '8px' }}>{user.name} 관리자님</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff', background: '#1B3A7A', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap', fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {stats.schoolName}
                </span>
                <button onClick={handleEtl} disabled={etlRunning}
                  style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'rgba(27,58,122,0.08)', color: '#1B3A7A', border: '1px solid rgba(27,58,122,0.2)', cursor: etlRunning ? 'default' : 'pointer', fontFamily: "'Noto Sans KR', sans-serif", whiteSpace: 'nowrap', opacity: etlRunning ? 0.7 : 1 }}>
                  {etlRunning ? '갱신 중...' : '데이터 갱신'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { label: '전체 교사', value: `${stats.teachers}명` },
                { label: '승인 대기', value: stats.pending > 0 ? `${stats.pending}명` : '없음', highlight: stats.pending > 0 },
                { label: '전체 학급', value: `${stats.classGroups}개` },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', borderRadius: '10px', width: '110px', border: '1px solid #d1d9e0' }}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '5px', fontWeight: 500, whiteSpace: 'nowrap' }}>{s.label}</p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: (s as any).highlight ? '#dc2626' : '#1a2332', letterSpacing: '-0.02em' }}>{s.value}</p>
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
              모든 가능성의<br/>발견
            </h2>
          </div>
        </div>

        {/* 오른쪽: 2개 쌓기 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ flex: 1, borderRadius: '4px', overflow: 'hidden', position: 'relative', boxShadow: '0 2px 10px rgba(27,58,122,0.12)' }}>
            <img src="/school.jpeg" alt="학교" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,31,78,0.85) 0%, rgba(10,31,78,0.3) 60%, transparent 100%)' }}/>
            <div style={{ position: 'absolute', bottom: '12px', left: '14px', color: '#fff' }}>
              <p style={{ fontSize: '10px', opacity: 0.8, marginBottom: '3px', fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '0.04em' }}>교사 · 학생 · 학부모</p>
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

      {/* 바로가기 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginBottom: '14px', alignItems: 'start' }}>
        <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc' }}>
            <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#1B3A7A', flexShrink: 0 }}/>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>바로가기</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {[
              { label: '교사 관리', desc: '목록 · 직책 수정', path: '/admin/users' },
              { label: '학교 관리', desc: '학급 추가 · 담임 배정', path: '/admin/schools' },
              { label: '과목 관리', desc: '과목 개설 · 비율', path: '/admin/courses' },
              { label: '승인 대기', desc: '가입 · 전근 · 전학', path: '/admin/approvals', badge: stats.pending },
              { label: '알림', desc: '알림 전체 보기', path: '/notifications' },
            ].map((s, i) => (
              <button key={s.label} onClick={() => navigate(s.path)}
                style={{ padding: '16px 18px', border: 'none', borderRight: i < 4 ? '1px solid #f1f5f9' : 'none', background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: "'Noto Sans KR', sans-serif", transition: 'background 0.1s', position: 'relative' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f0f5ff')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                {s.badge ? (
                  <span style={{ position: 'absolute', top: '12px', right: '12px', background: '#dc2626', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{s.badge}</span>
                ) : null}
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A7A', marginBottom: '4px' }}>{s.label}</p>
                <p style={{ fontSize: '11px', color: '#94a3b8' }}>{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 메뉴 안내 */}
      <div style={{ background: '#fff', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: '#F4A000', flexShrink: 0 }}/>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>메뉴 안내</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { title: '교사 관리', items: ['교사 목록 조회 (담임/교과담당/비교과 필터)', '교사 직책 수정', '교사 비활성화/활성화'] },
            { title: '학교 관리', items: ['학급 추가/삭제', '담임 교사 배정', '전학 학생 학급 배정'] },
            { title: '과목 관리', items: ['학년도/학기별 과목 개설', '교과·학년·평가방식 설정', '중간/기말/수행평가 비율 설정'] },
            { title: '승인 대기', items: ['교사 가입 신청 승인/거절', '교사 전근 신청 처리', '학생 전학 신청 처리'] },
          ].map(s => (
            <div key={s.title} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B3A7A', marginBottom: '8px' }}>{s.title}</p>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {s.items.map(item => (
                  <li key={item} style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
