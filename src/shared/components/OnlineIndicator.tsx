import { useNetworkStatus } from '../hooks/useNetworkStatus';

/** Indicador visual de estado de conexión (online/offline), usado en HomeScreen. */
export function OnlineIndicator() {
  const { isOnline } = useNetworkStatus();
  const color = isOnline ? 'var(--ant-color-success, #52c41a)' : 'var(--ant-color-error, #ff4d4f)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <span style={{ fontSize: 12, opacity: 0.7 }}>{isOnline ? 'En línea' : 'Sin conexión'}</span>
    </div>
  );
}
