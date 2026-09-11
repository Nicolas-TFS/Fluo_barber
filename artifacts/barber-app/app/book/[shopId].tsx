import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createPublicBooking, getPublicBookingShop, type PublicBookingShop } from '@workspace/api-client-react';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton } from '@/components/PrimaryButton';
import { BrandMark } from '@/components/BrandMark';
import { useColors } from '@/hooks/useColors';

const pad = (value: number) => String(value).padStart(2, '0');
const formatDateKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const dateFromKey = (key: string) => new Date(`${key}T12:00:00`);

export default function PublicBookingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { shopId = '' } = useLocalSearchParams<{ shopId: string }>();
  const today = formatDateKey(new Date());
  const [date, setDate] = useState(today);
  const [data, setData] = useState<PublicBookingShop>();
  const [serviceId, setServiceId] = useState('');
  const [time, setTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const days = useMemo(() => Array.from({ length: 14 }, (_, index) => {
    const current = new Date();
    current.setDate(current.getDate() + index);
    return current;
  }), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getPublicBookingShop(shopId, { date })
      .then((result) => {
        if (!active) return;
        setData(result);
        setServiceId((current) => result.services.some((service) => service.id === current) ? current : result.services[0]?.id ?? '');
        setTime('');
      })
      .catch(() => active && setError('Este link de agendamento não está disponível.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [date, shopId]);

  const submit = async () => {
    if (!clientName.trim() || !clientPhone.trim() || !serviceId || !time) return;
    setSaving(true);
    setError('');
    try {
      await createPublicBooking(shopId, { clientName: clientName.trim(), clientPhone: clientPhone.trim(), serviceId, date, time });
      setSuccess(true);
    } catch (submitError) {
      if ((submitError as { status?: number }).status === 409) {
        setError('Esse horário acabou de ser reservado. Escolha outro.');
        const refreshed = await getPublicBookingShop(shopId, { date });
        setData(refreshed);
        setTime('');
      } else if ((submitError as { status?: number }).status === 429) {
        setError('Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.');
      } else {
        setError('Não foi possível concluir o agendamento. Tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (success) {
    return (
      <View style={[styles.center, styles.successScreen, { backgroundColor: colors.background }]}>
        <View style={[styles.successIcon, { backgroundColor: colors.accent }]}><Feather name="check" size={32} color={colors.primary} /></View>
        <Text style={[styles.successTitle, { color: colors.foreground }]}>Horário reservado.</Text>
        <Text style={[styles.successText, { color: colors.mutedForeground }]}>
          Seu agendamento em {dateFromKey(date).toLocaleDateString('pt-BR')} às {time} foi enviado para {data?.shopName}.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 34 }]}
      bottomOffset={72}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.shopHeader}>
        {data?.profileImage ? <Image source={{ uri: data.profileImage }} style={styles.logo} contentFit="cover" /> : <BrandMark size={54} />}
        <View style={styles.shopCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>AGENDAMENTO ONLINE</Text>
          <Text style={[styles.shopName, { color: colors.foreground }]}>{data?.shopName}</Text>
          {data?.address || data?.city ? <Text style={[styles.address, { color: colors.mutedForeground }]}>{[data.address, data.city].filter(Boolean).join(' · ')}</Text> : null}
        </View>
      </View>

      <View>
        <Text style={[styles.title, { color: colors.foreground }]}>Escolha seu horário.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>A reserva entra diretamente na agenda da barbearia.</Text>
      </View>

      <Text style={[styles.label, { color: colors.mutedForeground }]}>Data</Text>
      <View style={styles.dayList}>
        {days.map((day) => {
          const key = formatDateKey(day);
          const selected = key === date;
          return (
            <Pressable key={key} onPress={() => setDate(key)} style={[styles.day, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}>
              <Text style={[styles.dayWeek, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</Text>
              <Text style={[styles.dayNumber, { color: selected ? colors.primaryForeground : colors.foreground }]}>{day.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, { color: colors.mutedForeground }]}>Serviço</Text>
      <View style={styles.options}>
        {data?.services.map((service) => (
          <Pressable key={service.id} onPress={() => setServiceId(service.id)} style={[styles.service, { backgroundColor: serviceId === service.id ? colors.accent : colors.card, borderColor: serviceId === service.id ? colors.primary : colors.border }]}>
            <View>
              <Text style={[styles.serviceName, { color: colors.foreground }]}>{service.name}</Text>
              <Text style={[styles.serviceMeta, { color: colors.mutedForeground }]}>{service.duration} min</Text>
            </View>
            <Text style={[styles.servicePrice, { color: colors.primary }]}>R$ {service.price.toFixed(2).replace('.', ',')}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.mutedForeground }]}>Horário disponível</Text>
      <View style={styles.times}>
        {data?.availableTimes.length ? data.availableTimes.map((availableTime) => (
          <Pressable key={availableTime} onPress={() => setTime(availableTime)} style={[styles.time, { backgroundColor: time === availableTime ? colors.primary : colors.card, borderColor: time === availableTime ? colors.primary : colors.border }]}>
            <Text style={[styles.timeText, { color: time === availableTime ? colors.primaryForeground : colors.foreground }]}>{availableTime}</Text>
          </Pressable>
        )) : <Text style={[styles.noTimes, { color: colors.mutedForeground }]}>Nenhum horário disponível nesta data.</Text>}
      </View>

      <Field label="Seu nome" value={clientName} onChangeText={setClientName} placeholder="Nome completo" colors={colors} />
      <Field label="Seu telefone" value={clientPhone} onChangeText={setClientPhone} keyboardType="phone-pad" placeholder="(11) 99999-9999" colors={colors} />
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      <PrimaryButton label="Confirmar agendamento" onPress={submit} loading={saving} disabled={!clientName.trim() || !clientPhone.trim() || !serviceId || !time} />
    </KeyboardAwareScrollViewCompat>
  );
}

function Field({ label, colors, ...props }: { label: string; colors: ReturnType<typeof useColors> } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput {...props} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingHorizontal: 20, gap: 16 },
  shopHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  logo: { width: 54, height: 54, borderRadius: 17 },
  shopCopy: { flex: 1, gap: 4 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  shopName: { fontSize: 18, fontWeight: '800' },
  address: { fontSize: 11 },
  title: { fontSize: 29, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  dayList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: -8 },
  day: { width: 44, height: 58, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dayWeek: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  dayNumber: { fontSize: 16, fontWeight: '800' },
  options: { gap: 8, marginTop: -8 },
  service: { minHeight: 64, borderRadius: 15, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceName: { fontSize: 14, fontWeight: '800' },
  serviceMeta: { fontSize: 11, marginTop: 4 },
  servicePrice: { fontSize: 13, fontWeight: '800' },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -8 },
  time: { borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingVertical: 10 },
  timeText: { fontSize: 12, fontWeight: '800' },
  noTimes: { fontSize: 12, paddingVertical: 8 },
  field: { gap: 8 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 15 },
  error: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  successScreen: { paddingHorizontal: 34 },
  successIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 28, fontWeight: '800' },
  successText: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10 },
});