import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../../../services/supabase/auth';

export function LogoutScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    signOut()
      .catch(() => {
        // Si falla el signOut remoto, igual limpiamos el almacenamiento local abajo.
      })
      .finally(() => {
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      Cerrando sesión...
    </div>
  );
}
