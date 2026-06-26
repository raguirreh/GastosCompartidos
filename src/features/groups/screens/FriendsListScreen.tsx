import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { computeGroupSettlements } from '../../../shared/utils/debtSimplification';
import { formatMoney } from '../../../shared/utils/format';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useProfilesStore } from '../../../store/profilesStore';
import { useUserStore } from '../../../store/userStore';

export function FriendsListScreen() {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const groups = useGroupsStore((s) => s.groups);
  const fetchGroups = useGroupsStore((s) => s.fetchGroups);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  const friendGroups = useMemo(() => groups.filter((g) => g.isDirect), [groups]);

  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.uid).catch(() => {
        // Si falla la carga, la lista queda vacía y el usuario puede reintentar.
      });
    }
  }, [currentUser, fetchGroups]);

  useEffect(() => {
    friendGroups.forEach((group) => {
      fetchExpenses(group.id).catch(() => {
        // Ignoramos errores individuales por amigo.
      });
    });
    const allMemberIds = friendGroups.flatMap((g) => g.memberIds);
    if (allMemberIds.length > 0) {
      ensureProfiles(allMemberIds).catch(() => {
        // Si falla, los avatares simplemente no se resuelven aún.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendGroups]);

  const balances = useMemo(() => {
    const result: Record<string, number> = {};
    if (!currentUser) return result;
    for (const group of friendGroups) {
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
  }, [friendGroups, expensesByGroup, currentUser]);

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <div role="banner" style={{ paddingBottom: 8 }}>
        <Typography.Title level={1} style={{ fontSize: 22 }}>
          Amigos
        </Typography.Title>
      </div>

      <div role="main">
        {friendGroups.length === 0 && (
          <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: 48 }}>
            Todavía no tienes amigos agregados. Invita a alguien para empezar.
          </Typography.Text>
        )}

        {friendGroups.map((group) => {
          const balance = balances[group.id] ?? 0;
          const friendId = group.memberIds.find((id) => id !== currentUser?.uid);
          const friend = friendId ? profiles[friendId] : undefined;
          const pending = !friend;

          return (
            <Card
              key={group.id}
              hoverable
              onClick={() => navigate(`/app/groups/${group.id}`)}
              role="button"
              aria-label={friend?.name ?? 'Invitación pendiente'}
              style={{ marginBottom: 12 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {friend ? (
                  <Avatar emoji={friend.emoji} color={friend.avatarColor} size={40} />
                ) : (
                  <div style={{ fontSize: 32 }} aria-hidden="true">
                    🧑
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Typography.Text strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {friend?.name ?? 'Invitación pendiente'}
                  </Typography.Text>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {pending ? (
                    <Typography.Text type="secondary">Esperando...</Typography.Text>
                  ) : balance === 0 ? (
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
        aria-label="Agregar amigo"
        onClick={() => navigate('/app/friends/new')}
        style={{ position: 'fixed', right: 16, bottom: 72, width: 56, height: 56 }}
      />
    </div>
  );
}
