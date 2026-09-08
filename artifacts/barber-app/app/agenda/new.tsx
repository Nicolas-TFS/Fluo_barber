import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const pad = (value: number) => String(value).padStart(2, '0');
const formatDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateFromKey = (dateKey: string) => new Date(`${dateKey}T12:00:00`);
const monthTitle = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, (letter) => letter.toUpperCase());
const longDate = (dateKey: string) =>
  dateFromKey(dateKey).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

export default function NewAppointmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { services, addAppointment } = useShopStore();
  const today = formatDateKey(new Date());
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [time, setTime] = useState('09:00');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [saving, setSaving] = useState(false);

  const selectedService = services.find((service) => service.id === serviceId);
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const leadingDays = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();
    return [...Array.from({ length: leadingDays }, () => null), ...Array.from({ length: totalDays }, (_, index) => index + 1)];
  }, [calendarMonth]);

  const save = async () => {
    if (!clientName.trim() || !serviceId || !selectedService) return;
    setSaving(true);
    await addAppointment({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceId,
      amount: selectedService.price,
      date: selectedDate,
      time,
    });
    setSaving(false);
    router.back();
  };

  const changeMonth = (offset: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Novo agendamento',
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
        <Text style={[styles.title, { color: colors.foreground }]}>Reserve um horário.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Escolha o dia e deixe o atendimento pronto na sua agenda.
        </Text>

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
                  onPress={() => setSelectedDate(dateKey)}
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

        <Field label="Nome do cliente" value={clientName} onChangeText={setClientName} placeholder="Nome completo" colors={colors} />
        <Field label="Telefone" value={clientPhone} onChangeText={setClientPhone} placeholder="(11) 99999-9999" keyboardType="phone-pad" colors={colors} />
        <Field label="Horário" value={time} onChangeText={setTime} placeholder="09:00" colors={colors} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Serviço</Text>
        <View style={styles.services}>
          {services.filter((item) => item.active).map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setServiceId(item.id)}
              style={[styles.service, { backgroundColor: serviceId === item.id ? colors.accent : colors.input, borderColor: serviceId === item.id ? colors.primary : colors.border }]}
            >
              <Text style={[styles.serviceName, { color: colors.foreground }]}>{item.name}</Text>
              <Text style={[styles.serviceMeta, { color: colors.mutedForeground }]}>{item.duration} min · R$ {item.price.toFixed(2).replace('.', ',')}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="Salvar agendamento" onPress={save} disabled={!clientName.trim() || !serviceId} loading={saving} />
      </KeyboardAwareScrollViewCompat>
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
  services: { gap: 9, marginTop: -7, marginBottom: 8 },
  service: { borderWidth: 1, borderRadius: 15, padding: 14, gap: 5 },
  serviceName: { fontSize: 14, fontWeight: '700' },
  serviceMeta: { fontSize: 12 },
});