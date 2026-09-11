import { Feather } from '@expo/vector-icons';
import { useClerk } from '@clerk/expo';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/BrandMark';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, services, saveProfile, addService, deleteAccount } = useShopStore();
  const { signOut } = useClerk();
  const router = useRouter();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [servicePrice, setServicePrice] = useState('');
  const [openingTime, setOpeningTime] = useState(profile?.openingTime || '09:00');
  const [closingTime, setClosingTime] = useState(profile?.closingTime || '18:00');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [savingService, setSavingService] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const openHours = () => {
    setOpeningTime(profile?.openingTime || '09:00');
    setClosingTime(profile?.closingTime || '18:00');
    setError('');
    setHoursOpen(true);
  };

  const handleAddService = async () => {
    const duration = Number(serviceDuration);
    const price = Number(servicePrice.replace(',', '.'));
    if (!serviceName.trim() || !Number.isInteger(duration) || duration <= 0 || !Number.isFinite(price) || price < 0) {
      setError('Informe nome, duração e valor válidos.');
      return;
    }
    setSavingService(true);
    setError('');
    try {
      await addService({ name: serviceName.trim(), duration, price: Math.round(price) });
      setServiceName('');
      setServiceDuration('30');
      setServicePrice('');
    } catch {
      setError('Não foi possível adicionar o serviço agora.');
    } finally {
      setSavingService(false);
    }
  };

  const handleSaveHours = async () => {
    if (!profile || !/^\d{2}:\d{2}$/.test(openingTime) || !/^\d{2}:\d{2}$/.test(closingTime)) {
      setError('Use o formato 09:00 para os horários.');
      return;
    }
    setSavingHours(true);
    setError('');
    try {
      await saveProfile({ ...profile, openingTime, closingTime });
      setHoursOpen(false);
    } catch {
      setError('Não foi possível atualizar o horário agora.');
    } finally {
      setSavingHours(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR') return;
    setDeleting(true);
    setError('');
    try {
      await deleteAccount();
      try {
        await signOut();
      } catch {
        // The Clerk user has already been deleted by the server.
      }
      router.replace('/');
    } catch {
      setError('Não foi possível excluir a conta agora. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 94 }}
      >
        <ScreenHeader eyebrow="Configurações" title="Mais do seu negócio." />
        <Pressable onPress={() => router.push('/profile')} style={({ pressed }) => [styles.profile, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          {profile?.profileImage ? <Image source={{ uri: profile.profileImage }} style={styles.profileImage} contentFit="cover" /> : <BrandMark size={48} />}
          <View style={styles.profileCopy}>
            <Text style={[styles.shopName, { color: colors.foreground }]}>{profile?.shopName}</Text>
            <Text style={[styles.ownerName, { color: colors.mutedForeground }]}>{profile?.ownerName}</Text>
            <Text style={[styles.editProfile, { color: colors.primary }]}>Editar perfil</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estrutura</Text>
        <MenuRow
          icon="scissors"
          label="Serviços"
          detail={`${services.filter((service) => service.active).length} ativos · adicionar serviço`}
          onPress={() => {
            setError('');
            setServicesOpen(true);
          }}
          colors={colors}
        />
        <MenuRow
          icon="clock"
          label="Horário de funcionamento"
          detail={`${profile?.openingTime} — ${profile?.closingTime}`}
          onPress={openHours}
          colors={colors}
        />
        <MenuRow
          icon="bar-chart-2"
          label="Financeiro"
          detail="Atendimentos pagos e formas de pagamento"
          onPress={() => router.push('/finance')}
          colors={colors}
        />

        <Text style={[styles.sectionTitle, styles.accountTitle, { color: colors.foreground }]}>Conta</Text>
        <MenuRow
          icon="trash-2"
          label="Deletar conta"
          detail="Apagar permanentemente cadastro e dados"
          onPress={() => {
            setDeleteConfirmation('');
            setError('');
            setDeleteOpen(true);
          }}
          colors={colors}
          destructive
        />
        <Pressable onPress={() => signOut()} style={styles.logout}>
          <Feather name="log-out" size={17} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sair da conta</Text>
        </Pressable>
      </ScrollView>

      <ModalSheet visible={servicesOpen} onClose={() => setServicesOpen(false)} title="Serviços" colors={colors}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.serviceList}>
            {services.map((service) => (
              <View key={service.id} style={[styles.serviceCard, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <View style={styles.serviceCopy}>
                  <Text style={[styles.serviceName, { color: colors.foreground }]}>{service.name}</Text>
                  <Text style={[styles.serviceMeta, { color: colors.mutedForeground }]}>{service.duration} min</Text>
                </View>
                <Text style={[styles.servicePrice, { color: colors.primary }]}>R$ {service.price.toFixed(2).replace('.', ',')}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Adicionar serviço</Text>
          <Field label="Nome do serviço" value={serviceName} onChangeText={setServiceName} placeholder="Ex.: Sobrancelha" colors={colors} />
          <View style={styles.fieldRow}>
            <View style={styles.flexField}>
              <Field label="Duração (min)" value={serviceDuration} onChangeText={setServiceDuration} keyboardType="number-pad" placeholder="30" colors={colors} />
            </View>
            <View style={styles.flexField}>
              <Field label="Valor (R$)" value={servicePrice} onChangeText={setServicePrice} keyboardType="decimal-pad" placeholder="25" colors={colors} />
            </View>
          </View>
          {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
          <PrimaryButton label="Adicionar serviço" onPress={handleAddService} loading={savingService} disabled={!serviceName.trim() || !servicePrice} />
        </ScrollView>
      </ModalSheet>

      <ModalSheet visible={hoursOpen} onClose={() => setHoursOpen(false)} title="Horário de funcionamento" colors={colors}>
        <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>Defina o horário exibido para sua barbearia.</Text>
        <View style={styles.fieldRow}>
          <View style={styles.flexField}>
            <Field label="Abertura" value={openingTime} onChangeText={setOpeningTime} placeholder="09:00" colors={colors} />
          </View>
          <View style={styles.flexField}>
            <Field label="Fechamento" value={closingTime} onChangeText={setClosingTime} placeholder="18:00" colors={colors} />
          </View>
        </View>
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <PrimaryButton label="Salvar horário" onPress={handleSaveHours} loading={savingHours} />
      </ModalSheet>

      <ModalSheet visible={deleteOpen} onClose={() => !deleting && setDeleteOpen(false)} title="Deletar conta definitivamente?" colors={colors}>
        <View style={[styles.warning, { backgroundColor: colors.input, borderColor: colors.destructive }]}>
          <Feather name="alert-triangle" size={20} color={colors.destructive} />
          <Text style={[styles.warningText, { color: colors.foreground }]}>
            Esta ação apaga seu perfil, serviços, agenda, financeiro, e-mail e senha. O acesso só será possível após um novo cadastro.
          </Text>
        </View>
        <Field
          label='Digite "EXCLUIR" para confirmar'
          value={deleteConfirmation}
          onChangeText={setDeleteConfirmation}
          autoCapitalize="characters"
          placeholder="EXCLUIR"
          colors={colors}
        />
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <Pressable
          disabled={deleteConfirmation !== 'EXCLUIR' || deleting}
          onPress={handleDeleteAccount}
          style={[
            styles.deleteButton,
            { backgroundColor: colors.destructive },
            (deleteConfirmation !== 'EXCLUIR' || deleting) && styles.disabled,
          ]}
        >
          <Text style={styles.deleteButtonText}>{deleting ? 'Excluindo...' : 'Excluir permanentemente'}</Text>
        </Pressable>
      </ModalSheet>
    </>
  );
}

function MenuRow({
  icon,
  label,
  detail,
  onPress,
  colors,
  destructive = false,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  detail: string;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  destructive?: boolean;
}) {
  const color = destructive ? colors.destructive : colors.foreground;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, { borderBottomColor: colors.border }, pressed && styles.pressed]}>
      <View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={17} color={destructive ? colors.destructive : colors.primary} />
      </View>
      <View style={styles.menuCopy}>
        <Text style={[styles.menuLabel, { color }]}>{label}</Text>
        <Text style={[styles.menuDetail, { color: colors.mutedForeground }]}>{detail}</Text>
      </View>
      <Feather name="chevron-right" size={17} color={colors.mutedForeground} />
    </Pressable>
  );
}

function ModalSheet({
  visible,
  onClose,
  title,
  colors,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, colors, ...props }: { label: string; colors: ReturnType<typeof useColors> } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  profile: { borderWidth: 1, borderRadius: 19, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 30 },
  profileCopy: { flex: 1, gap: 4 },
  profileImage: { width: 48, height: 48, borderRadius: 15 },
  shopName: { fontSize: 16, fontWeight: '700' },
  ownerName: { fontSize: 12 },
  editProfile: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  accountTitle: { marginTop: 29 },
  menuRow: { minHeight: 70, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1, gap: 4 },
  menuLabel: { fontSize: 14, fontWeight: '600' },
  menuDetail: { fontSize: 12 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 24, paddingVertical: 12 },
  logoutText: { fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  modalCard: { maxHeight: '88%', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, padding: 22, paddingBottom: 32, gap: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  modalTitle: { flex: 1, fontSize: 21, fontWeight: '700' },
  closeButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalDescription: { fontSize: 13, lineHeight: 19 },
  serviceList: { gap: 8, marginBottom: 22 },
  serviceCard: { minHeight: 62, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceCopy: { flex: 1, gap: 4 },
  serviceName: { fontSize: 14, fontWeight: '700' },
  serviceMeta: { fontSize: 11 },
  servicePrice: { fontSize: 13, fontWeight: '700' },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  field: { gap: 7, marginBottom: 13 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 14 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  flexField: { flex: 1 },
  error: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  warning: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  warningText: { flex: 1, fontSize: 13, lineHeight: 19 },
  deleteButton: { minHeight: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  deleteButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  disabled: { opacity: 0.42 },
});