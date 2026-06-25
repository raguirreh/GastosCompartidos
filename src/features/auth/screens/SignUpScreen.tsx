import { Alert, Button, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signUp } from '../../../services/supabase/auth';

interface FormValues {
  email: string;
  password: string;
}

export function SignUpScreen() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const handleSubmit = async (values: FormValues) => {
    setError('');
    setIsSubmitting(true);
    try {
      const { needsEmailConfirmation } = await signUp(values.email.trim(), values.password);
      if (needsEmailConfirmation) {
        setNeedsConfirmation(true);
      }
      // Si hay sesión inmediata, el listener de onAuthStateChange en main.tsx
      // se encarga de navegar a ProfileSetup automáticamente.
    } catch {
      setError('No pudimos crear tu cuenta. Intenta con otro correo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (needsConfirmation) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <Typography.Title level={3}>Revisa tu correo</Typography.Title>
          <Typography.Paragraph type="secondary">
            Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
          </Typography.Paragraph>
          <Button type="primary" block onClick={() => navigate('/login')} style={{ height: 48 }}>
            Ir a iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>
          Crea tu cuenta
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
            extra="Mínimo 6 caracteres."
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>

          {error.length > 0 && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isSubmitting} style={{ height: 48 }}>
              Crear cuenta
            </Button>
          </Form.Item>
        </Form>

        <Button type="text" block onClick={() => navigate('/login')} style={{ marginTop: 8 }}>
          ¿Ya tienes cuenta? Inicia sesión
        </Button>
      </div>
    </div>
  );
}
