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
    />
  );
};

// Root layout with providers
export default function RootLayout() {
  console.log('🗂️ Rendering RootLayout');
  return (
    <SafeAreaProvider>
      <AuthProvider>
        {console.log('🗂️ Inside AuthProvider wrapper')}
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