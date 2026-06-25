import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface AvatarProps {
  emoji?: string;
  label?: string;
  color: string;
  size?: number;
}

/** Avatar circular simple: muestra un emoji o, si no hay, las iniciales del nombre. */
export function Avatar({ emoji, label, color, size = 40 }: AvatarProps) {
  const content = emoji ?? label ?? '?';

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={{ fontSize: size * 0.45 }}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
