// app/(tabs)/scanner.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  Animated, Alert, Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Product } from '../../data/StoreContext';
import { COLORS } from '../../components/theme';

function ScanOverlay({ scanned }: { scanned: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const cornerColor = scanned ? COLORS.success : COLORS.accent;

  useEffect(() => {
    if (!scanned) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulse.setValue(1);
    }
  }, [scanned]);

  return (
    <View style={overlay.container}>
      {/* Dimmed areas */}
      <View style={overlay.top} />
      <View style={overlay.middle}>
        <View style={overlay.side} />
        {/* Scan Box */}
        <Animated.View style={[overlay.box, { opacity: scanned ? 1 : pulse }]}>
          {/* Corners */}
          {[styles.cornerTL, styles.cornerTR, styles.cornerBL, styles.cornerBR].map((s, i) => (
            <View key={i} style={[styles.corner, s, { borderColor: cornerColor }]} />
          ))}
          {/* Scan Line */}
          {!scanned && <View style={[overlay.scanLine, { backgroundColor: COLORS.accent }]} />}
          {scanned && (
            <View style={overlay.successIcon}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.success} />
            </View>
          )}
        </Animated.View>
        <View style={overlay.side} />
      </View>
      <View style={overlay.bottom} />
    </View>
  );
}

function ProductFoundModal({
  product,
  onSell,
  onCancel,
}: {
  product: Product;
  onSell: (qty: number) => void;
  onCancel: () => void;
}) {
  const [qty, setQty] = useState('1');
  const profit = (product.price - product.cost) * parseInt(qty || '1');
  const total = product.price * parseInt(qty || '1');
  const hasStock = product.stock >= parseInt(qty || '1');

  return (
    <Modal visible animationType="slide" transparent>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.handle} />
          <View style={modal.barcodeRow}>
            <Ionicons name="barcode" size={16} color={COLORS.textMuted} />
            <Text style={modal.barcodeText}>{product.barcode}</Text>
          </View>
          <Text style={modal.productName}>{product.name}</Text>
          <Text style={modal.category}>{product.category}</Text>

          <View style={modal.priceRow}>
            <View style={modal.priceBlock}>
              <Text style={modal.priceLabel}>Unit Price</Text>
              <Text style={modal.priceValue}>R${product.price.toFixed(2)}</Text>
            </View>
            <View style={modal.priceBlock}>
              <Text style={modal.priceLabel}>In Stock</Text>
              <Text style={[modal.priceValue, { color: product.stock > 0 ? COLORS.success : COLORS.danger }]}>
                {product.stock} units
              </Text>
            </View>
            <View style={modal.priceBlock}>
              <Text style={modal.priceLabel}>Margin</Text>
              <Text style={[modal.priceValue, { color: COLORS.warning }]}>
                {Math.round(((product.price - product.cost) / product.price) * 100)}%
              </Text>
            </View>
          </View>

          <View style={modal.qtySection}>
            <Text style={modal.qtyLabel}>Quantity</Text>
            <View style={modal.qtyControl}>
              <TouchableOpacity
                style={modal.qtyBtn}
                onPress={() => setQty(String(Math.max(1, parseInt(qty || '1') - 1)))}
              >
                <Ionicons name="remove" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <TextInput
                style={modal.qtyInput}
                value={qty}
                onChangeText={v => setQty(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                textAlign="center"
              />
              <TouchableOpacity
                style={modal.qtyBtn}
                onPress={() => setQty(String(Math.min(product.stock, parseInt(qty || '1') + 1)))}
              >
                <Ionicons name="add" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={modal.totalRow}>
            <Text style={modal.totalLabel}>Total</Text>
            <Text style={modal.totalValue}>R${total.toFixed(2)}</Text>
          </View>

          <View style={modal.actions}>
            <TouchableOpacity style={modal.cancelBtn} onPress={onCancel}>
              <Text style={modal.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modal.sellBtn, !hasStock && { opacity: 0.5 }]}
              onPress={() => hasStock && onSell(parseInt(qty || '1'))}
              disabled={!hasStock}
            >
                <View style={modal.iconWrapper}>
                  <Ionicons name="cart" size={18} color="#fff" />
                </View>
                <View style={modal.textWrapper}>
                  <Text style={modal.sellText}>Register Sale</Text>
                </View>
            </TouchableOpacity>
          </View>
          {!hasStock && <Text style={modal.noStockText}>Insufficient stock!</Text>}
        </View>
      </View>
    </Modal>
  );
}

function NotFoundModal({ barcode, onClose }: { barcode: string; onClose: () => void }) {
  return (
    <Modal visible animationType="fade" transparent>
      <View style={modal.overlay}>
        <View style={[modal.sheet, { alignItems: 'center', paddingVertical: 32 }]}>
          <Ionicons name="alert-circle" size={56} color={COLORS.warning} />
          <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 16 }}>
            Product Not Found
          </Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6, marginBottom: 24, textAlign: 'center' }}>
            No product registered with barcode{'\n'}{barcode}
          </Text>
          <TouchableOpacity style={modal.sellBtn} onPress={onClose}>
            <View style={modal.textWrapper}>
              <Text style={modal.sellText}>Scan Again</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [torch, setTorch] = useState(false);
  const { findByBarcode, addSale } = useStore();

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    Vibration.vibrate(100);
    setScanned(true);
    const product = findByBarcode(data);
    if (product) {
      setFoundProduct(product);
    } else {
      setNotFoundBarcode(data);
    }
  };

  const handleSell = (qty: number) => {
    if (!foundProduct) return;
    addSale({
      productId: foundProduct.id,
      productName: foundProduct.name,
      quantity: qty,
      total: parseFloat((foundProduct.price * qty).toFixed(2)),
    });
    setFoundProduct(null);
    setScanned(false);
    Alert.alert('Sale Registered!', `${qty}x ${foundProduct.name} — R$${(foundProduct.price * qty).toFixed(2)}`);
  };

  const resetScan = () => {
    setFoundProduct(null);
    setNotFoundBarcode(null);
    setScanned(false);
  };

  if (!permission) {
    return <View style={styles.center}><Text style={{ color: COLORS.text }}>Requesting camera...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permissionScreen}>
          <Ionicons name="camera-outline" size={72} color={COLORS.accent} />
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionSub}>
            To scan barcodes, we need access to your camera.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      <ScanOverlay scanned={scanned} />

      {/* Top bar */}
      <SafeAreaView style={styles.topBar} edges={['top']}>
        <Text style={styles.scanTitle}>Barcode Scanner</Text>
        <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(v => !v)}>
          <Ionicons name={torch ? 'flash' : 'flash-off'} size={22} color={torch ? COLORS.warning : '#fff'} />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom hint */}
      <View style={styles.bottomHint}>
        <Text style={styles.hintText}>
          {scanned ? 'Processing...' : 'Point camera at a barcode'}
        </Text>
        {scanned && (
          <TouchableOpacity style={styles.rescanBtn} onPress={resetScan}>
            <Ionicons name="refresh" size={16} color="#fff" />
            <Text style={styles.rescanText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </View>

      {foundProduct && (
        <ProductFoundModal
          product={foundProduct}
          onSell={handleSell}
          onCancel={resetScan}
        />
      )}
      {notFoundBarcode && (
        <NotFoundModal barcode={notFoundBarcode} onClose={resetScan} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scanTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  torchBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  bottomHint: {
    position: 'absolute', bottom: 100, left: 0, right: 0,
    alignItems: 'center', gap: 12,
  },
  hintText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.accent, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  rescanText: { color: '#fff', fontWeight: '600' },
  corner: { position: 'absolute', width: 24, height: 24, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },
  permissionScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  permissionSub: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  permissionBtn: {
    backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32,
    marginTop: 8,
  },
  permissionBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

const overlay = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  top: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  middle: { flexDirection: 'row', height: 220 },
  side: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  box: { width: 260, alignItems: 'center', justifyContent: 'center' },
  bottom: { flex: 1.5, backgroundColor: 'rgba(0,0,0,0.6)' },
  scanLine: { position: 'absolute', height: 2, left: 16, right: 16, opacity: 0.8 },
  successIcon: { alignItems: 'center', justifyContent: 'center' },
});

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: 20,
  },
  barcodeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  barcodeText: { fontSize: 12, color: COLORS.textMuted, letterSpacing: 0.5 },
  productName: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  category: { fontSize: 13, color: COLORS.accentLight, fontWeight: '600', marginBottom: 20 },
  priceRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  priceBlock: {
    flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  priceLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600', marginBottom: 4 },
  priceValue: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  qtySection: { marginBottom: 16 },
  qtyLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 10 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  qtyInput: {
    flex: 1, backgroundColor: COLORS.surfaceAlt, borderRadius: 12, paddingVertical: 10,
    color: COLORS.text, fontSize: 22, fontWeight: '800', borderWidth: 1, borderColor: COLORS.border,
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: COLORS.border, marginBottom: 16,
  },
  totalLabel: { fontSize: 15, fontWeight: '600', color: COLORS.textMuted },
  totalValue: { fontSize: 26, fontWeight: '800', color: COLORS.text },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border,
  },
  cancelText: { color: COLORS.textSub, fontWeight: '700', fontSize: 15 },
  sellBtn: {
    flex: 2, flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14,
    minWidth: 180,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.success,
    shadowColor: COLORS.bg, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 8, elevation: 6,
  },
  sellText: { color: '#fff', fontWeight: '700', fontSize: 15, elevation: 1, paddingHorizontal: 6, textAlign: 'center', flexShrink: 0, lineHeight: 18 },
  noStockText: { textAlign: 'center', color: COLORS.danger, marginTop: 10, fontWeight: '600' },
  iconWrapper: { backgroundColor: 'rgba(0,0,0,0.12)', padding: 8, borderRadius: 8 },
  textWrapper: { backgroundColor: 'transparent', paddingHorizontal: 8, overflow: 'hidden' },
});
