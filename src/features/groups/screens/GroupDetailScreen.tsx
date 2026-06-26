import { ArrowLeftOutlined, PlusOutlined, SearchOutlined, SettingOutlined, UserAddOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Modal, Segmented, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { InviteModal } from '../../../shared/components/InviteModal';
import { mockCategories, paymentCategory } from '../../../shared/constants/categories';
import { computeGroupSettlements } from '../../../shared/utils/debtSimplification';
import { formatDate, formatMoney } from '../../../shared/utils/format';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useProfilesStore } from '../../../store/profilesStore';
import { useUserStore } from '../../../store/userStore';

type TabKey = 'expenses' | 'balances' | 'members';

const EMOJI_OPTIONS = ['🏠', '🏔️', '🍖', '✈️', '🎉', '🚗', '💼', '🎓'];
const CURRENCIES = ['PEN', 'USD', 'EUR', 'MXN', 'ARS', 'COP'];

export function GroupDetailScreen() {
  const navigate = useNavigate();
  const { groupId = '' } = useParams<{ groupId: string }>();
  const [tab, setTab] = useState<TabKey>('expenses');
  const [inviteVisible, setInviteVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const getGroupById = useGroupsStore((s) => s.getGroupById);
  const updateGroup = useGroupsStore((s) => s.updateGroup);
  const leaveGroup = useGroupsStore((s) => s.leaveGroup);
  const group = getGroupById(groupId);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const recordPayment = useExpensesStore((s) => s.recordPayment);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);
  const currentUser = useUserStore((s) => s.currentUser);
  const [payingSettlement, setPayingSettlement] = useState<number | null>(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editCurrency, setEditCurrency] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');

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

  const filteredExpenses = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return groupExpenses.filter((expense) => {
      if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
      if (query && !expense.description.toLowerCase().includes(query) && !expense.notes.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });
  }, [groupExpenses, searchText, categoryFilter]);

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

  const openSettings = () => {
    setEditName(group.name);
    setEditEmoji(group.emoji);
    setEditCurrency(group.currency);
    setSettingsError('');
    setSettingsVisible(true);
  };

  const handleSaveSettings = async () => {
    if (!editName.trim()) return;
    setSettingsError('');
    setIsSavingSettings(true);
    try {
      await updateGroup(groupId, { name: editName.trim(), emoji: editEmoji, currency: editCurrency });
      setSettingsVisible(false);
    } catch {
      setSettingsError('No pudimos guardar los cambios. Inténtalo de nuevo.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLeaveGroup = () => {
    if (!currentUser) return;
    Modal.confirm({
      title: 'Salir del grupo',
      content: '¿Seguro que quieres salir de este grupo? Dejarás de ver sus gastos y saldos.',
      okText: 'Salir',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        setIsLeaving(true);
        try {
          await leaveGroup(groupId, currentUser.uid);
          setSettingsVisible(false);
          navigate('/app/groups', { replace: true });
        } finally {
          setIsLeaving(false);
        }
      },
    });
  };

  const handleRecordPayment = (index: number, fromUserId: string, toUserId: string, amount: number) => {
    Modal.confirm({
      title: 'Registrar pago',
      content: `¿Confirmas que se registró un pago de ${formatMoney(amount, group.currency)}?`,
      okText: 'Registrar',
      cancelText: 'Cancelar',
      onOk: async () => {
        setPayingSettlement(index);
        try {
          await recordPayment({ groupId, fromUserId, toUserId, amount, currency: group.currency });
        } finally {
          setPayingSettlement(null);
        }
      },
    });
  };

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
        {!group.isDirect && (
          <Button type="text" icon={<SettingOutlined />} aria-label="Configuración del grupo" onClick={openSettings} />
        )}
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
          {groupExpenses.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <Input
                placeholder="Buscar gastos"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                style={{ flex: 1 }}
              />
              <Select
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: 'Todas' },
                  ...mockCategories.map((cat) => ({ value: cat.value, label: cat.label })),
                  { value: 'payment', label: paymentCategory.label },
                ]}
              />
            </div>
          )}
          {groupExpenses.length === 0 && (
            <Typography.Text type="secondary">Todavía no hay gastos en este grupo.</Typography.Text>
          )}
          {groupExpenses.length > 0 && filteredExpenses.length === 0 && (
            <Typography.Text type="secondary">No hay gastos que coincidan con la búsqueda.</Typography.Text>
          )}
          {filteredExpenses.map((expense) => {
            const payer = profiles[expense.paidBy];
            const isPayment = expense.category === 'payment';
            const category = isPayment ? paymentCategory : mockCategories.find((c) => c.value === expense.category);
            return (
              <Card
                key={expense.id}
                size="small"
                style={{ marginBottom: 8, cursor: isPayment ? 'default' : 'pointer' }}
                onClick={isPayment ? undefined : () => navigate(`/app/groups/${groupId}/expenses/${expense.id}`)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {payer && <Avatar emoji={payer.emoji} color={payer.avatarColor} size={40} />}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isPayment ? 'Pago registrado' : expense.description}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {payer?.name ?? 'Alguien'} pagó · {category?.label} · {formatDate(expense.date)}
                    </div>
                  </div>
                  <Typography.Text strong style={isPayment ? { color: 'var(--ant-color-success, #52c41a)' } : undefined}>
                    {formatMoney(expense.amount, expense.currency)}
                  </Typography.Text>
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
                {currentUser && (settlement.fromUserId === currentUser.uid || settlement.toUserId === currentUser.uid) && (
                  <Button
                    size="small"
                    style={{ marginTop: 8 }}
                    block
                    loading={payingSettlement === index}
                    onClick={() =>
                      handleRecordPayment(index, settlement.fromUserId, settlement.toUserId, settlement.amount)
                    }
                  >
                    Registrar pago
                  </Button>
                )}
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

      <Modal
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        title="Configuración del grupo"
        footer={null}
      >
        <Form layout="vertical" disabled={isSavingSettings}>
          <Form.Item label="Nombre del grupo">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </Form.Item>

          <Typography.Text strong>Emoji</Typography.Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '8px 0 16px' }}>
            {EMOJI_OPTIONS.map((option) => (
              <Button
                key={option}
                type={option === editEmoji ? 'primary' : 'default'}
                onClick={() => setEditEmoji(option)}
                style={{ minWidth: 48 }}
                aria-label={`Emoji ${option}`}
              >
                {option}
              </Button>
            ))}
          </div>

          <Form.Item label="Moneda">
            <Select
              value={editCurrency}
              onChange={setEditCurrency}
              options={CURRENCIES.map((option) => ({ value: option, label: option }))}
              style={{ width: 160 }}
            />
          </Form.Item>

          {settingsError.length > 0 && <Alert type="error" message={settingsError} style={{ marginBottom: 16 }} />}

          <Button
            type="primary"
            block
            onClick={handleSaveSettings}
            disabled={!editName.trim() || isSavingSettings}
            loading={isSavingSettings}
            style={{ marginBottom: 8 }}
          >
            Guardar cambios
          </Button>
          <Button danger block onClick={handleLeaveGroup} loading={isLeaving}>
            Salir del grupo
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
