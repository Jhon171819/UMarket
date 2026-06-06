// app/(tabs)/sales.tsx
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Sale } from '../../data/StoreContext';
import { COLORS } from '../../components/theme';

const FILTERS = ['All', 'Today', 'This Week'];

function SaleItem({ sale }: { sale: Sale }) {
  const date = new Date(sale.date);
  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <View style={styles.saleCard}>
      <View style={styles.saleIcon}>
        <Ionicons name="cart" size={18} color={COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.saleName} numberOfLines={1}>{sale.productName}</Text>
        <Text style={styles.saleMeta}>{dateStr} · {timeStr} · {sale.quantity}x units</Text>
      </View>
      <Text style={styles.saleTotal}>R${sale.total.toFixed(2)}</Text>
    </View>
  );
}

export default function SalesScreen() {
  const { sales } = useStore();
  const [filter, setFilter] = useState('This Week');

  const filtered = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    return [...sales]
      .filter(s => {
        if (filter === 'Today') return new Date(s.date).toDateString() === todayStr;
        if (filter === 'This Week') {
          const diff = (now.getTime() - new Date(s.date).getTime()) / (1000 * 60 * 60 * 24);
          return diff <= 7;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, filter]);

  const totalRevenue = useMemo(() => filtered.reduce((acc, s) => acc + s.total, 0), [filtered]);
  const totalItems = useMemo(() => filtered.reduce((acc, s) => acc + s.quantity, 0), [filtered]);

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, Sale[]> = {};
    filtered.forEach(s => {
      const key = new Date(s.date).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return Object.entries(map).map(([date, items]) => ({
      date,
      label: formatDateLabel(date),
      items,
      total: items.reduce((a, i) => a + i.total, 0),
    }));
  }, [filtered]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Sales History</Text>
        </View>

        {/* Filter */}
        <View style={styles.filterRow}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>R${totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{filtered.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Items Sold</Text>
            <Text style={styles.statValue}>{totalItems}</Text>
          </View>
        </View>

        {/* Sales List */}
        <FlatList
          data={grouped}
          keyExtractor={item => item.date}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item: group }) => (
            <View style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <Text style={styles.groupTotal}>R${group.total.toFixed(2)}</Text>
              </View>
              {group.items.map(sale => (
                <SaleItem key={sale.id} sale={sale} />
              ))}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No sales found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function formatDateLabel(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  header: { paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
  filterTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  statLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: '800', color: COLORS.text },
  group: { marginBottom: 20 },
  groupHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  groupLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, textTransform: 'capitalize' },
  groupTotal: { fontSize: 13, fontWeight: '700', color: COLORS.success },
  saleCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    borderRadius: 14, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border, gap: 12,
  },
  saleIcon: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.accent + '22',
    alignItems: 'center', justifyContent: 'center',
  },
  saleName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  saleMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  saleTotal: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
});
