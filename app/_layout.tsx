import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@/theme/ThemeContext';
import { useTheme } from '@/hooks/useTheme';
import { useDatabaseReady } from '@/hooks/useDatabaseReady';
import { AppLockProvider, useAppLock } from '@/lock/AppLockContext';
import { LockScreen } from '@/components/LockScreen';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppLockProvider>
        <RootLayoutInner />
      </AppLockProvider>
    </ThemeProvider>
  );
}

function RootLayoutInner() {
  const { colors, scheme } = useTheme();
  const { ready, error } = useDatabaseReady();
  const { locked } = useAppLock();

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '700', marginBottom: 6 }}>
          Couldn't start the database
        </Text>
        <Text style={{ color: colors.inkSoft, fontSize: 13, textAlign: 'center' }}>
          {error.message}
        </Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.sale} />
      </View>
    );
  }

  if (locked) {
    return (
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <LockScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
