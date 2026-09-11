import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { clients, appointments } = useShopStore();
  const [search, setSearch] = useState('');
  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    if (!query) return clients;
    return clients.filter((client) =>
      client.name.toLocaleLowerCase('pt-BR').includes(query) || client.phone.includes(query),
    );
  }, [clients, search]);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 94 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        eyebrow="Relacionamento"
        title="Seus clientes."
        trailing={
          <Pressable onPress={() => router.push('/clients/new')} style={[styles.add, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={19} color={colors.primaryForeground} />
          </Pressable>
        }
      />
      <View style={[styles.search, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar cliente"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
      </View>
      {clients.length === 0 ? (
        <EmptyState icon="users" title="Sua base começa aqui" description="Cadastre seus clientes e acompanhe o histórico de cada um." />
      ) : filteredClients.length === 0 ? (
        <EmptyState icon="search" title="Cliente não encontrado" description="Tente buscar por outro nome ou telefone." />
      ) : (
        <View style={styles.list}>
          {filteredClients.map((client) => {
            const visits = appointments.filter((appointment) => appointment.clientId === client.id).length;
            return (
              <Pressable
                key={client.id}
                onPress={() => router.push({ pathname: '/clients/[id]', params: { id: client.id } })}
                style={({ pressed }) => [
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>{client.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{client.name}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {client.phone || 'Sem telefone'} · {visits} {visits === 1 ? 'atendimento' : 'atendimentos'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  add: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  search: { minHeight: 48, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 18 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 12 },
  list: { gap: 10 },
  card: { minHeight: 76, borderRadius: 18, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700' },
  cardInfo: { flex: 1, gap: 5 },
  name: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});