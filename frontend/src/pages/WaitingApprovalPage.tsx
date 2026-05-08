export function WaitingApprovalPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563a8 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        width: '100%', maxWidth: '420px', padding: '48px 36px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563a8" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
        </div>

        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1e3a5f', marginBottom: '12px' }}>
          승인 대기 중
        </h1>
        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginBottom: '24px' }}>
          가입 신청이 완료되었습니다.<br />
          관리자 또는 담당 선생님의 승인 후<br />
          서비스를 이용하실 수 있습니다.
        </p>

        <div style={{
          background: '#f0f4ff', borderRadius: '8px', padding: '14px 16px',
          fontSize: '13px', color: '#374151', lineHeight: '1.6',
        }}>
          <strong>선생님</strong> 가입 → 관리자 승인<br />
          <strong>학생/학부모</strong> 가입 → 담임 선생님 승인
        </div>
      </div>
    </div>
  );
}
