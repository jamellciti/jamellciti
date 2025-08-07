import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';

console.log('🔥 debugLogin.tsx loaded at', new Date().toISOString());

export default function DebugLogin() {
  return (
    <View style={styles.container}>
      <Pressable onPress={() => console.log('👆 Pressable works!')}>
        <Text style={styles.text}>PRESS ME</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: 18,
    color: 'blue',
    padding: 20,
    backgroundColor: 'lightgray',
    borderRadius: 5
  }
});