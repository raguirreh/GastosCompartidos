import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Avatar } from './Avatar';

interface StackedAvatarsProps {
  members: Array<{ emoji: string; color: string }>;
  size?: number;
  max?: number;
}

/** Avatares apilados (overlap) para mostrar miembros de un grupo de forma compacta. */
export function StackedAvatars({ members, size = 28, max = 4 }: StackedAvatarsProps) {
  const visible = members.slice(0, max);
  const remaining = members.length - visible.length;

  return (
    <View style={styles.row}>
      {visible.map((member, index) => (
        <View key={index} style={[styles.avatarWrapper, { marginLeft: index === 0 ? 0 : -size * 0.3 }]}>
          <Avatar emoji={member.emoji} color={member.color} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View style={[styles.avatarWrapper, { marginLeft: -size * 0.3 }]}>
          <Avatar label={`+${remaining}`} color="#D9E2EC" size={size} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 100,
  },
});
