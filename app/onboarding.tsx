import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../components/theme';
import { PaymentMethodConfig, useStore } from '../data/StoreContext';

type PaymentOption = PaymentMethodConfig & { icon: keyof typeof Ionicons.glyphMap };

const INITIAL_PAYMENTS: PaymentOption[] = [
  { id: 'pix', name: 'Pix', icon: 'qr-code-outline', enabled: true, surchargeEnabled: false, surchargePercent: 0, pixKey: '' },
  { id: 'cash', name: 'Dinheiro', icon: 'cash-outline', enabled: true, surchargeEnabled: false, surchargePercent: 0 },
  { id: 'debit', name: 'Débito', icon: 'card-outline', enabled: false, surchargeEnabled: false, surchargePercent: 0 },
  { id: 'credit', name: 'Crédito', icon: 'card-outline', enabled: false, surchargeEnabled: false, surchargePercent: 0 },
];

export default function OnboardingScreen() {
  const { hydrated, storeConfig, completeSetup } = useStore();
  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [payments, setPayments] = useState<PaymentOption[]>(INITIAL_PAYMENTS);
  const [error, setError] = useState('');

  useEffect(() => {
    if (hydrated && storeConfig) router.replace('/(tabs)');
  }, [hydrated, storeConfig]);

  const enabledPayments = useMemo(() => payments.filter(payment => payment.enabled), [payments]);

  const updatePayment = (id: string, updates: Partial<PaymentOption>) => {
    setPayments(current => current.map(payment => payment.id === id ? { ...payment, ...updates } : payment));
    setError('');
  };

  const continueSetup = () => {
    if (step === 0) {
      if (!companyName.trim() || !managerName.trim()) {
        setError('Preencha os dois campos para continuar.');
        return;
      }
      setError('');
      setStep(1);
      return;
    }
    if (step === 1) {
      if (enabledPayments.length === 0) {
        setError('Selecione pelo menos um método de pagamento.');
        return;
      }
      const pix = payments.find(payment => payment.id === 'pix' && payment.enabled);
      if (pix && !pix.pixKey?.trim()) {
        setError('Informe sua chave Pix para continuar.');
        return;
      }
      setError('');
      setStep(2);
      return;
    }

    completeSetup({
      companyName: companyName.trim(),
      managerName: managerName.trim(),
      paymentMethods: payments.map(({ icon: _icon, ...payment }) => ({ ...payment, surchargePercent: payment.surchargeEnabled ? payment.surchargePercent : 0 })),
    });
    router.replace('/(tabs)');
  };

  if (!hydrated || storeConfig) return <View style={styles.loading} />;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.topbar}>
            <View style={styles.brandMark}><Ionicons name="storefront-outline" size={22} color={COLORS.white} /></View>
            <Text style={styles.brand}>UMarket</Text>
            <Text style={styles.stepCount}>{step + 1} de 3</Text>
          </View>

          <View style={styles.progress}><View style={[styles.progressFill, { width: `${((step + 1) / 3) * 100}%` }]} /></View>

          {step === 0 && <CompanyStep companyName={companyName} managerName={managerName} setCompanyName={setCompanyName} setManagerName={setManagerName} />}
          {step === 1 && <PaymentsStep payments={payments} companyName={companyName} updatePayment={updatePayment} />}
          {step === 2 && <ReviewStep companyName={companyName} managerName={managerName} payments={enabledPayments} />}

          {error ? <View style={styles.errorBox}><Ionicons name="alert-circle-outline" size={17} color={COLORS.danger} /><Text style={styles.errorText}>{error}</Text></View> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={continueSetup} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>{step === 2 ? 'Começar a usar' : 'Continuar'}</Text>
            <Ionicons name={step === 2 ? 'checkmark' : 'arrow-forward'} size={19} color={COLORS.white} />
          </TouchableOpacity>
          {step > 0 && <TouchableOpacity style={styles.backButton} onPress={() => { setError(''); setStep(current => current - 1); }}><Ionicons name="arrow-back" size={16} color={COLORS.textSub} /><Text style={styles.backText}>Voltar</Text></TouchableOpacity>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CompanyStep({ companyName, managerName, setCompanyName, setManagerName }: { companyName: string; managerName: string; setCompanyName: (value: string) => void; setManagerName: (value: string) => void }) {
  return <View>
    <View style={styles.illustration}><Ionicons name="sparkles-outline" size={31} color={COLORS.accent} /></View>
    <Text style={styles.title}>Vamos deixar tudo pronto.</Text>
    <Text style={styles.subtitle}>Conte um pouco sobre sua empresa para personalizar o UMarket.</Text>
    <View style={styles.form}>
      <Field label="Nome da empresa" placeholder="Ex.: Mercadinho da Vila" value={companyName} onChangeText={setCompanyName} icon="business-outline" autoFocus />
      <Field label="Nome do gerente ou proprietário" placeholder="Ex.: João Martins" value={managerName} onChangeText={setManagerName} icon="person-outline" />
    </View>
  </View>;
}

function PaymentsStep({ payments, companyName, updatePayment }: { payments: PaymentOption[]; companyName: string; updatePayment: (id: string, updates: Partial<PaymentOption>) => void }) {
  const pix = payments.find(payment => payment.id === 'pix');
  return <View>
    <View style={[styles.illustration, styles.illustrationGreen]}><Ionicons name="wallet-outline" size={31} color={COLORS.success} /></View>
    <Text style={styles.title}>Como você recebe?</Text>
    <Text style={styles.subtitle}>Escolha os métodos usados nas vendas. Você pode alterar isso depois.</Text>
    <View style={styles.paymentList}>{payments.map(payment => <PaymentCard key={payment.id} payment={payment} companyName={companyName} updatePayment={updatePayment} />)}</View>
    {pix?.enabled && pix.pixKey?.trim() ? <View style={styles.pixFooter}><Ionicons name="key-outline" size={17} color={COLORS.accent} /><View style={styles.pixFooterCopy}><Text style={styles.pixFooterLabel}>Chave Pix configurada</Text><Text style={styles.pixFooterValue} selectable>{pix.pixKey}</Text></View></View> : null}
  </View>;
}

function PaymentCard({ payment, companyName, updatePayment }: { payment: PaymentOption; companyName: string; updatePayment: (id: string, updates: Partial<PaymentOption>) => void }) {
  return <View style={[styles.paymentCard, payment.enabled && styles.paymentCardActive]}>
    <TouchableOpacity style={styles.paymentHeader} onPress={() => updatePayment(payment.id, { enabled: !payment.enabled })} activeOpacity={0.8}>
      <View style={[styles.paymentIcon, payment.enabled && styles.paymentIconActive]}><Ionicons name={payment.icon} size={20} color={payment.enabled ? COLORS.accent : COLORS.textMuted} /></View>
      <Text style={styles.paymentName}>{payment.name}</Text>
      <View style={[styles.check, payment.enabled && styles.checkActive]}>{payment.enabled && <Ionicons name="checkmark" size={14} color={COLORS.white} />}</View>
    </TouchableOpacity>
    {payment.enabled && <View style={styles.surchargeRow}>
      <View style={styles.surchargeCopy}><Text style={styles.surchargeTitle}>Aplicar acréscimo</Text><Text style={styles.surchargeHint}>Adicione um percentual neste método</Text></View>
      <Switch value={payment.surchargeEnabled} onValueChange={value => updatePayment(payment.id, { surchargeEnabled: value })} trackColor={{ false: '#D8E0EA', true: '#B9D0FF' }} thumbColor={payment.surchargeEnabled ? COLORS.accent : '#FFFFFF'} />
    </View>}
    {payment.enabled && payment.surchargeEnabled && <View style={styles.percentField}><TextInput value={payment.surchargePercent ? String(payment.surchargePercent).replace('.', ',') : ''} onChangeText={value => updatePayment(payment.id, { surchargePercent: Number(value.replace(',', '.').replace(/[^0-9.]/g, '')) || 0 })} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={COLORS.textMuted} style={styles.percentInput} maxLength={5} /><Text style={styles.percentSymbol}>%</Text></View>}
    {payment.enabled && payment.id === 'pix' && <View style={styles.pixSetup}>
      <Text style={styles.pixLabel}>Sua chave Pix</Text>
      <View style={styles.pixInputWrap}><Ionicons name="key-outline" size={17} color={COLORS.textMuted} /><TextInput value={payment.pixKey ?? ''} onChangeText={value => updatePayment(payment.id, { pixKey: value })} placeholder="CPF, e-mail, telefone ou chave aleatória" placeholderTextColor={COLORS.textMuted} style={styles.pixInput} autoCapitalize="none" autoCorrect={false} keyboardType="default" /></View>
      <Text style={styles.pixHint}>O QR Code aparecerá na tela de pagamento quando o cliente escolher Pix.</Text>
    </View>}
  </View>;
}

function ReviewStep({ companyName, managerName, payments }: { companyName: string; managerName: string; payments: PaymentOption[] }) {
  return <View>
    <View style={[styles.illustration, styles.illustrationPurple]}><Ionicons name="checkmark-circle-outline" size={31} color={COLORS.accent} /></View>
    <Text style={styles.title}>Tudo certo por aqui.</Text>
    <Text style={styles.subtitle}>Confira os dados e comece a organizar sua operação.</Text>
    <View style={styles.reviewCard}>
      <ReviewRow icon="business-outline" label="Empresa" value={companyName} />
      <ReviewRow icon="person-outline" label="Gerente" value={managerName} />
      <ReviewRow icon="wallet-outline" label="Recebimentos" value={payments.map(payment => `${payment.name}${payment.surchargeEnabled && payment.surchargePercent ? ` +${payment.surchargePercent}%` : ''}`).join(' · ')} />
    </View>
    <View style={styles.readyHint}><Ionicons name="shield-checkmark-outline" size={18} color={COLORS.success} /><Text style={styles.readyText}>Seus dados ficam salvos localmente neste dispositivo.</Text></View>
  </View>;
}

function ReviewRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return <View style={styles.reviewRow}><View style={styles.reviewIcon}><Ionicons name={icon} size={18} color={COLORS.accent} /></View><View style={styles.reviewCopy}><Text style={styles.reviewLabel}>{label}</Text><Text style={styles.reviewValue}>{value}</Text></View></View>;
}

function Field({ label, placeholder, value, onChangeText, icon, autoFocus = false }: { label: string; placeholder: string; value: string; onChangeText: (value: string) => void; icon: keyof typeof Ionicons.glyphMap; autoFocus?: boolean }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.inputWrap}><Ionicons name={icon} size={19} color={COLORS.textMuted} /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={COLORS.textMuted} style={styles.input} autoCapitalize="words" autoFocus={autoFocus} returnKeyType="next" /></View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg }, flex: { flex: 1 }, loading: { flex: 1, backgroundColor: COLORS.bg }, content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 14, paddingBottom: 26 }, topbar: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 17 }, brandMark: { width: 35, height: 35, borderRadius: 11, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }, brand: { color: COLORS.text, fontSize: 17, fontWeight: '800', flex: 1 }, stepCount: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' }, progress: { height: 5, backgroundColor: '#E1E9F5', borderRadius: 3, overflow: 'hidden', marginBottom: 31 }, progressFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 }, illustration: { width: 64, height: 64, borderRadius: 21, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }, illustrationGreen: { backgroundColor: '#E7F8F1' }, illustrationPurple: { backgroundColor: '#E9F0FF' }, title: { color: COLORS.text, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 }, subtitle: { color: COLORS.textSub, fontSize: 14, lineHeight: 21, marginTop: 9, maxWidth: 350 }, form: { marginTop: 30, gap: 18 }, field: { gap: 8 }, fieldLabel: { color: COLORS.text, fontSize: 12, fontWeight: '800' }, inputWrap: { height: 54, borderWidth: 1, borderColor: COLORS.border, borderRadius: 15, backgroundColor: COLORS.surface, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, gap: 11 }, input: { flex: 1, color: COLORS.text, fontSize: 14, height: '100%' }, paymentList: { gap: 11, marginTop: 27 }, paymentCard: { backgroundColor: COLORS.surface, borderRadius: 17, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }, paymentCardActive: { borderColor: '#BBD2FF' }, paymentHeader: { minHeight: 65, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 11 }, paymentIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }, paymentIconActive: { backgroundColor: COLORS.surfaceAlt }, paymentName: { color: COLORS.text, fontSize: 13, fontWeight: '700', flex: 1 }, check: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' }, checkActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent }, surchargeRow: { borderTopWidth: 1, borderTopColor: COLORS.border, minHeight: 58, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center' }, surchargeCopy: { flex: 1 }, surchargeTitle: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' }, surchargeHint: { color: COLORS.textMuted, fontSize: 10, marginTop: 3 }, percentField: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginLeft: 13, marginBottom: 12, height: 40, width: 92, borderWidth: 1, borderColor: '#BBD2FF', backgroundColor: '#F7FAFF', borderRadius: 10, paddingHorizontal: 11 }, percentInput: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: '700', padding: 0 }, percentSymbol: { color: COLORS.accent, fontSize: 13, fontWeight: '800' }, pixSetup: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 13, gap: 8 }, pixLabel: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' }, pixInputWrap: { height: 46, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.bg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 9 }, pixInput: { flex: 1, color: COLORS.text, fontSize: 12, height: '100%' }, pixHint: { color: COLORS.textMuted, fontSize: 10 }, pixFooter: { marginTop: 14, backgroundColor: COLORS.surfaceAlt, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, pixFooterCopy: { flex: 1 }, pixFooterLabel: { color: COLORS.accent, fontSize: 10, fontWeight: '800', marginBottom: 4 }, pixFooterValue: { color: COLORS.text, fontSize: 12, fontWeight: '700' }, reviewCard: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 18, paddingHorizontal: 14, marginTop: 28 }, reviewRow: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 70, borderBottomWidth: 1, borderBottomColor: COLORS.border }, reviewIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' }, reviewCopy: { flex: 1 }, reviewLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 4 }, reviewValue: { color: COLORS.text, fontSize: 13, fontWeight: '800' }, readyHint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 19, paddingHorizontal: 3 }, readyText: { color: COLORS.textSub, fontSize: 11, flex: 1 }, errorBox: { backgroundColor: '#FFF0F1', borderRadius: 11, minHeight: 40, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 }, errorText: { color: COLORS.danger, fontSize: 12, fontWeight: '600', flex: 1 }, primaryButton: { height: 54, borderRadius: 16, backgroundColor: COLORS.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 28, shadowColor: COLORS.accent, shadowOpacity: 0.24, shadowRadius: 10, elevation: 4 }, primaryButtonText: { color: COLORS.white, fontSize: 14, fontWeight: '800' }, backButton: { height: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 5 }, backText: { color: COLORS.textSub, fontSize: 12, fontWeight: '700' },
});
