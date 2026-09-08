import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewAppointmentScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { services, addAppointment } = useShopStore();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [time, setTime] = useState('09:00');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [saving, setSaving] = useState(false);
  const save = async () => { if (!clientName.trim() || !serviceId) return; setSaving(true); await addAppointment({ clientName: clientName.trim(), clientPhone: clientPhone.trim(), serviceId, date: new Date().toISOString().slice(0, 10), time }); setSaving(false); router.back(); };
  return <><Stack.Screen options={{ title: 'Novo agendamento', headerShown: true, headerTintColor: colors.foreground, headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.foreground } }} /><KeyboardAwareScrollViewCompat contentContainerStyle={[styles.content, { paddingTop: 18, paddingBottom: insets.bottom + 30 }]} bottomOffset={18}><Text style={[styles.title, { color: colors.foreground }]}>Reserve um horário.</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>O horário ficará registrado na sua agenda de hoje.</Text><Field label="Nome do cliente" value={clientName} onChangeText={setClientName} placeholder="Nome completo" colors={colors} /><Field label="Telefone" value={clientPhone} onChangeText={setClientPhone} placeholder="(11) 99999-9999" keyboardType="phone-pad" colors={colors} /><Field label="Horário" value={time} onChangeText={setTime} placeholder="09:00" colors={colors} /><Text style={[styles.label, { color: colors.mutedForeground }]}>Serviço</Text><View style={styles.services}>{services.filter((item) => item.active).map((item) => <Pressable key={item.id} onPress={() => setServiceId(item.id)} style={[styles.service, { backgroundColor: serviceId === item.id ? colors.accent : colors.input, borderColor: serviceId === item.id ? colors.primary : colors.border }]}><Text style={[styles.serviceName, { color: colors.foreground }]}>{item.name}</Text><Text style={[styles.serviceMeta, { color: colors.mutedForeground }]}>{item.duration} min · R$ {item.price}</Text></Pressable>)}</View><PrimaryButton label="Salvar agendamento" onPress={save} disabled={!clientName.trim() || !serviceId} loading={saving} /></KeyboardAwareScrollViewCompat></>;
}

function Field({ label, colors, ...props }: { label: string; colors: ReturnType<typeof useColors> } & React.ComponentProps<typeof TextInput>) { return <View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput {...props} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} /></View>; }

const styles = StyleSheet.create({ content: { flexGrow: 1, paddingHorizontal: 20, gap: 16 }, title: { fontSize: 29, fontWeight: '700', letterSpacing: -0.7 }, subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 7 }, field: { gap: 8 }, label: { fontSize: 12, fontWeight: '600' }, input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 15 }, services: { gap: 9, marginTop: -7, marginBottom: 8 }, service: { borderWidth: 1, borderRadius: 15, padding: 14, gap: 5 }, serviceName: { fontSize: 14, fontWeight: '700' }, serviceMeta: { fontSize: 12 } });