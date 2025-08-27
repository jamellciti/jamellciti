import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function ParentRewards() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.comingSoon}>
          <MaterialIcons name="card-giftcard" size={64} color="#4A90E2" />
          <Text style={styles.title}>Rewards & Points</Text>
          <Text style={styles.subtitle}>
            Create custom rewards, set point values, and manage your children's reward redemptions.
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
    backgroundColor: '#f8f9fa',
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
    color: '#4A90E2',
    fontWeight: '600',
    marginTop: 24,
  },
});