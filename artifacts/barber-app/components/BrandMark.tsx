import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function BrandMark({ size = 42 }: { size?: number }) {
  const colors = useColors();
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.3, backgroundColor: colors.accent }]}>
      <Feather name="scissors" size={size * 0.46} color={colors.accentForeground} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center' },
});