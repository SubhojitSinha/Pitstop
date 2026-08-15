import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSaleService, usePurchaseService } from '@/hooks/useServices';
import { formatCurrency } from '@/lib/format';
import { parseISODate } from '@/lib/periods';
import type { LedgerRecord } from '@/db/models/Report';

export default function DayDetailScreen() {
  const { tab, date } = useLocalSearchParams<{ tab: 'sale' | 'purchase'; date: string }>();
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const saleService = useSaleService();
  const purchaseService = usePurchaseService();
  const service = tab === 'purchase' ? purchaseService : saleService;
  const accent = tab === 'purchase' ? colors.purchase : colors.sale;

  const [records, setRecords] = useState<LedgerRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      service.recordsForDate(date).then(setRecords);
    }, [service, date])
  );

  const totalQty = records.reduce((sum, r) => sum + r.quantity, 0);
  const totalAmount = records.reduce((sum, r) => sum + r.totalPrice, 0);
  const dateLabel = parseISODate(date).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
            {tab === 'purchase' ? 'Purchases' : 'Sales'}
          </Text>
          <Text style={[styles.headerTitle, { color: colors.ink }]} numberOfLines={1}>
            {dateLabel}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <View
          style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
        >
          <Text style={{ color: accent, fontSize: 22, fontWeight: '700' }}>{formatCurrency(totalAmount)}</Text>
          <Text style={{ color: colors.inkSoft, fontSize: 12, marginTop: 2 }}>
            {totalQty} units · {records.length} {records.length === 1 ? 'entry' : 'entries'}
          </Text>
        </View>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.md, gap: 10 }}
        ListEmptyComponent={
          <Text style={{ color: colors.inkFaint, fontSize: 13, textAlign: 'center', marginTop: 24 }}>
            No {tab === 'purchase' ? 'purchases' : 'sales'} recorded on this date.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[styles.recordCard, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={{ color: colors.inkFaint, fontSize: 11, marginTop: 1 }}>
                PID {item.productId} · {item.quantity} × {formatCurrency(item.price)} · {item.time}
              </Text>
            </View>
            <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{formatCurrency(item.totalPrice)}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  summaryCard: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
});
