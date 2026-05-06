import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS, RadialLinearScale, PointElement,
  LineElement, Filler, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const DUMMY_STUDENTS = [
  { id: 1, name: '김철수', grade: 3, classNumber: 5, studentNumber: 1, recentGradeScore: 87.5, recentGradeLevel: 'B+', feedbackCount: 2, counselingCount: 5 },
  { id: 2, name: '이영희', grade: 3, classNumber: 5, studentNumber: 2, recentGradeScore: 92.3, recentGradeLevel: 'A', feedbackCount: 3, counselingCount: 3 },
  { id: 3, name: '박민수', grade: 3, classNumber: 5, studentNumber: 3, recentGradeScore: 78.2, recentGradeLevel: 'C+', feedbackCount: 1, counselingCount: 8 },
  { id: 4, name: '최지은', grade: 3, classNumber: 4, studentNumber: 7, recentGradeScore: 95.0, recentGradeLevel: 'A+', feedbackCount: 4, counselingCount: 2 },
  { id: 5, name: '정승호', grade: 2, classNumber: 3, studentNumber: 15, recentGradeScore: 83.1, recentGradeLevel: 'B', feedbackCount: 1, counselingCount: 4 },
];

const RADAR_DATA: Record<number, number[]> = {
  1: [87, 92, 78, 85, 90],
  2: [92, 95, 88, 91, 89],
  3: [78, 70, 82, 75, 80],
  4: [95, 93, 97, 90, 96],
  5: [83, 80, 85, 88, 79],
};

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const inputStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff' };

export function StudentSearchPage() {
  const [filters, setFilters] = useState({ grade: '', classNumber: '', name: '', contentType: 'all' });
  const [results, setResults] = useState(DUMMY_STUDENTS);
  const [selected, setSelected] = useState<typeof DUMMY_STUDENTS[0] | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'grade' | 'feedback' | 'counseling'>('info');

  const handleSearch = () => {
    setResults(DUMMY_STUDENTS.filter(s =>
      (!filters.grade || s.grade === Number(filters.grade)) &&
      (!filters.classNumber || s.classNumber === Number(filters.classNumber)) &&
      (!filters.name || s.name.includes(filters.name))
    ));
  };

  const radarData = selected ? {
    labels: ['수학', '국어', '영어', '과학', '사회'],
    datasets: [{
      label: '성적',
      data: RADAR_DATA[selected.id] ?? [0, 0, 0, 0, 0],
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
            { label: '반', key: 'classNumber', options: Array.from({length: 10}, (_, i) => ({ value: String(i+1), label: `${i+1}반` })) },
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
          <Button size="sm" variant="secondary" onClick={() => { setFilters({ grade: '', classNumber: '', name: '', contentType: 'all' }); setResults(DUMMY_STUDENTS); }}>초기화</Button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>검색 결과</h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>총 {results.length}명</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>{['학년/반/번호','이름','최근 성적','피드백','상담 건수',''].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {results.map((s) => (
              <tr key={s.id} style={{ cursor: 'pointer' }}>
                <td style={{ ...tdStyle, color: '#64748b' }}>{s.grade}-{s.classNumber}-{String(s.studentNumber).padStart(2,'0')}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                <td style={tdStyle}>
                  <span style={{ fontWeight: 600, color: '#1e5a99' }}>{s.recentGradeScore}점</span>
                  <span style={{ marginLeft: '6px' }}><Badge variant="primary">{s.recentGradeLevel}</Badge></span>
                </td>
                <td style={tdStyle}>{s.feedbackCount}건</td>
                <td style={tdStyle}>{s.counselingCount}회</td>
                <td style={tdStyle}>
                  <Button size="sm" onClick={() => { setSelected(s); setActiveTab('info'); }}>상세보기</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!selected} title={selected ? `${selected.name} 학생 상세` : ''} onClose={() => setSelected(null)} width={700}>
        {selected && (
          <div>
            <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: '2px solid #f1f5f9' }}>
              {([['info','기본 정보'],['grade','성적'],['feedback','피드백'],['counseling','상담']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === tab ? 700 : 400, color: activeTab === tab ? '#1e5a99' : '#94a3b8', borderBottom: activeTab === tab ? '2px solid #1e5a99' : '2px solid transparent', marginBottom: '-2px', fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'info' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  {[['이름', selected.name], ['학년/반/번호', `${selected.grade}학년 ${selected.classNumber}반 ${selected.studentNumber}번`], ['최근 성적', `${selected.recentGradeScore}점`], ['등급', selected.recentGradeLevel], ['피드백 수', `${selected.feedbackCount}건`], ['상담 횟수', `${selected.counselingCount}회`]].map(([k, v]) => (
                    <div key={k} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: '8px' }}>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>{k}</p>
                      <p style={{ fontSize: '15px', fontWeight: 700, color: '#1a2332' }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'grade' && radarData && (
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>과목별 성적 분포</p>
                <div style={{ maxWidth: '320px', margin: '0 auto' }}>
                  <Radar data={radarData} options={{ scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } }, plugins: { legend: { display: false } } }} />
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div>
                {[
                  { date: '2026-04-19', teacher: '홍길동', type: '성적', content: '문제 해결 능력이 뛰어납니다.' },
                  { date: '2026-04-10', teacher: '김민지', type: '태도', content: '수업 참여도가 좋습니다.' },
                ].map((f, i) => (
                  <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{f.date} · {f.teacher} 선생님</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, background: '#ebf4ff', color: '#1e5a99', padding: '2px 8px', borderRadius: '4px' }}>{f.type}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#334155' }}>{f.content}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'counseling' && (
              <div>
                {[
                  { date: '2026-04-18', teacher: '홍길동', content: '진로 고민 상담. 이공계 진학 희망.' },
                  { date: '2026-03-20', teacher: '홍길동', content: '교우 관계 어려움 호소. 지속 관찰 필요.' },
                ].map((c, i) => (
                  <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{c.date}</span>
                      <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{c.teacher} 선생님</span>
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
