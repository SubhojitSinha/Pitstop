import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface ProductChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export function ProductChip({ label, active, onPress }: ProductChipProps) {
  const { colors, radius } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderRadius: radius.pill,
          borderColor: active ? colors.ink : colors.lineStrong,
          backgroundColor: active ? colors.ink : colors.surface,
        },
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.bg : colors.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
