import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTheme } from '@/hooks/useTheme';
import { verifyPin } from '@/lib/appLock';
import { useAppLock } from '@/lock/AppLockContext';
import { PinPad } from '@/components/PinPad';

const PIN_LENGTH = 4;

export function LockScreen() {
  const { colors } = useTheme();
  const { biometricEnabled, unlock } = useAppLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricBusy, setBiometricBusy] = useState(false);
  const attemptedAutoBiometric = useRef(false);

  async function tryBiometric() {
    setBiometricBusy(true);
    try {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hardware || !enrolled) return;
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Pitstop' });
      if (result.success) unlock();
    } finally {
      setBiometricBusy(false);
    }
  }

  useEffect(() => {
    if (biometricEnabled && !attemptedAutoBiometric.current) {
      attemptedAutoBiometric.current = true;
      tryBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    verifyPin(pin).then((ok) => {
      if (ok) {
        unlock();
        return;
      }
      setError(true);
      Vibration.vibrate(200);
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 400);
    });
  }, [pin]);

  function press(key: string) {
    if (key === '') return;
    if (key === 'back') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    setPin((p) => p + key);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.center}>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Enter PIN</Text>
        <Text style={{ color: error ? colors.danger : colors.inkSoft, fontSize: 13, marginBottom: 24 }}>
          {error ? 'Incorrect PIN' : 'Unlock Pitstop to continue'}
        </Text>

        <PinPad length={PIN_LENGTH} value={pin} error={error} onPress={press} />

        {biometricEnabled ? (
          <Pressable onPress={tryBiometric} disabled={biometricBusy} style={styles.biometricButton} hitSlop={8}>
            <Ionicons name="finger-print-outline" size={20} color={colors.inkSoft} />
            <Text style={{ color: colors.inkSoft, fontSize: 13, fontWeight: '600' }}>Use Face ID / Fingerprint</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  biometricButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, padding: 8 },
});
