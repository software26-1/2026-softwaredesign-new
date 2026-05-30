import { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import client from '../../api/client';
import type { ApiResponse } from '../../types/common';

interface SchoolInfo {
  id: number;
  schoolName: string;
  schoolType: string;
  schoolCode: string;
}

interface ClassGroupInfo {
  id: number;
  grade: number;
  classNumber: number;
  academicYear: number;
  teacherName?: string;
}

const TYPE_LABEL: Record<string, string> = { HIGH: '고등학교', MIDDLE: '중학교' };

export function SchoolManagementPage() {
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [classGroups, setClassGroups] = useState<ClassGroupInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client.get<ApiResponse<{ id: number; schoolName: string; schoolType: string; schoolCode: string }[]>>('/schools')
      .then(res => {
        const schools = res.data.data ?? [];
        const mySchool = schools[0];
        if (mySchool) {
          setSchool(mySchool);
          return client.get<ApiResponse<ClassGroupInfo[]>>(`/schools/${mySchool.id}/class-groups`);
        }
      })
      .then(res => {
        if (res) setClassGroups(res.data.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
  const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>MY SCHOOL</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>내 학교 정보</h1>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
      ) : !school ? (
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>학교 정보가 없습니다.</p>
      ) : (
        <>
          <Card title="학교 기본 정보">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {[
                ['학교명', school.schoolName],
                ['학교 구분', TYPE_LABEL[school.schoolType] ?? school.schoolType],
                ['학교 코드', school.schoolCode ?? '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>{k}</p>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>{v}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title={`학급 목록 (${classGroups.length}개)`} style={{ marginTop: '20px' }}>
            {classGroups.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '13px', padding: '20px 0' }}>등록된 학급이 없습니다.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['학년도', '학년', '반', '담임'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {classGroups.map(c => (
                    <tr key={c.id}>
                      <td style={{ ...tdStyle, color: '#64748b' }}>{c.academicYear}년</td>
                      <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{c.grade}학년</td>
                      <td style={{ ...tdStyle, color: '#1e293b' }}>{c.classNumber}반</td>
                      <td style={{ ...tdStyle, color: '#475569' }}>{c.teacherName ?? '미지정'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
