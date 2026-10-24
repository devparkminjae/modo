import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { Redirect } from 'expo-router';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <AuthProvider><RootLayoutNav /></AuthProvider>;
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 1100;
  const phonePreview = Platform.OS === 'web' && width > 440;
  const frameScale = Math.max(0, Math.min(1, (height - 40) / 844, (width - 48) / 390));
  const frameWidth = 390 * frameScale;
  const frameHeight = 844 * frameScale;

  if (!loading && !user) return <Redirect href="/auth" />;
  if (loading) return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={[styles.root, phonePreview && styles.phonePreviewRoot, desktop && styles.desktopRoot, { minHeight: height }]}>
        {desktop && (
          <View style={styles.brandPanel}>
            <View style={styles.wordmarkRow}>
              <Text style={styles.wordmark}>modo</Text>
              <View style={styles.brandDot} />
            </View>
            <Text style={styles.brandLine}>친구와 나누는{ '\n' }가벼운 대화</Text>
          </View>
        )}
        <View
          style={phonePreview ? [styles.phoneFrameStage, { width: frameWidth, height: frameHeight }] : styles.mobileWindow}>
          <View
            style={[
              styles.appWindow,
              phonePreview ? styles.fixedPhoneFrame : styles.mobileWindow,
              phonePreview && { transform: [{ scale: frameScale }] },
            ]}>
            <Stack screenOptions={{ contentStyle: { backgroundColor: '#FFFFFF', paddingTop: Platform.OS === 'web' ? 12 : 0 } }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="auth" options={{ headerShown: false }} />
              <Stack.Screen name="conversation/[id]" options={{ title: '대화' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </View>
        </View>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  desktopRoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 88,
    paddingHorizontal: 40,
    backgroundColor: '#F5F6F4',
  },
  phonePreviewRoot: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F4',
  },
  phoneFrameStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandPanel: {
    width: 236,
    alignItems: 'flex-start',
  },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center' },
  wordmark: {
    color: '#1A1D1B',
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -2.4,
  },
  brandDot: {
    width: 8,
    height: 8,
    marginTop: 20,
    marginLeft: 4,
    borderRadius: 4,
    backgroundColor: '#FEE500',
  },
  brandLine: {
    marginTop: 18,
    color: '#757C78',
    fontSize: 16,
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  appWindow: {
    width: '100%',
    flexShrink: 0,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderColor: '#E1E4E1',
    borderWidth: 1,
    borderRadius: 22,
    shadowColor: '#25352E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
  },
  fixedPhoneFrame: {
    width: 390,
    height: 844,
  },
  mobileWindow: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
    borderWidth: 0,
    borderRadius: 0,
    shadowOpacity: 0,
  },
});
