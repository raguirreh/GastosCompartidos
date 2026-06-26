import { Button, Card, Modal, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '../../../shared/components/Avatar';
import { buildWhatsAppPaymentRequestUrl, buildWhatsAppWebPaymentRequestUrl } from '../../../shared/utils/invite';
import { formatMoney, getCurrencySymbol } from '../../../shared/utils/format';
import { openWhatsApp } from '../../../shared/utils/share';
import { useBalancesStore } from '../../../store/balancesStore';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useProfilesStore } from '../../../store/profilesStore';
import { useUserStore } from '../../../store/userStore';
import type { Settlement } from '../../../shared/utils/debtSimplification';

interface SettlementEntry {
  groupId: string;
  otherUserId: string;
  amount: number; // positivo: te deben, negativo: debes
  currency: string;
}

export function BalancesScreen() {
  const currentUser = useUserStore((s) => s.currentUser);
  const groups = useGroupsStore((s) => s.groups);
  const fetchGroups = useGroupsStore((s) => s.fetchGroups);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const recalculateForGroup = useBalancesStore((s) => s.recalculateForGroup);
  const settlementsByGroup = useBalancesStore((s) => s.settlementsByGroup);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  const recordPayment = useExpensesStore((s) => s.recordPayment);

  const [dialogEntry, setDialogEntry] = useState<SettlementEntry | null>(null);
  const [dialogAction, setDialogAction] = useState<'request' | 'register' | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.uid).catch(() => {
        // Si falla, la lista de saldos queda vacía.
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

  useEffect(() => {
    for (const group of groups) {
      const expenses = expensesByGroup[group.id] ?? [];
      recalculateForGroup(group.id, expenses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, expensesByGroup]);

  const settlements: SettlementEntry[] = useMemo(() => {
    if (!currentUser) return [];
    const entries: SettlementEntry[] = [];
    for (const group of groups) {
      const groupSettlements: Settlement[] = settlementsByGroup[group.id] ?? [];
      for (const settlement of groupSettlements) {
        if (settlement.toUserId === currentUser.uid) {
          entries.push({
            groupId: group.id,
            otherUserId: settlement.fromUserId,
            amount: settlement.amount,
            currency: group.currency,
          });
        } else if (settlement.fromUserId === currentUser.uid) {
          entries.push({
            groupId: group.id,
            otherUserId: settlement.toUserId,
            amount: -settlement.amount,
            currency: group.currency,
          });
        }
      }
    }
    return entries;
  }, [groups, settlementsByGroup, currentUser]);

  const owedToMe = useMemo(() => settlements.filter((s) => s.amount > 0), [settlements]);
  const owedByMe = useMemo(() => settlements.filter((s) => s.amount < 0), [settlements]);
  const netTotalsByCurrency = useMemo(() => {
    const result: Record<string, number> = {};
    for (const s of settlements) {
      result[s.currency] = (result[s.currency] ?? 0) + s.amount;
    }
    return Object.entries(result).filter(([, amount]) => amount !== 0);
  }, [settlements]);

  const closeDialog = () => {
    setDialogEntry(null);
    setDialogAction(null);
  };

  const handleRequestPayment = (entry: SettlementEntry) => {
    const debtor = profiles[entry.otherUserId];
    const group = groups.find((g) => g.id === entry.groupId);
    if (!debtor || !group) return;

    const nativeUrl = buildWhatsAppPaymentRequestUrl(
      debtor.name,
      Math.abs(entry.amount),
      getCurrencySymbol(group.currency),
      group.name
    );
    const webUrl = buildWhatsAppWebPaymentRequestUrl(
      debtor.name,
      Math.abs(entry.amount),
      getCurrencySymbol(group.currency),
      group.name
    );
    openWhatsApp(nativeUrl, webUrl).catch(() => {
      // Si WhatsApp no está instalado, no hacemos nada más.
    });
    closeDialog();
  };

  const handleRegisterPayment = async (entry: SettlementEntry) => {
    if (!currentUser) return;
    setIsRegistering(true);
    try {
      await recordPayment({
        groupId: entry.groupId,
        fromUserId: currentUser.uid,
        toUserId: entry.otherUserId,
        amount: Math.abs(entry.amount),
        currency: entry.currency,
      });
      closeDialog();
    } finally {
      setIsRegistering(false);
    }
  };

  const renderEntry = (entry: SettlementEntry, type: 'owed' | 'owe') => {
    const other = profiles[entry.otherUserId];
    const group = groups.find((g) => g.id === entry.groupId);
    if (!other || !group) return null;

    return (
      <Card key={`${entry.groupId}-${entry.otherUserId}`} size="small" style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Avatar emoji={other.emoji} color={other.avatarColor} size={40} />
          <div style={{ flex: 1 }}>
            <div>{other.name}</div>
            <div style={{ fontSize: 12, opacity: 0.6 }}>{group.name}</div>
          </div>
          <Typography.Text
            strong
            style={{
              color: type === 'owed' ? 'var(--ant-color-success, #52c41a)' : 'var(--ant-color-error, #ff4d4f)',
            }}
          >
            <span aria-hidden="true">{type === 'owed' ? '↑ ' : '↓ '}</span>
            {formatMoney(Math.abs(entry.amount), group.currency)} {type === 'owed' ? '(a tu favor)' : '(debes)'}
          </Typography.Text>
        </div>
        <Button
          type="text"
          size="small"
          onClick={() => {
            setDialogEntry(entry);
            setDialogAction(type === 'owed' ? 'request' : 'register');
          }}
        >
          {type === 'owed' ? 'Solicitar pago' : 'Registrar pago'}
        </Button>
      </Card>
    );
  };

  return (
    <div style={{ padding: 16, paddingBottom: 32 }} role="main">
      <Typography.Title level={1} style={{ fontSize: 22, marginBottom: 16 }}>
        Saldos
      </Typography.Title>

      <Card style={{ marginBottom: 24 }}>
        <Typography.Text type="secondary">Saldo neto total</Typography.Text>
        {netTotalsByCurrency.length === 0 ? (
          <Typography.Title level={2} style={{ margin: 0 }}>
            {formatMoney(0, 'PEN')}
          </Typography.Title>
        ) : (
          netTotalsByCurrency.map(([currency, netTotal]) => (
            <Typography.Title
              key={currency}
              level={2}
              style={{
                margin: 0,
                color: netTotal >= 0 ? 'var(--ant-color-success, #52c41a)' : 'var(--ant-color-error, #ff4d4f)',
              }}
            >
              <span aria-hidden="true">{netTotal >= 0 ? '↑ ' : '↓ '}</span>
              {formatMoney(netTotal, currency)} {netTotal >= 0 ? '(a tu favor)' : '(debes)'}
            </Typography.Title>
          ))
        )}
      </Card>

      <Typography.Title level={2} style={{ fontSize: 16, marginBottom: 12 }}>
        Te deben
      </Typography.Title>
      {owedToMe.length === 0 && <Typography.Text type="secondary">Nadie te debe dinero ahora.</Typography.Text>}
      {owedToMe.map((entry) => renderEntry(entry, 'owed'))}

      <Typography.Title level={2} style={{ fontSize: 16, marginBottom: 12, marginTop: 16 }}>
        Debes
      </Typography.Title>
      {owedByMe.length === 0 && <Typography.Text type="secondary">No le debes dinero a nadie ahora.</Typography.Text>}
      {owedByMe.map((entry) => renderEntry(entry, 'owe'))}

      <Modal
        open={dialogEntry !== null}
        onCancel={closeDialog}
        title={dialogAction === 'request' ? 'Solicitar pago' : 'Registrar pago'}
        onOk={() => {
          if (!dialogEntry) return;
          if (dialogAction === 'request') {
            handleRequestPayment(dialogEntry);
          } else {
            handleRegisterPayment(dialogEntry);
          }
        }}
        okText="Confirmar"
        okButtonProps={{ loading: isRegistering }}
        cancelText="Cancelar"
      >
        <Typography.Text>
          {dialogAction === 'request'
            ? `Se abrirá WhatsApp para recordarle a ${profiles[dialogEntry?.otherUserId ?? '']?.name} que te debe dinero.`
            : `Esto marcará la deuda con ${profiles[dialogEntry?.otherUserId ?? '']?.name} como pagada.`}
        </Typography.Text>
      </Modal>
    </div>
  );
}
