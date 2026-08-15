import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSaleService, usePurchaseService } from '@/hooks/useServices';
import { DrillRow } from '@/components/DrillRow';
import { formatCurrency } from '@/lib/format';
import { parseISODate } from '@/lib/periods';
import type { DayTotal } from '@/db/models/Report';

export default function DaysDrillScreen() {
  const { tab, start, end, title } = useLocalSearchParams<{
    tab: 'sale' | 'purchase';
    start: string;
    end: string;
    title: string;
  }>();
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const saleService = useSaleService();
  const purchaseService = usePurchaseService();
  const service = tab === 'purchase' ? purchaseService : saleService;
  const accent = tab === 'purchase' ? colors.purchase : colors.sale;

  const [days, setDays] = useState<DayTotal[]>([]);

  useFocusEffect(
    useCallback(() => {
      service.dailyTotalsInRange({ start, end }).then((rows) => setDays([...rows].reverse()));
    }, [service, start, end])
  );

  const totalQty = days.reduce((sum, d) => sum + d.qty, 0);
  const totalAmount = days.reduce((sum, d) => sum + d.amount, 0);
  // Purchases are rare and bulk, so zero-activity days are noise here — sales keeps every day, since a
  // quiet sales day is itself meaningful signal.
  const visibleDays = tab === 'purchase' ? days.filter((d) => d.qty !== 0 || d.amount !== 0) : days;

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

        {visibleDays.length > 0 ? (
          <View
            style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
          >
            {visibleDays.map((day, i) => (
              <DrillRow
                key={day.date}
                label={parseISODate(day.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
                qty={day.qty}
                amount={day.amount}
                last={i === visibleDays.length - 1}
                onPress={() => router.push({ pathname: '/report/day', params: { tab, date: day.date } })}
              />
            ))}
          </View>
        ) : (
          <Text style={{ color: colors.inkFaint, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
            No purchases recorded in this range.
          </Text>
        )}
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
