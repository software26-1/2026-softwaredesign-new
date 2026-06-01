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
      {/* 헤더 배너 */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563a8 100%)', borderRadius: '14px', padding: '28px 32px', marginBottom: '24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '12px', opacity: 0.7, marginBottom: '6px' }}>{today}</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>안녕하세요, {user.name} 관리자님</h1>
          <p style={{ fontSize: '13px', opacity: 0.8 }}>{stats.schoolName}</p>
        </div>
        <button onClick={handleEtl} disabled={etlRunning}
          style={{ padding: '9px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: '#fff', color: '#1e3a5f', border: 'none', cursor: etlRunning ? 'default' : 'pointer', fontFamily: "'Noto Sans KR', sans-serif", opacity: etlRunning ? 0.7 : 1 }}>
          {etlRunning ? '갱신 중...' : '분석 데이터 갱신'}
        </button>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: '전체 교사', value: `${stats.teachers}명`, sub: '활성 교사' },
          { label: '승인 대기', value: `${stats.pending}명`, sub: stats.pending > 0 ? '처리 필요' : '모두 처리됨', alert: stats.pending > 0 },
          { label: '학급 수', value: `${stats.classGroups}개`, sub: '등록된 학급' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.alert ? '#e65100' : '#1e5a99'}` }}>
            <p style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '26px', fontWeight: 700, color: s.alert ? '#e65100' : '#1a2332', marginBottom: '4px' }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: s.alert ? '#f39c12' : '#94a3b8' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 메뉴 안내 */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '20px 24px', marginBottom: '14px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '16px' }}>메뉴 안내</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { title: '교사 관리', items: ['교사 목록 조회 (담임/교과담당/비교과 필터)', '교사 직책 수정', '교사 비활성화/활성화'] },
            { title: '학교 관리', items: ['학급 추가/삭제', '담임 교사 배정', '전학 학생 학급 배정'] },
            { title: '과목 관리', items: ['학년도/학기별 과목 개설', '교과·학년·평가방식 설정', '중간/기말/수행평가 비율 설정'] },
            { title: '승인 대기', items: ['교사 가입 신청 승인/거절', '교사 전근 신청 처리', '학생 전학 신청 처리'] },
            { title: '알림', items: ['가입·전근·전학 신청 접수 시 자동 발송', '상단 벨 아이콘 클릭 시 최근 알림 확인 가능', '알림 페이지에서 전체 내역 조회 및 읽음 처리'] },
          ].map(s => (
            <div key={s.title} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1e5a99', marginBottom: '8px' }}>{s.title}</p>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                {s.items.map(item => (
                  <li key={item} style={{ fontSize: '12px', color: '#64748b', marginBottom: '3px' }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 바로가기 */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>바로가기</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {[
            { label: '교사 관리', desc: '교사 목록 · 직책 수정', path: '/admin/users' },
            { label: '학교 관리', desc: '학급 추가 · 담임 배정', path: '/admin/schools' },
            { label: '과목 관리', desc: '과목 개설 · 비율 설정', path: '/admin/courses' },
            { label: '승인 대기', desc: `가입 · 전근 · 전학 신청`, path: '/admin/approvals', badge: stats.pending },
            { label: '알림', desc: '알림 전체 보기', path: '/notifications' },
          ].map((s, i) => (
            <button key={s.label} onClick={() => navigate(s.path)}
              style={{ padding: '20px 24px', border: 'none', borderRight: i < 4 ? '1px solid #f1f5f9' : 'none', background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: "'Noto Sans KR', sans-serif", transition: 'background 0.1s', position: 'relative' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
              {s.badge ? (
                <span style={{ position: 'absolute', top: '16px', right: '16px', background: '#e65100', color: '#fff', borderRadius: '10px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>{s.badge}</span>
              ) : null}
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a2332', marginBottom: '4px' }}>{s.label}</p>
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>{s.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
