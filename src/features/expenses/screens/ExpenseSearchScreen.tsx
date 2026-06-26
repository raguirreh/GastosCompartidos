import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Input, Select, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../../shared/components/Avatar';
import { mockCategories, paymentCategory } from '../../../shared/constants/categories';
import { formatDate, formatMoney } from '../../../shared/utils/format';
import { useExpensesStore } from '../../../store/expensesStore';
import { useGroupsStore } from '../../../store/groupsStore';
import { useProfilesStore } from '../../../store/profilesStore';
import { useUserStore } from '../../../store/userStore';

export function ExpenseSearchScreen() {
  const navigate = useNavigate();
  const currentUser = useUserStore((s) => s.currentUser);
  const groups = useGroupsStore((s) => s.groups);
  const fetchGroups = useGroupsStore((s) => s.fetchGroups);
  const expensesByGroup = useExpensesStore((s) => s.expensesByGroup);
  const fetchExpenses = useExpensesStore((s) => s.fetchExpenses);
  const profiles = useProfilesStore((s) => s.profiles);
  const ensureProfiles = useProfilesStore((s) => s.ensureProfiles);

  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  useEffect(() => {
    if (currentUser) {
      fetchGroups(currentUser.uid).catch(() => {
        // Si falla, la búsqueda simplemente queda vacía.
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

  const filteredExpenses = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return allExpenses
      .filter((expense) => {
        if (groupFilter !== 'all' && expense.groupId !== groupFilter) return false;
        if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
        if (query && !expense.description.toLowerCase().includes(query) && !expense.notes.toLowerCase().includes(query)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date - a.date);
  }, [allExpenses, searchText, categoryFilter, groupFilter]);

  return (
    <div style={{ padding: 16, paddingBottom: 32 }} role="main">
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} aria-label="Volver" onClick={() => navigate(-1)} />
        <Typography.Title level={1} style={{ fontSize: 20, margin: 0, flex: 1 }}>
          Buscar gastos
        </Typography.Title>
      </div>

      <Input
        placeholder="Buscar por descripción o notas"
        prefix={<SearchOutlined />}
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
        style={{ marginBottom: 12 }}
        size="large"
        autoFocus
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <Select
          value={groupFilter}
          onChange={setGroupFilter}
          style={{ flex: 1 }}
          options={[
            { value: 'all', label: 'Todos los grupos' },
            ...groups.map((group) => ({ value: group.id, label: `${group.emoji} ${group.name}` })),
          ]}
        />
        <Select
          value={categoryFilter}
          onChange={setCategoryFilter}
          style={{ flex: 1 }}
          options={[
            { value: 'all', label: 'Todas las categorías' },
            ...mockCategories.map((cat) => ({ value: cat.value, label: cat.label })),
            { value: 'payment', label: paymentCategory.label },
          ]}
        />
      </div>

      {filteredExpenses.length === 0 && (
        <Typography.Text type="secondary">No encontramos gastos que coincidan.</Typography.Text>
      )}

      {filteredExpenses.map((expense) => {
        const payer = profiles[expense.paidBy];
        const group = groups.find((g) => g.id === expense.groupId);
        const isPayment = expense.category === 'payment';
        const category = isPayment ? paymentCategory : mockCategories.find((c) => c.value === expense.category);
        return (
          <Card
            key={expense.id}
            size="small"
            style={{ marginBottom: 8, cursor: isPayment ? 'default' : 'pointer' }}
            onClick={isPayment ? undefined : () => navigate(`/app/groups/${expense.groupId}/expenses/${expense.id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {payer && <Avatar emoji={payer.emoji} color={payer.avatarColor} size={40} />}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isPayment ? 'Pago registrado' : expense.description}
                </div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>
                  {group?.name ?? ''} · {payer?.name ?? 'Alguien'} pagó · {category?.label} · {formatDate(expense.date)}
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
  );
}
