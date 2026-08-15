import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: 'sale' | 'purchase' | 'neutral';
}

export function MetricCard({ label, value, sub, tone = 'neutral' }: MetricCardProps) {
  const { colors, radius, spacing } = useTheme();
  const valueColor = tone === 'sale' ? colors.sale : tone === 'purchase' ? colors.purchase : colors.ink;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card, padding: spacing.md },
      ]}
    >
      <Text style={[styles.label, { color: colors.inkFaint }]}>{label.toUpperCase()}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {sub ? <Text style={[styles.sub, { color: colors.inkSoft }]}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 12,
    marginTop: 2,
  },
});
