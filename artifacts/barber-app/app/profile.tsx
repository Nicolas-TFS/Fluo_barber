import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, saveProfile } = useShopStore();
  const [shopName, setShopName] = useState(profile?.shopName ?? '');
  const [ownerName, setOwnerName] = useState(profile?.ownerName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [profileImage, setProfileImage] = useState(profile?.profileImage ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const chooseImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Permita o acesso às fotos para adicionar uma imagem ao perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      const base64 = asset.base64!;
      if (base64.length > 4_000_000) {
        setError('Esta foto é muito grande. Escolha outra imagem.');
        return;
      }
      setProfileImage(`data:${asset.mimeType ?? 'image/jpeg'};base64,${base64}`);
      setError('');
    }
  };

  const save = async () => {
    if (!profile || !shopName.trim() || !ownerName.trim()) return;
    Keyboard.dismiss();
    setSaving(true);
    setError('');
    try {
      await saveProfile({
        ...profile,
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        profileImage,
      });
      router.back();
    } catch {
      setError('Não foi possível atualizar o perfil agora. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 34 }]}
      bottomOffset={72}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
    >
      <ScreenHeader
        eyebrow="Perfil"
        title="Sua barbearia."
        trailing={<Pressable onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-left" size={20} color={colors.foreground} /></Pressable>}
      />

      <View style={styles.photoSection}>
        <Pressable onPress={chooseImage} style={[styles.photoButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.photo} contentFit="cover" />
          ) : (
            <Feather name="camera" size={28} color={colors.primary} />
          )}
          <View style={[styles.photoBadge, { backgroundColor: colors.primary }]}>
            <Feather name="edit-2" size={13} color={colors.primaryForeground} />
          </View>
        </Pressable>
        <View style={styles.photoCopy}>
          <Text style={[styles.photoTitle, { color: colors.foreground }]}>Foto do perfil</Text>
          <Text style={[styles.photoText, { color: colors.mutedForeground }]}>Toque para escolher uma foto quadrada da galeria.</Text>
          {profileImage ? <Pressable onPress={() => setProfileImage('')}><Text style={[styles.removePhoto, { color: colors.destructive }]}>Remover foto</Text></Pressable> : null}
        </View>
      </View>

      <View style={styles.form}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Informações principais</Text>
        <Field label="Nome da barbearia" value={shopName} onChangeText={setShopName} placeholder="Nome do estabelecimento" colors={colors} />
        <Field label="Nome do responsável" value={ownerName} onChangeText={setOwnerName} placeholder="Seu nome" colors={colors} />
        <Field label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="(11) 99999-9999" colors={colors} />

        <Text style={[styles.sectionTitle, styles.addressTitle, { color: colors.foreground }]}>Endereço da barbearia</Text>
        <Field label="Endereço" value={address} onChangeText={setAddress} placeholder="Rua, número e complemento" colors={colors} />
        <Field label="Cidade" value={city} onChangeText={setCity} placeholder="Cidade e estado" colors={colors} />
      </View>

      {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
      <PrimaryButton label="Salvar alterações" onPress={save} loading={saving} disabled={!shopName.trim() || !ownerName.trim()} />
    </KeyboardAwareScrollViewCompat>
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
  content: { flexGrow: 1, paddingHorizontal: 20 },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  photoSection: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 30 },
  photoButton: { width: 92, height: 92, borderRadius: 26, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%', borderRadius: 25 },
  photoBadge: { position: 'absolute', right: -4, bottom: -4, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  photoCopy: { flex: 1, gap: 5 },
  photoTitle: { fontSize: 16, fontWeight: '800' },
  photoText: { fontSize: 12, lineHeight: 18 },
  removePhoto: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  form: { gap: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 1 },
  addressTitle: { marginTop: 12 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 15 },
  error: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginVertical: 14 },
});