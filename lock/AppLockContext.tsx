import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { hasPinSet, isBiometricEnabled } from '@/lib/appLock';

type Phase = 'checking' | 'locked' | 'unlocked';

interface AppLockContextValue {
  locked: boolean;
  pinEnabled: boolean;
  biometricEnabled: boolean;
  unlock: () => void;
  /** Re-reads the PIN/biometric flags from storage without forcing a (re)lock — call after changing them in Settings. */
  refresh: () => Promise<void>;
}

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('checking');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const appState = useRef(AppState.currentState);

  async function refreshFlags(): Promise<boolean> {
    const [pin, biometric] = await Promise.all([hasPinSet(), isBiometricEnabled()]);
    setPinEnabled(pin);
    setBiometricEnabledState(biometric);
    return pin;
  }

  useEffect(() => {
    refreshFlags().then((pin) => setPhase(pin ? 'locked' : 'unlocked'));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current === 'active' && next !== 'active' && pinEnabled) {
        setPhase('locked');
      }
      appState.current = next;
    });
    return () => subscription.remove();
  }, [pinEnabled]);

  const value = useMemo<AppLockContextValue>(
    () => ({
      locked: phase === 'locked',
      pinEnabled,
      biometricEnabled,
      unlock: () => setPhase('unlocked'),
      refresh: async () => {
        await refreshFlags();
      },
    }),
    [phase, pinEnabled, biometricEnabled]
  );

  // Skip rendering for one tick while the stored PIN/biometric flags load, to
  // avoid a flash of the unlocked app before we know whether to lock it.
  if (phase === 'checking') return null;

  return <AppLockContext.Provider value={value}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return ctx;
}
