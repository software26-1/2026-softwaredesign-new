import { useState, useEffect } from 'react';
import { Button } from '../components/common/Button';
import { reportService, type Report, type ReportType, type ReportFormat } from '../services/reportService';

const TYPE_LABELS: Record<ReportType, string> = { GRADE_ANALYSIS: '성적 분석', COUNSELING_SUMMARY: '상담 요약', FEEDBACK_SUMMARY: '피드백 요약' };
const STATUS_LABELS: Record<string, string> = { PENDING: '대기', PROCESSING: '생성 중', DONE: '완료', FAILED: '실패' };
const statusStyle: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: '#fff3e0', color: '#e65100' },
  PROCESSING: { bg: '#ebf4ff', color: '#1e5a99' },
  DONE: { bg: '#e8f5e9', color: '#2e7d32' },
  FAILED: { bg: '#fdecea', color: '#c62828' },
};

const thStyle: React.CSSProperties = { padding: '11px 20px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '12px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' };
const tdStyle: React.CSSProperties = { padding: '13px 20px', borderBottom: '1px solid #f8fafc', fontSize: '13px' };
const selectStyle: React.CSSProperties = { padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', fontFamily: "'Noto Sans KR', sans-serif", outline: 'none', background: '#fff', width: '100%' };

export function ReportPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [reportType, setReportType] = useState<ReportType>('GRADE_ANALYSIS');
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [msg, setMsg] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getReports()
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    setCreating(true); setMsg('');
    try {
      const created = await reportService.create(reportType, format);
      setReports(prev => [created, ...prev]);
      setMsg('보고서 생성 요청이 접수되었습니다. 완료 후 다운로드 가능합니다.');
      setTimeout(() => setMsg(''), 4000);
    } catch {
      setMsg('생성 요청에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (reportId: number, fmt: ReportFormat) => {
    try {
      const blob = await reportService.download(reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}.${fmt === 'PDF' ? 'pdf' : 'xlsx'}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('다운로드에 실패했습니다.');
    }
  };

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
        {msg && <div style={{ padding: '10px 14px', background: msg.includes('실패') ? '#fdecea' : '#e8f5e9', color: msg.includes('실패') ? '#c62828' : '#2e7d32', borderRadius: '6px', fontSize: '13px', marginBottom: '14px', borderLeft: `3px solid ${msg.includes('실패') ? '#e57373' : '#4caf50'}` }}>{msg}</div>}
        <Button size="sm" onClick={handleCreate} disabled={creating}>{creating ? '요청 중...' : '보고서 생성 요청'}</Button>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#1a2332' }}>보고서 목록</h2>
        </div>
        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>불러오는 중...</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['생성일', '종류', '형식', '상태', '다운로드'].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {reports.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>생성된 보고서가 없습니다.</td></tr>
              )}
              {reports.map(r => (
                <tr key={r.id}>
                  <td style={{ ...tdStyle, color: '#94a3b8' }}>{r.createdAt?.slice(0, 10)}</td>
                  <td style={{ ...tdStyle, fontWeight: 500, color: '#1e293b' }}>{TYPE_LABELS[r.reportType]}</td>
                  <td style={{ ...tdStyle, color: '#64748b' }}>{r.format}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, ...statusStyle[r.status] }}>
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <Button size="sm" variant={r.status === 'DONE' ? 'success' : 'secondary'} disabled={r.status !== 'DONE'}
                      onClick={() => handleDownload(r.id, r.format)}>
                      다운로드
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
