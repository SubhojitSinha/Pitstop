import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSaleService, usePurchaseService } from '@/hooks/useServices';
import { DrillRow } from '@/components/DrillRow';
import { formatCurrency } from '@/lib/format';
import { computeMonthBuckets, formatMonthLabel, MonthBucket } from '@/lib/periods';
import type { MonthTotal } from '@/db/models/Report';

export default function MonthsDrillScreen() {
  const { tab, count, title } = useLocalSearchParams<{ tab: 'sale' | 'purchase'; count: string; title: string }>();
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const saleService = useSaleService();
  const purchaseService = usePurchaseService();
  const service = tab === 'purchase' ? purchaseService : saleService;
  const accent = tab === 'purchase' ? colors.purchase : colors.sale;

  const [months, setMonths] = useState<MonthTotal[]>([]);
  const [buckets, setBuckets] = useState<MonthBucket[]>([]);

  useFocusEffect(
    useCallback(() => {
      const computed = computeMonthBuckets(Number(count));
      setBuckets(computed);
      service.monthlyTotals(computed).then(setMonths);
    }, [service, count])
  );

  const totalQty = months.reduce((sum, m) => sum + m.qty, 0);
  const totalAmount = months.reduce((sum, m) => sum + m.amount, 0);

  function openMonth(bucket: MonthBucket) {
    router.push({
      pathname: '/report/days',
      params: { tab, start: bucket.range.start, end: bucket.range.end, title: formatMonthLabel(bucket.key) },
    });
  }

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
            {title}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <View
          style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
        >
          <Text style={{ color: accent, fontSize: 22, fontWeight: '700' }}>{formatCurrency(totalAmount)}</Text>
          <Text style={{ color: colors.inkSoft, fontSize: 12, marginTop: 2 }}>{totalQty} units total</Text>
        </View>

        <View
          style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
        >
          {months.map((month, i) => (
            <DrillRow
              key={month.key}
              label={formatMonthLabel(month.key)}
              qty={month.qty}
              amount={month.amount}
              last={i === months.length - 1}
              onPress={() => {
                const bucket = buckets.find((b) => b.key === month.key);
                if (bucket) openMonth(bucket);
              }}
            />
          ))}
        </View>
      </ScrollView>
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
  summaryCard: { borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  table: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
