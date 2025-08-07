import { router } from 'expo-router';
import { useState } from 'react';
import { Button, View } from 'react-native';

export default function DebugLogin() {
  const [clicked, setClicked] = useState(false);

  const fakeAuth = () => {
    // Use the same token storage format as our auth system
    localStorage.setItem('token', 'debug-jwt-token');
    localStorage.setItem('token_exp', String(Date.now() + 86400 * 1000)); // 24 hours
    
    setClicked(true);
    console.log('🔍 DEBUG: Fake token set, calling router.replace(/dashboard)');
    router.replace('/dashboard');
  };

  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Button 
        title={clicked ? 'Clicked - Navigating...' : 'Debug Login'} 
        onPress={fakeAuth}
      />
    </View>
  );
}