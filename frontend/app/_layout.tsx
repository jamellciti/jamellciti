import React from 'react';
import { Stack, Redirect } from 'expo-router';
import AuthProvider, { useAuth } from '../context/AuthProvider';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';
// STEP 6 TEST: Import login screen directly
import LoginScreen from './login';

// Loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#00CED1" />
  </View>
);

// STEP 6: Test direct screen render - bypass all routing and context
export default function RootLayout() {
  console.log('🗂️ STEP 6 TEST: Rendering direct LoginScreen');
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <LoginScreen />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

// Original implementation commented out for testing:
/*
// App content with official Expo Router auth guard pattern
const AppContent = () => {
  const { loading, token } = useAuth();

  console.log('🚦 Guard – loading:', loading, 'token:', token);

  // TEMPORARY: Bypass the guard to test if login screen works
  console.log('🚦 BYPASSING GUARD - Force showing Stack');
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    />
  );
};

// Root layout with providers
export default function RootLayoutOriginal() {
  console.log('🗂️ Rendering RootLayout');
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          {console.log('🗂️ Inside AuthProvider wrapper')}
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
*/

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});