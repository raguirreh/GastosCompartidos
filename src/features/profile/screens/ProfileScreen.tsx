import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Dialog, Portal, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import { Avatar } from '../../../shared/components/Avatar';
import { resetDatabase } from '../../../services/database/client';
import { useUserStore } from '../../../store';

const mockStats = {
  totalGroups: 3,
  totalExpenses: 4,
  totalSpent: 1990,
};

export function ProfileScreen() {
  const theme = useTheme();
  const currentUser = useUserStore((s) => s.currentUser);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const themePreference = useUserStore((s) => s.themePreference);
  const toggleTheme = useUserStore((s) => s.toggleTheme);
  const clearUser = useUserStore((s) => s.clearUser);

  const [isEditing, setIsEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(currentUser?.name ?? '');
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleSaveName = () => {
    if (nameDraft.trim()) {
      updateProfile({ name: nameDraft.trim() });
    }
    setIsEditing(false);
  };

  const handleExportCSV = () => {
    Alert.alert(
      'Exportar CSV',
      'Esta función todavía no está implementada. Próximamente podrás exportar tus gastos a un archivo CSV.'
    );
  };

  const handleClearLocalData = async () => {
    setIsClearing(true);
    try {
      await resetDatabase();
      clearUser();
      setClearDialogVisible(false);
    } catch (err) {
      Alert.alert('Error', 'No pudimos limpiar tus datos locales. Inténtalo de nuevo.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          Perfil
        </Text>

        <View style={styles.profileHeader}>
          {currentUser && <Avatar emoji={currentUser.emoji} color={currentUser.avatarColor} size={72} />}
          <View style={styles.profileInfo}>
            {isEditing ? (
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                mode="outlined"
                dense
                style={styles.nameInput}
                onSubmitEditing={handleSaveName}
              />
            ) : (
              <Text variant="titleLarge">{currentUser?.name ?? 'Usuario'}</Text>
            )}
            <Button
              mode="text"
              compact
              onPress={() => (isEditing ? handleSaveName() : setIsEditing(true))}
            >
              {isEditing ? 'Guardar' : 'Editar nombre'}
            </Button>
          </View>
        </View>

        <Card style={styles.statsCard} mode="outlined">
          <Card.Content style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="titleMedium">{mockStats.totalGroups}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Grupos</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="titleMedium">{mockStats.totalExpenses}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Gastos</Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="titleMedium">S/.{mockStats.totalSpent}</Text>
              <Text variant="bodySmall" style={styles.statLabel}>Total</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.optionCard} mode="outlined">
          <Card.Content style={styles.optionRow}>
            <Text variant="bodyMedium">Tema oscuro</Text>
            <Switch value={themePreference === 'dark'} onValueChange={toggleTheme} />
          </Card.Content>
        </Card>

        <Button mode="outlined" onPress={handleExportCSV} style={styles.actionButton} icon="file-export">
          Exportar gastos a CSV
        </Button>

        <Button
          mode="outlined"
          onPress={() => setClearDialogVisible(true)}
          style={styles.actionButton}
          textColor={theme.colors.error}
          icon="trash-can-outline"
        >
          Limpiar datos locales
        </Button>
      </ScrollView>

      <Portal>
        <Dialog visible={clearDialogVisible} onDismiss={() => setClearDialogVisible(false)}>
          <Dialog.Title>Limpiar datos locales</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Esto borrará todos tus grupos, gastos y tu perfil guardados en este dispositivo. Esta acción no se puede deshacer.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearDialogVisible(false)}>Cancelar</Button>
            <Button onPress={handleClearLocalData} loading={isClearing} textColor={theme.colors.error}>
              Borrar todo
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 24,
    fontWeight: '700',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  profileInfo: {
    flex: 1,
  },
  nameInput: {
    marginBottom: 4,
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    opacity: 0.6,
    marginTop: 2,
  },
  optionCard: {
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    marginBottom: 12,
  },
});
