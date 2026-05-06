import { useState } from 'react';
import { Button } from '../components/common/Button';

type ReportType = 'GRADE_ANALYSIS' | 'COUNSELING_SUMMARY' | 'FEEDBACK_SUMMARY';
type ReportFormat = 'PDF' | 'EXCEL';
type ReportStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';

interface ReportItem { id: number; reportType: ReportType; format: ReportFormat; status: ReportStatus; createdAt: string; }

const TYPE_LABELS: Record<ReportType, string> = { GRADE_ANALYSIS: '성적 분석', COUNSELING_SUMMARY: '상담 요약', FEEDBACK_SUMMARY: '피드백 요약' };
const STATUS_LABELS: Record<ReportStatus, string> = { PENDING: '대기', PROCESSING: '생성 중', DONE: '완료', FAILED: '실패' };
const statusStyle: Record<ReportStatus, { bg: string; color: string }> = {
  PENDING: { bg: '#fff3e0', color: '#e65100' },
  PROCESSING: { bg: '#ebf4ff', color: '#1e5a99' },
  DONE: { bg: '#e8f5e9', color: '#2e7d32' },
  FAILED: { bg: '#fdecea', color: '#c62828' },
};

const DUMMY: ReportItem[] = [
  { id: 1, reportType: 'GRADE_ANALYSIS', format: 'PDF', status: 'DONE', createdAt: '2026-04-18' },
  { id: 2, reportType: 'COUNSELING_SUMMARY', format: 'EXCEL', status: 'DONE', createdAt: '2026-04-15' },
];

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };

export function ReportPage() {
  const [reports, setReports] = useState<ReportItem[]>(DUMMY);
  const [reportType, setReportType] = useState<ReportType>('GRADE_ANALYSIS');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [msg, setMsg] = useState('');

  const handleCreate = () => {
    const newReport: ReportItem = { id: Date.now(), reportType, format, status: 'PROCESSING', createdAt: new Date().toISOString().slice(0, 10) };
    setReports(prev => [newReport, ...prev]);
    setMsg('보고서 생성 요청이 접수되었습니다. 완료 후 다운로드 가능합니다.');
    setTimeout(() => {
      setReports(prev => prev.map(r => r.id === newReport.id ? { ...r, status: 'DONE' } : r));
      setMsg('');
    }, 2500);
  };

  const selectStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontWeight: 500 }}>REPORTS</p>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a2332' }}>보고서 생성</h1>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332', marginBottom: '20px' }}>보고서 생성 요청</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>보고서 종류</label>
            <select style={selectStyle} value={reportType} onChange={e => setReportType(e.target.value as ReportType)}>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l} 보고서</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>파일 형식</label>
            <select style={selectStyle} value={format} onChange={e => setFormat(e.target.value as ReportFormat)}>
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel</option>
            </select>
          </div>
        </div>
        <div style={{ padding: '12px 14px', background: '#eff6ff', color: '#1e5a99', borderRadius: '6px', fontSize: '13px', marginBottom: '16px', borderLeft: '3px solid #1e5a99' }}>
          보고서 생성은 비동기로 처리됩니다. 완료 후 목록에서 다운로드하세요.
        </div>
        {msg && <div style={{ padding: '10px 14px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: '3px solid #4caf50' }}>{msg}</div>}
        <Button size="sm" onClick={handleCreate}>보고서 생성 요청</Button>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>보고서 목록</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['생성일','종류','형식','상태','다운로드'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {reports.map(r => (
              <tr key={r.id}>
                <td style={{ ...tdStyle, color: '#94a3b8' }}>{r.createdAt}</td>
                <td style={{ ...tdStyle, fontWeight: 500, color: '#1e293b' }}>{TYPE_LABELS[r.reportType]}</td>
                <td style={{ ...tdStyle, color: '#64748b' }}>{r.format}</td>
                <td style={tdStyle}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, ...statusStyle[r.status] }}>{STATUS_LABELS[r.status]}</span>
                </td>
                <td style={tdStyle}>
                  <Button size="sm" variant={r.status === 'DONE' ? 'success' : 'secondary'} disabled={r.status !== 'DONE'}
                    onClick={() => alert('백엔드 연동 후 실제 다운로드 됩니다.')}>
                    다운로드
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
