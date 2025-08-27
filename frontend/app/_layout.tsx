import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            title: 'Family Tasks'
          }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ 
            headerShown: false,
            title: 'Authentication'
          }} 
        />
        <Stack.Screen 
          name="(parent)" 
          options={{ 
            headerShown: false,
            title: 'Parent Dashboard'
          }} 
        />
        <Stack.Screen 
          name="(child)" 
          options={{ 
            headerShown: false,
            title: 'Child Dashboard'
          }} 
        />
      </Stack>
    </AuthProvider>
  );
}