import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { formatCurrency } from '@/lib/format';

interface DrillRowProps {
  label: string;
  qty: number;
  amount: number;
  onPress: () => void;
  last?: boolean;
}

export function DrillRow({ label, qty, amount, onPress, last }: DrillRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line }]}
    >
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <View style={styles.right}>
        <Text style={{ color: colors.inkSoft, fontSize: 12 }}>{qty} units</Text>
        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{formatCurrency(amount)}</Text>
        <Ionicons name="chevron-forward" size={15} color={colors.inkFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
