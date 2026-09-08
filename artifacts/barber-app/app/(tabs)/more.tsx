import { Feather } from '@expo/vector-icons';
import { useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/BrandMark';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useShopStore } from '@/contexts/AppContext';
import { useColors } from '@/hooks/useColors';

export default function MoreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, services } = useShopStore();
  const { signOut } = useClerk();
  const router = useRouter();
  return <ScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 94 }}><ScreenHeader eyebrow="Configurações" title="Mais do seu negócio." /><View style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}><BrandMark size={48} /><View style={styles.profileCopy}><Text style={[styles.shopName, { color: colors.foreground }]}>{profile?.shopName}</Text><Text style={[styles.ownerName, { color: colors.mutedForeground }]}>{profile?.ownerName}</Text></View><Feather name="chevron-right" size={18} color={colors.mutedForeground} /></View><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estrutura</Text><MenuRow icon="scissors" label="Serviços" detail={`${services.length} ativos`} onPress={() => undefined} colors={colors} /><MenuRow icon="clock" label="Horário de funcionamento" detail={`${profile?.openingTime} — ${profile?.closingTime}`} onPress={() => undefined} colors={colors} /><MenuRow icon="bar-chart-2" label="Financeiro" detail="Em breve" onPress={() => undefined} colors={colors} /><Pressable onPress={() => signOut()} style={styles.logout}><Feather name="log-out" size={17} color={colors.destructive} /><Text style={[styles.logoutText, { color: colors.destructive }]}>Sair da conta</Text></Pressable></ScrollView>;
}

function MenuRow({ icon, label, detail, onPress, colors }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; detail: string; onPress: () => void; colors: ReturnType<typeof useColors> }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.menuRow, { borderBottomColor: colors.border }, pressed && { opacity: 0.7 }]}><View style={[styles.menuIcon, { backgroundColor: colors.secondary }]}><Feather name={icon} size={17} color={colors.primary} /></View><View style={styles.menuCopy}><Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.menuDetail, { color: colors.mutedForeground }]}>{detail}</Text></View><Feather name="chevron-right" size={17} color={colors.mutedForeground} /></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20 },
  profile: { borderWidth: 1, borderRadius: 19, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 13, marginBottom: 30 },
  profileCopy: { flex: 1, gap: 4 },
  shopName: { fontSize: 16, fontWeight: '700' },
  ownerName: { fontSize: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  menuRow: { minHeight: 70, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 13 },
  menuIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1, gap: 4 },
  menuLabel: { fontSize: 14, fontWeight: '600' },
  menuDetail: { fontSize: 12 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 31, paddingVertical: 12 },
  logoutText: { fontSize: 14, fontWeight: '700' },
});