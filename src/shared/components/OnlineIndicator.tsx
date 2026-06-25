import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

/** Indicador visual de estado de conexión (online/offline), usado en HomeScreen. */
export function OnlineIndicator() {
  const { isOnline } = useNetworkStatus();
  const theme = useTheme();
  const color = isOnline ? theme.colors.tertiary : theme.colors.error;

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {isOnline ? 'En línea' : 'Sin conexión'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
