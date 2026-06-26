import { Button, Spin, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { joinGroupByInviteToken, resolveInviteToken } from '../../../services/supabase/api';
import { useAuthStore } from '../../../store/authStore';

interface InvitePreview {
  id: string;
  name: string;
  emoji: string;
  currency: string;
  isDirect: boolean;
}

export function JoinGroupScreen() {
  const navigate = useNavigate();
  const { token = '' } = useParams<{ token: string }>();
  const session = useAuthStore((s) => s.session);
  const setPendingInviteToken = useAuthStore((s) => s.setPendingInviteToken);

  const [isLoading, setIsLoading] = useState(true);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    resolveInviteToken(token)
      .then((result) => {
        if (cancelled) return;
        if (!result) {
          setError('Esta invitación ya no es válida.');
        } else {
          setPreview(result);
        }
      })
      .catch(() => {
        if (!cancelled) setError('No pudimos cargar esta invitación.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCreateAccountToJoin = () => {
    setPendingInviteToken(token);
    navigate('/signup');
  };

  const handleJoin = async () => {
    setIsJoining(true);
    setError('');
    try {
      await joinGroupByInviteToken(token);
      navigate('/app/home');
    } catch {
      setError('No pudimos unirte al grupo. Intenta de nuevo.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
        {isLoading && <Spin style={{ marginTop: 48 }} />}

        {!isLoading && error.length > 0 && (
          <Typography.Text type="danger">{error}</Typography.Text>
        )}

        {!isLoading && preview && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{preview.isDirect ? '🧑' : preview.emoji}</div>
            <Typography.Title level={4}>
              {preview.isDirect
                ? 'Te han invitado a compartir gastos contigo'
                : `Te han invitado a unirte a ${preview.emoji} ${preview.name}`}
            </Typography.Title>

            {session ? (
              <Button
                type="primary"
                block
                onClick={handleJoin}
                loading={isJoining}
                disabled={isJoining}
                style={{ marginTop: 8, height: 48 }}
              >
                {preview.isDirect ? 'Aceptar y empezar' : 'Unirme al grupo'}
              </Button>
            ) : (
              <>
                <Typography.Paragraph type="secondary">
                  Para unirte necesitas crear una cuenta primero.
                </Typography.Paragraph>
                <Button type="primary" block onClick={handleCreateAccountToJoin} style={{ height: 48 }}>
                  Crear cuenta para unirme
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
