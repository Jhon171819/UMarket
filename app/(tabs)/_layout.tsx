import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../components/theme';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.tabBar, tabBarActiveTintColor: COLORS.accent, tabBarInactiveTintColor: COLORS.textMuted, tabBarLabelStyle: styles.label }}>
    <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} /> }} />
    <Tabs.Screen name="stock" options={{ title: 'Estoque', tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> }} />
    <Tabs.Screen name="services" options={{ title: 'Serviços', tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} /> }} />
    <Tabs.Screen name="scanner" options={{ title: 'Vender', tabBarIcon: () => <View style={styles.sellButton}><Ionicons name="cart-outline" size={24} color={COLORS.white} /></View>, tabBarLabel: () => null }} />
    <Tabs.Screen name="sales" options={{ title: 'Vendas', tabBarIcon: ({ color, size }) => <Ionicons name="receipt-outline" size={size} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: 'Mais', tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" size={size} color={color} /> }} />
  </Tabs>;
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border, borderTopWidth: 1, height: 72, paddingBottom: 10, paddingTop: 8 },
  label: { fontSize: 10, fontWeight: '600' },
  sellButton: { width: 50, height: 50, borderRadius: 18, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: COLORS.accent, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5 },
});
