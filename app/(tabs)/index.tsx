// app/(tabs)/index.tsx
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useStore } from '../../data/StoreContext';
import { COLORS } from '../../components/theme';
import { router } from 'expo-router';

const { width: SCREEN_W } = Dimensions.get('window');

function getWeekDays() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push({ label: days[d.getDay()], date: d.toDateString() });
  }
  return result;
}

export default function DashboardScreen() {
  const { sales, products } = useStore();

  const weekDays = useMemo(() => getWeekDays(), []);

  const dailyRevenue = useMemo(() => {
    return weekDays.map(({ date }) => {
      const daySales = sales.filter(s => new Date(s.date).toDateString() === date);
      return daySales.reduce((acc, s) => acc + s.total, 0);
    });
  }, [sales, weekDays]);

  const totalWeekRevenue = useMemo(() => dailyRevenue.reduce((a, b) => a + b, 0), [dailyRevenue]);
  const totalWeekSales = useMemo(() =>
    sales.filter(s => {
      const now = new Date();
      const saleDate = new Date(s.date);
      const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length, [sales]);

  const lowStockItems = useMemo(() =>
    products.filter(p => p.stock <= p.lowStockAlert), [products]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; total: number; qty: number }> = {};
    sales.forEach(s => {
      if (!map[s.productId]) map[s.productId] = { name: s.productName, total: 0, qty: 0 };
      map[s.productId].total += s.total;
      map[s.productId].qty += s.quantity;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 3);
  }, [sales]);

  const todayRevenue = useMemo(() => {
    const today = new Date().toDateString();
    return sales
      .filter(s => new Date(s.date).toDateString() === today)
      .reduce((acc, s) => acc + s.total, 0);
  }, [sales]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()} 👋</Text>
            <Text style={styles.title}>Store Dashboard</Text>
          </View>
          <View style={styles.avatar}>
            <Ionicons name="storefront" size={22} color={COLORS.accent} />
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.kpiLabel}>Today</Text>
            <Text style={styles.kpiValue}>R${todayRevenue.toFixed(2)}</Text>
            <View style={styles.kpiBadge}>
              <Ionicons name="trending-up" size={12} color={COLORS.success} />
              <Text style={[styles.kpiBadgeText, { color: COLORS.success }]}> Revenue</Text>
            </View>
          </View>
          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>This Week</Text>
            <Text style={styles.kpiValue}>R${totalWeekRevenue.toFixed(2)}</Text>
            <View style={styles.kpiBadge}>
              <Ionicons name="cart" size={12} color={COLORS.accentLight} />
              <Text style={[styles.kpiBadgeText, { color: COLORS.accentLight }]}> {totalWeekSales} sales</Text>
            </View>
          </View>
        </View>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            onPress={() => router.push('/(tabs)/stock')}
          >
            <Ionicons name="warning" size={18} color={COLORS.warning} />
            <Text style={styles.alertText}>
              {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low on stock
            </Text>
            <Ionicons name="chevron-forward" size={16} color={COLORS.warning} />
          </TouchableOpacity>
        )}

        {/* Weekly Sales Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Weekly Revenue</Text>
          <LineChart
            data={{
              labels: weekDays.map(d => d.label),
              datasets: [{ data: dailyRevenue.map(v => v || 0) }],
            }}
            width={SCREEN_W - 78}
            height={180}
            yAxisLabel="R$"
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: COLORS.card,
              backgroundGradientTo: COLORS.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              labelColor: () => 'black',
              style: { borderRadius: 16 },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: COLORS.accent,
                fill: COLORS.bg,
              },
              propsForBackgroundLines: {
                stroke: COLORS.border,
                strokeDasharray: '4',
              },
            }}
            bezier
            style={styles.chart}
            withShadow={false}
          />
        </View>

        {/* Top Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Products</Text>
          {topProducts.map((p, i) => (
            <View key={i} style={styles.topProductRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.productSub}>{p.qty} units sold</Text>
              </View>
              <Text style={styles.productRevenue}>R${p.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/scanner')}>
              <Ionicons name="scan" size={24} color={COLORS.accent} />
              <Text style={styles.actionLabel}>Scan & Sell</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/stock')}>
              <Ionicons name="add-circle" size={24} color={COLORS.success} />
              <Text style={styles.actionLabel}>Add Product</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(tabs)/sales')}>
              <Ionicons name="list" size={24} color={COLORS.warning} />
              <Text style={styles.actionLabel}>All Sales</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 18) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  greeting: { fontSize: 13, color: COLORS.textMuted, letterSpacing: 0.5, marginBottom: 2 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  kpiRow: { flexDirection: 'row', marginBottom: 16 },
  kpiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  kpiLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 },
  kpiBadge: { flexDirection: 'row', alignItems: 'center' },
  kpiBadgeText: { fontSize: 12, fontWeight: '600' },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 16, gap: 8,
  },
  alertText: { flex: 1, color: COLORS.warning, fontSize: 13, fontWeight: '600' },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  chart: { marginTop: 8, borderRadius: 12, marginLeft: '-2%' },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 14 },
  topProductRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  rankBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  rankText: { fontSize: 13, fontWeight: '700', color: COLORS.accentLight },
  productName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  productSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  productRevenue: { fontSize: 14, fontWeight: '700', color: COLORS.success },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceAlt, borderRadius: 14,
    paddingVertical: 14, borderWidth: 1, borderColor: COLORS.border, gap: 6,
  },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSub },
});
