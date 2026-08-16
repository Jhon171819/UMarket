import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '../../data/StoreContext';
import { COLORS, money } from '../../components/theme';

const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
}

export default function DashboardScreen() {
  const { products, sales, services, customers } = useStore();
  const today = new Date().toDateString();
  const todaySales = sales.filter(sale => new Date(sale.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((total, sale) => total + sale.totalCents, 0);
  const currentMonth = new Date();
  const monthRevenue = sales.filter(sale => {
    const date = new Date(sale.date);
    return date.getFullYear() === currentMonth.getFullYear() && date.getMonth() === currentMonth.getMonth();
  }).reduce((total, sale) => total + sale.totalCents, 0);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayRevenue = sales.filter(sale => new Date(sale.date).toDateString() === yesterday.toDateString()).reduce((total, sale) => total + sale.totalCents, 0);
  const dayComparison = yesterdayRevenue === 0 ? null : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
  const lowStock = products.filter(product => product.active && product.stock <= product.lowStockAlert);
  const maxBar = Math.max(...days.map((_, index) => sales.filter(sale => new Date(sale.date).getDay() === (index + 1) % 7).reduce((total, sale) => total + sale.totalCents, 0)), 1);
  const topItems = useMemo(() => {
    const grouped = new Map<string, { name: string; quantity: number; total: number }>();
    sales.forEach(sale => {
      const item = grouped.get(sale.itemName) ?? { name: sale.itemName, quantity: 0, total: 0 };
      item.quantity += sale.quantity;
      item.total += sale.totalCents;
      grouped.set(sale.itemName, item);
    });
    return [...grouped.values()].sort((a, b) => b.total - a.total).slice(0, 3);
  }, [sales]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{greeting()}</Text>
            <Text style={styles.title}>Veja como está sua empresa hoje.</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={() => router.push('/(tabs)/settings')}>
            <Text style={styles.avatarText}>JM</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Faturamento de hoje</Text>
              <Text style={styles.heroValue}>{money(todayRevenue)}</Text>
            </View>
            <View style={styles.heroIcon}><Ionicons name="trending-up" size={20} color={COLORS.white} /></View>
          </View>
          <View style={styles.heroFooter}><Text style={styles.heroFootText}>{todaySales.length} venda{todaySales.length === 1 ? '' : 's'} realizadas</Text>{dayComparison === null ? <Text style={styles.heroFootText}>Sem comparação</Text> : <Text style={styles.heroFootText}>{dayComparison >= 0 ? '+' : ''}{dayComparison.toFixed(1).replace('.', ',')}% vs. ontem</Text>}</View>
        </View>

        <View style={styles.metricsRow}>
          <Metric icon="calendar-outline" label="Este mês" value={money(monthRevenue)} color={COLORS.orange} />
          <Metric icon="people-outline" label="Clientes" value={String(customers.length)} color={COLORS.accent} />
        </View>
        <View style={styles.metricsRow}>
          <Metric icon="briefcase-outline" label="Serviços ativos" value={String(services.length)} color={COLORS.success} />
          <Metric icon="alert-circle-outline" label="Estoque baixo" value={String(lowStock.length)} color={COLORS.warning} />
        </View>

        <SectionHeader title="Ações rápidas" />
        <View style={styles.actionsGrid}>
          <QuickAction icon="cart-outline" label="Nova venda" color={COLORS.accent} onPress={() => router.push('/(tabs)/scanner')} />
          <QuickAction icon="cube-outline" label="Novo produto" color={COLORS.orange} onPress={() => router.push('/(tabs)/stock')} />
          <QuickAction icon="person-add-outline" label="Novo cliente" color={COLORS.success} onPress={() => router.push('/(tabs)/settings')} />
          <QuickAction icon="bar-chart-outline" label="Relatórios" color={COLORS.accentDark} onPress={() => router.push('/(tabs)/sales')} />
        </View>

        <SectionHeader title="Faturamento da semana" action="Detalhes" onPress={() => router.push('/(tabs)/sales')} />
        <View style={styles.chartCard}>
          <View style={styles.chartBars}>{days.map((day, index) => {
            const total = sales.filter(sale => new Date(sale.date).getDay() === (index + 1) % 7).reduce((sum, sale) => sum + sale.totalCents, 0);
            return <View key={day} style={styles.barColumn}><View style={[styles.bar, { height: Math.max(8, Math.round((total / maxBar) * 92)) }]} /><Text style={styles.dayLabel}>{day}</Text></View>;
          })}</View>
          <View style={styles.chartLegend}><View style={styles.dot} /><Text style={styles.legendText}>Receita por dia</Text><Text style={styles.chartTotal}>{money(monthRevenue)}</Text></View>
        </View>

        <SectionHeader title="Produtos mais vendidos" />
        <View style={styles.listCard}>{topItems.map((item, index) => <View key={item.name} style={styles.topRow}><View style={styles.rank}><Text style={styles.rankText}>{index + 1}</Text></View><View style={styles.topInfo}><Text style={styles.topName} numberOfLines={1}>{item.name}</Text><Text style={styles.topMeta}>{item.quantity} unidades vendidas</Text></View><Text style={styles.topTotal}>{money(item.total)}</Text></View>)}{topItems.length === 0 && <Text style={styles.empty}>Ainda não há vendas registradas.</Text>}</View>

        {lowStock.length > 0 && <TouchableOpacity style={styles.alert} onPress={() => router.push('/(tabs)/stock')}><Ionicons name="warning-outline" size={20} color={COLORS.warning} /><View style={styles.alertCopy}><Text style={styles.alertTitle}>{lowStock.length} itens precisam de atenção</Text><Text style={styles.alertText}>{lowStock.slice(0, 2).map(item => item.name).join(' · ')}</Text></View><Ionicons name="chevron-forward" size={18} color={COLORS.warning} /></TouchableOpacity>}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${color}18` }]}><Ionicons name={icon} size={19} color={color} /></View><View><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View></View>;
}

function QuickAction({ icon, label, color, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string; onPress: () => void }) {
  return <TouchableOpacity style={styles.action} onPress={onPress}><View style={[styles.actionIcon, { backgroundColor: `${color}16` }]}><Ionicons name={icon} size={22} color={color} /></View><Text style={styles.actionLabel}>{label}</Text></TouchableOpacity>;
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text>{action && <TouchableOpacity onPress={onPress}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg }, content: { padding: 20, paddingBottom: 34 }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, eyebrow: { color: COLORS.textMuted, fontSize: 13, marginBottom: 6 }, title: { color: COLORS.text, fontSize: 20, lineHeight: 26, fontWeight: '800', maxWidth: 285 }, avatar: { width: 44, height: 44, borderRadius: 15, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D7E5FF' }, avatarText: { color: COLORS.accent, fontWeight: '800', fontSize: 14 }, heroCard: { backgroundColor: COLORS.accent, borderRadius: 22, padding: 20, marginBottom: 14, shadowColor: COLORS.accent, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, heroLabel: { color: '#CDE0FF', fontSize: 13, marginBottom: 8 }, heroValue: { color: COLORS.white, fontSize: 30, fontWeight: '800' }, heroIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#FFFFFF26', alignItems: 'center', justifyContent: 'center' }, heroFooter: { marginTop: 22, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#FFFFFF28', flexDirection: 'row', justifyContent: 'space-between' }, heroFootText: { color: '#DCE9FF', fontSize: 12, fontWeight: '600' }, metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 }, metric: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, metricIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, metricLabel: { color: COLORS.textMuted, fontSize: 11, marginBottom: 4 }, metricValue: { color: COLORS.text, fontSize: 15, fontWeight: '800' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 11 }, sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800' }, sectionAction: { color: COLORS.accent, fontSize: 12, fontWeight: '700' }, actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, action: { width: '48%', backgroundColor: COLORS.surface, borderRadius: 16, padding: 13, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 10 }, actionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, actionLabel: { color: COLORS.text, fontSize: 13, fontWeight: '700' }, chartCard: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 16 }, chartBars: { height: 126, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4 }, barColumn: { alignItems: 'center', justifyContent: 'flex-end', height: 126, gap: 7 }, bar: { width: 25, borderRadius: 7, backgroundColor: COLORS.accent }, dayLabel: { color: COLORS.textMuted, fontSize: 10 }, chartLegend: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 14, paddingTop: 13 }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginRight: 7 }, legendText: { color: COLORS.textMuted, fontSize: 12, flex: 1 }, chartTotal: { color: COLORS.text, fontSize: 13, fontWeight: '800' }, listCard: { backgroundColor: COLORS.surface, borderRadius: 18, borderWidth: 1, borderColor: COLORS.border, padding: 8 }, topRow: { flexDirection: 'row', alignItems: 'center', padding: 9, gap: 10 }, rank: { width: 28, height: 28, borderRadius: 9, backgroundColor: COLORS.surfaceAlt, alignItems: 'center', justifyContent: 'center' }, rankText: { color: COLORS.accent, fontSize: 12, fontWeight: '800' }, topInfo: { flex: 1 }, topName: { color: COLORS.text, fontSize: 13, fontWeight: '700' }, topMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 }, topTotal: { color: COLORS.text, fontSize: 13, fontWeight: '800' }, empty: { color: COLORS.textMuted, padding: 18, textAlign: 'center', fontSize: 13 }, alert: { marginTop: 16, backgroundColor: '#FFF8E8', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, alertCopy: { flex: 1 }, alertTitle: { color: '#9A6700', fontSize: 13, fontWeight: '800' }, alertText: { color: '#B48725', fontSize: 11, marginTop: 3 },
});
