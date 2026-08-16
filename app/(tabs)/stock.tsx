import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Category, Product, useStore } from "../../data/StoreContext";
import { COLORS, money } from "../../components/theme";

const cents = (value: string) =>
  Math.round(Number(value.replace(",", ".")) * 100) || 0;

function Badge({ stock, limit }: { stock: number; limit: number }) {
  const color =
    stock === 0
      ? COLORS.danger
      : stock <= limit
        ? COLORS.warning
        : COLORS.success;
  const label =
    stock === 0 ? "Esgotado" : stock <= limit ? "Baixo" : "Disponível";
  return (
    <View style={[styles.badge, { backgroundColor: `${color}16` }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function ProductRow({
  product,
  onEdit,
  onAdjust,
}: {
  product: Product;
  onEdit: (product: Product) => void;
  onAdjust: (product: Product, amount: number) => void;
}) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productIcon}>
        <Ionicons name="cube-outline" size={21} color={COLORS.accent} />
      </View>
      <View style={styles.productBody}>
        <View style={styles.productLine}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Badge stock={product.stock} limit={product.lowStockAlert} />
        </View>
        <Text style={styles.productMeta}>
          {product.category || "Sem categoria"} ·{" "}
          {product.barcode || "Sem código"}
        </Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{money(product.priceCents)}</Text>
          <View style={styles.stockControls}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => onAdjust(product, -1)}
            >
              <Ionicons name="remove" size={15} color={COLORS.textSub} />
            </TouchableOpacity>
            <Text style={styles.stockValue}>{product.stock}</Text>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => onAdjust(product, 1)}
            >
              <Ionicons name="add" size={15} color={COLORS.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => onEdit(product)}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={18}
                color={COLORS.textSub}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  containerStyle,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

function CategoryModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const save = () => {
    if (!name.trim()) return;
    onSave(name.trim());
    setName("");
    onClose();
  };
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.categorySheet}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Nova categoria</Text>
              <Text style={styles.modalSubtitle}>
                Ela ficará disponível para produtos e serviços.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <Field
            label="Nome da categoria"
            value={name}
            onChangeText={setName}
            placeholder="Ex.: Informática"
          />
          <TouchableOpacity style={styles.saveButton} onPress={save}>
            <Text style={styles.saveText}>Criar categoria</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ProductModal({
  visible,
  product,
  categories,
  onClose,
  onSave,
  onCreateCategory,
}: {
  visible: boolean;
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (data: Omit<Product, "id" | "active">) => void;
  onCreateCategory: () => void;
}) {
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState("");
  const [lowStockAlert, setLowStockAlert] = useState("5");

  React.useEffect(() => {
    setName(product?.name ?? "");
    setBarcode(product?.barcode ?? "");
    setPrice(product ? String(product.priceCents / 100).replace(".", ",") : "");
    setCost(product ? String(product.costCents / 100).replace(".", ",") : "");
    setStock(product ? String(product.stock) : "0");
    setCategory(product?.category ?? "");
    setLowStockAlert(product ? String(product.lowStockAlert) : "5");
  }, [product, visible]);
  const save = () => {
    if (!name.trim() || !price) {
      Alert.alert(
        "Confira os dados",
        "Informe pelo menos o nome e o preço de venda.",
      );
      return;
    }
    onSave({
      name: name.trim(),
      barcode: barcode.trim(),
      priceCents: cents(price),
      costCents: cents(cost),
      stock: Math.max(0, Number(stock) || 0),
      category,
      lowStockAlert: Math.max(0, Number(lowStockAlert) || 0),
      unit: "UN",
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.handle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {product ? "Editar produto" : "Novo produto"}
              </Text>
              <Text style={styles.modalSubtitle}>
                Cadastre os dados essenciais para vender.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Field
              label="Nome do produto"
              value={name}
              onChangeText={setName}
              placeholder="Ex.: Cabo USB-C"
            />
            <Field
              label="Código de barras"
              value={barcode}
              onChangeText={setBarcode}
              placeholder="Opcional"
              keyboardType="numeric"
            />
            <View style={styles.formRow}>
              <Field
                containerStyle={styles.halfField}
                label="Preço de venda"
                value={price}
                onChangeText={setPrice}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />
              <Field
                containerStyle={styles.halfField}
                label="Custo"
                value={cost}
                onChangeText={setCost}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.formRow}>
              <Field
                containerStyle={styles.halfField}
                label="Estoque inicial"
                value={stock}
                onChangeText={setStock}
                placeholder="0"
                keyboardType="numeric"
              />
              <Field
                containerStyle={styles.halfField}
                label="Alerta abaixo de"
                value={lowStockAlert}
                onChangeText={setLowStockAlert}
                placeholder="5"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.fieldLabel}>Categoria</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.categoryChip,
                    category === item.name && styles.categoryChipActive,
                  ]}
                  onPress={() => setCategory(item.name)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === item.name && styles.categoryTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.newCategoryChip}
                onPress={onCreateCategory}
              >
                <Ionicons name="add" size={15} color={COLORS.accent} />
                <Text style={styles.categoryTextActive}>Nova categoria</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={save}>
              <Text style={styles.saveText}>Salvar produto</Text>
            </TouchableOpacity>
            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function StockScreen() {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    adjustStock,
    addCategory,
  } = useStore();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [modalVisible, setModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const activeProducts = products.filter((product) => product.active);
  const productCategories = categories.filter(
    (item) => item.active && (item.type === "PRODUCT" || item.type === "BOTH"),
  );
  const filters = ["Todos", ...productCategories.map((item) => item.name)];
  const filtered = useMemo(
    () =>
      activeProducts.filter(
        (product) =>
          (category === "Todos" || product.category === category) &&
          `${product.name} ${product.barcode}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [activeProducts, category, search],
  );
  const openNew = () => {
    setEditing(null);
    setModalVisible(true);
  };
  const saveProduct = (data: Omit<Product, "id" | "active">) =>
    editing ? updateProduct(editing.id, data) : addProduct(data);
  const adjust = (product: Product, amount: number) => {
    if (product.stock === 0 && amount < 0) return;
    adjustStock(product.id, amount);
  };
  const createCategory = (name: string) => addCategory(name, "BOTH");

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Estoque</Text>
            <Text style={styles.subtitle}>
              {activeProducts.length} produtos cadastrados ·{" "}
              {activeProducts.filter((p) => p.stock <= p.lowStockAlert).length}{" "}
              em atenção
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openNew}>
            <Ionicons name="add" size={23} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto ou código"
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={COLORS.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.filter, category === item && styles.filterActive]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  category === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              onEdit={(product) => {
                setEditing(product);
                setModalVisible(true);
              }}
              onAdjust={adjust}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name="cube-outline"
                size={44}
                color={COLORS.textMuted}
              />
              <Text style={styles.emptyTitle}>Nenhum produto encontrado</Text>
              <Text style={styles.emptyText}>
                Cadastre seu primeiro produto para começar.
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={openNew}>
                <Text style={styles.emptyButtonText}>Cadastrar produto</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
      <ProductModal
        visible={modalVisible}
        product={editing}
        categories={productCategories}
        onClose={() => setModalVisible(false)}
        onSave={saveProduct}
        onCreateCategory={() => setCategoryModalVisible(true)}
      />
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        onSave={createCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: { color: COLORS.text, fontSize: 27, fontWeight: "800" },
  subtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 5 },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 9,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  filters: { gap: 8, paddingVertical: 14 },
  filter: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    height: 40,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  filterActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  filterText: { color: COLORS.textSub, fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: COLORS.white },
  list: { paddingBottom: 110 },
  productCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 13,
    marginBottom: 9,
    flexDirection: "row",
    gap: 11,
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  productBody: { flex: 1 },
  productLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  productName: { color: COLORS.text, fontSize: 14, fontWeight: "800", flex: 1 },
  productMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  productFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  productPrice: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  stockControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  adjustButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  stockValue: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 13,
    minWidth: 20,
    textAlign: "center",
  },
  editButton: {
    marginLeft: 5,
    paddingLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  badgeDot: { width: 5, height: 5, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: "800" },
  empty: { alignItems: "center", paddingTop: 70, paddingHorizontal: 28 },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 14,
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  emptyButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 18,
  },
  emptyButtonText: { color: COLORS.white, fontWeight: "800", fontSize: 13 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#14223880",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "90%",
  },
  categorySheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: "800" },
  modalSubtitle: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  field: { marginBottom: 14 },
  formRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  halfField: { flex: 1 },
  fieldLabel: {
    color: COLORS.textSub,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 7,
  },
  input: {
    height: 46,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 13,
    color: COLORS.text,
    fontSize: 14,
  },
  categoryScroll: { gap: 8, paddingBottom: 20 },
  categoryChip: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  categoryChipActive: { backgroundColor: COLORS.surfaceAlt },
  newCategoryChip: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  categoryText: { color: COLORS.textSub, fontSize: 12, fontWeight: "700" },
  categoryTextActive: { color: COLORS.accent, fontSize: 12, fontWeight: "700" },
  saveButton: {
    height: 49,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: COLORS.white, fontSize: 14, fontWeight: "800" },
});
