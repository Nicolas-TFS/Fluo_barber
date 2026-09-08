import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColors } from '@/hooks/useColors';

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 94 }}><ScreenHeader eyebrow="Relacionamento" title="Seus clientes." trailing={<Pressable onPress={() => router.push('/clients/new')} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={19} color={colors.primaryForeground} /></Pressable>} /><View style={[styles.search, { backgroundColor: colors.input, borderColor: colors.border }]}><Feather name="search" size={17} color={colors.mutedForeground} /><Text style={[styles.searchText, { color: colors.mutedForeground }]}>Buscar cliente</Text></View><EmptyState icon="users" title="Sua base começa aqui" description="Salve preferências, histórico e observações para atender cada cliente melhor." /></ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  add: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  search: { minHeight: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 },
  searchText: { fontSize: 13 },
});