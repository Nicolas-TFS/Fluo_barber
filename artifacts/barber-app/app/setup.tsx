import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';
import { BrandMark } from '@/components/BrandMark';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SetupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { saveProfile } = useShopStore();
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('19:00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async () => {
    if (!shopName.trim() || !ownerName.trim()) return;
    setSaving(true);
    setError('');
    try {
      await saveProfile({ shopName: shopName.trim(), ownerName: ownerName.trim(), phone: phone.trim(), address: '', city: '', profileImage: '', openingTime, closingTime });
      router.replace('/(tabs)');
    } catch {
      setError('Não foi possível salvar sua barbearia no banco. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      bottomOffset={72}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <BrandMark size={52} />
      <View style={styles.heading}>
        <Text style={[styles.kicker, { color: colors.primary }]}>PRIMEIRO PASSO</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Vamos preparar sua barbearia.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Esses dados deixam seu painel pronto para a rotina.</Text>
      </View>
      <View style={styles.form}>
        <Field label="Nome da barbearia" value={shopName} onChangeText={setShopName} placeholder="Ex.: Studio 13" colors={colors} />
        <Field label="Seu nome" value={ownerName} onChangeText={setOwnerName} placeholder="Ex.: João Silva" colors={colors} />
        <Field label="Telefone" value={phone} onChangeText={setPhone} placeholder="(11) 99999-9999" keyboardType="phone-pad" colors={colors} />
        <View style={styles.timeRow}>
          <View style={styles.timeField}><Field label="Abre às" value={openingTime} onChangeText={setOpeningTime} placeholder="09:00" colors={colors} /></View>
          <View style={styles.timeField}><Field label="Fecha às" value={closingTime} onChangeText={setClosingTime} placeholder="19:00" colors={colors} /></View>
        </View>
      </View>
      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      <PrimaryButton label="Entrar no painel" onPress={save} disabled={!shopName.trim() || !ownerName.trim()} loading={saving} />
    </KeyboardAwareScrollViewCompat>
  );
}

function Field({ label, colors, ...props }: { label: string; colors: ReturnType<typeof useColors> } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput {...props} placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingHorizontal: 22, gap: 28 },
  heading: { gap: 8, marginTop: 8 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 30, lineHeight: 36, fontWeight: '700', letterSpacing: -0.7 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  form: { gap: 16, flex: 1 },
  timeRow: { flexDirection: 'row', gap: 12 },
  timeField: { flex: 1 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 15 },
  error: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
});