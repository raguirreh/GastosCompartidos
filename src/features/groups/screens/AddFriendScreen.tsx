import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InviteModal } from '../../../shared/components/InviteModal';
import { useGroupsStore } from '../../../store/groupsStore';
import { useUserStore } from '../../../store/userStore';
import type { Group } from '../../../shared/types';

export function AddFriendScreen() {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const createGroup = useGroupsStore((s) => s.createGroup);

  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [friendGroup, setFriendGroup] = useState<Group | null>(null);

  const handleCreate = async () => {
    if (!currentUser) return;
    setError('');
    setIsCreating(true);
    try {
      const group = await createGroup({
        name: 'Amigo',
        emoji: '🧑',
        currency: 'PEN',
        createdBy: currentUser.uid,
        isDirect: true,
      });
      setFriendGroup(group);
    } catch {
      setError('No pudimos crear la invitación. Inténtalo de nuevo.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <Button type="text" icon={<ArrowLeftOutlined />} aria-label="Volver" onClick={() => navigate(-1)} />
          <Typography.Title level={3} style={{ margin: 0, flex: 1 }}>
            Agregar amigo
          </Typography.Title>
        </div>

        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Genera un link o código QR de invitación para empezar a compartir gastos 1 a 1, sin necesidad de un grupo.
        </Typography.Text>

        {error.length > 0 && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

        <Button type="primary" block onClick={handleCreate} loading={isCreating} style={{ height: 48 }}>
          Generar invitación
        </Button>
      </div>

      {friendGroup && (
        <InviteModal
          visible={Boolean(friendGroup)}
          onDismiss={() => navigate('/app/friends', { replace: true })}
          inviteToken={friendGroup.inviteToken}
          groupName="tu amigo"
        />
      )}
    </div>
  );
}
