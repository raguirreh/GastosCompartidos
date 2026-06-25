import { Alert, Button, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { joinGroupByInviteToken, upsertProfile } from '../../../services/supabase/api';
import { useAuthStore } from '../../../store/authStore';
import { useUserStore } from '../../../store/userStore';

const EMOJI_OPTIONS = ['🧑', '👩', '🧔', '👩‍🦱', '🧑‍🦰', '👨‍🦲', '🧓', '🐱'];
const COLOR_OPTIONS = ['#D3E6F5', '#FCE4EC', '#E1F5E5', '#FFF3E0', '#E8E1F5', '#D9F0F5'];

export function ProfileSetupScreen() {
  const navigate = useNavigate();
  const setCurrentUser = useUserStore((s) => s.setCurrentUser);
  const session = useAuthStore((s) => s.session);
  const pendingInviteToken = useAuthStore((s) => s.pendingInviteToken);
  const setPendingInviteToken = useAuthStore((s) => s.setPendingInviteToken);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    if (!session?.user.id) {
      setError('Tu sesión expiró. Inicia sesión de nuevo.');
      navigate('/login', { replace: true });
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const user = {
        uid: session.user.id,
        name: name.trim(),
        emoji,
        avatarColor: color,
        createdAt: Date.now(),
      };

      await upsertProfile(user);
      setCurrentUser(user);

      if (pendingInviteToken) {
        try {
          await joinGroupByInviteToken(pendingInviteToken);
        } catch {
          // El token podría haber expirado o ya estar usado: no bloqueamos el flujo.
        } finally {
          setPendingInviteToken(null);
        }
      }

      navigate('/app/home', { replace: true });
    } catch {
      setError('No pudimos guardar tu perfil. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>
          Cuéntanos sobre ti
        </Typography.Title>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <Avatar emoji={emoji} color={color} size={88} />
        </div>

        <Form layout="vertical" disabled={isSubmitting}>
          <Form.Item label="¿Cómo te llamas?">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Form.Item>

          <Typography.Text strong>Elige un avatar</Typography.Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 16px' }}>
            {EMOJI_OPTIONS.map((option) => (
              <Button
                key={option}
                type={option === emoji ? 'primary' : 'default'}
                onClick={() => setEmoji(option)}
                style={{ minWidth: 48 }}
                aria-label={`Avatar ${option}`}
              >
                {option}
              </Button>
            ))}
          </div>

          <Typography.Text strong>Elige un color</Typography.Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 16px' }}>
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={`Color ${option}`}
                onClick={() => setColor(option)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: option,
                  border: option === color ? '3px solid var(--ant-color-primary, #1677ff)' : '1px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>

          {error.length > 0 && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

          <Button
            type="primary"
            block
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            loading={isSubmitting}
            style={{ height: 48 }}
          >
            Entrar a la app
          </Button>
        </Form>
      </div>
    </div>
  );
}
