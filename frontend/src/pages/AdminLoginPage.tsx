import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../hooks/useAuth';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await client.post('/auth/admin/login', { email: form.loginId, password: form.password });
      const { user, accessToken, refreshToken } = res.data.data;
      login(user, accessToken, refreshToken);
      navigate('/admin/users');
    } catch {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a',
    }}>
      <div style={{
        background: '#1e293b', borderRadius: '12px',
        border: '1px solid #334155',
        width: '100%', maxWidth: '400px', padding: '40px 36px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '44px', height: '44px', borderRadius: '10px',
            background: '#3b82f6', marginBottom: '14px',
          }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
            학교 담당자 로그인
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '6px' }}>
            학교 담당자 전용 페이지입니다.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              아이디
            </label>
            <input
              type="text" required
              placeholder="아이디를 입력하세요"
              value={form.loginId}
              onChange={e => setForm(prev => ({ ...prev, loginId: e.target.value }))}
              style={{
                width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
                fontSize: '14px', color: '#f1f5f9', outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
              비밀번호
            </label>
            <input
              type="password" required
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              style={{
                width: '100%', padding: '11px 14px', boxSizing: 'border-box',
                background: '#0f172a', border: '1px solid #334155', borderRadius: '8px',
                fontSize: '14px', color: '#f1f5f9', outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
              fontSize: '13px', color: '#f87171', marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={isLoading}
            style={{
              width: '100%', padding: '12px',
              background: isLoading ? '#1d4ed8' : '#3b82f6',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
