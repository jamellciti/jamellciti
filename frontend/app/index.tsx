import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { user, loading, isParent, isChild } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on user role
        if (isParent) {
          router.replace('/(parent)');
        } else if (isChild) {
          router.replace('/(child)');
        }
      } else {
        // No user logged in, go to auth
        router.replace('/auth');
      }
    }
  }, [user, loading, isParent, isChild]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4A90E2" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});