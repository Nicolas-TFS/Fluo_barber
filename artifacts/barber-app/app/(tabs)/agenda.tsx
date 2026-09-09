import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Appointment, PaymentMethod, useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

const pad = (value: number) => String(value).padStart(2, '0');
const formatDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateFromKey = (dateKey: string) => new Date(`${dateKey}T12:00:00`);
const paymentLabels: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit_card: 'Crédito',
  debit_card: 'Débito',
};

export default function AgendaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appointments, services, completeAppointment } = useShopStore();
  const today = formatDateKey(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointmentToFinish, setAppointmentToFinish] = useState<Appointment | null>(null);
  const [finishing, setFinishing] = useState(false);

  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        return formatDateKey(date);
      }),
    [],
  );
  const selectedDateAppointments = appointments
    .filter((item) => item.date === selectedDate && item.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time));

  const finishAppointment = async (paymentMethod: PaymentMethod) => {
    if (!appointmentToFinish) return;
    setFinishing(true);
    await completeAppointment(appointmentToFinish.id, paymentMethod);
    setFinishing(false);
    setAppointmentToFinish(null);
  };

  return (
    <>
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 94 }}>
        <ScreenHeader
          eyebrow="Agenda"
          title="Seu dia, no controle."
          trailing={
            <Pressable accessibilityRole="button" onPress={() => router.push('/agenda/new')} style={[styles.add, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={19} color={colors.primaryForeground} />
            </Pressable>
          }
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {dates.map((dateKey, index) => {
            const date = dateFromKey(dateKey);
            const selected = selectedDate === dateKey;
            const label = index === 0 ? 'HOJE' : index === 1 ? 'AMANHÃ' : date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
            return (
              <Pressable key={dateKey} onPress={() => setSelectedDate(dateKey)} style={[styles.dayPill, { backgroundColor: selected ? colors.primary : colors.secondary }]}>
                <Text style={[styles.dayNumber, { color: selected ? colors.primaryForeground : colors.foreground }]}>{date.getDate()}</Text>
                <Text style={[styles.dayName, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.heading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {selectedDate === today ? 'Atendimentos de hoje' : `Atendimentos de ${dateFromKey(selectedDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`}
            </Text>
            <Text style={[styles.count, { color: colors.mutedForeground }]}>{selectedDateAppointments.length} agendado{selectedDateAppointments.length === 1 ? '' : 's'}</Text>
          </View>
          {selectedDate !== today ? <Pressable onPress={() => setSelectedDate(today)}><Text style={[styles.todayAction, { color: colors.primary }]}>Voltar para hoje</Text></Pressable> : null}
        </View>
        {selectedDateAppointments.length === 0 ? (
          <EmptyState icon="clock" title="Agenda livre por enquanto" description="Quando você ou um cliente criarem um horário, ele aparecerá aqui." />
        ) : (
          selectedDateAppointments.map((item) => {
            const service = services.find((entry) => entry.id === item.serviceId);
            const amount = item.amount || service?.price || 0;
            return (
              <View key={item.id} style={[styles.appointment, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.time, { color: colors.primary }]}>{item.time}</Text>
                <View style={styles.appointmentCopy}>
                  <Text style={[styles.client, { color: colors.foreground }]}>{item.clientName}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>{service?.name || 'Serviço'} · R$ {amount.toFixed(2).replace('.', ',')}</Text>
                  {item.status === 'completed' && item.paymentMethod ? <Text style={[styles.paid, { color: colors.accentForeground }]}><Feather name="check-circle" size={12} color={colors.accentForeground} /> Pago via {paymentLabels[item.paymentMethod]}</Text> : null}
                </View>
                {item.status === 'completed' ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Alterar atendimento de ${item.clientName}`}
                    onPress={() => router.push({ pathname: '/agenda/new', params: { id: item.id } })}
                    style={[styles.editButton, { backgroundColor: colors.accent, borderColor: colors.primary }]}
                  >
                    <Feather name="edit-2" size={13} color={colors.primary} />
                    <Text style={[styles.editText, { color: colors.primary }]}>Alterar</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => setAppointmentToFinish(item)} style={[styles.finishButton, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={14} color={colors.primaryForeground} />
                    <Text style={[styles.finishText, { color: colors.primaryForeground }]}>Finalizar</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
      <Modal visible={Boolean(appointmentToFinish)} transparent animationType="slide" onRequestClose={() => setAppointmentToFinish(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Finalizar atendimento</Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
              Como o cliente pagou{appointmentToFinish ? ` o atendimento de ${appointmentToFinish.clientName}` : ''}?
            </Text>
            <View style={styles.paymentList}>
              {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                <Pressable key={method} disabled={finishing} onPress={() => finishAppointment(method)} style={[styles.paymentOption, { backgroundColor: colors.input, borderColor: colors.border }]}>
                  <View style={[styles.paymentIcon, { backgroundColor: colors.accent }]}>
                    <Feather name={method === 'pix' ? 'smartphone' : method === 'cash' ? 'dollar-sign' : 'credit-card'} size={17} color={colors.primary} />
                  </View>
                  <Text style={[styles.paymentLabel, { color: colors.foreground }]}>{paymentLabels[method]}</Text>
                  <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
                </Pressable>
              ))}
            </View>
            <Pressable disabled={finishing} onPress={() => setAppointmentToFinish(null)} style={styles.cancelButton}>
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Voltar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  add: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dateRow: { gap: 10, paddingBottom: 28 },
  dayPill: { minWidth: 78, minHeight: 74, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 6 },
  dayNumber: { fontSize: 21, fontWeight: '700' },
  dayName: { fontSize: 10, fontWeight: '700', letterSpacing: 0.7 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  count: { fontSize: 12, marginTop: 5 },
  todayAction: { fontSize: 12, fontWeight: '700' },
  appointment: { minHeight: 88, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  time: { fontSize: 16, fontWeight: '700', minWidth: 43 },
  appointmentCopy: { flex: 1, gap: 5 },
  client: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
  paid: { fontSize: 11, fontWeight: '700' },
  finishButton: { minHeight: 34, paddingHorizontal: 10, borderRadius: 11, flexDirection: 'row', gap: 5, alignItems: 'center' },
  finishText: { fontSize: 11, fontWeight: '800' },
  editButton: { minHeight: 34, paddingHorizontal: 9, borderRadius: 11, borderWidth: 1, flexDirection: 'row', gap: 5, alignItems: 'center' },
  editText: { fontSize: 11, fontWeight: '800' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.62)' },
  modalCard: { borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 22, paddingBottom: 30 },
  modalHandle: { width: 40, height: 4, borderRadius: 4, alignSelf: 'center', marginBottom: 22 },
  modalTitle: { fontSize: 22, fontWeight: '700' },
  modalSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 18 },
  paymentList: { gap: 9 },
  paymentOption: { minHeight: 58, borderRadius: 15, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  paymentLabel: { flex: 1, fontSize: 14, fontWeight: '700' },
  cancelButton: { alignItems: 'center', paddingTop: 19 },
  cancelText: { fontSize: 13, fontWeight: '700' },
});