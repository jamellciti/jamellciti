import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';

console.log('🔥 debugLogin.tsx loaded at', new Date().toISOString());

export default function DebugLogin() {
  const fakeAuth = () => {
    console.log('🔍 DEBUG: fakeAuth invoked');
    
    // 1️⃣ Set fake token (using same format as our auth system)
    localStorage.setItem('token', 'debug-jwt-token');
    localStorage.setItem('token_exp', String(Date.now() + 86400 * 1000)); // 24 hours
    console.log('🔍 DEBUG: Token set in localStorage');
    
    // 2️⃣ Replace route to dashboard
    console.log('🔍 DEBUG: About to call router.replace(/dashboard)');
    router.replace('/dashboard');
    console.log('🔍 DEBUG: router.replace() called successfully');
  };

  return (
    <View style={styles.container}>
      <Button 
        title="DEBUG LOGIN - TEST ROUTER.REPLACE" 
        onPress={fakeAuth}
        accessibilityLabel="debug-login-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});