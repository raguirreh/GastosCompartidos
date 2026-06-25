import { ExportOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Card, Switch, Typography, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { signOut } from '../../../services/supabase/auth';
import { useUserStore } from '../../../store/userStore';

const mockStats = {
  totalGroups: 3,
  totalExpenses: 4,
  totalSpent: 1990,
};

export function ProfileScreen() {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const themePreference = useUserStore((s) => s.themePreference);
  const toggleTheme = useUserStore((s) => s.toggleTheme);

  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(currentUser?.name ?? '');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSaveName = () => {
    if (nameDraft.trim()) {
      updateProfile({ name: nameDraft.trim() });
    }
    setIsEditing(false);
  };

  const handleExportCSV = () => {
    message.info('Esta función todavía no está implementada. Próximamente podrás exportar tus gastos a un archivo CSV.');
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div style={{ padding: 16, paddingBottom: 32 }}>
      <Typography.Title level={1} style={{ fontSize: 22, marginBottom: 24 }}>
        Perfil
      </Typography.Title>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {currentUser && <Avatar emoji={currentUser.emoji} color={currentUser.avatarColor} size={72} />}
        <div style={{ flex: 1 }}>
          {isEditing ? (
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              style={{ marginBottom: 4, padding: '4px 8px', fontSize: 16, width: '100%' }}
            />
          ) : (
            <Typography.Text style={{ fontSize: 18 }}>{currentUser?.name ?? 'Usuario'}</Typography.Text>
          )}
          <Button type="text" size="small" onClick={() => (isEditing ? handleSaveName() : setIsEditing(true))}>
            {isEditing ? 'Guardar' : 'Editar nombre'}
          </Button>
        </div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {mockStats.totalGroups}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Grupos
            </Typography.Text>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {mockStats.totalExpenses}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Gastos
            </Typography.Text>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              S/.{mockStats.totalSpent}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Total
            </Typography.Text>
          </div>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Tema oscuro</span>
          <Switch checked={themePreference === 'dark'} onChange={toggleTheme} />
        </div>
      </Card>

      <Button icon={<ExportOutlined />} block onClick={handleExportCSV} style={{ marginBottom: 12 }}>
        Exportar gastos a CSV
      </Button>

      <Button
        danger
        icon={<LogoutOutlined />}
        block
        onClick={handleSignOut}
        loading={isSigningOut}
        style={{ marginBottom: 12 }}
      >
        Cerrar sesión
      </Button>
    </div>
  );
}
