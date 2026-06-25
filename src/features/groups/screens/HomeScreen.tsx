import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { OnlineIndicator } from '../../../shared/components/OnlineIndicator';
import { computeGroupSettlements } from '../../../shared/utils/debtSimplification';
import { formatMoney, formatRelativeDate, getCurrencySymbol } from '../../../shared/utils/format';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useProfilesStore } from '../../../store/profilesStore';
import { useUserStore } from '../../../store/userStore';

export function HomeScreen() {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const groups = useGroupsStore((s) => s.groups);
  const fetchGroups = useGroupsStore((s) => s.fetchGroups);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.uid).catch(() => {
        // Si falla, la pantalla simplemente queda vacía.
      });
    }
  }, [currentUser, fetchGroups]);

  useEffect(() => {
    groups.forEach((group) => {
      fetchExpenses(group.id).catch(() => {
        // Ignoramos errores individuales por grupo.
      });
    });
    const allMemberIds = groups.flatMap((g) => g.memberIds);
    if (allMemberIds.length > 0) {
      ensureProfiles(allMemberIds).catch(() => {
        // Si falla, los avatares simplemente no se resuelven aún.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  const allExpenses = useMemo(() => Object.values(expensesByGroup).flat(), [expensesByGroup]);

  const { owed, owe, net } = useMemo(() => {
    if (!currentUser) return { owed: 0, owe: 0, net: 0 };
    let totalOwed = 0;
    let totalOwe = 0;
    for (const group of groups) {
      const expenses = expensesByGroup[group.id] ?? [];
      const settlements = computeGroupSettlements(
        expenses.map((expense) => ({
          paidBy: expense.paidBy,
          amount: expense.amount,
          splits: expense.splits.map((s) => ({ userId: s.userId, amount: s.amount })),
        }))
      );
      for (const settlement of settlements) {
        if (settlement.toUserId === currentUser.uid) totalOwed += settlement.amount;
        if (settlement.fromUserId === currentUser.uid) totalOwe += settlement.amount;
      }
    }
    return { owed: totalOwed, owe: totalOwe, net: totalOwed - totalOwe };
  }, [groups, expensesByGroup, currentUser]);

  const recentActivity = useMemo(
    () => [...allExpenses].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4),
    [allExpenses]
  );

  return (
    <div style={{ padding: 16, paddingBottom: 96 }} role="main">
      <div
        role="banner"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
      >
        <div>
          <Typography.Title level={1} style={{ fontSize: 18, margin: 0 }}>
            Hola, {currentUser?.name ?? 'Usuario'} {currentUser?.emoji}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Esto es lo que pasa con tu dinero
          </Typography.Text>
        </div>
        <OnlineIndicator />
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Typography.Text type="secondary">Tu balance neto</Typography.Text>
        <Typography.Title
          level={2}
          style={{ color: net >= 0 ? 'var(--ant-color-success, #52c41a)' : 'var(--ant-color-error, #ff4d4f)' }}
        >
          <span aria-hidden="true">{net >= 0 ? '↑ ' : '↓ '}</span>
          {formatMoney(net, 'PEN')} {net >= 0 ? '(a tu favor)' : '(debes)'}
        </Typography.Title>
        <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Te deben
            </Typography.Text>
            <div style={{ color: 'var(--ant-color-success, #52c41a)', fontWeight: 600 }}>
              <span aria-hidden="true">↑ </span>
              {formatMoney(owed, 'PEN')} (a tu favor)
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Debes
            </Typography.Text>
            <div style={{ color: 'var(--ant-color-error, #ff4d4f)', fontWeight: 600 }}>
              <span aria-hidden="true">↓ </span>
              {formatMoney(owe, 'PEN')} (debes)
            </div>
          </div>
        </div>
      </Card>

      <Typography.Title level={2} style={{ fontSize: 16, marginBottom: 12 }}>
        Tus grupos
      </Typography.Title>
      {groups.length === 0 ? (
        <Typography.Text type="secondary">Todavía no tienes grupos. Crea uno para empezar.</Typography.Text>
      ) : (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', marginBottom: 24 }}>
          {groups.map((group) => (
            <Card
              key={group.id}
              hoverable
              onClick={() => navigate(`/app/groups/${group.id}`)}
              role="button"
              aria-label={`${group.name}, ${group.memberIds.length} miembros`}
              style={{ minWidth: 140 }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }} aria-hidden="true">
                {group.emoji}
              </div>
              <Typography.Text strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {group.name}
              </Typography.Text>
              <div style={{ fontSize: 12, opacity: 0.6 }}>{group.memberIds.length} miembros</div>
            </Card>
          ))}
        </div>
      )}

      <Typography.Title level={2} style={{ fontSize: 16, marginBottom: 12 }}>
        Actividad reciente
      </Typography.Title>
      {recentActivity.length === 0 && (
        <Typography.Text type="secondary">Todavía no hay actividad.</Typography.Text>
      )}
      {recentActivity.map((expense) => {
        const payer = profiles[expense.paidBy];
        const group = groups.find((g) => g.id === expense.groupId);
        return (
          <Card key={expense.id} size="small" style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {payer && <Avatar emoji={payer.emoji} color={payer.avatarColor} size={36} />}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {payer?.name ?? 'Alguien'} pagó <strong>{expense.description}</strong>
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {group?.name} · {formatRelativeDate(expense.createdAt)}
                </div>
              </div>
              <Typography.Text strong>
                {getCurrencySymbol(expense.currency)}
                {expense.amount.toFixed(2)}
              </Typography.Text>
            </div>
          </Card>
        );
      })}

      {groups.length > 0 && (
        <Button
          type="primary"
          shape="circle"
          icon={<PlusOutlined />}
          size="large"
          aria-label="Agregar gasto"
          onClick={() => navigate(`/app/groups/${groups[0].id}/add-expense`)}
          style={{ position: 'fixed', right: 16, bottom: 72, width: 56, height: 56 }}
        />
      )}
    </div>
  );
}
