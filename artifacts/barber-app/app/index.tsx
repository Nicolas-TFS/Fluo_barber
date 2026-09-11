import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useShopStore } from '@/contexts/AppContext';
import { PrimaryButton } from '@/components/PrimaryButton';

export default function Index() {
  const colors = useColors();
  const { isSignedIn, isLoaded } = useAuth();
  const { profile, ready, retrySync, syncError } = useShopStore();

  if (!isLoaded || !ready) {
    return <View style={[styles.container, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (syncError) {
    return (
      <View style={[styles.container, styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Não foi possível abrir sua conta</Text>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>{syncError}</Text>
        <View style={styles.retryButton}><PrimaryButton label="Tentar novamente" onPress={retrySync} /></View>
      </View>
    );
  }
  if (!profile) return <Redirect href="/setup" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { paddingHorizontal: 28, gap: 12 },
  errorTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  errorText: { fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retryButton: { width: '100%', marginTop: 8 },
});