import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const isNewUser = params.get('isNewUser') === 'true';

    if (!accessToken) {
      navigate('/login');
      return;
    }

    if (isNewUser) {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      navigate('/profile-setup');
    } else {
      const userStr = params.get('user');
      const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
      login(user, accessToken, refreshToken ?? '');
      navigate('/dashboard');
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}
