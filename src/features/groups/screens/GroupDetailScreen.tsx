import { ArrowLeftOutlined, PlusOutlined, UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Segmented, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { InviteModal } from '../../../shared/components/InviteModal';
import { mockCategories } from '../../../shared/constants/categories';
import { computeGroupSettlements } from '../../../shared/utils/debtSimplification';
import { formatDate, formatMoney } from '../../../shared/utils/format';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useProfilesStore } from '../../../store/profilesStore';

type TabKey = 'expenses' | 'balances' | 'members';

export function GroupDetailScreen() {
  const navigate = useNavigate();
  const { groupId = '' } = useParams<{ groupId: string }>();
  const [tab, setTab] = useState<TabKey>('expenses');
  const [inviteVisible, setInviteVisible] = useState(false);

  const getGroupById = useGroupsStore((s) => s.getGroupById);
  const group = getGroupById(groupId);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  useEffect(() => {
    fetchExpenses(groupId).catch(() => {
      // Si falla, la lista de gastos queda vacía.
    });
  }, [groupId, fetchExpenses]);

  useEffect(() => {
    if (group) {
      ensureProfiles(group.memberIds).catch(() => {
        // Si falla, los avatares simplemente no se resuelven aún.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  const groupExpenses = useMemo(() => expensesByGroup[groupId] ?? [], [expensesByGroup, groupId]);

  const settlements = useMemo(
    () =>
      computeGroupSettlements(
        groupExpenses.map((expense) => ({
          paidBy: expense.paidBy,
          amount: expense.amount,
          splits: expense.splits.map((s) => ({ userId: s.userId, amount: s.amount })),
        }))
      ),
    [groupExpenses]
  );

  if (!group) {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Text type="secondary">No pudimos encontrar este grupo.</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 96 }}>
      <div role="banner" style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} aria-label="Volver" onClick={() => navigate(-1)} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Typography.Title
            level={1}
            aria-label={group.name}
            style={{ fontSize: 18, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {group.emoji} {group.name}
          </Typography.Title>
        </div>
        <Button
          type="text"
          icon={<UserAddOutlined />}
          aria-label="Invitar miembro"
          onClick={() => setInviteVisible(true)}
        />
      </div>

      <Segmented
        value={tab}
        onChange={(value) => setTab(value as TabKey)}
        block
        style={{ marginBottom: 16 }}
        options={[
          { value: 'expenses', label: 'Gastos' },
          { value: 'balances', label: 'Saldos' },
          { value: 'members', label: 'Miembros' },
        ]}
      />

      {tab === 'expenses' && (
        <div role="main">
          {groupExpenses.length === 0 && (
            <Typography.Text type="secondary">Todavía no hay gastos en este grupo.</Typography.Text>
          )}
          {groupExpenses.map((expense) => {
            const payer = profiles[expense.paidBy];
            const category = mockCategories.find((c) => c.value === expense.category);
            return (
              <Card key={expense.id} size="small" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {payer && <Avatar emoji={payer.emoji} color={payer.avatarColor} size={40} />}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {expense.description}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {payer?.name ?? 'Alguien'} pagó · {category?.label} · {formatDate(expense.date)}
                    </div>
                  </div>
                  <Typography.Text strong>{formatMoney(expense.amount, expense.currency)}</Typography.Text>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'balances' && (
        <div role="main">
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            Pagos sugeridos (mínimo de transacciones)
          </Typography.Text>
          {settlements.length === 0 && (
            <Typography.Text type="secondary">Este grupo está saldado. ¡Buen trabajo!</Typography.Text>
          )}
          {settlements.map((settlement, index) => {
            const from = profiles[settlement.fromUserId];
            const to = profiles[settlement.toUserId];
            return (
              <Card key={index} size="small" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {from && <Avatar emoji={from.emoji} color={from.avatarColor} size={32} />}
                  <div style={{ flex: 1 }}>
                    <strong>{from?.name}</strong> le debe a <strong>{to?.name}</strong>
                  </div>
                  {to && <Avatar emoji={to.emoji} color={to.avatarColor} size={32} />}
                </div>
                <Typography.Text style={{ color: 'var(--ant-color-error, #ff4d4f)' }}>
                  <span aria-hidden="true">↓ </span>
                  {formatMoney(settlement.amount, group.currency)} (deuda pendiente)
                </Typography.Text>
              </Card>
            );
          })}
        </div>
      )}

      {tab === 'members' && (
        <div role="main">
          {group.memberIds.map((memberId) => {
            const member = profiles[memberId];
            if (!member) return null;
            return (
              <Card key={memberId} size="small" style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar emoji={member.emoji} color={member.avatarColor} size={40} />
                  <span>{member.name}</span>
                  {memberId === group.createdBy && (
                    <Typography.Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>
                      Admin
                    </Typography.Text>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Button
        type="primary"
        shape="circle"
        icon={<PlusOutlined />}
        size="large"
        aria-label="Agregar gasto"
        onClick={() => navigate(`/app/groups/${groupId}/add-expense`)}
        style={{ position: 'fixed', right: 16, bottom: 72, width: 56, height: 56 }}
      />

      <InviteModal
        visible={inviteVisible}
        onDismiss={() => setInviteVisible(false)}
        inviteToken={group.inviteToken}
        groupName={group.name}
      />
    </div>
  );
}
