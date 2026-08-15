import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { setPin as savePin } from '@/lib/appLock';
import { PinPad } from '@/components/PinPad';

const PIN_LENGTH = 4;

interface SetPinModalProps {
  visible: boolean;
  onCancel: () => void;
  onDone: () => void;
}

export function SetPinModal({ visible, onCancel, onDone }: SetPinModalProps) {
  const { colors, radius, spacing } = useTheme();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('enter');
      setFirstPin('');
      setValue('');
      setError(false);
    }
  }, [visible]);

  function press(key: string) {
    if (key === '') return;
    if (key === 'back') {
      setValue((v) => v.slice(0, -1));
      return;
    }
    if (value.length >= PIN_LENGTH) return;
    const next = value + key;
    setValue(next);

    if (next.length !== PIN_LENGTH) return;

    if (step === 'enter') {
      setFirstPin(next);
      setStep('confirm');
      setValue('');
      return;
    }

    if (next === firstPin) {
      savePin(next).then(onDone);
      return;
    }

    setError(true);
    setTimeout(() => {
      setStep('enter');
      setFirstPin('');
      setValue('');
      setError(false);
    }, 500);
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.card, padding: spacing.lg }]}>
          <Text style={[styles.title, { color: colors.ink }]}>{step === 'enter' ? 'Set a PIN' : 'Confirm PIN'}</Text>
          <Text style={{ color: error ? colors.danger : colors.inkSoft, fontSize: 12, marginBottom: 20 }}>
            {error ? "PINs didn't match — try again" : step === 'enter' ? 'Used to unlock the app' : 'Enter it once more'}
          </Text>

          <PinPad length={PIN_LENGTH} value={value} error={error} onPress={press} />

          <Pressable
            onPress={onCancel}
            style={[styles.cancelButton, { borderColor: colors.lineStrong, borderRadius: radius.control }]}
          >
            <Text style={{ color: colors.ink, fontWeight: '700' }}>Cancel</Text>
          </Pressable>
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
  card: { width: '100%', maxWidth: 360, alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cancelButton: { width: '100%', borderWidth: StyleSheet.hairlineWidth, paddingVertical: 11, alignItems: 'center', marginTop: 16 },
});
