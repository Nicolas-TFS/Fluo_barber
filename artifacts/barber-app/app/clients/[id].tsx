import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default function ClientDetailsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clients, appointments, services, updateClient, deleteClient } = useShopStore();
  const [month, setMonth] = useState(() => new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const client = clients.find((item) => item.id === id);
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month);

  const clientAppointments = useMemo(() => {
    if (!client) return [];
    return appointments
      .filter((appointment) => {
        return appointment.clientId === client.id && appointment.date.startsWith(monthKey(month)) && appointment.status !== 'cancelled';
      })
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [appointments, client, month]);

  if (!client) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Cliente', headerShown: true, headerTintColor: colors.foreground, headerStyle: { backgroundColor: colors.background } }} />
        <EmptyState icon="user-x" title="Cliente não encontrado" description="Esse cadastro não está mais disponível." />
      </View>
    );
  }

  const completed = clientAppointments.filter((appointment) => appointment.status === 'completed');
  const revenue = completed.reduce((total, appointment) => total + appointment.amount, 0);

  const changeMonth = (offset: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const openEdit = () => {
    setEditName(client.name);
    setEditPhone(client.phone);
    setError('');
    setEditOpen(true);
  };

  const saveClient = async () => {
    if (!editName.trim() || saving) return;
    setSaving(true);
    setError('');
    try {
      await updateClient(client.id, { name: editName.trim(), phone: editPhone.trim() });
      setEditOpen(false);
    } catch {
      setError('Não foi possível atualizar o cliente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError('');
    try {
      await deleteClient(client.id);
      setDeleteConfirmOpen(false);
      router.back();
    } catch {
      setError('Não foi possível excluir o cliente. Tente novamente.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: client.name, headerShown: true, headerTintColor: colors.foreground, headerStyle: { backgroundColor: colors.background }, headerTitleStyle: { color: colors.foreground } }} />
      <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{client.name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: colors.foreground }]}>{client.name}</Text>
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>{client.phone || 'Telefone não informado'}</Text>
          </View>
          <Pressable onPress={openEdit} style={[styles.editButton, { backgroundColor: colors.secondary }]}>
            <Feather name="edit-2" size={16} color={colors.foreground} />
          </Pressable>
        </View>
        <Pressable disabled={deleting} onPress={() => { setError(''); setDeleteConfirmOpen(true); }} style={styles.deleteButton}>
          <Feather name="trash-2" size={15} color={colors.destructive} />
          <Text style={[styles.deleteText, { color: colors.destructive }]}>{deleting ? 'Excluindo...' : 'Excluir cliente'}</Text>
        </Pressable>

        <View style={styles.monthHeader}>
          <Pressable onPress={() => changeMonth(-1)} style={[styles.monthButton, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-left" size={19} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
          <Pressable onPress={() => changeMonth(1)} style={[styles.monthButton, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-right" size={19} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{completed.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Concluídos</Text>
          </View>
          <View style={[styles.stat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.statValue, { color: colors.foreground }]}>R$ {revenue.toFixed(2).replace('.', ',')}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Recebido</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Atendimentos do mês</Text>
        {clientAppointments.length === 0 ? (
          <EmptyState icon="calendar" title="Nenhum atendimento" description="Não há movimentações desse cliente no mês selecionado." />
        ) : (
          <View style={styles.list}>
            {clientAppointments.map((appointment) => {
              const service = services.find((item) => item.id === appointment.serviceId);
              return (
                <View key={appointment.id} style={[styles.visit, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.visitInfo}>
                    <Text style={[styles.service, { color: colors.foreground }]}>{service?.name || 'Serviço'}</Text>
                    <Text style={[styles.visitMeta, { color: colors.mutedForeground }]}>
                      {appointment.date.split('-').reverse().join('/')} às {appointment.time}
                    </Text>
                  </View>
                  <View style={styles.visitValue}>
                    <Text style={[styles.amount, { color: colors.foreground }]}>R$ {appointment.amount.toFixed(2).replace('.', ',')}</Text>
                    <Text style={[styles.status, { color: appointment.status === 'completed' ? colors.primary : colors.mutedForeground }]}>
                      {appointment.status === 'completed' ? 'Concluído' : 'Agendado'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.editModal, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Editar cliente</Text>
                <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>As alterações também atualizam os atendimentos vinculados.</Text>
              </View>
              <Pressable onPress={() => setEditOpen(false)} style={[styles.closeButton, { backgroundColor: colors.secondary }]}>
                <Feather name="x" size={18} color={colors.foreground} />
              </Pressable>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nome</Text>
            <TextInput value={editName} onChangeText={setEditName} autoCapitalize="words" placeholder="Nome completo" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Telefone</Text>
            <TextInput value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" placeholder="(11) 99999-9999" placeholderTextColor={colors.mutedForeground} style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]} />
            {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
            <PrimaryButton label="Salvar alterações" onPress={() => void saveClient()} disabled={!editName.trim()} loading={saving} />
          </View>
        </View>
      </Modal>
      <Modal visible={deleteConfirmOpen} transparent animationType="fade" onRequestClose={() => setDeleteConfirmOpen(false)}>
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.dangerIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="trash-2" size={21} color={colors.destructive} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>Excluir cliente?</Text>
            <Text style={[styles.confirmDescription, { color: colors.mutedForeground }]}>
              O cadastro será removido. Os atendimentos continuam na agenda e no financeiro, mas deixam de aparecer no controle deste cliente.
            </Text>
            {error ? <Text style={[styles.confirmError, { color: colors.destructive }]}>{error}</Text> : null}
            <Pressable disabled={deleting} onPress={() => void handleDelete()} style={[styles.confirmDelete, { backgroundColor: colors.destructive }]}>
              <Text style={[styles.confirmDeleteText, { color: colors.primaryForeground }]}>{deleting ? 'Excluindo...' : 'Excluir cliente'}</Text>
            </Pressable>
            <Pressable disabled={deleting} onPress={() => setDeleteConfirmOpen(false)} style={styles.confirmCancel}>
              <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  notFound: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  profile: { marginTop: 18, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1, gap: 5 },
  editButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700' },
  phone: { fontSize: 13 },
  deleteButton: { alignSelf: 'flex-end', marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7 },
  deleteText: { fontSize: 12, fontWeight: '700' },
  monthHeader: { marginTop: 26, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, minHeight: 88, borderRadius: 17, borderWidth: 1, padding: 14, justifyContent: 'space-between' },
  statValue: { fontSize: 19, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 28, marginBottom: 12 },
  list: { gap: 10 },
  visit: { minHeight: 74, borderRadius: 17, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  visitInfo: { flex: 1, gap: 6 },
  service: { fontSize: 14, fontWeight: '700' },
  visitMeta: { fontSize: 12 },
  visitValue: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 13, fontWeight: '700' },
  status: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.68)' },
  editModal: { borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  modalHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(150,150,150,0.45)', alignSelf: 'center', marginBottom: 8 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 5 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 5, maxWidth: 280 },
  closeButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginTop: 3 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 15, fontSize: 15 },
  error: { fontSize: 12 },
  confirmOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(0,0,0,0.72)' },
  confirmCard: { borderWidth: 1, borderRadius: 22, padding: 20, alignItems: 'center' },
  dangerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmTitle: { fontSize: 20, fontWeight: '700' },
  confirmDescription: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 9, marginBottom: 18 },
  confirmError: { fontSize: 12, textAlign: 'center', marginBottom: 12 },
  confirmDelete: { minHeight: 50, borderRadius: 14, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  confirmDeleteText: { fontSize: 14, fontWeight: '700' },
  confirmCancel: { minHeight: 46, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  confirmCancelText: { fontSize: 14, fontWeight: '700' },
});