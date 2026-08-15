import { Modal, Platform, Pressable, StyleSheet, Text } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';

interface InlineDatePickerProps {
  visible: boolean;
  value: Date;
  maximumDate: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

/** Native date picker: modal spinner on iOS, native dialog on Android. Used by Reports and Settings. */
export function InlineDatePicker({ visible, value, maximumDate, onChange, onClose }: InlineDatePickerProps) {
  const { colors, radius } = useTheme();
  if (!visible) return null;

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === 'android') {
      onClose();
    }
    if (date) onChange(date);
  }

  if (Platform.OS === 'ios') {
    return (
      <Modal transparent animationType="fade" onRequestClose={onClose}>
        <Pressable style={styles.pickerOverlay} onPress={onClose}>
          <Pressable style={[styles.pickerSheet, { backgroundColor: colors.surface, borderRadius: radius.card }]}>
            <DateTimePicker value={value} mode="date" display="spinner" maximumDate={maximumDate} onChange={handleChange} />
            <Pressable
              onPress={onClose}
              style={[styles.doneButton, { backgroundColor: colors.ink, borderRadius: radius.control }]}
            >
              <Text style={{ color: colors.bg, fontWeight: '700' }}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return <DateTimePicker value={value} mode="date" display="default" maximumDate={maximumDate} onChange={handleChange} />;
}

const styles = StyleSheet.create({
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet: { padding: 16, alignItems: 'stretch' },
  doneButton: { paddingVertical: 12, alignItems: 'center', marginTop: 8 },
});
