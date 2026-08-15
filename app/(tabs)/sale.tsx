import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useProductService, useSaleService } from '@/hooks/useServices';
import { Stepper } from '@/components/Stepper';
import { formatCurrency } from '@/lib/format';
import { todayDateString, nowTimeString } from '@/lib/datetime';
import type { Product } from '@/db/models/Product';

interface CartLine {
  key: string;
  product: Product;
  quantity: number;
  price: string;
}

export default function SaleScreen() {
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ productId?: string }>();
  const productService = useProductService();
  const saleService = useSaleService();
  const nextKey = useRef(0);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      productService.list().then(setAllProducts);
    }, [productService])
  );

  useEffect(() => {
    if (!params.productId) return;
    const incomingId = Number(params.productId);
    (async () => {
      const product = await productService.getById(incomingId);
      if (product) await addToCart(product);
      router.setParams({ productId: undefined });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.productId]);

  async function handleSearch(term: string) {
    setSearch(term);
    const results = await productService.list(term);
    setAllProducts(results);
  }

  async function addToCart(product: Product) {
    const lastPrice = await saleService.lastPriceFor(product.id);
    nextKey.current += 1;
    setCart((prev) => [
      ...prev,
      { key: String(nextKey.current), product, quantity: 1, price: lastPrice !== null ? String(lastPrice) : '0' },
    ]);
  }

  function updateQuantity(key: string, quantity: number) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: Math.max(1, quantity) } : l)));
  }

  function updatePrice(key: string, price: string) {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, price } : l)));
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((l) => l.key !== key));
  }

  const totalQuantity = cart.reduce((sum, l) => sum + l.quantity, 0);
  const grandTotal = cart.reduce((sum, l) => sum + l.quantity * (parseFloat(l.price) || 0), 0);

  function confirmSave() {
    if (cart.length === 0 || saving) return;
    const productLabel = cart.length === 1 ? 'product' : 'products';
    const unitLabel = totalQuantity === 1 ? 'unit' : 'units';
    Alert.alert(
      'Confirm sale',
      `${cart.length} ${productLabel} · ${totalQuantity} ${unitLabel}\nTotal: ${formatCurrency(grandTotal)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save sale', onPress: performSave },
      ]
    );
  }

  async function performSave() {
    setSaving(true);
    try {
      const date = todayDateString();
      const time = nowTimeString();
      await saleService.createMany(
        cart.map((l) => ({
          productId: l.product.id,
          quantity: l.quantity,
          price: parseFloat(l.price) || 0,
          date,
          time,
        }))
      );
      setCart([]);
      router.push('/');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <Text style={[styles.eyebrow, { color: colors.inkFaint }]}>New entry</Text>
        <Text style={[styles.title, { color: colors.sale }]}>Sale</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        {cart.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card },
            ]}
          >
            <Ionicons name="cart-outline" size={22} color={colors.inkFaint} />
            <Text style={{ color: colors.inkSoft, fontSize: 13, marginTop: 8, textAlign: 'center' }}>
              No products added yet
            </Text>
          </View>
        ) : (
          cart.map((line) => (
            <View
              key={line.key}
              style={[
                styles.lineCard,
                { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card },
              ]}
            >
              <View style={styles.lineHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lineName, { color: colors.ink }]} numberOfLines={1}>
                    {line.product.name}
                  </Text>
                  <Text style={{ color: colors.inkFaint, fontSize: 11 }}>PID {line.product.id}</Text>
                </View>
                <Pressable onPress={() => removeLine(line.key)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              <View style={styles.lineRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.inkFaint }]}>QUANTITY</Text>
                  <Stepper value={line.quantity} onChange={(q) => updateQuantity(line.key, q)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.inkFaint }]}>PRICE PER UNIT</Text>
                  <View
                    style={[
                      styles.priceRow,
                      { backgroundColor: colors.surface2, borderColor: colors.lineStrong, borderRadius: radius.control },
                    ]}
                  >
                    <Text style={{ color: colors.inkFaint, fontSize: 15 }}>₹</Text>
                    <TextInput
                      value={line.price}
                      onChangeText={(v) => updatePrice(line.key, v)}
                      keyboardType="decimal-pad"
                      style={[styles.priceInput, { color: colors.ink }]}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.lineTotalRow, { borderTopColor: colors.line }]}>
                <Text style={{ color: colors.inkSoft, fontSize: 12 }}>Line total</Text>
                <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>
                  {formatCurrency(line.quantity * (parseFloat(line.price) || 0))}
                </Text>
              </View>
            </View>
          ))
        )}

        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.addButton, { borderColor: colors.sale, borderRadius: radius.card }]}
        >
          <Ionicons name="add" size={18} color={colors.sale} />
          <Text style={{ color: colors.sale, fontWeight: '700', fontSize: 14 }}>
            {cart.length === 0 ? 'Add product' : 'Add another product'}
          </Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.line, backgroundColor: colors.surface }]}>
        <View style={styles.totalRow}>
          <View>
            <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: '600' }}>Total</Text>
            <Text style={{ color: colors.inkFaint, fontSize: 11, marginTop: 1 }}>
              {totalQuantity} {totalQuantity === 1 ? 'unit' : 'units'} · {cart.length}{' '}
              {cart.length === 1 ? 'product' : 'products'}
            </Text>
          </View>
          <Text style={{ color: colors.ink, fontSize: 21, fontWeight: '700' }}>{formatCurrency(grandTotal)}</Text>
        </View>
        <Pressable
          disabled={cart.length === 0 || saving}
          onPress={confirmSave}
          style={[
            styles.saveButton,
            { backgroundColor: colors.sale, borderRadius: radius.control, opacity: cart.length === 0 || saving ? 0.6 : 1 },
          ]}
        >
          <Text style={{ color: colors.onSale, fontSize: 15, fontWeight: '700' }}>
            {saving ? 'Saving…' : 'Save sale'}
          </Text>
        </Pressable>
      </View>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ padding: spacing.xl, gap: spacing.md, flex: 1 }}>
            <Text style={[styles.title, { color: colors.ink, fontSize: 18 }]}>Product catalog</Text>
            <TextInput
              value={search}
              onChangeText={handleSearch}
              placeholder="Search products"
              placeholderTextColor={colors.inkFaint}
              style={[
                styles.searchInput,
                { backgroundColor: colors.surface, borderColor: colors.lineStrong, color: colors.ink, borderRadius: radius.control },
              ]}
            />
            <FlatList
              data={allProducts}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={async () => {
                    setPickerOpen(false);
                    await addToCart(item);
                  }}
                  style={[styles.row, { borderBottomColor: colors.line }]}
                >
                  <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600' }}>{item.name}</Text>
                  <Text style={{ color: colors.inkFaint, fontSize: 11 }}>PID {item.id}</Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={[styles.closeButton, { borderColor: colors.lineStrong, borderRadius: radius.control }]}
            >
              <Text style={{ color: colors.ink, fontWeight: '700' }}>Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '700' },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6 },
  emptyCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 28,
    alignItems: 'center',
  },
  lineCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 12,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lineName: { fontSize: 14, fontWeight: '700' },
  lineRow: {
    flexDirection: 'row',
    gap: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  priceInput: { flex: 1, fontSize: 15, fontWeight: '700' },
  lineTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 14,
  },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth, gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  saveButton: { padding: 14, alignItems: 'center' },
  searchInput: { borderWidth: StyleSheet.hairlineWidth, padding: 10, fontSize: 14 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2 },
  closeButton: { borderWidth: StyleSheet.hairlineWidth, padding: 11, alignItems: 'center' },
});
