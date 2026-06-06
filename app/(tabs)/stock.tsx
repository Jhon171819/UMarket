// app/(tabs)/stock.tsx
import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore, Product } from '../../data/StoreContext';
import { COLORS } from '../../components/theme';

const CATEGORIES = ['All', 'Beverages', 'Bakery', 'Dairy', 'Grains', 'Cleaning', 'Other'];

function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
  const color = stock <= 0 ? COLORS.danger : stock <= threshold ? COLORS.warning : COLORS.success;
  const label = stock <= 0 ? 'Out' : stock <= threshold ? 'Low' : 'OK';
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function ProductCard({
  product, onEdit, onDelete,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  const isLow = product.stock <= product.lowStockAlert;
  return (
    <View style={[styles.productCard, isLow && styles.productCardLow]}>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
          <StockBadge stock={product.stock} threshold={product.lowStockAlert} />
        </View>
        <Text style={styles.productBarcode}>{product.barcode}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.metaChip}>{product.category}</Text>
          <Text style={styles.metaPrice}>R${product.price.toFixed(2)}</Text>
          <Text style={styles.metaCost}>Cost: R${product.cost.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.stockSection}>
        <Text style={styles.stockNumber}>{product.stock}</Text>
        <Text style={styles.stockLabel}>units</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => onEdit(product)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={18} color={COLORS.accentLight} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onDelete(product.id)} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function ProductModal({
  visible,
  product,
  onClose,
  onSave,
}: {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (data: Omit<Product, 'id'>) => void;
}) {
  const [name, setName] = useState(product?.name || '');
  const [barcode, setBarcode] = useState(product?.barcode || '');
  const [price, setPrice] = useState(String(product?.price || ''));
  const [cost, setCost] = useState(String(product?.cost || ''));
  const [stock, setStock] = useState(String(product?.stock || ''));
  const [category, setCategory] = useState(product?.category || 'Other');
  const [lowAlert, setLowAlert] = useState(String(product?.lowStockAlert || '5'));

  React.useEffect(() => {
    setName(product?.name || '');
    setBarcode(product?.barcode || '');
    setPrice(String(product?.price || ''));
    setCost(String(product?.cost || ''));
    setStock(String(product?.stock || ''));
    setCategory(product?.category || 'Other');
    setLowAlert(String(product?.lowStockAlert || '5'));
  }, [product, visible]);

  const handleSave = () => {
    if (!name || !barcode || !price || !stock) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    onSave({
      name, barcode,
      price: parseFloat(price),
      cost: parseFloat(cost) || 0,
      stock: parseInt(stock),
      category,
      lowStockAlert: parseInt(lowAlert) || 5,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{product ? 'Edit Product' : 'New Product'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Field label="Product Name *" value={name} onChangeText={setName} placeholder="e.g. Coca-Cola 350ml" />
            <Field label="Barcode *" value={barcode} onChangeText={setBarcode} placeholder="e.g. 7894900011517" keyboardType="numeric" />
            <View style={styles.row}>
              <Field label="Sale Price (R$) *" value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" style={{ flex: 1, marginRight: 8 }} />
              <Field label="Cost (R$)" value={cost} onChangeText={setCost} placeholder="0.00" keyboardType="decimal-pad" style={{ flex: 1 }} />
            </View>
            <View style={styles.row}>
              <Field label="Stock Qty *" value={stock} onChangeText={setStock} placeholder="0" keyboardType="numeric" style={{ flex: 1, marginRight: 8 }} />
              <Field label="Low Alert At" value={lowAlert} onChangeText={setLowAlert} placeholder="5" keyboardType="numeric" style={{ flex: 1 }} />
            </View>
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {CATEGORIES.filter(c => c !== 'All').map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                >
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Product</Text>
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label, value, onChangeText, placeholder, keyboardType, style,
}: any) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType || 'default'}
      />
    </View>
  );
}

export default function StockScreen() {
  const { products, addProduct, updateProduct, deleteProduct } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchCat = category === 'All' || p.category === category;
      return matchSearch && matchCat;
    });
  }, [products, search, category]);

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(id) },
    ]);
  };

  const handleSave = (data: Omit<Product, 'id'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else {
      addProduct(data);
    }
  };

  const lowStockCount = products.filter(p => p.stock <= p.lowStockAlert).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Inventory</Text>
            <Text style={styles.subtitle}>{products.length} products · {lowStockCount} low stock</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => { setEditingProduct(null); setModalVisible(true); }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or barcode..."
            placeholderTextColor={COLORS.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          style={styles.filterRow} contentContainerStyle={{ paddingRight: 20 }}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.filterChip, category === cat && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, category === cat && styles.filterChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product List */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProductCard product={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />
      </View>

      <ProductModal
        visible={modalVisible}
        product={editingProduct}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingTop: 16, paddingBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  addBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  filterRow: { marginBottom: 16, marginTop: 4, height: 50 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.surface, marginRight: 8,
  },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterChipText: { fontSize: 13, fontWeight: '600', color: 'black' },
  filterChipTextActive: { color: '#fff' },
  productCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  productCardLow: { borderColor: COLORS.warning + '60' },
  productInfo: { flex: 1 },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  productName: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  productBarcode: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8, letterSpacing: 0.5 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaChip: {
    fontSize: 11, color: COLORS.accentLight, fontWeight: '600',
    backgroundColor: COLORS.accent + '22', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  metaPrice: { fontSize: 13, color: COLORS.text, fontWeight: '700' },
  metaCost: { fontSize: 11, color: COLORS.textMuted },
  stockSection: { alignItems: 'center', justifyContent: 'center', paddingLeft: 12, minWidth: 64 },
  stockNumber: { fontSize: 28, fontWeight: '800', color: COLORS.text, lineHeight: 32 },
  stockLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { color: COLORS.textMuted, fontSize: 15 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, maxHeight: '90%',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: COLORS.border,
    alignSelf: 'center', marginBottom: 16,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: 6, letterSpacing: 0.5 },
  input: {
    backgroundColor: COLORS.surfaceAlt, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  row: { flexDirection: 'row' },
  catRow: { marginBottom: 20 },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, marginRight: 8,
  },
  catChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSub },
  catChipTextActive: { color: '#fff' },
  saveBtn: {
    backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
