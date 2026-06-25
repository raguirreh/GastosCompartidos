import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';

export function SplashScreen() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 1100));

    let cancelled = false;
    const waitForAuth = () =>
      new Promise<void>((resolve) => {
        const check = () => {
          if (!useAuthStore.getState().isAuthLoading && !useUserStore.getState().isProfileLoading) {
            resolve();
            return;
          }
          setTimeout(check, 50);
        };
        check();
      });

    Promise.all([minDelay, waitForAuth()]).then(() => {
      if (cancelled) return;
      const currentSession = useAuthStore.getState().session;
      if (!currentSession) {
        navigate('/login', { replace: true });
        return;
      }
      if (!useUserStore.getState().hasCompletedOnboarding) {
        navigate('/onboarding', { replace: true });
        return;
      }
      if (!useUserStore.getState().currentUser) {
        navigate('/profile-setup', { replace: true });
      } else {
        navigate('/app/home', { replace: true });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--ant-color-primary, #1677ff)',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 600ms ease, transform 600ms ease',
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16 }}>💸</div>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 24 }}>Gastos Compartidos</div>
        <div style={{ color: '#fff', opacity: 0.85, marginTop: 4 }}>Divide gastos, no amistades</div>
      </div>
    </div>
  );
}
