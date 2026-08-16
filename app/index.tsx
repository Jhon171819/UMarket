// app/index.tsx
import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../components/theme';
import { useStore } from '../data/StoreContext';

export default function Index() {
  const { hydrated, storeConfig } = useStore();
  if (!hydrated) return <View style={styles.loading}><ActivityIndicator color={COLORS.accent} /></View>;
  if (storeConfig) return <Redirect href="/(tabs)" />;
  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({ loading: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' } });
