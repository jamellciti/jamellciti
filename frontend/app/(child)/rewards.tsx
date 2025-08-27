import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function ChildRewards() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.comingSoon}>
          <MaterialIcons name="stars" size={64} color="#FF6B6B" />
          <Text style={styles.title}>My Rewards</Text>
          <Text style={styles.subtitle}>
            See your points balance and redeem awesome rewards set up by your parents!
          </Text>
          <Text style={styles.comingSoonText}>Coming Soon!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5f5',
  },
  scrollView: {
    flex: 1,
  },
  comingSoon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  comingSoonText: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: '600',
    marginTop: 24,
  },
});