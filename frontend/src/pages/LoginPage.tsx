import { useState } from 'react';

const ROLE_OPTIONS = [
  { value: 'teacher', label: '교사' },
  { value: 'student', label: '학생' },
  { value: 'parent', label: '학부모' },
];

export function LoginPage() {
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const handleGoogleLogin = () => {
    if (!role) {
      setError('사용자 구분을 선택해주세요.');
      return;
    }
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/oauth2/google?role=${role}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e5a99 0%, #2e6fb8 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '50px 40px',
          borderRadius: '8px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          width: '100%',
          maxWidth: '420px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e3a5f', marginBottom: '8px' }}>
            학생 생활기록부 관리
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>STUDENT RECORD MANAGEMENT SYSTEM</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
            사용자 구분
          </label>
          <select
            value={role}
            onChange={(e) => { setRole(e.target.value); setError(''); }}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              background: 'white',
              outline: 'none',
            }}
          >
            <option value="">선택하세요</option>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              background: '#fdecea',
              color: '#e53935',
              borderRadius: '4px',
              fontSize: '14px',
              marginBottom: '16px',
              borderLeft: '4px solid #e53935',
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '14px',
            background: 'white',
            color: '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            style={{ width: '20px', height: '20px' }}
          />
          Google 로그인
        </button>
      </div>
    </div>
  );
}
