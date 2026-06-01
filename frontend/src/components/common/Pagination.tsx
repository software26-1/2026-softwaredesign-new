interface Props {
  page: number;          // 현재 페이지 (1-base)
  totalItems: number;
  pageSize: number;
  onChange: (page: number) => void;
}

const btn = (active: boolean, disabled = false): React.CSSProperties => ({
  minWidth: '32px', height: '32px', padding: '0 8px', borderRadius: '6px',
  border: active ? '1px solid #1e5a99' : '1px solid #e2e8f0',
  background: active ? '#1e5a99' : '#fff',
  color: disabled ? '#cbd5e1' : active ? '#fff' : '#475569',
  fontSize: '13px', fontWeight: active ? 700 : 500,
  cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
});

export function Pagination({ page, totalItems, pageSize, onChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  // 현재 페이지 주변 최대 5개 + 처음/끝
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '16px' }}>
      <button style={btn(false, page === 1)} disabled={page === 1} onClick={() => onChange(page - 1)}>이전</button>
      {start > 1 && (
        <>
          <button style={btn(false)} onClick={() => onChange(1)}>1</button>
          {start > 2 && <span style={{ color: '#cbd5e1', fontSize: '13px' }}>…</span>}
        </>
      )}
      {pages.map(p => (
        <button key={p} style={btn(p === page)} onClick={() => onChange(p)}>{p}</button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span style={{ color: '#cbd5e1', fontSize: '13px' }}>…</span>}
          <button style={btn(false)} onClick={() => onChange(totalPages)}>{totalPages}</button>
        </>
      )}
      <button style={btn(false, page === totalPages)} disabled={page === totalPages} onClick={() => onChange(page + 1)}>다음</button>
    </div>
  );
}
