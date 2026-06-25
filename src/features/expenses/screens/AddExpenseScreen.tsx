import { ArrowLeftOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Segmented, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { mockCategories } from '../../../shared/constants/categories';
import type { ExpenseCategory, SplitMode } from '../../../shared/types';
import { formatDate } from '../../../shared/utils/format';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useProfilesStore } from '../../../store/profilesStore';
import { useUserStore } from '../../../store/userStore';

export function AddExpenseScreen() {
  const navigate = useNavigate();
  const { groupId = '' } = useParams<{ groupId: string }>();
  const currentUser = useUserStore((s) => s.currentUser);
  const addExpense = useExpensesStore((s) => s.addExpense);
  const getGroupById = useGroupsStore((s) => s.getGroupById);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  const group = getGroupById(groupId);

  useEffect(() => {
    if (group) {
      ensureProfiles(group.memberIds).catch(() => {
        // Si falla, los miembros simplemente no se resuelven aún.
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  const members = useMemo(
    () =>
      (group?.memberIds ?? [])
        .map((id) => profiles[id])
        .filter((u): u is NonNullable<typeof u> => Boolean(u)),
    [group, profiles]
  );

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(currentUser?.uid ?? members[0]?.uid ?? '');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [notes, setNotes] = useState('');
  const [participantIds, setParticipantIds] = useState<string[]>(group?.memberIds ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group) setParticipantIds(group.memberIds);
  }, [group]);

  const numericAmount = parseFloat(amount.replace(',', '.')) || 0;

  const toggleParticipant = (userId: string) => {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!description.trim() || numericAmount <= 0 || !paidBy || participantIds.length === 0) return;
    if (!currentUser || !group) return;

    setError('');
    setIsSubmitting(true);
    try {
      await addExpense({
        groupId,
        description: description.trim(),
        amount: numericAmount,
        currency: group.currency,
        paidBy,
        category,
        date: Date.now(),
        notes,
        createdBy: currentUser.uid,
        splitMode,
        participantIds,
      });
      navigate(-1);
    } catch {
      setError('No pudimos agregar el gasto. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = description.trim().length > 0 && numericAmount > 0 && participantIds.length > 0 && Boolean(group);

  if (!group) {
    return (
      <div style={{ padding: 16 }}>
        <Typography.Text type="secondary">No pudimos encontrar este grupo.</Typography.Text>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, paddingBottom: 48 }} role="main">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} aria-label="Volver" onClick={() => navigate(-1)} />
        <Typography.Title level={1} style={{ fontSize: 20, margin: 0 }}>
          Agregar gasto
        </Typography.Title>
      </div>

      <Input
        placeholder="Ej. Almuerzo en el centro"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={{ marginBottom: 16 }}
        size="large"
      />

      <Input
        addonBefore={group.currency}
        placeholder="Monto"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        style={{ marginBottom: 16 }}
        size="large"
      />

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        ¿Quién pagó?
      </Typography.Text>
      <Select
        value={paidBy || undefined}
        onChange={(value) => setPaidBy(value)}
        style={{ width: '100%', marginBottom: 16 }}
        placeholder="Selecciona"
        options={members.map((member) => ({
          value: member.uid,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar emoji={member.emoji} color={member.avatarColor} size={20} />
              {member.name}
            </div>
          ),
        }))}
      />

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Dividir entre
      </Typography.Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {members.map((member) => {
          const selected = participantIds.includes(member.uid);
          return (
            <Button
              key={member.uid}
              type={selected ? 'primary' : 'default'}
              shape="round"
              size="small"
              onClick={() => toggleParticipant(member.uid)}
            >
              {member.emoji} {member.name}
            </Button>
          );
        })}
      </div>

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Modo de división
      </Typography.Text>
      <Segmented
        value={splitMode}
        onChange={(value) => setSplitMode(value as SplitMode)}
        block
        style={{ marginBottom: 8 }}
        options={[
          { value: 'equal', label: 'Igual' },
          { value: 'percentage', label: '%' },
          { value: 'exact', label: 'Exacto' },
          { value: 'shares', label: 'Shares' },
        ]}
      />
      {splitMode !== 'equal' && (
        <Typography.Text type="secondary" style={{ display: 'block', fontSize: 12, marginBottom: 16 }}>
          El detalle por persona para este modo se ajusta luego desde el detalle del gasto. Por ahora se aplica
          división igual como base.
        </Typography.Text>
      )}

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Categoría
      </Typography.Text>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {mockCategories.map((cat) => (
          <Button
            key={cat.value}
            type={category === cat.value ? 'primary' : 'default'}
            shape="round"
            size="small"
            onClick={() => setCategory(cat.value)}
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Fecha
      </Typography.Text>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        {formatDate(Date.now())}
      </Typography.Text>

      <Input.TextArea
        placeholder="Notas (opcional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        style={{ marginBottom: 16 }}
      />

      <Button type="primary" block size="large" onClick={handleSubmit} disabled={!canSubmit} loading={isSubmitting}>
        Agregar gasto
      </Button>
      {error.length > 0 && (
        <Alert type="error" message={error} style={{ marginTop: 16 }} />
      )}
    </div>
  );
}
