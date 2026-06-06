// app/(tabs)/settings.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../data/StoreContext';
import { COLORS } from '../../components/theme';

function SettingRow({ icon, label, value, color, onPress }: {
  icon: string; label: string; value?: string; color?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={[styles.rowIcon, { backgroundColor: (color || COLORS.accent) + '22' }]}>
        <Ionicons name={icon as any} size={20} color={color || COLORS.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {onPress && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { products, sales } = useStore();

  const totalInventoryValue = products.reduce((acc, p) => acc + p.cost * p.stock, 0);
  const totalSalesValue = sales.reduce((acc, s) => acc + s.total, 0);
  const outOfStock = products.filter(p => p.stock === 0).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
        </View>

        {/* Store Stats */}
        <View style={styles.statsCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="storefront" size={32} color={COLORS.accent} />
          </View>
          <Text style={styles.storeName}>My Store</Text>
          <Text style={styles.storeSubtitle}>Store Manager Pro</Text>
          <View style={styles.statGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statNum}>{products.length}</Text>
              <Text style={styles.statLab}>Products</Text>
            </View>
            <View style={[styles.statItem, styles.statDivider]}>
              <Text style={styles.statNum}>{sales.length}</Text>
              <Text style={styles.statLab}>All Sales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNum, { color: outOfStock > 0 ? COLORS.danger : COLORS.success }]}>
                {outOfStock}
              </Text>
              <Text style={styles.statLab}>Out of Stock</Text>
            </View>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>
          <SettingRow
            icon="cube"
            label="Inventory Value"
            value={`R$${totalInventoryValue.toFixed(2)}`}
            color={COLORS.accentLight}
          />
          <SettingRow
            icon="trending-up"
            label="Total Sales Revenue"
            value={`R$${totalSalesValue.toFixed(2)}`}
            color={COLORS.success}
          />
          <SettingRow
            icon="alert-circle"
            label="Low Stock Items"
            value={`${products.filter(p => p.stock <= p.lowStockAlert && p.stock > 0).length} products`}
            color={COLORS.warning}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingRow
            icon="phone-portrait"
            label="App Version"
            value="1.0.0"
            color={COLORS.textSub}
          />
          <SettingRow
            icon="code-slash"
            label="Built with Expo"
            value="React Native"
            color={COLORS.textSub}
          />
          <SettingRow
            icon="barcode"
            label="Barcode Scanner"
            value="expo-camera"
            color={COLORS.textSub}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  header: { paddingTop: 16, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  statsCard: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', marginBottom: 16,
  },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 22, backgroundColor: COLORS.accent + '22',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.accent + '44',
  },
  storeName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  storeSubtitle: { fontSize: 13, color: COLORS.textMuted, marginBottom: 20 },
  statGrid: { flexDirection: 'row', width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: {
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: COLORS.border,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  statLab: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: '600' },
  section: {
    backgroundColor: COLORS.surface, borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 16,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textMuted, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 14 },
  rowIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  rowValue: { fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
});
