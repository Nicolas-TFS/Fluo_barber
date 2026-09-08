import { BrandMark } from '@/components/BrandMark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/hooks/useColors';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const result = await signIn.password({ emailAddress: email.trim(), password });
    if (result.error) {
      setError(result.error.message || 'Não foi possível entrar. Confira seus dados.');
      return;
    }
    if (signIn.status === 'complete') {
      await signIn.finalize({ navigate: () => router.replace('/') });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 34, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.brand}><BrandMark size={56} /><Text style={[styles.brandName, { color: colors.foreground }]}>BARBER APP</Text></View>
      <View style={styles.heading}><Text style={[styles.title, { color: colors.foreground }]}>Sua barbearia, no ritmo certo.</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Entre para acompanhar sua agenda e o seu dia.</Text></View>
      <View style={styles.form}>
        <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@barbearia.com" keyboardType="email-address" colors={colors} />
        <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry colors={colors} />
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <PrimaryButton label="Entrar" onPress={submit} disabled={!email || !password} loading={fetchStatus === 'fetching'} />
      </View>
      <View style={styles.footer}><Text style={[styles.footerText, { color: colors.mutedForeground }]}>Ainda não tem uma conta?</Text><Pressable onPress={() => router.push('/(auth)/sign-up')}><Text style={[styles.link, { color: colors.primary }]}>Criar agora</Text></Pressable></View>
    </View>
  );
}

function Field({ label, colors, ...props }: { label: string; colors: ReturnType<typeof useColors> } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput {...props} autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 22, justifyContent: 'space-between' },
  brand: { gap: 14, alignItems: 'flex-start' },
  brandName: { fontSize: 12, fontWeight: '700', letterSpacing: 2.8 },
  heading: { gap: 10 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -0.9 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  form: { gap: 17 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 15, paddingHorizontal: 16, fontSize: 15 },
  error: { fontSize: 13, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  footerText: { fontSize: 13 },
  link: { fontSize: 13, fontWeight: '700' },
});