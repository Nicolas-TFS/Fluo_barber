import { BrandMark } from '@/components/BrandMark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/hooks/useColors';
import { useSignUp } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, fetchStatus } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const verifying = signUp.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address');

  const submit = async () => {
    setError('');
    const result = await signUp.password({ emailAddress: email.trim(), password });
    if (result.error) {
      setError(result.error.message || 'Não foi possível criar a conta.');
      return;
    }
    const codeResult = await signUp.verifications.sendEmailCode();
    if (codeResult.error) setError(codeResult.error.message || 'Não foi possível enviar o código.');
  };

  const verify = async () => {
    setError('');
    const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (result.error) {
      setError(result.error.message || 'Código inválido.');
      return;
    }
    if (signUp.status === 'complete') await signUp.finalize({ navigate: () => router.replace('/') });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 34, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.brand}><BrandMark size={56} /><Text style={[styles.brandName, { color: colors.foreground }]}>BARBER APP</Text></View>
      <View style={styles.heading}><Text style={[styles.title, { color: colors.foreground }]}>{verifying ? 'Confirme seu e-mail.' : 'Comece pelo essencial.'}</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{verifying ? 'Enviamos um código para o seu endereço.' : 'Crie sua conta e organize sua barbearia de um jeito mais leve.'}</Text></View>
      <View style={styles.form}>
        {verifying ? <Field label="Código de verificação" value={code} onChangeText={setCode} placeholder="000000" keyboardType="number-pad" colors={colors} /> : <><Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@barbearia.com" keyboardType="email-address" colors={colors} /><Field label="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo de 8 caracteres" secureTextEntry colors={colors} /></>}
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <PrimaryButton label={verifying ? 'Confirmar e-mail' : 'Criar conta'} onPress={verifying ? verify : submit} disabled={verifying ? !code : !email || !password} loading={fetchStatus === 'fetching'} />
      </View>
      <View style={styles.footer}><Text style={[styles.footerText, { color: colors.mutedForeground }]}>Já tem uma conta?</Text><Pressable onPress={() => router.push('/(auth)/sign-in')}><Text style={[styles.link, { color: colors.primary }]}>Entrar</Text></Pressable></View>
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