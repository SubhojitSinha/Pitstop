import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useProductService } from '@/hooks/useServices';
import { ProductNameModal } from '@/components/ProductNameModal';
import type { Product } from '@/db/models/Product';

export default function ProductsScreen() {
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const productService = useProductService();

  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (term: string) => {
      const results = await productService.list(term);
      setProducts(results);
    },
    [productService]
  );

  useFocusEffect(
    useCallback(() => {
      setSearch('');
      load('');
    }, [load])
  );

  async function handleSearch(term: string) {
    setSearch(term);
    await load(term);
  }

  async function handleAdd(name: string) {
    setSaving(true);
    try {
      const product = await productService.create(name);
      setAddOpen(false);
      await load(search);
      router.push(`/product/${product.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.inkFaint }]}>Catalog</Text>
          <Text style={[styles.title, { color: colors.ink }]}>Products</Text>
          <Text style={[styles.count, { color: colors.inkSoft }]}>
            {products.length} {products.length === 1 ? 'product' : 'products'}
            {search ? ' matching' : ''}
          </Text>
        </View>
        <Pressable
          onPress={() => setAddOpen(true)}
          style={[styles.addButton, { backgroundColor: colors.ink, borderRadius: radius.control }]}
        >
          <Ionicons name="add" size={18} color={colors.bg} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, flex: 1 }}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.surface, borderColor: colors.lineStrong, borderRadius: radius.control },
          ]}
        >
          <Ionicons name="search" size={15} color={colors.inkFaint} />
          <TextInput
            value={search}
            onChangeText={handleSearch}
            placeholder="Search products"
            placeholderTextColor={colors.inkFaint}
            style={[styles.searchInput, { color: colors.ink }]}
          />
        </View>

        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/product/${item.id}`)}
              style={[styles.row, { borderBottomColor: colors.line }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowName, { color: colors.ink }]}>{item.name}</Text>
                <Text style={[styles.rowCode, { color: colors.inkFaint }]}>PID {item.id}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
            </Pressable>
          )}
        />
      </View>

      <ProductNameModal
        visible={addOpen}
        title="Add product"
        confirmLabel="Add"
        saving={saving}
        onCancel={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 4,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '700' },
  count: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  addButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: { flex: 1, fontSize: 14 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowName: { fontSize: 14, fontWeight: '700' },
  rowCode: { fontSize: 11, marginTop: 1 },
});
