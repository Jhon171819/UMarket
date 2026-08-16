import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useStore, PaymentMethodConfig, StoreConfig } from '../../data/StoreContext';
import { COLORS, money } from '../../components/theme';

export default function SettingsScreen() {
  const { products, services, customers, sales, storeConfig, completeSetup } = useStore();
  const [editorVisible, setEditorVisible] = useState(false);
  const [draft, setDraft] = useState<StoreConfig | null>(null);
  const [editorError, setEditorError] = useState('');
  const companyName = storeConfig?.companyName ?? 'Empresa local';
  const managerName = storeConfig?.managerName ?? 'Configuração pendente';
  const managerInitials = managerName.split(' ').filter(Boolean).slice(0, 2).map(name => name[0]).join('').toUpperCase() || 'U';
  const inventory = products.reduce((sum, product) => sum + product.costCents * product.stock, 0);
  const revenue = sales.reduce((sum, sale) => sum + sale.totalCents, 0);
  const lowStock = products.filter(product => product.active && product.stock <= product.lowStockAlert).length;

  const openEditor = () => {
    if (!storeConfig) return;
    setDraft({ ...storeConfig, paymentMethods: storeConfig.paymentMethods.map(method => ({ ...method })) });
    setEditorError('');
    setEditorVisible(true);
  };

  const closeEditor = () => {
    setEditorVisible(false);
    setEditorError('');
  };

  const updateDraft = (updates: Partial<StoreConfig>) => setDraft(current => current ? { ...current, ...updates } : current);

  const updateMethod = (id: string, updates: Partial<PaymentMethodConfig>) => {
    setDraft(current => current ? { ...current, paymentMethods: current.paymentMethods.map(method => method.id === id ? { ...method, ...updates } : method) } : current);
    setEditorError('');
  };

  const saveEditor = () => {
    if (!draft) return;
    if (!draft.companyName.trim() || !draft.managerName.trim()) {
      setEditorError('Preencha o nome da empresa e do gerente.');
      return;
    }
    if (!draft.paymentMethods.some(method => method.enabled)) {
      setEditorError('Selecione pelo menos um método de pagamento.');
      return;
    }
    const pix = draft.paymentMethods.find(method => method.id === 'pix' && method.enabled);
    if (pix && !pix.pixKey?.trim()) {
      setEditorError('Informe a chave Pix ou desative o Pix.');
      return;
    }
    completeSetup({ ...draft, companyName: draft.companyName.trim(), managerName: draft.managerName.trim() });
    closeEditor();
  };

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View><Text style={styles.title}>Mais</Text><Text style={styles.subtitle}>Configurações e visão geral.</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{managerInitials}</Text></View></View>
      <TouchableOpacity style={styles.companyCard} onPress={openEditor} activeOpacity={0.8}><View style={styles.companyLogo}><Ionicons name="storefront-outline" size={26} color={COLORS.white} /></View><View style={styles.companyInfo}><Text style={styles.companyName} numberOfLines={1}>{companyName}</Text><Text style={styles.companySub} numberOfLines={1}>{managerName} · modo offline</Text></View><Ionicons name="chevron-forward" size={19} color={COLORS.textMuted} /></TouchableOpacity>
      <Text style={styles.sectionTitle}>Resumo do negócio</Text>
      <View style={styles.statsGrid}><Stat icon="cube-outline" value={String(products.filter(p => p.active).length)} label="Produtos" color={COLORS.accent} /><Stat icon="construct-outline" value={String(services.length)} label="Serviços" color={COLORS.orange} /><Stat icon="people-outline" value={String(customers.length)} label="Clientes" color={COLORS.success} /><Stat icon="alert-circle-outline" value={String(lowStock)} label="Estoque baixo" color={COLORS.warning} /></View>
      <Text style={styles.sectionTitle}>Financeiro</Text>
      <View style={styles.financeCard}><InfoRow icon="wallet-outline" label="Receita acumulada" value={money(revenue)} color={COLORS.success} /><InfoRow icon="cube-outline" label="Valor em estoque" value={money(inventory)} color={COLORS.accent} /><InfoRow icon="receipt-outline" label="Vendas registradas" value={String(sales.length)} color={COLORS.orange} /></View>
      <Text style={styles.sectionTitle}>Preferências</Text>
      <View style={styles.menuCard}><MenuRow icon="business-outline" title="Dados da empresa" subtitle="Nome do negócio e gerente" onPress={openEditor} /><MenuRow icon="wallet-outline" title="Métodos de pagamento" subtitle="Pix, cartões e acréscimos" onPress={openEditor} /><MenuRow icon="people-outline" title="Usuários e permissões" subtitle="Admin e equipe" /><MenuRow icon="cloud-offline-outline" title="Dados locais" subtitle="Persistidos neste dispositivo" /></View>
      <Text style={styles.version}>UMarket · versão 0.1.0</Text>
    </ScrollView>
    <CompanyEditor visible={editorVisible} draft={draft} error={editorError} onClose={closeEditor} onUpdate={updateDraft} onUpdateMethod={updateMethod} onSave={saveEditor} />
  </SafeAreaView>;
}

function CompanyEditor({ visible, draft, error, onClose, onUpdate, onUpdateMethod, onSave }: { visible: boolean; draft: StoreConfig | null; error: string; onClose: () => void; onUpdate: (updates: Partial<StoreConfig>) => void; onUpdateMethod: (id: string, updates: Partial<PaymentMethodConfig>) => void; onSave: () => void }) {
  return <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}><KeyboardAvoidingView style={styles.editorKeyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.editorSheet}>
      <View style={styles.editorHeader}><View><Text style={styles.editorTitle}>Configurações da loja</Text><Text style={styles.editorSubtitle}>Edite os dados usados no seu dia a dia.</Text></View><TouchableOpacity onPress={onClose} style={styles.closeButton}><Ionicons name="close" size={22} color={COLORS.textSub} /></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.editorContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.editorSection}>Dados da empresa</Text>
        <Field label="Nome da empresa" value={draft?.companyName ?? ''} placeholder="Nome da empresa" onChangeText={value => onUpdate({ companyName: value })} icon="business-outline" />
        <Field label="Gerente ou proprietário" value={draft?.managerName ?? ''} placeholder="Nome do gerente" onChangeText={value => onUpdate({ managerName: value })} icon="person-outline" />
        <Text style={styles.editorSection}>Métodos de pagamento</Text>
        {draft?.paymentMethods.map(method => <MethodEditor key={method.id} method={method} onUpdate={updates => onUpdateMethod(method.id, updates)} />)}
        {error ? <View style={styles.editorError}><Ionicons name="alert-circle-outline" size={17} color={COLORS.danger} /><Text style={styles.editorErrorText}>{error}</Text></View> : null}
      </ScrollView>
      <View style={styles.editorActions}><TouchableOpacity style={styles.cancelButton} onPress={onClose}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={styles.saveButton} onPress={onSave}><Ionicons name="checkmark" size={18} color={COLORS.white} /><Text style={styles.saveText}>Salvar alterações</Text></TouchableOpacity></View>
    </View></KeyboardAvoidingView></View>
  </Modal>;
}

function MethodEditor({ method, onUpdate }: { method: PaymentMethodConfig; onUpdate: (updates: Partial<PaymentMethodConfig>) => void }) {
  return <View style={[styles.methodCard, method.enabled && styles.methodCardActive]}>
    <View style={styles.methodHeader}><View style={[styles.methodIcon, method.enabled && styles.methodIconActive]}><Ionicons name={method.id === 'pix' ? 'qr-code-outline' : method.id === 'cash' ? 'cash-outline' : 'card-outline'} size={19} color={method.enabled ? COLORS.accent : COLORS.textMuted} /></View><Text style={styles.methodName}>{method.name}</Text><Switch value={method.enabled} onValueChange={value => onUpdate({ enabled: value })} trackColor={{ false: '#D8E0EA', true: '#B9D0FF' }} thumbColor={method.enabled ? COLORS.accent : '#FFFFFF'} /></View>
    {method.enabled && method.id === 'pix' ? <View style={styles.pixEditor}><Text style={styles.methodLabel}>Chave Pix</Text><TextInput value={method.pixKey ?? ''} onChangeText={value => onUpdate({ pixKey: value })} placeholder="CPF, e-mail, telefone ou chave aleatória" placeholderTextColor={COLORS.textMuted} style={styles.methodInput} autoCapitalize="none" autoCorrect={false} /></View> : null}
    {method.enabled ? <View style={styles.surchargeEditor}><View style={styles.surchargeEditorCopy}><Text style={styles.methodLabel}>Aplicar acréscimo</Text><Text style={styles.methodHint}>Adicione um percentual neste método</Text></View><Switch value={method.surchargeEnabled} onValueChange={value => onUpdate({ surchargeEnabled: value })} trackColor={{ false: '#D8E0EA', true: '#B9D0FF' }} thumbColor={method.surchargeEnabled ? COLORS.accent : '#FFFFFF'} /></View> : null}
    {method.enabled && method.surchargeEnabled ? <View style={styles.percentEditor}><TextInput value={method.surchargePercent ? String(method.surchargePercent).replace('.', ',') : ''} onChangeText={value => onUpdate({ surchargePercent: Number(value.replace(',', '.').replace(/[^0-9.]/g, '')) || 0 })} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={COLORS.textMuted} style={styles.percentInput} maxLength={5} /><Text style={styles.percentSymbol}>%</Text></View> : null}
  </View>;
}

function Field({ label, value, placeholder, onChangeText, icon }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void; icon: keyof typeof Ionicons.glyphMap }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.inputWrap}><Ionicons name={icon} size={18} color={COLORS.textMuted} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.textMuted} style={styles.input} autoCapitalize="words" /></View></View>;
}

function Stat({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; color: string }) { return <View style={styles.stat}><View style={[styles.statIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon} size={19} color={color} /></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }
function InfoRow({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }) { return <View style={styles.infoRow}><View style={[styles.infoIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon} size={18} color={color} /></View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>; }
function MenuRow({ icon, title, subtitle, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress?: () => void }) { return <TouchableOpacity style={styles.menuRow} onPress={onPress} disabled={!onPress} activeOpacity={0.75}><View style={styles.menuIcon}><Ionicons name={icon} size={19} color={COLORS.textSub} /></View><View style={styles.menuCopy}><Text style={styles.menuTitle}>{title}</Text><Text style={styles.menuSubtitle}>{subtitle}</Text></View><Ionicons name="chevron-forward" size={17} color={COLORS.textMuted} /></TouchableOpacity>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: 20, paddingBottom: 35 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 18 }, title: { color: COLORS.text, fontSize: 27, fontWeight: '800' }, subtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 5 }, avatar: { width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: COLORS.white, fontSize: 18, fontWeight: '800' }, companyCard: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 23 }, companyLogo: { width: 45, height: 45, borderRadius: 14, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }, companyInfo: { flex: 1 }, companyName: { color: COLORS.text, fontSize: 15, fontWeight: '800' }, companySub: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 }, sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', marginBottom: 11, marginTop: 4 }, statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }, stat: { width: '48%', backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, padding: 13, position: 'relative' }, statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, statValue: { color: COLORS.text, fontSize: 20, fontWeight: '800' }, statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 }, financeCard: { backgroundColor: COLORS.surface, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 13, marginBottom: 23 }, infoRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }, infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, infoLabel: { flex: 1, color: COLORS.textSub, fontSize: 12, fontWeight: '600' }, infoValue: { color: COLORS.text, fontSize: 13, fontWeight: '800' }, menuCard: { backgroundColor: COLORS.surface, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 13 }, menuRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border }, menuIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }, menuCopy: { flex: 1 }, menuTitle: { color: COLORS.text, fontSize: 13, fontWeight: '700' }, menuSubtitle: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 }, version: { textAlign: 'center', color: COLORS.textMuted, fontSize: 10, marginTop: 18 }, modalOverlay: { flex: 1, backgroundColor: '#14223880', justifyContent: 'flex-end' }, editorKeyboard: { width: '100%' }, editorSheet: { maxHeight: '92%', backgroundColor: COLORS.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingTop: 16 }, editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border }, editorTitle: { color: COLORS.text, fontSize: 20, fontWeight: '800' }, editorSubtitle: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 }, closeButton: { width: 35, height: 35, borderRadius: 11, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }, editorContent: { padding: 20, paddingBottom: 12 }, editorSection: { color: COLORS.text, fontSize: 15, fontWeight: '800', marginTop: 4, marginBottom: 12 }, field: { gap: 7, marginBottom: 14 }, fieldLabel: { color: COLORS.text, fontSize: 12, fontWeight: '800' }, inputWrap: { height: 49, borderWidth: 1, borderColor: COLORS.border, borderRadius: 13, backgroundColor: COLORS.bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 9 }, input: { flex: 1, color: COLORS.text, fontSize: 13, height: '100%' }, methodCard: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, marginBottom: 10, overflow: 'hidden', backgroundColor: COLORS.surface }, methodCardActive: { borderColor: '#BBD2FF' }, methodHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10 }, methodIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }, methodIconActive: { backgroundColor: COLORS.surfaceAlt }, methodName: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: '700' }, pixEditor: { padding: 12, paddingTop: 0, gap: 7 }, methodLabel: { color: COLORS.textSub, fontSize: 11, fontWeight: '700' }, methodInput: { height: 43, borderWidth: 1, borderColor: COLORS.border, borderRadius: 11, backgroundColor: COLORS.bg, paddingHorizontal: 11, color: COLORS.text, fontSize: 12 }, surchargeEditor: { minHeight: 55, borderTopWidth: 1, borderTopColor: COLORS.border, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }, surchargeEditorCopy: { flex: 1 }, methodHint: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 }, percentEditor: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginLeft: 12, marginBottom: 11, height: 38, width: 88, borderWidth: 1, borderColor: '#BBD2FF', backgroundColor: '#F7FAFF', borderRadius: 10, paddingHorizontal: 10 }, percentInput: { flex: 1, color: COLORS.text, fontSize: 12, fontWeight: '700', padding: 0 }, percentSymbol: { color: COLORS.accent, fontSize: 12, fontWeight: '800' }, editorError: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF0F1', borderRadius: 11, padding: 11, marginTop: 8 }, editorErrorText: { color: COLORS.danger, fontSize: 11, fontWeight: '600', flex: 1 }, editorActions: { flexDirection: 'row', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: COLORS.border }, cancelButton: { flex: 1, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }, cancelText: { color: COLORS.textSub, fontSize: 13, fontWeight: '800' }, saveButton: { flex: 1.5, height: 48, borderRadius: 13, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, saveText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
});
