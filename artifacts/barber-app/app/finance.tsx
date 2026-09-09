import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PaymentMethod, useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

const paymentLabels: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit_card: 'Crédito',
  debit_card: 'Débito',
};

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthTitle(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
}

function longDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(year, month - 1, day));
}

type PeriodKey = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

const periodLabels: Record<PeriodKey, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  thisWeek: 'Esta semana',
  lastWeek: 'Semana passada',
  thisMonth: 'Este mês',
  lastMonth: 'Mês passado',
  custom: 'Escolher data',
};

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getPeriodRange(period: PeriodKey, now: Date, customDate: string) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === 'yesterday') {
    const yesterday = formatDateKey(addDays(today, -1));
    return { start: yesterday, end: yesterday };
  }
  if (period === 'thisWeek' || period === 'lastWeek') {
    const mondayOffset = (today.getDay() + 6) % 7;
    const thisMonday = addDays(today, -mondayOffset);
    const start = period === 'lastWeek' ? addDays(thisMonday, -7) : thisMonday;
    return { start: formatDateKey(start), end: formatDateKey(addDays(start, 6)) };
  }
  if (period === 'thisMonth' || period === 'lastMonth') {
    const month = period === 'lastMonth' ? now.getMonth() - 1 : now.getMonth();
    const start = new Date(now.getFullYear(), month, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { start: formatDateKey(start), end: formatDateKey(end) };
  }
  const date = period === 'custom' ? customDate : formatDateKey(today);
  return { start: date, end: date };
}

export default function FinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appointments, services } = useShopStore();
  const now = new Date();
  const today = formatDateKey(now);
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [selectedDate, setSelectedDate] = useState(today);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const range = getPeriodRange(period, now, selectedDate);
  const completed = useMemo(
    () => appointments.filter((appointment) => appointment.status === 'completed' && appointment.date >= range.start && appointment.date <= range.end),
    [appointments, range.end, range.start],
  );
  const getAmount = (appointment: (typeof appointments)[number]) => appointment.amount || services.find((service) => service.id === appointment.serviceId)?.price || 0;
  const total = completed.reduce((sum, appointment) => sum + getAmount(appointment), 0);
  const byPayment = useMemo(
    () =>
      (Object.keys(paymentLabels) as PaymentMethod[]).map((method) => ({
        method,
        amount: completed.filter((appointment) => appointment.paymentMethod === method).reduce((sum, appointment) => sum + getAmount(appointment), 0),
        count: completed.filter((appointment) => appointment.paymentMethod === method).length,
      })),
    [completed, services],
  );
  const firstWeekday = (calendarMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
  const calendarDays: Array<number | null> = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const changeMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 34 }}>
      <ScreenHeader
        eyebrow="Financeiro"
        title="Dinheiro organizado."
        trailing={<Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={colors.foreground} /></Pressable>}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => setPeriodModalOpen(true)}
        style={[styles.periodButton, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={[styles.periodIcon, { backgroundColor: colors.accent }]}><Feather name="calendar" size={18} color={colors.primary} /></View>
        <View style={styles.selectedDateCopy}>
          <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>Período do financeiro</Text>
          <Text style={[styles.selectedDate, { color: colors.foreground }]}>
            {period === 'custom' ? longDate(selectedDate) : periodLabels[period]}
          </Text>
        </View>
        <Feather name="chevron-down" size={20} color={colors.mutedForeground} />
      </Pressable>
      <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.totalLabel, { color: colors.primaryForeground }]}>Total recebido no período</Text>
        <Text style={[styles.totalValue, { color: colors.primaryForeground }]}>R$ {total.toFixed(2).replace('.', ',')}</Text>
        <Text style={[styles.totalMeta, { color: colors.primaryForeground }]}>{completed.length} atendimento{completed.length === 1 ? '' : 's'} finalizado{completed.length === 1 ? '' : 's'}</Text>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Por forma de pagamento</Text>
      <View style={styles.paymentGrid}>
        {byPayment.map(({ method, amount, count }) => (
          <View key={method} style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.paymentIcon, { backgroundColor: colors.accent }]}>
              <Feather name={method === 'pix' ? 'smartphone' : method === 'cash' ? 'dollar-sign' : 'credit-card'} size={16} color={colors.primary} />
            </View>
            <Text style={[styles.paymentName, { color: colors.mutedForeground }]}>{paymentLabels[method]}</Text>
            <Text style={[styles.paymentAmount, { color: colors.foreground }]}>R$ {amount.toFixed(2).replace('.', ',')}</Text>
            <Text style={[styles.paymentCount, { color: colors.mutedForeground }]}>{count} atendimento{count === 1 ? '' : 's'}</Text>
          </View>
        ))}
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 28 }]}>Últimos recebimentos</Text>
      {completed.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="bar-chart-2" size={24} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum recebimento neste período</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Escolha outro período ou finalize um atendimento na agenda.</Text>
        </View>
      ) : (
        completed.slice().sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || '')).slice(0, 8).map((appointment) => (
          <View key={appointment.id} style={[styles.receipt, { borderBottomColor: colors.border }]}>
            <View style={[styles.receiptIcon, { backgroundColor: colors.accent }]}><Feather name="check" size={15} color={colors.primary} /></View>
            <View style={styles.receiptCopy}>
              <Text style={[styles.receiptName, { color: colors.foreground }]}>{appointment.clientName}</Text>
              <Text style={[styles.receiptMeta, { color: colors.mutedForeground }]}>{appointment.paymentMethod ? paymentLabels[appointment.paymentMethod] : 'Pagamento registrado'} · {appointment.date}</Text>
            </View>
            <Text style={[styles.receiptAmount, { color: colors.foreground }]}>R$ {getAmount(appointment).toFixed(2).replace('.', ',')}</Text>
          </View>
        ))
      )}
      <Modal visible={periodModalOpen} transparent animationType="fade" onRequestClose={() => setPeriodModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setPeriodModalOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Selecionar período</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Escolha o intervalo do financeiro</Text>
              </View>
              <Pressable onPress={() => setPeriodModalOpen(false)} style={styles.iconButton}><Feather name="x" size={21} color={colors.foreground} /></Pressable>
            </View>
            {!calendarOpen ? (
              <View style={styles.periodOptions}>
                {(Object.keys(periodLabels) as PeriodKey[]).map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      if (option === 'custom') {
                        setCalendarOpen(true);
                        return;
                      }
                      setPeriod(option);
                      setPeriodModalOpen(false);
                    }}
                    style={[styles.periodOption, { borderBottomColor: colors.border }, period === option && { backgroundColor: colors.accent }]}
                  >
                    <Text style={[styles.periodOptionText, { color: colors.foreground }]}>{periodLabels[option]}</Text>
                    {period === option ? <Feather name="check" size={18} color={colors.primary} /> : option === 'custom' ? <Feather name="chevron-right" size={18} color={colors.mutedForeground} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : (
              <>
                <View style={styles.monthHeader}>
                  <Pressable accessibilityRole="button" accessibilityLabel="Mês anterior" onPress={() => changeMonth(-1)} style={styles.iconButton}>
                    <Feather name="chevron-left" size={20} color={colors.foreground} />
                  </Pressable>
                  <Text style={[styles.monthTitle, { color: colors.foreground }]}>{monthTitle(calendarMonth)}</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Próximo mês" onPress={() => changeMonth(1)} style={styles.iconButton}>
                    <Feather name="chevron-right" size={20} color={colors.foreground} />
                  </Pressable>
                </View>
                <View style={styles.weekRow}>
                  {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => <Text key={day} style={[styles.weekDay, { color: colors.mutedForeground }]}>{day}</Text>)}
                </View>
                <View style={styles.calendarGrid}>
                  {calendarDays.map((day, index) => {
                    if (!day) return <View key={`empty-${index}`} style={styles.calendarDay} />;
                    const dateKey = formatDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
                    const selected = dateKey === selectedDate;
                    return (
                      <Pressable
                        key={dateKey}
                        onPress={() => {
                          setSelectedDate(dateKey);
                          setPeriod('custom');
                          setCalendarOpen(false);
                          setPeriodModalOpen(false);
                        }}
                        style={[styles.calendarDay, selected && { backgroundColor: colors.primary }]}
                      >
                        <Text style={[styles.dayText, { color: selected ? colors.primaryForeground : colors.foreground }]}>{day}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable onPress={() => setCalendarOpen(false)} style={styles.backToOptions}>
                  <Feather name="arrow-left" size={17} color={colors.primary} />
                  <Text style={[styles.backToOptionsText, { color: colors.primary }]}>Voltar aos períodos</Text>
                </Pressable>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  periodButton: { minHeight: 74, borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  periodIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  selectedDateCopy: { flex: 1, gap: 4 },
  dateLabel: { fontSize: 11, fontWeight: '700' },
  selectedDate: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  iconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 14, fontWeight: '800', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row' },
  weekDay: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 9, fontWeight: '700', paddingVertical: 7 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  dayText: { fontSize: 12, fontWeight: '600' },
  totalCard: { borderRadius: 22, padding: 20, marginBottom: 28 },
  totalLabel: { fontSize: 12, fontWeight: '700', opacity: 0.75 },
  totalValue: { fontSize: 32, fontWeight: '700', marginTop: 9, letterSpacing: -0.8 },
  totalMeta: { fontSize: 12, marginTop: 8, opacity: 0.8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 13 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  paymentCard: { width: '48%', minHeight: 126, borderWidth: 1, borderRadius: 17, padding: 13 },
  paymentIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  paymentName: { fontSize: 12, fontWeight: '600' },
  paymentAmount: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  paymentCount: { fontSize: 11, marginTop: 4 },
  empty: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  receipt: { minHeight: 66, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  receiptIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  receiptCopy: { flex: 1, gap: 4 },
  receiptName: { fontSize: 14, fontWeight: '700' },
  receiptMeta: { fontSize: 11 },
  receiptAmount: { fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end', padding: 16 },
  modalCard: { borderWidth: 1, borderRadius: 24, padding: 18, paddingBottom: 24 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalSubtitle: { fontSize: 12, marginTop: 4 },
  periodOptions: { overflow: 'hidden', borderRadius: 14 },
  periodOption: { minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodOptionText: { fontSize: 15, fontWeight: '600' },
  backToOptions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 14, minHeight: 42 },
  backToOptionsText: { fontSize: 13, fontWeight: '700' },
});