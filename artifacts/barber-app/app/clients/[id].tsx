import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function ClientDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients, appointments, services } = useShopStore();
  const [month, setMonth] = useState(() => new Date());
  const client = clients.find((item) => item.id === id);
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month);

  const clientAppointments = useMemo(() => {
    if (!client) return [];
    return appointments
      .filter((appointment) => {
        return appointment.clientId === client.id && appointment.date.startsWith(monthKey(month)) && appointment.status !== 'cancelled';
      })
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [appointments, client, month]);

  if (!client) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Cliente', headerShown: true, headerTintColor: colors.foreground, headerStyle: { backgroundColor: colors.background } }} />
        <EmptyState icon="user-x" title="Cliente não encontrado" description="Esse cadastro não está mais disponível." />
      </View>
    );
  }

  const completed = clientAppointments.filter((appointment) => appointment.status === 'completed');
  const revenue = completed.reduce((total, appointment) => total + appointment.amount, 0);

  const changeMonth = (offset: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <>
      <Stack.Screen options={{ title: client.name, headerShown: true, headerTintColor: colors.foreground, headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.foreground } }} />
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{client.name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{client.name}</Text>
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>{client.phone || 'Telefone não informado'}</Text>
          </View>
        </View>

        <View style={styles.monthHeader}>
          <Pressable onPress={() => changeMonth(-1)} style={[styles.monthButton, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-left" size={19} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
          <Pressable onPress={() => changeMonth(1)} style={[styles.monthButton, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-right" size={19} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{completed.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Concluídos</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>R$ {revenue.toFixed(2).replace('.', ',')}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Recebido</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Atendimentos do mês</Text>
        {clientAppointments.length === 0 ? (
          <EmptyState icon="calendar" title="Nenhum atendimento" description="Não há movimentações desse cliente no mês selecionado." />
        ) : (
          <View style={styles.list}>
            {clientAppointments.map((appointment) => {
              const service = services.find((item) => item.id === appointment.serviceId);
              return (
                <View key={appointment.id} style={[styles.visit, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.visitInfo}>
                    <Text style={[styles.service, { color: colors.foreground }]}>{service?.name || 'Serviço'}</Text>
                    <Text style={[styles.visitMeta, { color: colors.mutedForeground }]}>
                      {appointment.date.split('-').reverse().join('/')} às {appointment.time}
                    </Text>
                  </View>
                  <View style={styles.visitValue}>
                    <Text style={[styles.amount, { color: colors.foreground }]}>R$ {appointment.amount.toFixed(2).replace('.', ',')}</Text>
                    <Text style={[styles.status, { color: appointment.status === 'completed' ? colors.primary : colors.mutedForeground }]}>
                      {appointment.status === 'completed' ? 'Concluído' : 'Agendado'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  notFound: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  profile: { marginTop: 18, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 5 },
  name: { fontSize: 18, fontWeight: '700' },
  phone: { fontSize: 13 },
  monthHeader: { marginTop: 26, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, minHeight: 88, borderRadius: 17, borderWidth: 1, padding: 14, justifyContent: 'space-between' },
  statValue: { fontSize: 19, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  list: { gap: 10 },
  visit: { minHeight: 74, borderRadius: 17, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  visitInfo: { flex: 1, gap: 6 },
  service: { fontSize: 14, fontWeight: '700' },
  visitMeta: { fontSize: 12 },
  visitValue: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 13, fontWeight: '700' },
  status: { fontSize: 11, fontWeight: '600' },
});