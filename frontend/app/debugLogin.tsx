import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function DebugLogin() {
  const fakeAuth = () => {
    console.log('🔍 DEBUG: fakeAuth invoked');
    
    // 1️⃣ Set fake token
    localStorage.setItem('token', 'debug-token');
    console.log('🔍 DEBUG: Token set');
    
    // 2️⃣ Replace route
    router.replace('/dashboard');
    console.log('🔍 DEBUG: Called router.replace');
  };

  return (
    <View style={styles.container}>
      <Button 
        title="DEBUG LOGIN" 
        onPress={fakeAuth}  // correct prop is onPress
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