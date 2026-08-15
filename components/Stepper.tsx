import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface StepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  step?: number;
}

export function Stepper({ value, onChange, min = 1, step = 1 }: StepperProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - step))}
        style={[styles.circle, { borderColor: colors.lineStrong, backgroundColor: colors.surface }]}
      >
        <Text style={[styles.symbol, { color: colors.ink }]}>-</Text>
      </Pressable>
      <Text style={[styles.value, { color: colors.ink }]}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + step)}
        style={[styles.circle, { borderColor: colors.lineStrong, backgroundColor: colors.surface }]}
      >
        <Text style={[styles.symbol, { color: colors.ink }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  value: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
