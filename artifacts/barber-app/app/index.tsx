import { useAuth } from '@clerk/expo';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useShopStore } from '@/contexts/AppContext';

export default function Index() {
  const colors = useColors();
  const { isSignedIn, isLoaded } = useAuth();
  const { profile, ready } = useShopStore();

  if (!isLoaded || !ready) {
    return <View style={[styles.container, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;
  if (!profile) return <Redirect href="/setup" />;
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' } });