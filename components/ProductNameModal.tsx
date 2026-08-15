import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useProductService } from '@/hooks/useServices';
import type { Product } from '@/db/models/Product';

interface ProductNameModalProps {
  visible: boolean;
  title: string;
  confirmLabel: string;
  initialName?: string;
  saving?: boolean;
  /** Product being edited, if any — excluded from the duplicate check against itself. */
  excludeProductId?: number;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}

function isSameName(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function ProductNameModal({
  visible,
  title,
  confirmLabel,
  initialName = '',
  saving = false,
  excludeProductId,
  onCancel,
  onSubmit,
}: ProductNameModalProps) {
  const { colors, radius, spacing } = useTheme();
  const productService = useProductService();
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState<Product[]>([]);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setError('');
      setMatches([]);
    }
  }, [visible, initialName]);

  useEffect(() => {
    const term = name.trim();
    if (!visible || !term) {
      setMatches([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const results = await productService.list(term);
      if (!cancelled) {
        setMatches(results.filter((p) => p.id !== excludeProductId));
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [name, visible, productService, excludeProductId]);

  const exactMatch = matches.find((p) => isSameName(p.name, name));

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a product name first');
      return;
    }
    if (exactMatch) {
      setError(`"${exactMatch.name}" already exists (PID ${exactMatch.id})`);
      return;
    }
    onSubmit(trimmed);
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg }]}>
          <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
          <TextInput
            value={name}
            onChangeText={(v) => {
              setName(v);
              if (error) setError('');
            }}
            placeholder="Product name"
            placeholderTextColor={colors.inkFaint}
            autoFocus
            style={[
              styles.input,
              {
                backgroundColor: colors.surface2,
                borderColor: exactMatch ? colors.danger : colors.lineStrong,
                color: colors.ink,
                borderRadius: radius.control,
              },
            ]}
          />
          {error ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: 6 }}>{error}</Text> : null}

          {matches.length > 0 ? (
            <View style={{ marginTop: 12 }}>
              <Text style={{ color: colors.inkFaint, fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6 }}>
                {exactMatch ? 'ALREADY IN YOUR CATALOG' : 'SIMILAR PRODUCTS ALREADY IN YOUR CATALOG'}
              </Text>
              <FlatList
                data={matches.slice(0, 5)}
                keyExtractor={(item) => String(item.id)}
                style={{ maxHeight: 140 }}
                renderItem={({ item }) => (
                  <View style={[styles.matchRow, { borderBottomColor: colors.line }]}>
                    <Text
                      style={{
                        color: isSameName(item.name, name) ? colors.danger : colors.ink,
                        fontSize: 13,
                        fontWeight: '600',
                        flex: 1,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ color: colors.inkFaint, fontSize: 11 }}>PID {item.id}</Text>
                  </View>
                )}
              />
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { borderColor: colors.lineStrong, borderRadius: radius.control }]}
            >
              <Text style={{ color: colors.ink, fontWeight: '700' }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              disabled={saving || !!exactMatch}
              style={[
                styles.button,
                { backgroundColor: colors.ink, borderRadius: radius.control, opacity: saving || exactMatch ? 0.6 : 1 },
              ]}
            >
              <Text style={{ color: colors.bg, fontWeight: '700' }}>{saving ? 'Saving…' : confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  matchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  button: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
    alignItems: 'center',
  },
});
