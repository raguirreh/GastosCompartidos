import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Modal, Segmented, Select, Typography } from 'antd';
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
  const { groupId = '', expenseId } = useParams<{ groupId: string; expenseId?: string }>();
  const isEditing = Boolean(expenseId);
  const currentUser = useUserStore((s) => s.currentUser);
  const addExpense = useExpensesStore((s) => s.addExpense);
  const updateExpense = useExpensesStore((s) => s.updateExpense);
  const deleteExpense = useExpensesStore((s) => s.deleteExpense);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const getGroupById = useGroupsStore((s) => s.getGroupById);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  const group = getGroupById(groupId);
  const existingExpense = useMemo(
    () => (expenseId ? (expensesByGroup[groupId] ?? []).find((e) => e.id === expenseId) : undefined),
    [expensesByGroup, groupId, expenseId]
  );

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

  const [description, setDescription] = useState(existingExpense?.description ?? '');
  const [amount, setAmount] = useState(existingExpense ? String(existingExpense.amount) : '');
  const [paidBy, setPaidBy] = useState(
    existingExpense?.paidBy ?? currentUser?.uid ?? members[0]?.uid ?? ''
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [category, setCategory] = useState<ExpenseCategory>(existingExpense?.category ?? 'food');
  const [notes, setNotes] = useState(existingExpense?.notes ?? '');
  const [participantIds, setParticipantIds] = useState<string[]>(
    existingExpense ? existingExpense.splits.map((s) => s.userId) : group?.memberIds ?? []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (group && !isEditing) setParticipantIds(group.memberIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, isEditing]);

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
      if (isEditing && expenseId) {
        await updateExpense({
          id: expenseId,
          groupId,
          description: description.trim(),
          amount: numericAmount,
          currency: group.currency,
          paidBy,
          category,
          date: existingExpense?.date ?? Date.now(),
          notes,
          createdBy: currentUser.uid,
          splitMode,
          participantIds,
        });
      } else {
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
      }
      navigate(-1);
    } catch {
      setError(isEditing ? 'No pudimos guardar los cambios. Inténtalo de nuevo.' : 'No pudimos agregar el gasto. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!expenseId) return;
    Modal.confirm({
      title: 'Eliminar gasto',
      content: '¿Seguro que quieres eliminar este gasto? Esta acción no se puede deshacer.',
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        setIsDeleting(true);
        try {
          await deleteExpense(groupId, expenseId);
          navigate(-1);
        } catch {
          setError('No pudimos eliminar el gasto. Inténtalo de nuevo.');
        } finally {
          setIsDeleting(false);
        }
      },
    });
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
        <Typography.Title level={1} style={{ fontSize: 20, margin: 0, flex: 1 }}>
          {isEditing ? 'Editar gasto' : 'Agregar gasto'}
        </Typography.Title>
        {isEditing && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            aria-label="Eliminar gasto"
            onClick={handleDelete}
            loading={isDeleting}
          />
        )}
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
        {isEditing ? 'Guardar cambios' : 'Agregar gasto'}
      </Button>
      {error.length > 0 && (
        <Alert type="error" message={error} style={{ marginTop: 16 }} />
      )}
    </div>
  );
}
