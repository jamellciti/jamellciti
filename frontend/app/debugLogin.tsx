import { router } from 'expo-router';
import { useState } from 'react';
import { Button, View } from 'react-native';

export default function DebugLogin() {
  const [clicked, setClicked] = useState(false);

  const fakeAuth = () => {
    localStorage.setItem('token', 'debug'); // stand-in JWT
    setClicked(true);
    router.replace('/dashboard');
  };

  return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      <Button 
        title={clicked ? 'Clicked' : 'Debug Login'} 
        onPress={fakeAuth}
      />
    </View>
  );
}