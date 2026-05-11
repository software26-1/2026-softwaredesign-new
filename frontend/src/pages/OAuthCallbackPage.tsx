import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function getRoleHome(role?: string) {
  switch (role) {
    case 'ADMIN':   return '/admin/users';
    case 'TEACHER': return '/dashboard';
    case 'STUDENT': return '/my-grades';
    case 'PARENT':  return '/child-grades';
    default:        return '/dashboard';
  }
}

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const tempToken = params.get('tempToken');
    const refreshToken = params.get('refreshToken');
    const isNewUser = params.get('isNewUser') === 'true';

    if (isNewUser && tempToken) {
      localStorage.setItem('accessToken', tempToken);
      navigate('/profile-setup');
      return;
    }

    const status = params.get('status');
    if (status === 'waiting_approval') {
      navigate('/waiting-approval');
      return;
    }

    if (!accessToken) {
      navigate('/login');
      return;
    }

    const userStr = params.get('user');
    const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;
    login(user, accessToken, refreshToken ?? '');
    navigate(getRoleHome(user?.role));
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <p>로그인 처리 중...</p>
    </div>
  );
}
