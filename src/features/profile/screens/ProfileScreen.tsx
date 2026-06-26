import { ExportOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Card, Switch, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { signOut } from '../../../services/supabase/auth';
import { formatMoney } from '../../../shared/utils/format';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useUserStore } from '../../../store/userStore';

function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const themePreference = useUserStore((s) => s.themePreference);
  const toggleTheme = useUserStore((s) => s.toggleTheme);
  const groups = useGroupsStore((s) => s.groups);
  const fetchGroups = useGroupsStore((s) => s.fetchGroups);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);

  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(currentUser?.name ?? '');
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.uid).catch(() => {
        // Si falla, las estadísticas simplemente quedan vacías.
      });
    }
  }, [currentUser, fetchGroups]);

  useEffect(() => {
    groups.forEach((group) => {
      fetchExpenses(group.id).catch(() => {
        // Ignoramos errores individuales por grupo.
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const realGroups = useMemo(() => groups.filter((g) => !g.isDirect), [groups]);

  const userExpenses = useMemo(() => {
    if (!currentUser) return [];
    return Object.values(expensesByGroup)
      .flat()
      .filter(
        (expense) =>
          expense.category !== 'payment' &&
          (expense.paidBy === currentUser.uid || expense.splits.some((s) => s.userId === currentUser.uid))
      );
  }, [expensesByGroup, currentUser]);

  const spentByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    if (!currentUser) return result;
    for (const expense of userExpenses) {
      if (expense.paidBy !== currentUser.uid) continue;
      result[expense.currency] = (result[expense.currency] ?? 0) + expense.amount;
    }
    return result;
  }, [userExpenses, currentUser]);

  const handleSaveName = () => {
    if (nameDraft.trim()) {
      updateProfile({ name: nameDraft.trim() });
    }
    setIsEditing(false);
  };

  const handleExportCSV = () => {
    if (userExpenses.length === 0) {
      message.info('No tienes gastos para exportar todavía.');
      return;
    }
    const header = ['Fecha', 'Grupo', 'Descripción', 'Categoría', 'Monto', 'Moneda', 'Pagado por'];
    const rows = userExpenses
      .slice()
      .sort((a, b) => b.date - a.date)
      .map((expense) => {
        const group = groups.find((g) => g.id === expense.groupId);
        return [
          new Date(expense.date).toISOString().slice(0, 10),
          group?.name ?? '',
          expense.description,
          expense.category,
          expense.amount.toFixed(2),
          expense.currency,
          expense.paidBy === currentUser?.uid ? 'Yo' : expense.paidBy,
        ]
          .map((field) => escapeCsvField(String(field)))
          .join(',');
      });
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gastos-compartidos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: Object.keys(spentByCurrency).length > 0 ? 12 : 0 }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {realGroups.length}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Grupos
            </Typography.Text>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {userExpenses.length}
            </Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Gastos
            </Typography.Text>
          </div>
        </div>
        {Object.entries(spentByCurrency).map(([currency, amount]) => (
          <div key={currency} style={{ textAlign: 'center' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Pagado por ti en {currency}: <strong>{formatMoney(amount, currency)}</strong>
            </Typography.Text>
          </div>
        ))}
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
