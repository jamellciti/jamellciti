import React from 'react';
import { Stack, Redirect } from 'expo-router';
import AuthProvider, { useAuth } from '../context/AuthProvider';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Loading component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#00D2FF" />
  </View>
);

// App content with official Expo Router auth guard pattern
const AppContent = () => {
  const { loading, token } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Redirect to login if no token (official pattern)
  if (!token) {
    return <Redirect href="/login" />;
  }

  // User is authenticated - show app content
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="consent-wizard" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="trust" />
      <Stack.Screen name="dev-tiles" />
    </Stack>
  );
};

// Root layout with providers
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});