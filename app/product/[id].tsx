import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useProductService } from '@/hooks/useServices';
import { ProductNameModal } from '@/components/ProductNameModal';
import { QuickActionButton } from '@/components/QuickActionButton';
import { formatCurrency, formatShortDate } from '@/lib/format';
import type { ProductInsights } from '@/db/models/Product';
import type { PeriodBreakdown, PeriodBucket } from '@/db/models/PeriodStats';

type LedgerTab = 'sale' | 'purchase';

const PERIOD_LABELS: { key: keyof PeriodBreakdown; label: string }[] = [
  { key: 'last7Days', label: 'Last 7 days' },
  { key: 'thisMonth', label: 'This month' },
  { key: 'lastMonth', label: 'Last month' },
  { key: 'last6Months', label: 'Last 6 months' },
  { key: 'last12Months', label: 'Last 12 months' },
  { key: 'allTime', label: 'All time' },
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = Number(id);
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const productService = useProductService();

  const [insights, setInsights] = useState<ProductInsights | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>('sale');

  const load = useCallback(async () => {
    const result = await productService.getInsights(productId);
    setInsights(result);
  }, [productService, productId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleEdit(name: string) {
    setSaving(true);
    try {
      await productService.update(productId, name);
      setEditOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete product?', 'This removes the product from your catalog.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: handleDelete },
    ]);
  }

  async function handleDelete() {
    try {
      await productService.remove(productId);
      router.back();
    } catch {
      Alert.alert(
        "Can't delete this product",
        'It has recorded sales or purchases, and those records are kept for accuracy. Remove those entries first if you really need to delete it.'
      );
    }
  }

  if (!insights) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const { product, sale, purchase, lastSale, lastPurchase } = insights;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.ink }]} numberOfLines={1}>
          {product.name}
        </Text>
        <Pressable onPress={() => setEditOpen(true)} hitSlop={8}>
          <Ionicons name="create-outline" size={20} color={colors.ink} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}>
          <MetaRow label="Product ID" value={String(product.id)} colors={colors} />
          <MetaRow label="Product name" value={product.name} colors={colors} wrap />
          <MetaRow
            label="Added on"
            value={`${formatShortDate(product.createdOn)} · ${product.createdAt}`}
            colors={colors}
          />
          <MetaRow
            label="Last updated"
            value={
              product.updatedOn && product.updatedAt
                ? `${formatShortDate(product.updatedOn)} · ${product.updatedAt}`
                : 'Not edited yet'
            }
            colors={colors}
          />
          <MetaRow
            label="Last sale"
            value={lastSale ? `${formatShortDate(lastSale.date)} · ${lastSale.time}` : 'No sales yet'}
            colors={colors}
          />
          <MetaRow
            label="Last purchase"
            value={
              lastPurchase ? `${formatShortDate(lastPurchase.date)} · ${lastPurchase.time}` : 'No purchases yet'
            }
            colors={colors}
            last
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <QuickActionButton
            icon="cart-outline"
            label="Sell this"
            sub="New sale entry"
            tone="sale"
            onPress={() => router.push({ pathname: '/sale', params: { productId: String(product.id) } })}
          />
          <QuickActionButton
            icon="cube-outline"
            label="Restock this"
            sub="New purchase entry"
            tone="purchase"
            onPress={() => router.push({ pathname: '/purchase', params: { productId: String(product.id) } })}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <SummaryCard
            label="Total sold"
            qty={sale.allTime.qty}
            amount={sale.allTime.amount}
            tone="sale"
          />
          <SummaryCard
            label="Total purchased"
            qty={purchase.allTime.qty}
            amount={purchase.allTime.amount}
            tone="purchase"
          />
        </View>

        <View>
          <View style={[styles.segRow, { backgroundColor: colors.surface2, borderRadius: radius.pill }]}>
            <Pressable
              onPress={() => setLedgerTab('sale')}
              style={[
                styles.segBtn,
                { borderRadius: radius.pill },
                ledgerTab === 'sale' && { backgroundColor: colors.surface },
              ]}
            >
              <Text style={{ color: ledgerTab === 'sale' ? colors.sale : colors.inkFaint, fontWeight: '700', fontSize: 13 }}>
                Sales
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLedgerTab('purchase')}
              style={[
                styles.segBtn,
                { borderRadius: radius.pill },
                ledgerTab === 'purchase' && { backgroundColor: colors.surface },
              ]}
            >
              <Text
                style={{
                  color: ledgerTab === 'purchase' ? colors.purchase : colors.inkFaint,
                  fontWeight: '700',
                  fontSize: 13,
                }}
              >
                Purchases
              </Text>
            </Pressable>
          </View>

          {ledgerTab === 'sale' ? <PeriodTable data={sale} /> : <PeriodTable data={purchase} />}
        </View>

        <Pressable
          onPress={confirmDelete}
          style={[styles.deleteButton, { borderColor: colors.danger, borderRadius: radius.control }]}
        >
          <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 14 }}>Delete product</Text>
        </Pressable>
      </ScrollView>

      <ProductNameModal
        visible={editOpen}
        title="Edit product"
        confirmLabel="Save"
        initialName={product.name}
        saving={saving}
        excludeProductId={product.id}
        onCancel={() => setEditOpen(false)}
        onSubmit={handleEdit}
      />
    </SafeAreaView>
  );
}

function MetaRow({
  label,
  value,
  colors,
  last,
  wrap,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
  last?: boolean;
  wrap?: boolean;
}) {
  return (
    <View style={[styles.metaRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }]}>
      <Text style={{ color: colors.inkSoft, fontSize: 12, fontWeight: '600', flexShrink: 0 }}>{label}</Text>
      <Text
        style={{ color: colors.ink, fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' }}
        numberOfLines={wrap ? undefined : 1}
      >
        {value}
      </Text>
    </View>
  );
}

function SummaryCard({
  label,
  qty,
  amount,
  tone,
}: {
  label: string;
  qty: number;
  amount: number;
  tone: 'sale' | 'purchase';
}) {
  const { colors, radius } = useTheme();
  const accent = tone === 'sale' ? colors.sale : colors.purchase;
  return (
    <View
      style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
    >
      <Text style={{ color: colors.inkFaint, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>
        {label.toUpperCase()}
      </Text>
      <Text style={{ color: accent, fontSize: 20, fontWeight: '700', marginTop: 4 }}>{formatCurrency(amount)}</Text>
      <Text style={{ color: colors.inkSoft, fontSize: 12, marginTop: 2 }}>{qty} units</Text>
    </View>
  );
}

function PeriodTable({ data }: { data: PeriodBreakdown }) {
  const { colors, radius } = useTheme();
  return (
    <View style={{ marginTop: 10 }}>
      <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}>
        <View style={[styles.tableHeadRow, { borderBottomColor: colors.line }]}>
          <Text style={[styles.tableHeadCell, { color: colors.inkFaint, flex: 1.4 }]}>Period</Text>
          <Text style={[styles.tableHeadCell, { color: colors.inkFaint }]}>Qty</Text>
          <Text style={[styles.tableHeadCell, { color: colors.inkFaint, textAlign: 'right' }]}>Amount</Text>
        </View>
        {PERIOD_LABELS.map(({ key, label }, i) => {
          const bucket: PeriodBucket = data[key];
          const isLast = i === PERIOD_LABELS.length - 1;
          return (
            <View
              key={key}
              style={[
                styles.tableRow,
                !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
                isLast && { backgroundColor: colors.surface2 },
              ]}
            >
              <Text style={[styles.tableCell, { color: colors.ink, flex: 1.4, fontWeight: isLast ? '700' : '600' }]}>
                {label}
              </Text>
              <Text style={[styles.tableCell, { color: colors.inkSoft }]}>{bucket.qty}</Text>
              <Text style={[styles.tableCell, { color: colors.ink, textAlign: 'right', fontWeight: '700' }]}>
                {formatCurrency(bucket.amount)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  metaCard: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  segRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
  },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tableHeadRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tableHeadCell: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: 13,
  },
  deleteButton: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
});
