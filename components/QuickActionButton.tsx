import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface QuickActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  tone: 'sale' | 'purchase';
  onPress: () => void;
}

export function QuickActionButton({ icon, label, sub, tone, onPress }: QuickActionButtonProps) {
  const { colors, radius, spacing } = useTheme();
  const bg = tone === 'sale' ? colors.sale : colors.purchase;
  const onColor = tone === 'sale' ? colors.onSale : colors.onPurchase;
  const accent = tone === 'sale' ? colors.sale : colors.purchase;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderRadius: radius.card, padding: spacing.md, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={24} color={accent} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: onColor }]}>{label}</Text>
        <Text style={[styles.sub, { color: onColor }]}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    gap: 10,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    gap: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  sub: {
    fontSize: 11,
    opacity: 0.85,
  },
});
