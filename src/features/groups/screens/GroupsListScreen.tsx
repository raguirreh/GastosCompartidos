import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { StackedAvatars } from '../../../shared/components/StackedAvatars';
import { computeGroupSettlements } from '../../../shared/utils/debtSimplification';
import { formatMoney } from '../../../shared/utils/format';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useProfilesStore } from '../../../store/profilesStore';
import { useUserStore } from '../../../store/userStore';

export function GroupsListScreen() {
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
        // Si falla la carga, la lista queda vacía y el usuario puede reintentar.
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

  const groupBalances = useMemo(() => {
    const result: Record<string, number> = {};
    if (!currentUser) return result;
    for (const group of groups) {
      const expenses = expensesByGroup[group.id] ?? [];
      const settlements = computeGroupSettlements(
        expenses.map((expense) => ({
          paidBy: expense.paidBy,
          amount: expense.amount,
          splits: expense.splits.map((s) => ({ userId: s.userId, amount: s.amount })),
        }))
      );
      let net = 0;
      for (const settlement of settlements) {
        if (settlement.toUserId === currentUser.uid) net += settlement.amount;
        if (settlement.fromUserId === currentUser.uid) net -= settlement.amount;
      }
      result[group.id] = net;
    }
    return result;
  }, [groups, expensesByGroup, currentUser]);

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <div role="banner" style={{ paddingBottom: 8 }}>
        <Typography.Title level={1} style={{ fontSize: 22 }}>
          Grupos
        </Typography.Title>
      </div>

      <div role="main">
        {groups.length === 0 && (
          <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 48 }}>
            Todavía no tienes grupos. Crea uno para empezar.
          </Typography.Text>
        )}

        {groups.map((group) => {
          const balance = groupBalances[group.id] ?? 0;
          const members = group.memberIds
            .map((id) => profiles[id])
            .filter((u): u is NonNullable<typeof u> => Boolean(u))
            .map((u) => ({ emoji: u.emoji, color: u.avatarColor }));

          return (
            <Card
              key={group.id}
              hoverable
              onClick={() => navigate(`/app/groups/${group.id}`)}
              role="button"
              aria-label={group.name}
              style={{ marginBottom: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 32 }} aria-hidden="true">
                  {group.emoji}
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
                  <Typography.Text strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {group.name}
                  </Typography.Text>
                  <StackedAvatars members={members} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  {balance === 0 ? (
                    <Typography.Text type="secondary">Saldado</Typography.Text>
                  ) : (
                    <Typography.Text
                      strong
                      style={{
                        color: balance > 0 ? 'var(--ant-color-success, #52c41a)' : 'var(--ant-color-error, #ff4d4f)',
                      }}
                    >
                      <span aria-hidden="true">{balance > 0 ? '↑ ' : '↓ '}</span>
                      {formatMoney(balance, group.currency)} {balance > 0 ? '(a tu favor)' : '(debes)'}
                    </Typography.Text>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Button
        type="primary"
        shape="circle"
        icon={<PlusOutlined />}
        size="large"
        aria-label="Crear grupo"
        onClick={() => navigate('/app/groups/new')}
        style={{ position: 'fixed', right: 16, bottom: 72, width: 56, height: 56 }}
      />
    </div>
  );
}
