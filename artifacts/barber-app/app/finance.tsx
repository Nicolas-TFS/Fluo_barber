import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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

export default function FinanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { appointments, services } = useShopStore();
  const completed = appointments.filter((appointment) => appointment.status === 'completed');
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

  return (
    <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 34 }}>
      <ScreenHeader
        eyebrow="Financeiro"
        title="Dinheiro organizado."
        trailing={<Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={colors.foreground} /></Pressable>}
      />
      <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.totalLabel, { color: colors.primaryForeground }]}>Total recebido</Text>
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
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Nenhum recebimento ainda</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Finalize um atendimento na agenda para começar a acompanhar seu financeiro.</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
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
});