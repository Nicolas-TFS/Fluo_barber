import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Appointment, PaymentMethod, useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const pad = (value: number) => String(value).padStart(2, '0');
const formatDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateFromKey = (dateKey: string) => new Date(`${dateKey}T12:00:00`);
const monthTitle = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, (letter) => letter.toUpperCase());
const longDate = (dateKey: string) =>
  dateFromKey(dateKey).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
const paymentLabels: Record<PaymentMethod, string> = {
  pix: 'Pix',
  cash: 'Dinheiro',
  credit_card: 'Crédito',
  debit_card: 'Débito',
};

export default function NewAppointmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile, services, clients, appointments, addAppointment, updateAppointment } = useShopStore();
  const existingAppointment = appointments.find((appointment) => appointment.id === id);
  const today = formatDateKey(new Date());
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientId, setClientId] = useState<string | null>();
  const [time, setTime] = useState('09:00');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [amount, setAmount] = useState(services[0]?.price ? String(services[0].price) : '');
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  const [loadedAppointmentId, setLoadedAppointmentId] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [servicePickerOpen, setServicePickerOpen] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [showAvailableTimes, setShowAvailableTimes] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const bookingUrl = profile?.bookingId && process.env.EXPO_PUBLIC_DOMAIN
    ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/book/${profile.bookingId}`
    : '';

  const selectedService = services.find((service) => service.id === serviceId);
  const selectedClient = clients.find((client) => client.id === clientId);
  const filteredClients = clients.filter((client) => {
    const query = clientSearch.trim().toLocaleLowerCase('pt-BR');
    return !query || client.name.toLocaleLowerCase('pt-BR').includes(query) || client.phone.includes(query);
  });
  const availableTimes = useMemo(() => {
    const toMinutes = (value: string) => {
      const [hours, minutes] = value.split(':').map(Number);
      return hours * 60 + minutes;
    };
    const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
    const opening = toMinutes(profile?.openingTime || '09:00');
    const closing = toMinutes(profile?.closingTime || '18:00');
    const occupied = new Set(
      appointments
        .filter((appointment) =>
          appointment.id !== id &&
          appointment.date === selectedDate &&
          appointment.status === 'scheduled')
        .map((appointment) => appointment.time),
    );
    const result: string[] = [];
    for (let minutes = opening; minutes < closing; minutes += 30) {
      const candidate = toTime(minutes);
      if (!occupied.has(candidate)) result.push(candidate);
    }
    return result;
  }, [appointments, id, profile?.closingTime, profile?.openingTime, selectedDate]);
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    return [...Array.from({ length: leadingDays }, () => null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];
  }, [calendarMonth]);

  useEffect(() => {
    if (!id || !existingAppointment || loadedAppointmentId === id) return;
    setClientName(existingAppointment.clientName);
    setClientPhone(existingAppointment.clientPhone);
    setClientId(existingAppointment.clientId ?? undefined);
    setTime(existingAppointment.time);
    setServiceId(existingAppointment.serviceId);
    setAmount(String(existingAppointment.amount));
    setSelectedDate(existingAppointment.date);
    setCalendarMonth(new Date(`${existingAppointment.date}T12:00:00`));
    setPaymentMethod(existingAppointment.paymentMethod);
    setLoadedAppointmentId(id);
  }, [existingAppointment, id, loadedAppointmentId]);

  const save = async () => {
    if (!clientName.trim() || !serviceId || !selectedService) return;
    const normalizedAmount = Number(amount.replace(',', '.'));
    if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) return;
    setSaving(true);
    setScheduleError('');
    setShowAvailableTimes(false);
    try {
      if (id) {
        await updateAppointment(id, {
          clientId,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          serviceId,
          amount: Math.round(normalizedAmount),
          date: selectedDate,
          time,
          ...(existingAppointment?.status === 'completed' && paymentMethod ? { paymentMethod } : {}),
        });
      } else {
        await addAppointment({
          ...(clientId ? { clientId } : {}),
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          serviceId,
          amount: Math.round(normalizedAmount),
          date: selectedDate,
          time,
        });
      }
      router.back();
    } catch (error) {
      if ((error as { status?: number }).status === 409) {
        setScheduleError(`O horário ${time} não está disponível nessa data.`);
        setShowAvailableTimes(true);
      } else {
        setScheduleError('Não foi possível salvar o agendamento. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  const changeMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const copyBookingLink = async () => {
    if (!bookingUrl) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(bookingUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      return;
    }
    await Share.share({ title: 'Agendar horário', message: `Agende seu horário: ${bookingUrl}`, url: bookingUrl });
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: id ? 'Alterar atendimento' : 'Novo agendamento',
          headerShown: true,
          headerTintColor: colors.foreground,
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.foreground },
        }}
      />
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[styles.content, { paddingTop: 18, paddingBottom: insets.bottom + 30 }]}
        bottomOffset={18}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>{id ? 'Corrija os dados.' : 'Reserve um horário.'}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {id ? 'Ajuste o lançamento e mantenha sua agenda e seu financeiro corretos.' : 'Escolha o dia e deixe o atendimento pronto na sua agenda.'}
        </Text>

        {!id && bookingUrl ? (
          <View style={[styles.bookingLinkCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.bookingLinkIcon, { backgroundColor: colors.accent }]}>
              <Feather name="link" size={19} color={colors.primary} />
            </View>
            <View style={styles.bookingLinkCopy}>
              <Text style={[styles.bookingLinkTitle, { color: colors.foreground }]}>Link para o cliente</Text>
              <Text style={[styles.bookingLinkText, { color: colors.mutedForeground }]} numberOfLines={1}>{bookingUrl}</Text>
            </View>
            <Pressable onPress={copyBookingLink} style={[styles.copyButton, { backgroundColor: colors.secondary }]}>
              <Feather name={linkCopied ? 'check' : 'copy'} size={16} color={colors.primary} />
              <Text style={[styles.copyButtonText, { color: colors.primary }]}>{linkCopied ? 'Copiado' : 'Copiar'}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.dateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.dateCardHeader}>
            <View>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Data do atendimento</Text>
              <Text style={[styles.selectedDate, { color: colors.foreground }]}>{longDate(selectedDate)}</Text>
            </View>
            <Feather name="calendar" size={20} color={colors.primary} />
          </View>
          <View style={styles.monthHeader}>
            <Pressable accessibilityRole="button" onPress={() => changeMonth(-1)} style={styles.iconButton}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.monthTitle, { color: colors.foreground }]}>{monthTitle(calendarMonth)}</Text>
            <Pressable accessibilityRole="button" onPress={() => changeMonth(1)} style={styles.iconButton}>
              <Feather name="chevron-right" size={20} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.weekRow}>
            {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map((day) => (
              <Text key={day} style={[styles.weekDay, { color: colors.mutedForeground }]}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.calendarDay} />;
              const dateKey = formatDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day));
              const selected = dateKey === selectedDate;
              const isToday = dateKey === today;
              return (
                <Pressable
                  key={dateKey}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar dia ${day}`}
                  onPress={() => {
                    setSelectedDate(dateKey);
                    setScheduleError('');
                    setShowAvailableTimes(false);
                  }}
                  style={[styles.calendarDay, selected && { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.dayText, { color: selected ? colors.primaryForeground : colors.foreground }, isToday && !selected && { color: colors.primary, fontWeight: '800' }]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.label, { color: colors.mutedForeground }]}>Cliente cadastrado</Text>
        <Pressable
          onPress={() => setClientPickerOpen(true)}
          style={[styles.clientSelector, { backgroundColor: colors.input, borderColor: clientId ? colors.primary : colors.border }]}
        >
          <View style={styles.clientSelectorInfo}>
            <Feather name="user" size={17} color={colors.primary} />
            <View style={styles.clientSelectorText}>
              <Text style={[styles.clientSelectorTitle, { color: colors.foreground }]}>
                {selectedClient?.name || 'Selecionar cliente'}
              </Text>
              <Text style={[styles.clientSelectorMeta, { color: colors.mutedForeground }]}>
                {selectedClient?.phone || (clients.length > 0 ? 'Toque para buscar na lista' : 'Nenhum cliente cadastrado')}
              </Text>
            </View>
          </View>
          <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Field label="Nome do cliente" value={clientName} onChangeText={(value) => { setClientId(null); setClientName(value); }} placeholder="Nome completo" colors={colors} />
        <Field label="Telefone" value={clientPhone} onChangeText={(value) => { setClientId(null); setClientPhone(value); }} placeholder="(11) 99999-9999" keyboardType="phone-pad" colors={colors} />
        <Field label="Horário" value={time} onChangeText={(value) => { setTime(value); setScheduleError(''); setShowAvailableTimes(false); }} placeholder="09:00" colors={colors} />
        {scheduleError ? (
          <View style={[styles.availabilityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.availabilityTitleRow}>
              <Feather name="alert-circle" size={17} color={colors.destructive} />
              <Text style={[styles.availabilityError, { color: colors.destructive }]}>{scheduleError}</Text>
            </View>
            {showAvailableTimes ? <Text style={[styles.availabilityLabel, { color: colors.foreground }]}>Horários disponíveis</Text> : null}
            {showAvailableTimes && availableTimes.length > 0 ? (
              <View style={styles.availableTimes}>
                {availableTimes.map((availableTime) => (
                  <Pressable
                    key={availableTime}
                    onPress={() => {
                      setTime(availableTime);
                      setScheduleError('');
                      setShowAvailableTimes(false);
                    }}
                    style={[styles.availableTime, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  >
                    <Text style={[styles.availableTimeText, { color: colors.foreground }]}>{availableTime}</Text>
                  </Pressable>
                ))}
              </View>
            ) : showAvailableTimes ? (
              <Text style={[styles.noAvailableTimes, { color: colors.mutedForeground }]}>Não há horários livres nessa data.</Text>
            ) : null}
          </View>
        ) : null}
        <Field label="Valor cobrado" value={amount} onChangeText={setAmount} placeholder="35" keyboardType="decimal-pad" colors={colors} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Serviço</Text>
        <Pressable
          onPress={() => setServicePickerOpen((open) => !open)}
          style={[styles.serviceSelector, { backgroundColor: colors.input, borderColor: servicePickerOpen ? colors.primary : colors.border }]}
        >
          <View style={styles.serviceSelectorInfo}>
            <Feather name="scissors" size={17} color={colors.primary} />
            <View style={styles.serviceSelectorText}>
              <Text style={[styles.serviceSelectorTitle, { color: colors.foreground }]}>
                {selectedService?.name || 'Selecionar serviço'}
              </Text>
              <Text style={[styles.serviceSelectorMeta, { color: colors.mutedForeground }]}>
                {selectedService ? `${selectedService.duration} min · R$ ${selectedService.price.toFixed(2).replace('.', ',')}` : 'Toque para ver os serviços'}
              </Text>
            </View>
          </View>
          <Feather name={servicePickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.mutedForeground} />
        </Pressable>
        {servicePickerOpen ? (
          <View style={styles.services}>
            {services.filter((item) => item.active).map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setServiceId(item.id);
                  if (!id) setAmount(String(item.price));
                  setServicePickerOpen(false);
                }}
                style={[styles.service, { backgroundColor: serviceId === item.id ? colors.accent : colors.input, borderColor: serviceId === item.id ? colors.primary : colors.border }]}
              >
                <Text style={[styles.serviceName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.serviceMeta, { color: colors.mutedForeground }]}>{item.duration} min · R$ {item.price.toFixed(2).replace('.', ',')}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {existingAppointment?.status === 'completed' ? (
          <>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Forma de pagamento</Text>
            <View style={styles.paymentOptions}>
              {(Object.keys(paymentLabels) as PaymentMethod[]).map((method) => (
                <Pressable
                  key={method}
                  onPress={() => setPaymentMethod(method)}
                  style={[
                    styles.paymentOption,
                    { backgroundColor: paymentMethod === method ? colors.accent : colors.input, borderColor: paymentMethod === method ? colors.primary : colors.border },
                  ]}
                >
                  <Text style={[styles.paymentText, { color: colors.foreground }]}>{paymentLabels[method]}</Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : null}
        <PrimaryButton label={id ? 'Salvar alterações' : 'Salvar agendamento'} onPress={save} disabled={!clientName.trim() || !serviceId || !amount} loading={saving} />
      </KeyboardAwareScrollViewCompat>
      <Modal visible={clientPickerOpen} transparent animationType="slide" onRequestClose={() => setClientPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.clientModal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Selecionar cliente</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>Escolha um cadastro para vincular ao controle.</Text>
              </View>
              <Pressable onPress={() => setClientPickerOpen(false)} style={[styles.closeButton, { backgroundColor: colors.secondary }]}>
                <Feather name="x" size={18} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={[styles.clientSearch, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Feather name="search" size={17} color={colors.mutedForeground} />
              <TextInput
                value={clientSearch}
                onChangeText={setClientSearch}
                placeholder="Buscar por nome ou telefone"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
                style={[styles.clientSearchInput, { color: colors.foreground }]}
              />
            </View>
            <ScrollView style={styles.clientList} keyboardShouldPersistTaps="handled">
              {filteredClients.length === 0 ? (
                <Text style={[styles.noClients, { color: colors.mutedForeground }]}>
                  {clients.length === 0 ? 'Cadastre um cliente na tela Clientes.' : 'Nenhum cliente encontrado.'}
                </Text>
              ) : filteredClients.map((client) => (
                <Pressable
                  key={client.id}
                  onPress={() => {
                    setClientId(client.id);
                    setClientName(client.name);
                    setClientPhone(client.phone);
                    setClientSearch('');
                    setClientPickerOpen(false);
                  }}
                  style={[styles.clientRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.clientAvatar, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.clientAvatarText, { color: colors.primary }]}>{client.name.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View style={styles.clientRowInfo}>
                    <Text style={[styles.clientRowName, { color: colors.foreground }]}>{client.name}</Text>
                    <Text style={[styles.clientRowPhone, { color: colors.mutedForeground }]}>{client.phone || 'Sem telefone'}</Text>
                  </View>
                  {clientId === client.id ? <Feather name="check" size={18} color={colors.primary} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Field({ label, colors, ...props }: { label: string; colors: ReturnType<typeof useColors> } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput {...props} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 29, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 7 },
  dateCard: { borderWidth: 1, borderRadius: 20, padding: 16, gap: 15 },
  dateCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectedDate: { fontSize: 16, fontWeight: '700', marginTop: 5, textTransform: 'capitalize' },
  label: { fontSize: 12, fontWeight: '600' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthTitle: { fontSize: 15, fontWeight: '700' },
  iconButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 5 },
  calendarDay: { width: '14.285%', height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  dayText: { fontSize: 13, fontWeight: '600' },
  field: { gap: 8 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 15 },
  availabilityCard: { borderWidth: 1, borderRadius: 16, padding: 14, gap: 12 },
  availabilityTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availabilityError: { flex: 1, fontSize: 12, fontWeight: '700', lineHeight: 17 },
  availabilityLabel: { fontSize: 13, fontWeight: '700' },
  availableTimes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  availableTime: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 9 },
  availableTimeText: { fontSize: 12, fontWeight: '700' },
  noAvailableTimes: { fontSize: 12 },
  services: { gap: 9, marginTop: -7, marginBottom: 8 },
  serviceSelector: { minHeight: 62, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -7 },
  serviceSelectorInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  serviceSelectorText: { flex: 1, gap: 4 },
  serviceSelectorTitle: { fontSize: 14, fontWeight: '700' },
  serviceSelectorMeta: { fontSize: 11 },
  clientSelector: { minHeight: 62, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -7 },
  clientSelectorInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  clientSelectorText: { flex: 1, gap: 4 },
  clientSelectorTitle: { fontSize: 14, fontWeight: '700' },
  clientSelectorMeta: { fontSize: 11 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  clientModal: { maxHeight: '78%', borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.45)', alignSelf: 'center', marginBottom: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSubtitle: { fontSize: 12, marginTop: 5 },
  closeButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  clientSearch: { minHeight: 48, borderWidth: 1, borderRadius: 14, marginTop: 18, marginBottom: 8, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  clientSearchInput: { flex: 1, fontSize: 14, paddingVertical: 11 },
  clientList: { minHeight: 100 },
  noClients: { textAlign: 'center', fontSize: 13, paddingVertical: 34 },
  clientRow: { minHeight: 68, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  clientAvatar: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  clientAvatarText: { fontSize: 15, fontWeight: '700' },
  clientRowInfo: { flex: 1, gap: 4 },
  clientRowName: { fontSize: 14, fontWeight: '700' },
  clientRowPhone: { fontSize: 11 },
  service: { borderWidth: 1, borderRadius: 15, padding: 14, gap: 5 },
  serviceName: { fontSize: 14, fontWeight: '700' },
  serviceMeta: { fontSize: 12 },
  paymentOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -7, marginBottom: 8 },
  paymentOption: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11 },
  paymentText: { fontSize: 12, fontWeight: '700' },
  bookingLinkCard: { borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  bookingLinkIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bookingLinkCopy: { flex: 1, gap: 4 },
  bookingLinkTitle: { fontSize: 13, fontWeight: '800' },
  bookingLinkText: { fontSize: 10 },
  copyButton: { minHeight: 38, borderRadius: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  copyButtonText: { fontSize: 11, fontWeight: '800' },
});