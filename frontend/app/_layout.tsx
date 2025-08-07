import React from 'react';
import { Stack } from 'expo-router';
import AuthProvider, { useAuth } from '../context/AuthProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import ErrorBoundary from '../components/ErrorBoundary';

// Root layout with providers
export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <InnerLayout />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

// Loading screen component  
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#00CED1" />
  </View>
);

// Inner layout with auth-aware routing
function InnerLayout() {
  const { loading, token } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      {/* Public screens - only when NOT authenticated */}
      {!token && (
        <>
          <Stack.Screen 
            name="login" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="register" 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="index" 
            options={{ headerShown: false }} 
          />
        </>
      )}

      {/* Protected screens - only when authenticated */}
      {token && (
        <>
          <Stack.Screen 
            name="dashboard" 
            options={{ 
              title: 'Dashboard',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="trust" 
            options={{ 
              title: 'Trust & Privacy',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="settings" 
            options={{ 
              title: 'Settings',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="consent-wizard" 
            options={{ 
              title: 'Privacy Settings',
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="dev-tiles" 
            options={{ 
              title: 'Dev Tiles',
              headerShown: false 
            }} 
          />
        </>
      )}
    </Stack>
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