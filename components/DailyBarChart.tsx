import { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/lib/format';
import { parseISODate } from '@/lib/periods';
import type { DayTotal } from '@/db/models/Report';

const TOOLTIP_WIDTH = 132;

interface DailyBarChartProps {
  data: DayTotal[];
  color: string;
}

/** Tap-to-reveal tooltip bar chart — one bar per day, sized by amount. Used on Home and Reports. */
export function DailyBarChart({ data, color }: DailyBarChartProps) {
  const { colors, radius } = useTheme();
  const [chartWidth, setChartWidth] = useState(0);
  const [barLayouts, setBarLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const [tooltipDate, setTooltipDate] = useState<string | null>(null);

  const chartMax = Math.max(1, ...data.map((d) => d.amount));

  return (
    <View
      style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
    >
      <View
        style={styles.barChart}
        onLayout={(e: LayoutChangeEvent) => {
          const layout = e?.nativeEvent?.layout;
          if (layout) setChartWidth(layout.width);
        }}
      >
        {data.map((day) => (
          <Pressable
            key={day.date}
            style={styles.barCol}
            onLayout={(e: LayoutChangeEvent) => {
              const layout = e?.nativeEvent?.layout;
              if (!layout) return;
              setBarLayouts((prev) => ({ ...prev, [day.date]: { x: layout.x, width: layout.width } }));
            }}
            onPress={() => setTooltipDate((prev) => (prev === day.date ? null : day.date))}
          >
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(4, (day.amount / chartMax) * 90),
                    backgroundColor: color,
                    opacity: tooltipDate && tooltipDate !== day.date ? 0.4 : 1,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: colors.inkFaint }]}>{day.date.slice(8, 10)}</Text>
          </Pressable>
        ))}

        {tooltipDate && barLayouts[tooltipDate]
          ? (() => {
              const day = data.find((d) => d.date === tooltipDate);
              if (!day) return null;
              const layout = barLayouts[tooltipDate];
              const rawLeft = layout.x + layout.width / 2 - TOOLTIP_WIDTH / 2;
              const left = Math.min(Math.max(rawLeft, 0), Math.max(chartWidth - TOOLTIP_WIDTH, 0));
              return (
                <Pressable
                  onPress={() => setTooltipDate(null)}
                  style={[styles.tooltip, { left, backgroundColor: colors.ink, borderRadius: radius.control }]}
                >
                  <Text style={{ color: colors.bg, fontSize: 11, fontWeight: '700' }}>
                    {parseISODate(day.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </Text>
                  <Text style={{ color: colors.bg, fontSize: 13, fontWeight: '700', marginTop: 1 }}>
                    {formatCurrency(day.amount)}
                  </Text>
                  <Text style={{ color: colors.bg, fontSize: 10, opacity: 0.75 }}>{day.qty} units</Text>
                </Pressable>
              );
            })()
          : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartCard: { borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 140, position: 'relative' },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barTrack: { width: '100%', height: 100, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3 },
  barLabel: { fontSize: 8, marginTop: 5 },
  tooltip: {
    position: 'absolute',
    top: 0,
    width: TOOLTIP_WIDTH,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
});
