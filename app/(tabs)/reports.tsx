import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useSaleService, usePurchaseService } from '@/hooks/useServices';
import { DrillRow } from '@/components/DrillRow';
import { DailyBarChart } from '@/components/DailyBarChart';
import { InlineDatePicker } from '@/components/InlineDatePicker';
import { computeReportRanges, lastNDaysRange, toISODate, formatRangeLabel } from '@/lib/periods';
import type { ReportSummary, DayTotal } from '@/db/models/Report';

const CHART_DAYS = 14;

type Segment = 'sale' | 'purchase';

export default function ReportsScreen() {
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const saleService = useSaleService();
  const purchaseService = usePurchaseService();

  const [segment, setSegment] = useState<Segment>('sale');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [chart, setChart] = useState<DayTotal[]>([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const service = segment === 'sale' ? saleService : purchaseService;

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [reportSummary, dailyChart] = await Promise.all([
          service.reportSummary(),
          service.dailyTotalsInRange(lastNDaysRange(CHART_DAYS)),
        ]);
        if (cancelled) return;
        setSummary(reportSummary);
        setChart(dailyChart);
      })();
      return () => {
        cancelled = true;
      };
    }, [service])
  );

  const ranges = computeReportRanges();

  function goToDay(date: string) {
    router.push({ pathname: '/report/day', params: { tab: segment, date } });
  }

  function goToDays(start: string, end: string, title: string) {
    router.push({ pathname: '/report/days', params: { tab: segment, start, end, title } });
  }

  function goToMonths(count: number, title: string) {
    router.push({ pathname: '/report/months', params: { tab: segment, count: String(count), title } });
  }

  function applyCustomRange() {
    const startIso = toISODate(startDate);
    const endIso = toISODate(endDate);
    if (startIso > endIso) {
      Alert.alert('Invalid range', 'Start date must be on or before the end date.');
      return;
    }
    if (startIso === endIso) {
      goToDay(startIso);
    } else {
      goToDays(startIso, endIso, formatRangeLabel({ start: startIso, end: endIso }));
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        <Text style={[styles.eyebrow, { color: colors.inkFaint }]}>Insights</Text>
        <Text style={[styles.title, { color: colors.ink }]}>Reports</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}>
        <View style={[styles.segRow, { backgroundColor: colors.surface2 }]}>
          <Pressable
            onPress={() => setSegment('sale')}
            style={[styles.segBtn, segment === 'sale' && { backgroundColor: colors.surface }]}
          >
            <Text style={{ color: segment === 'sale' ? colors.sale : colors.inkFaint, fontWeight: '700', fontSize: 13 }}>
              Sales
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSegment('purchase')}
            style={[styles.segBtn, segment === 'purchase' && { backgroundColor: colors.surface }]}
          >
            <Text
              style={{
                color: segment === 'purchase' ? colors.purchase : colors.inkFaint,
                fontWeight: '700',
                fontSize: 13,
              }}
            >
              Purchases
            </Text>
          </Pressable>
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Last {CHART_DAYS} days</Text>
          <DailyBarChart data={chart} color={segment === 'sale' ? colors.sale : colors.purchase} />
        </View>

        {summary ? (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>Drill down</Text>
            <View
              style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
            >
              <DrillRow
                label="Today"
                qty={summary.today.qty}
                amount={summary.today.amount}
                onPress={() => goToDay(ranges.today.start)}
              />
              <DrillRow
                label="Yesterday"
                qty={summary.yesterday.qty}
                amount={summary.yesterday.amount}
                onPress={() => goToDay(ranges.yesterday.start)}
              />
              <DrillRow
                label="This week"
                qty={summary.thisWeek.qty}
                amount={summary.thisWeek.amount}
                onPress={() => goToDays(ranges.thisWeek.start, ranges.thisWeek.end, 'This week')}
              />
              <DrillRow
                label="Last week"
                qty={summary.lastWeek.qty}
                amount={summary.lastWeek.amount}
                onPress={() => goToDays(ranges.lastWeek.start, ranges.lastWeek.end, 'Last week')}
              />
              <DrillRow
                label="This month"
                qty={summary.thisMonth.qty}
                amount={summary.thisMonth.amount}
                onPress={() => goToDays(ranges.thisMonth.start, ranges.thisMonth.end, 'This month')}
              />
              <DrillRow
                label="Last month"
                qty={summary.lastMonth.qty}
                amount={summary.lastMonth.amount}
                onPress={() => goToDays(ranges.lastMonth.start, ranges.lastMonth.end, 'Last month')}
              />
              <DrillRow
                label="6 months"
                qty={summary.last6Months.qty}
                amount={summary.last6Months.amount}
                onPress={() => goToMonths(6, 'Last 6 months')}
              />
              <DrillRow
                label="1 year"
                qty={summary.last12Months.qty}
                amount={summary.last12Months.amount}
                onPress={() => goToMonths(12, 'Last 12 months')}
                last
              />
            </View>
          </View>
        ) : null}

        <View>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Custom range</Text>
          <View
            style={[styles.rangeCard, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
          >
            <View style={styles.rangeRow}>
              <Pressable
                onPress={() => setShowStartPicker(true)}
                style={[styles.dateChip, { borderColor: colors.lineStrong, borderRadius: radius.control }]}
              >
                <Text style={{ color: colors.inkFaint, fontSize: 11, fontWeight: '700' }}>START</Text>
                <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }}>
                  {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setShowEndPicker(true)}
                style={[styles.dateChip, { borderColor: colors.lineStrong, borderRadius: radius.control }]}
              >
                <Text style={{ color: colors.inkFaint, fontSize: 11, fontWeight: '700' }}>END</Text>
                <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }}>
                  {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={applyCustomRange}
              style={[styles.applyButton, { backgroundColor: colors.ink, borderRadius: radius.control }]}
            >
              <Text style={{ color: colors.bg, fontWeight: '700', fontSize: 14 }}>View report</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <InlineDatePicker
        visible={showStartPicker}
        value={startDate}
        maximumDate={new Date()}
        onChange={setStartDate}
        onClose={() => setShowStartPicker(false)}
      />
      <InlineDatePicker
        visible={showEndPicker}
        value={endDate}
        maximumDate={new Date()}
        onChange={setEndDate}
        onClose={() => setShowEndPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '700' },
  segRow: { flexDirection: 'row', gap: 6, borderRadius: 999, padding: 4 },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  table: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  rangeCard: { borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  rangeRow: { flexDirection: 'row', gap: 10 },
  dateChip: { flex: 1, borderWidth: StyleSheet.hairlineWidth, padding: 10, gap: 3 },
  applyButton: { paddingVertical: 12, alignItems: 'center' },
});
