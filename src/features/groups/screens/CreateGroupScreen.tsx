import { Alert, Button, Form, Input, Select, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupsStore } from '../../../store/groupsStore';
import { useUserStore } from '../../../store/userStore';

const EMOJI_OPTIONS = ['🏠', '🏔️', '🍖', '✈️', '🎉', '🚗', '💼', '🎓'];
const CURRENCIES = ['PEN', 'USD', 'EUR', 'MXN', 'ARS', 'COP'];

export function CreateGroupScreen() {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const createGroup = useGroupsStore((s) => s.createGroup);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [currency, setCurrency] = useState('PEN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !currentUser) return;

    setError('');
    setIsSubmitting(true);
    try {
      const group = await createGroup({
        name: name.trim(),
        emoji,
        currency,
        createdBy: currentUser.uid,
      });
      navigate(`/app/groups/${group.id}`, { replace: true });
    } catch {
      setError('No pudimos crear el grupo. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <Typography.Title level={3} style={{ marginBottom: 24 }}>
          Crear grupo
        </Typography.Title>

        <Form layout="vertical" disabled={isSubmitting}>
          <Form.Item label="Nombre del grupo">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Viaje a la playa" />
          </Form.Item>

          <Typography.Text strong>Emoji</Typography.Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 16px' }}>
            {EMOJI_OPTIONS.map((option) => (
              <Button
                key={option}
                type={option === emoji ? 'primary' : 'default'}
                onClick={() => setEmoji(option)}
                style={{ minWidth: 48 }}
                aria-label={`Emoji ${option}`}
              >
                {option}
              </Button>
            ))}
          </div>

          <Form.Item label="Moneda">
            <Select
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES.map((option) => ({ value: option, label: option }))}
              style={{ width: 160 }}
            />
          </Form.Item>

          {error.length > 0 && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

          <Button
            type="primary"
            block
            onClick={handleCreate}
            disabled={!name.trim() || isSubmitting}
            loading={isSubmitting}
            style={{ height: 48 }}
          >
            Crear grupo
          </Button>
        </Form>
      </div>
    </div>
  );
}
