import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewClientScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { addClient } = useShopStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await addClient({ name: name.trim(), phone: phone.trim() });
      router.back();
    } catch {
      setError('Não foi possível salvar o cliente. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Novo cliente', headerShown: true, headerTintColor: colors.foreground, headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.foreground } }} />
      <KeyboardAwareScrollViewCompat contentContainerStyle={[styles.content, { paddingTop: 18, paddingBottom: insets.bottom + 30 }]} bottomOffset={18}>
        <Text style={[styles.title, { color: colors.foreground }]}>Conheça quem senta na sua cadeira.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Os atendimentos desse cliente aparecerão automaticamente no histórico mensal.</Text>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Nome do cliente</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Nome completo" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.mutedForeground }]}>Telefone</Text>
        <TextInput value={phone} onChangeText={setPhone} placeholder="(11) 99999-9999" placeholderTextColor={colors.mutedForeground} keyboardType="phone-pad" style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} />
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <PrimaryButton label="Salvar cliente" onPress={() => void handleSave()} disabled={!name.trim()} loading={saving} />
      </KeyboardAwareScrollViewCompat>
    </>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 15 },
  error: { fontSize: 12, lineHeight: 18 },
});