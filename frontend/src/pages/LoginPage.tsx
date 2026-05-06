import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ userType: '', loginId: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await authService.login(form);
      login(res.user, res.accessToken, res.refreshToken);
      navigate('/dashboard');
    } catch {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
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
          <div
            style={{
              width: '80px',
              height: '80px',
              background: 'var(--primary-blue)',
              borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
            }}
          >
            🦈
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '8px' }}>
            학생 생활기록부 관리
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-gray)' }}>STUDENT RECORD MANAGEMENT SYSTEM</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              사용자 구분
            </label>
            <select
              required
              value={form.userType}
              onChange={(e) => setForm({ ...form, userType: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-gray)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: "'Noto Sans KR', sans-serif",
                background: 'white',
                outline: 'none',
              }}
            >
              <option value="">선택하세요</option>
              <option value="teacher">교사</option>
              <option value="student">학생</option>
              <option value="parent">학부모</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              아이디
            </label>
            <input
              type="text"
              required
              placeholder="아이디를 입력하세요"
              value={form.loginId}
              onChange={(e) => setForm({ ...form, loginId: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-gray)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: "'Noto Sans KR', sans-serif",
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
              비밀번호
            </label>
            <input
              type="password"
              required
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid var(--border-gray)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: "'Noto Sans KR', sans-serif",
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '12px 16px',
                background: '#fdecea',
                color: 'var(--danger-red)',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '16px',
                borderLeft: '4px solid var(--danger-red)',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: isLoading ? 'var(--text-gray)' : 'var(--primary-blue)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="#" style={{ color: 'var(--primary-blue)', textDecoration: 'none', fontSize: '14px' }}>
              비밀번호 찾기
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
