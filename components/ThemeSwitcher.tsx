import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/theme/ThemeContext';

const OPTIONS: { mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
  { mode: 'dark', label: 'Dark', icon: 'moon-outline' },
  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
];

export function ThemeSwitcher() {
  const { mode, setMode, colors, radius } = useTheme();

  return (
    <View style={[styles.row, { backgroundColor: colors.surface2, borderRadius: radius.pill }]}>
      {OPTIONS.map((option) => {
        const active = mode === option.mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => setMode(option.mode)}
            style={[
              styles.segment,
              { borderRadius: radius.pill },
              active && { backgroundColor: colors.surface },
            ]}
          >
            <Ionicons name={option.icon} size={14} color={active ? colors.ink : colors.inkFaint} />
            <Text style={[styles.label, { color: active ? colors.ink : colors.inkFaint }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
});
