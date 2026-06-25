import { GoogleOutlined } from '@ant-design/icons';
import { Alert, Button, Form, Input, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithGoogle, signInWithPassword } from '../../../services/supabase/auth';

interface FormValues {
  email: string;
  password: string;
}

export function LoginScreen() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (values: FormValues) => {
    setError('');
    setIsSubmitting(true);
    try {
      await signInWithPassword(values.email.trim(), values.password);
      // El listener de onAuthStateChange en main.tsx se encarga del resto.
    } catch {
      setError('No pudimos iniciar tu sesión. Revisa tu correo y contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      // En web esto redirige a Google; el listener de onAuthStateChange en
      // main.tsx se encarga del resto al volver.
    } catch {
      setError('No pudimos iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setIsGoogleSubmitting(false);
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

        <Button
          icon={<GoogleOutlined />}
          block
          onClick={handleGoogleSignIn}
          disabled={isSubmitting || isGoogleSubmitting}
          loading={isGoogleSubmitting}
          style={{ marginTop: 16, height: 48 }}
        >
          Continuar con Google
        </Button>
      </div>
    </div>
  );
}
