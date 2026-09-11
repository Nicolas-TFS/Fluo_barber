import { BrandMark } from '@/components/BrandMark';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useColors } from '@/hooks/useColors';
import { useSignIn } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, fetchStatus } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetStep, setResetStep] = useState<'request' | 'code' | 'password' | null>(null);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const submit = async () => {
    Keyboard.dismiss();
    setError('');
    try {
      const result = await signIn.password({ emailAddress: email.trim().toLowerCase(), password });
      if (result.error) {
        setError(result.error.message || 'Não foi possível entrar. Confira seus dados.');
        return;
      }
      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: () => router.replace('/') });
        return;
      }
      if (signIn.status === 'needs_second_factor' || signIn.status === 'needs_client_trust') {
        setError('Esta conta exige uma verificação adicional que ainda não está disponível nesta tela.');
        return;
      }
      setError('O login não foi concluído. Confira se o e-mail foi verificado e tente novamente.');
    } catch (submitError) {
      setError((submitError as { message?: string }).message || 'Não foi possível entrar agora. Verifique sua conexão e tente novamente.');
    }
  };

  const startPasswordReset = () => {
    setError('');
    setResetMessage('');
    setResetCode('');
    setNewPassword('');
    setResetStep('request');
  };

  const sendResetCode = async () => {
    Keyboard.dismiss();
    setError('');
    setResetMessage('');
    try {
      const result = await signIn.create({ identifier: email.trim().toLowerCase() });
      if (result.error) {
        setError(result.error.message || 'Não foi possível iniciar a recuperação.');
        return;
      }
      const prepareResult = await signIn.resetPasswordEmailCode.sendCode();
      if (prepareResult.error) {
        setError(prepareResult.error.message || 'Não foi possível enviar o código.');
        return;
      }
      setResetStep('code');
      setResetMessage('Enviamos um código para o seu e-mail.');
    } catch (resetError) {
      setError((resetError as { message?: string }).message || 'Não foi possível enviar o código agora.');
    }
  };

  const verifyResetCode = async () => {
    Keyboard.dismiss();
    setError('');
    setResetMessage('');
    try {
      const result = await signIn.resetPasswordEmailCode.verifyCode({
        code: resetCode.trim(),
      });
      if (result.error) {
        setError(result.error.message || 'Código inválido ou expirado.');
        return;
      }
      setResetStep('password');
    } catch (resetError) {
      setError((resetError as { message?: string }).message || 'Não foi possível validar o código.');
    }
  };

  const saveNewPassword = async () => {
    Keyboard.dismiss();
    setError('');
    setResetMessage('');
    if (newPassword.length < 8) {
      setError('A nova senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    try {
      const result = await signIn.resetPasswordEmailCode.submitPassword({ password: newPassword });
      if (result.error) {
        setError(result.error.message || 'Não foi possível salvar a nova senha.');
        return;
      }
      if (signIn.status === 'complete') {
        await signIn.finalize({ navigate: () => router.replace('/') });
        return;
      }
      setError('A senha foi alterada, mas o acesso não foi concluído. Tente entrar novamente.');
      setResetStep(null);
    } catch (resetError) {
      setError((resetError as { message?: string }).message || 'Não foi possível salvar a nova senha.');
    }
  };

  const cancelPasswordReset = () => {
    signIn.reset();
    setResetStep(null);
    setResetCode('');
    setNewPassword('');
    setResetMessage('');
    setError('');
  };

  const resetLoading = fetchStatus === 'fetching';

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 34, paddingBottom: insets.bottom + 20 }]}
      bottomOffset={72}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brand}><BrandMark size={56} /><Text style={[styles.brandName, { color: colors.foreground }]}>BARBER APP</Text></View>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {resetStep ? 'Recupere o acesso à sua conta.' : 'Sua barbearia, no ritmo certo.'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {resetStep === 'request'
            ? 'Informe seu e-mail para receber um código de recuperação.'
            : resetStep === 'code'
              ? 'Digite o código que enviamos para o seu e-mail.'
              : resetStep === 'password'
                ? 'Escolha uma nova senha para continuar.'
                : 'Entre para acompanhar sua agenda e o seu dia.'}
        </Text>
      </View>
      <View style={styles.form}>
        <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="voce@barbearia.com" keyboardType="email-address" colors={colors} editable={resetStep === null || resetStep === 'request'} />
        {resetStep === null ? (
          <>
            <Field label="Senha" value={password} onChangeText={setPassword} placeholder="Sua senha" secureTextEntry colors={colors} />
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            <PrimaryButton label="Entrar" onPress={submit} disabled={!email || !password} loading={resetLoading} />
            <Pressable style={styles.forgotButton} onPress={startPasswordReset}>
              <Text style={[styles.link, { color: colors.primary }]}>Esqueci minha senha</Text>
            </Pressable>
          </>
        ) : null}
        {resetStep === 'request' ? (
          <>
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            <PrimaryButton label="Enviar código" onPress={sendResetCode} disabled={!email} loading={resetLoading} />
          </>
        ) : null}
        {resetStep === 'code' ? (
          <>
            <Field label="Código de recuperação" value={resetCode} onChangeText={setResetCode} placeholder="000000" keyboardType="number-pad" colors={colors} />
            {resetMessage ? <Text style={[styles.message, { color: colors.mutedForeground }]}>{resetMessage}</Text> : null}
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            <PrimaryButton label="Confirmar código" onPress={verifyResetCode} disabled={!resetCode} loading={resetLoading} />
          </>
        ) : null}
        {resetStep === 'password' ? (
          <>
            <Field label="Nova senha" value={newPassword} onChangeText={setNewPassword} placeholder="Mínimo de 8 caracteres" secureTextEntry colors={colors} maxLength={64} />
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            <PrimaryButton label="Salvar nova senha" onPress={saveNewPassword} disabled={newPassword.length < 8} loading={resetLoading} />
          </>
        ) : null}
      </View>
      {resetStep ? (
        <Pressable style={styles.footer} onPress={cancelPasswordReset}>
          <Text style={[styles.link, { color: colors.mutedForeground }]}>Voltar para entrar</Text>
        </Pressable>
      ) : (
        <View style={styles.footer}><Text style={[styles.footerText, { color: colors.mutedForeground }]}>Ainda não tem uma conta?</Text><Pressable onPress={() => router.push('/(auth)/sign-up')}><Text style={[styles.link, { color: colors.primary }]}>Criar agora</Text></Pressable></View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

function Field({ label, colors, ...props }: { label: string; colors: ReturnType<typeof useColors> } & React.ComponentProps<typeof TextInput>) {
  return <View style={styles.field}><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text><TextInput {...props} autoCapitalize="none" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} /></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, justifyContent: 'space-between' },
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
  message: { fontSize: 13, lineHeight: 18 },
  forgotButton: { alignItems: 'center', marginTop: -4 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  footerText: { fontSize: 13 },
  link: { fontSize: 13, fontWeight: '700' },
});