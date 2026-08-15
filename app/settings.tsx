import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useTheme } from '@/hooks/useTheme';
import { useDataExchangeService } from '@/hooks/useServices';
import { Stepper } from '@/components/Stepper';
import { InlineDatePicker } from '@/components/InlineDatePicker';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { getTopSellersCount, setTopSellersCount } from '@/lib/preferences';
import { toISODate } from '@/lib/periods';
import type { ImportResult } from '@/db/services/DataExchangeService';

type ExportKind = 'products' | 'sales' | 'purchases';

export default function SettingsScreen() {
  const { colors, radius, spacing } = useTheme();
  const router = useRouter();
  const dataExchangeService = useDataExchangeService();

  const [topSellers, setTopSellers] = useState(5);
  const [useDateRange, setUseDateRange] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    getTopSellersCount().then(setTopSellers);
  }, []);

  async function handleTopSellersChange(next: number) {
    setTopSellers(next);
    await setTopSellersCount(next);
  }

  async function exportCSV(kind: ExportKind) {
    setBusy(`export-${kind}`);
    try {
      const range = useDateRange ? { start: toISODate(startDate), end: toISODate(endDate) } : undefined;
      const csv =
        kind === 'products'
          ? await dataExchangeService.exportProductsCSV(range)
          : kind === 'sales'
            ? await dataExchangeService.exportSalesCSV(range)
            : await dataExchangeService.exportPurchasesCSV(range);

      const filename = `${kind}-${toISODate(new Date())}.csv`;
      const file = new File(Paths.cache, filename);
      if (file.exists) file.delete();
      file.create();
      file.write(csv);

      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
      } else {
        Alert.alert('Exported', `Saved to ${file.uri}`);
      }
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  async function importCSV(kind: ExportKind) {
    // CSV MIME reporting is inconsistent across file providers, so accept any file type here —
    // bad content is caught and reported below rather than silently filtered out of the picker.
    const picked = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (picked.canceled || !picked.assets[0]) return;

    setBusy(`import-${kind}`);
    try {
      const text = await new File(picked.assets[0].uri).text();
      const result: ImportResult =
        kind === 'products'
          ? await dataExchangeService.importProductsCSV(text)
          : kind === 'sales'
            ? await dataExchangeService.importSalesCSV(text)
            : await dataExchangeService.importPurchasesCSV(text);

      Alert.alert(
        'Import complete',
        `${result.imported} ${kind} imported${result.skipped > 0 ? `, ${result.skipped} skipped (already existed or invalid)` : ''}.`
      );
    } catch (err) {
      Alert.alert('Import failed', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Appearance</Text>
          <ThemeSwitcher />
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Home screen</Text>
          <View
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
          >
            <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>
              Top sellers to show
            </Text>
            <Text style={{ color: colors.inkSoft, fontSize: 12, marginBottom: 12 }}>
              How many best-selling products appear on Home.
            </Text>
            <Stepper value={topSellers} onChange={handleTopSellersChange} min={1} />
          </View>
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Export data</Text>
          <View
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
          >
            <Pressable
              onPress={() => setUseDateRange((v) => !v)}
              style={styles.toggleRow}
            >
              <View style={[styles.checkbox, { borderColor: colors.lineStrong }, useDateRange && { backgroundColor: colors.ink }]}>
                {useDateRange ? <Ionicons name="checkmark" size={13} color={colors.bg} /> : null}
              </View>
              <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>Limit to a date range</Text>
            </Pressable>

            {useDateRange ? (
              <View style={styles.rangeRow}>
                <Pressable
                  onPress={() => setShowStartPicker(true)}
                  style={[styles.dateChip, { borderColor: colors.lineStrong, borderRadius: radius.control }]}
                >
                  <Text style={{ color: colors.inkFaint, fontSize: 10, fontWeight: '700' }}>START</Text>
                  <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>
                    {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setShowEndPicker(true)}
                  style={[styles.dateChip, { borderColor: colors.lineStrong, borderRadius: radius.control }]}
                >
                  <Text style={{ color: colors.inkFaint, fontSize: 10, fontWeight: '700' }}>END</Text>
                  <Text style={{ color: colors.ink, fontSize: 12, fontWeight: '700' }}>
                    {endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text style={{ color: colors.inkFaint, fontSize: 12, marginTop: 8 }}>Exports everything, all time.</Text>
            )}

            <View style={styles.actionCol}>
              <ExportButton label="Export products" busy={busy === 'export-products'} onPress={() => exportCSV('products')} />
              <ExportButton label="Export sales" busy={busy === 'export-sales'} onPress={() => exportCSV('sales')} />
              <ExportButton label="Export purchases" busy={busy === 'export-purchases'} onPress={() => exportCSV('purchases')} />
            </View>
          </View>
        </View>

        <View>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Restore / migration</Text>
          <Text style={{ color: colors.inkSoft, fontSize: 12, marginBottom: 8 }}>
            Import a CSV backup. Existing records (matched by ID) are left untouched — this only adds what's missing.
            Import products before sales or purchases that reference them.
          </Text>
          <View
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line, borderRadius: radius.card }]}
          >
            <View style={styles.actionCol}>
              <ExportButton
                label="Import products CSV"
                busy={busy === 'import-products'}
                onPress={() => importCSV('products')}
              />
              <ExportButton label="Import sales CSV" busy={busy === 'import-sales'} onPress={() => importCSV('sales')} />
              <ExportButton
                label="Import purchases CSV"
                busy={busy === 'import-purchases'}
                onPress={() => importCSV('purchases')}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <InlineDatePicker
        visible={showStartPicker}
        value={startDate}
        maximumDate={new Date()}
        onChange={setStartDate}
        onClose={() => setShowStartPicker(false)}
      />
      <InlineDatePicker
        visible={showEndPicker}
        value={endDate}
        maximumDate={new Date()}
        onChange={setEndDate}
        onClose={() => setShowEndPicker(false)}
      />
    </SafeAreaView>
  );
}

function ExportButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  const { colors, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={[styles.actionButton, { borderColor: colors.lineStrong, borderRadius: radius.control, opacity: busy ? 0.6 : 1 }]}
    >
      <Text style={{ color: colors.ink, fontWeight: '700', fontSize: 13 }}>{busy ? 'Working…' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
  card: { borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rangeRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  dateChip: { flex: 1, borderWidth: StyleSheet.hairlineWidth, padding: 9, gap: 2 },
  actionCol: { gap: 8, marginTop: 12 },
  actionButton: { borderWidth: StyleSheet.hairlineWidth, paddingVertical: 11, alignItems: 'center' },
});
