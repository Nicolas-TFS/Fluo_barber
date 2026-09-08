import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function AgendaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appointments } = useShopStore();
  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((item) => item.date === today && item.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time));

  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 94 }}><ScreenHeader eyebrow="Agenda" title="Seu dia, no controle." trailing={<Pressable accessibilityRole="button" onPress={() => router.push('/agenda/new')} style={[styles.add, { backgroundColor: colors.primary }]}><Feather name="plus" size={19} color={colors.primaryForeground} /></Pressable>} /><View style={styles.dayRow}><View style={[styles.dayPill, { backgroundColor: colors.primary }]}><Text style={[styles.dayNumber, { color: colors.primaryForeground }]}>{new Date().getDate()}</Text><Text style={[styles.dayName, { color: colors.primaryForeground }]}>HOJE</Text></View><View style={[styles.dayPill, { backgroundColor: colors.secondary }]}><Text style={[styles.dayNumber, { color: colors.foreground }]}>{new Date(Date.now() + 86400000).getDate()}</Text><Text style={[styles.dayName, { color: colors.mutedForeground }]}>AMANHÃ</Text></View><View style={[styles.dayPill, { backgroundColor: colors.secondary }]}><Text style={[styles.dayNumber, { color: colors.foreground }]}>{new Date(Date.now() + 172800000).getDate()}</Text><Text style={[styles.dayName, { color: colors.mutedForeground }]}>QUI</Text></View></View><View style={styles.heading}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Atendimentos de hoje</Text><Text style={[styles.count, { color: colors.mutedForeground }]}>{todayAppointments.length} agendados</Text></View>{todayAppointments.length === 0 ? <EmptyState icon="clock" title="Agenda livre por enquanto" description="Quando você ou um cliente criarem um horário, ele aparecerá aqui." /> : todayAppointments.map((item) => <View key={item.id} style={[styles.appointment, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.time, { color: colors.primary }]}>{item.time}</Text><View style={styles.appointmentCopy}><Text style={[styles.client, { color: colors.foreground }]}>{item.clientName}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{item.clientPhone}</Text></View><Feather name="more-horizontal" size={20} color={colors.mutedForeground} /></View>)}</ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  add: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  dayPill: { minWidth: 78, minHeight: 74, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 6 },
  dayNumber: { fontSize: 21, fontWeight: '700' },
  dayName: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  count: { fontSize: 12 },
  appointment: { minHeight: 76, borderWidth: 1, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  time: { fontSize: 16, fontWeight: '700', minWidth: 46 },
  appointmentCopy: { flex: 1, gap: 5 },
  client: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
});