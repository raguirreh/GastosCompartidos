import { Alert, Button, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPassword } from '../../../services/supabase/auth';
import { joinGroupByInviteToken } from '../../../services/supabase/api';
import { useAuthStore } from '../../../store/authStore';

interface FormValues {
  email: string;
  password: string;
}

export function LoginScreen() {
  const navigate = useNavigate();
  const pendingInviteToken = useAuthStore((s) => s.pendingInviteToken);
  const setPendingInviteToken = useAuthStore((s) => s.setPendingInviteToken);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values: FormValues) => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithPassword(values.email.trim(), values.password);
      if (pendingInviteToken) {
        try {
          await joinGroupByInviteToken(pendingInviteToken);
        } catch {
          // El token podría haber expirado o ya estar usado: no bloqueamos el flujo.
        } finally {
          setPendingInviteToken(null);
        }
        navigate('/app/home', { replace: true });
      }
      // Si no había invitación pendiente, el listener de onAuthStateChange en main.tsx se encarga del resto.
    } catch {
      setError('No pudimos iniciar tu sesión. Revisa tu correo y contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>
          Inicia sesión
        </Typography.Title>

        <Form layout="vertical" onFinish={handleSubmit} disabled={isSubmitting}>
          <Form.Item
            name="email"
            label="Correo"
            rules={[{ required: true, type: 'email', message: 'Ingresa un correo válido' }]}
          >
            <Input autoComplete="email" inputMode="email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Contraseña"
            rules={[{ required: true, min: 6, message: 'Mínimo 6 caracteres' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>

          {error.length > 0 && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isSubmitting} style={{ height: 48 }}>
              Entrar
            </Button>
          </Form.Item>
        </Form>

        <Button type="text" block onClick={() => navigate('/signup')} style={{ marginTop: 8 }}>
          ¿No tienes cuenta? Crea una
        </Button>
      </div>
    </div>
  );
}
