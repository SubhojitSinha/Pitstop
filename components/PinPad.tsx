import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

interface PinPadProps {
  length: number;
  value: string;
  error?: boolean;
  onPress: (key: string) => void;
}

export function PinPad({ length, value, error, onPress }: PinPadProps) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.dotsRow}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                borderColor: error ? colors.danger : colors.lineStrong,
                backgroundColor: i < value.length ? (error ? colors.danger : colors.ink) : 'transparent',
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {KEYS.map((key, i) =>
          key === '' ? (
            <View key={i} style={styles.key} />
          ) : (
            <Pressable
              key={i}
              onPress={() => onPress(key)}
              style={({ pressed }) => [styles.key, { backgroundColor: pressed ? colors.surface2 : 'transparent' }]}
            >
              {key === 'back' ? (
                <Ionicons name="backspace-outline" size={22} color={colors.ink} />
              ) : (
                <Text style={{ color: colors.ink, fontSize: 24, fontWeight: '600' }}>{key}</Text>
              )}
            </Pressable>
          )
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dotsRow: { flexDirection: 'row', gap: 14, marginBottom: 24, justifyContent: 'center' },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5 },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 260, justifyContent: 'center', alignSelf: 'center' },
  key: { width: 260 / 3, height: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 32 },
});
