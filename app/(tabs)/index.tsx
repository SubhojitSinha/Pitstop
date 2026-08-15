import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useProductService, useSaleService, usePurchaseService } from '@/hooks/useServices';
import { MetricCard } from '@/components/MetricCard';
import { QuickActionButton } from '@/components/QuickActionButton';
import { Logo } from '@/components/Logo';
import { DailyBarChart } from '@/components/DailyBarChart';
import { formatCurrency, formatShortDate } from '@/lib/format';
import { todayDateString } from '@/lib/datetime';
import { lastNDaysRange } from '@/lib/periods';
import { getTopSellersCount } from '@/lib/preferences';
import type { DayTotal } from '@/db/models/Report';
import type { ProductStats, RestockSuggestion, TopSellingProduct } from '@/db/models/Product';
import type { RestockEvent } from '@/db/models/Purchase';

const CHART_DAYS = 14;

type InsightTab = 'top' | 'restock';

export default function HomeScreen() {
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const saleService = useSaleService();
  const purchaseService = usePurchaseService();
  const productService = useProductService();

  const [todayTotal, setTodayTotal] = useState({ total: 0, count: 0 });
  const [lastRestock, setLastRestock] = useState<RestockEvent | null>(null);
  const [chart, setChart] = useState<DayTotal[]>([]);
  const [attention, setAttention] = useState<ProductStats[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellingProduct[]>([]);
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
  const [insightTab, setInsightTab] = useState<InsightTab>('top');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const today = todayDateString();
        const topSellersCount = await getTopSellersCount();
        const [total, restock, days, attn, sellers, suggestions] = await Promise.all([
          saleService.todayTotal(today),
          purchaseService.lastRestock(),
          saleService.dailyTotalsInRange(lastNDaysRange(CHART_DAYS)),
          productService.needingAttention(1),
          productService.topSelling(topSellersCount),
          productService.suggestedRestocks(5),
        ]);
        if (cancelled) return;
        setTodayTotal(total);
        setLastRestock(restock);
        setChart(days);
        setAttention(attn);
        setTopSellers(sellers);
        setRestockSuggestions(suggestions);
      })();
      return () => {
        cancelled = true;
      };
    }, [saleService, purchaseService, productService])
  );

  const daysSinceRestock = lastRestock
    ? Math.max(0, Math.round((Date.parse(todayDateString()) - Date.parse(lastRestock.date)) / 86400000))
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={styles.brandRow}>
          <View style={styles.brandLeft}>
            <Logo size={40} />
            <View>
              <Text style={[styles.eyebrow, { color: colors.inkFaint }]}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
              </Text>
              <Text style={[styles.title, { color: colors.ink }]}>Today at a glance</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color={colors.inkSoft} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <MetricCard
            label="Sold today"
            value={formatCurrency(todayTotal.total)}
            sub={`${todayTotal.count} sale${todayTotal.count === 1 ? '' : 's'}`}
            tone="sale"
          />
          <MetricCard
            label="Last restock"
            value={daysSinceRestock !== null ? `${daysSinceRestock}d` : '—'}
            sub={lastRestock ? `ago · ${formatCurrency(lastRestock.total)}` : 'No purchases yet'}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <QuickActionButton
            icon="cart-outline"
            label="New sale"
            sub="Log a sale at the counter"
            tone="sale"
            onPress={() => router.push('/sale')}
          />
          <QuickActionButton
            icon="cube-outline"
            label="New purchase"
            sub="Record stock coming in"
            tone="purchase"
            onPress={() => router.push('/purchase')}
          />
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>Last {CHART_DAYS} days</Text>
            <Text style={[styles.sectionSub, { color: colors.inkFaint }]}>Sales</Text>
          </View>
          <DailyBarChart data={chart} color={colors.sale} />
        </View>

        {attention.length > 0 ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>Needs attention</Text>
              <Text style={[styles.sectionSub, { color: colors.inkFaint }]}>{attention.length}</Text>
            </View>
            {attention.map((stat) => (
              <View key={stat.product.id} style={[styles.attnCard, { backgroundColor: colors.dangerBg }]}>
                <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.attnTitle, { color: colors.ink }]}>
                    {stat.product.name} — sold {stat.totalSold} times, never restocked
                  </Text>
                  <Text style={[styles.attnSub, { color: colors.inkSoft }]}>Might be worth reordering soon</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {topSellers.length > 0 || restockSuggestions.length > 0 ? (
          <View>
            <View style={[styles.segRow, { backgroundColor: colors.surface2 }]}>
              <Pressable
                onPress={() => setInsightTab('top')}
                style={[styles.segBtn, insightTab === 'top' && { backgroundColor: colors.surface }]}
              >
                <Text style={{ color: insightTab === 'top' ? colors.ink : colors.inkFaint, fontWeight: '700', fontSize: 13 }}>
                  Top sellers
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInsightTab('restock')}
                style={[styles.segBtn, insightTab === 'restock' && { backgroundColor: colors.surface }]}
              >
                <Text
                  style={{ color: insightTab === 'restock' ? colors.ink : colors.inkFaint, fontWeight: '700', fontSize: 13 }}
                >
                  Worth restocking
                </Text>
              </Pressable>
            </View>

            <View
              style={[styles.listCard, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
            >
              {insightTab === 'top' ? (
                topSellers.length > 0 ? (
                  topSellers.map((item, i) => (
                    <View
                      key={item.product.id}
                      style={[
                        styles.rankRow,
                        i < topSellers.length - 1 && {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: colors.line,
                        },
                      ]}
                    >
                      <View style={[styles.rankBadge, { backgroundColor: colors.surface2 }]}>
                        <Text style={{ color: colors.inkSoft, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                          {item.product.name}
                        </Text>
                        <Text style={{ color: colors.inkFaint, fontSize: 11 }}>{item.qty} units sold</Text>
                      </View>
                      <Text style={{ color: colors.sale, fontSize: 13, fontWeight: '700' }}>
                        {formatCurrency(item.amount)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.emptyText, { color: colors.inkFaint }]}>No sales recorded yet.</Text>
                )
              ) : restockSuggestions.length > 0 ? (
                restockSuggestions.map((item, i) => (
                  <View
                    key={item.product.id}
                    style={[
                      styles.rankRow,
                      i < restockSuggestions.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.line,
                      },
                    ]}
                  >
                    <View style={[styles.rankBadge, { backgroundColor: colors.purchaseBg }]}>
                      <Text style={{ color: colors.purchaseInk, fontSize: 11, fontWeight: '700' }}>↑</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                        {item.product.name}
                      </Text>
                      <Text style={{ color: colors.inkFaint, fontSize: 11 }}>
                        {item.lastPurchaseDate
                          ? `Since last restock · ${formatShortDate(item.lastPurchaseDate)}`
                          : 'Never restocked'}
                      </Text>
                    </View>
                    <Text style={{ color: colors.purchase, fontSize: 13, fontWeight: '700' }}>
                      {item.qtySoldSinceRestock} sold
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.inkFaint }]}>Nothing needs restocking right now.</Text>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionSub: {
    fontSize: 11,
  },
  attnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  attnTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  attnSub: {
    fontSize: 12,
    marginTop: 2,
  },
  segRow: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 999,
  },
  emptyText: {
    fontSize: 13,
    padding: 14,
    textAlign: 'center',
  },
  listCard: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
