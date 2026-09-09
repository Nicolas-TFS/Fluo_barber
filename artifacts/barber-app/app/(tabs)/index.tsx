import { Feather } from '@expo/vector-icons';
import { useUser } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useUser();
  const { profile, appointments, services } = useShopStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((item) => item.date === today && item.status !== 'cancelled');
  const nextAppointment = todayAppointments
    .filter((item) => item.status === 'scheduled')
    .sort((a, b) => a.time.localeCompare(b.time))[0];
  const todayRevenue = todayAppointments
    .filter((item) => item.status === 'completed')
    .reduce((total, appointment) => total + (appointment.amount || services.find((service) => service.id === appointment.serviceId)?.price || 0), 0);
  const firstName = profile?.ownerName?.split(' ')[0] || user?.firstName || 'barbeiro';

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 92 }} showsVerticalScrollIndicator={false}>
      <ScreenHeader eyebrow="Hoje" title={`Olá, ${firstName}.`} trailing={<View style={[styles.avatar, { backgroundColor: colors.accent }]}><Text style={[styles.avatarText, { color: colors.accentForeground }]}>{firstName.slice(0, 1).toUpperCase()}</Text></View>} />
      <Text style={[styles.date, { color: colors.mutedForeground }]}>{new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</Text>
      <View style={styles.statsGrid}>
        <Stat icon="trending-up" label="Faturamento" value={`R$ ${todayRevenue.toFixed(2).replace('.', ',')}`} colors={colors} />
        <Stat icon="calendar" label="Atendimentos" value={String(todayAppointments.length)} colors={colors} />
        <Stat icon="users" label="Clientes" value="0" colors={colors} />
        <Stat icon="clock" label="Próximo" value={nextAppointment?.time || '—'} colors={colors} />
      </View>
      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Próximo atendimento</Text><Pressable onPress={() => router.push('/(tabs)/agenda')}><Text style={[styles.seeAll, { color: colors.primary }]}>Ver agenda</Text></Pressable></View>
      {nextAppointment ? <View style={[styles.nextCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.nextTime}><Text style={[styles.timeValue, { color: colors.foreground }]}>{nextAppointment.time}</Text><Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>hoje</Text></View><View style={styles.nextInfo}><Text style={[styles.nextName, { color: colors.foreground }]}>{nextAppointment.clientName}</Text><Text style={[styles.nextService, { color: colors.mutedForeground }]}>{profile?.shopName}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View> : <EmptyState icon="calendar" title="Sua agenda começa aqui" description="Adicione o primeiro atendimento e tenha o dia inteiro sob controle." />}
      <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Atalhos</Text></View>
      <View style={styles.quickRow}><QuickAction icon="plus" label="Novo agendamento" onPress={() => router.push('/agenda/new')} colors={colors} /><QuickAction icon="user-plus" label="Novo cliente" onPress={() => router.push('/clients/new')} colors={colors} /></View>
    </ScrollView>
  );
}

function Stat({ icon, label, value, colors }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}><Feather name={icon} size={16} color={colors.primary} /><Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function QuickAction({ icon, label, onPress, colors }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, { backgroundColor: colors.secondary }, pressed && styles.pressed]}><Feather name={icon} size={17} color={colors.primary} /><Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  avatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700' },
  date: { fontSize: 13, marginTop: -13, marginBottom: 22, textTransform: 'capitalize' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', minHeight: 108, borderRadius: 18, borderWidth: 1, padding: 15, gap: 9 },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 12 },
  sectionHeading: { marginTop: 29, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  seeAll: { fontSize: 12, fontWeight: '700' },
  nextCard: { minHeight: 94, borderRadius: 19, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  nextTime: { alignItems: 'center', minWidth: 50 },
  timeValue: { fontSize: 19, fontWeight: '700' },
  timeLabel: { fontSize: 11, marginTop: 3 },
  nextInfo: { flex: 1, gap: 5 },
  nextName: { fontSize: 15, fontWeight: '700' },
  nextService: { fontSize: 12 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quick: { flex: 1, minHeight: 72, borderRadius: 17, padding: 14, justifyContent: 'space-between', gap: 8 },
  quickLabel: { fontSize: 12, fontWeight: '700', lineHeight: 17 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});