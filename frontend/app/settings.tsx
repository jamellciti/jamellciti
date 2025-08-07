import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface UserInfo {
  id: string;
  email: string;
  consent_level: string;
  subscription_tier: string;
  created_at: string;
}

interface SubscriptionInfo {
  tier: string;
  active: boolean;
  current_period_end: string | null;
}

export default function Settings() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      const userInfoStr = await AsyncStorage.getItem('user_info');
      if (userInfoStr) {
        const user = JSON.parse(userInfoStr);
        setUserInfo(user);
        
        // Fetch latest subscription info
        await fetchSubscriptionInfo();
      } else {
        router.replace('/login');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubscriptionInfo = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/v1/subscription/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    }
  };

  const handleConsentLevelChange = async (newLevel: string) => {
    setIsUpdating(true);
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/v1/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ level: newLevel }),
      });

      if (response.ok) {
        // Update local user info
        const updatedUser = { ...userInfo, consent_level: newLevel };
        setUserInfo(updatedUser);
        await AsyncStorage.setItem('user_info', JSON.stringify(updatedUser));
        
        Alert.alert('Success', `Privacy level updated to ${newLevel.toUpperCase()}`);
      } else {
        const data = await response.json();
        Alert.alert('Error', data.detail || 'Failed to update privacy level');
      }
    } catch (error) {
      console.error('Error updating consent:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['auth_token', 'user_info']);
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleUpgradeSubscription = () => {
    Alert.alert(
      'Upgrade Subscription',
      'Choose your subscription tier:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'PROTECT ($9.99/month)',
          onPress: () => Alert.alert('Coming Soon', 'Subscription upgrade will be available soon!'),
        },
        {
          text: 'PROTECT+ ($19.99/month)',
          onPress: () => Alert.alert('Coming Soon', 'Subscription upgrade will be available soon!'),
        },
      ]
    );
  };

  const getConsentDescription = (level: string) => {
    const descriptions = {
      personal: 'Personal use only - data stays private',
      network: 'Share with Aura Vision network for community safety',
      civic: 'Full civic participation and law enforcement integration',
      none: 'Not configured - please set your privacy preference',
    };
    return descriptions[level as keyof typeof descriptions] || 'Unknown';
  };

  const getSubscriptionDescription = (tier: string) => {
    const descriptions = {
      aura_free: '7-day clip history, basic features',
      protect: '30-day clip history, extended features',
      protect_plus: '1-year clip history, live streaming, all features',
    };
    return descriptions[tier as keyof typeof descriptions] || 'Unknown plan';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D2FF" />
          <Text style={styles.loadingText}>Loading Settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <MaterialIcons name="account-circle" size={48} color="#00D2FF" />
            <View style={styles.profileInfo}>
              <Text style={styles.profileEmail}>{userInfo?.email}</Text>
              <Text style={styles.profileDate}>
                Member since {new Date(userInfo?.created_at || '').toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Consent</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <MaterialIcons name="privacy-tip" size={24} color="#00D2FF" />
              <Text style={styles.settingTitle}>Privacy Level</Text>
            </View>
            <Text style={styles.settingDescription}>
              Current: {userInfo?.consent_level?.toUpperCase() || 'NOT SET'}
            </Text>
            <Text style={styles.settingSubtext}>
              {getConsentDescription(userInfo?.consent_level || 'none')}
            </Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/consent-wizard')}
              disabled={isUpdating}
            >
              <MaterialIcons name="edit" size={20} color="#00D2FF" />
              <Text style={styles.actionButtonText}>Change Privacy Level</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Subscription Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <MaterialIcons name="card-membership" size={24} color="#FFA726" />
              <Text style={styles.settingTitle}>Current Plan</Text>
            </View>
            <Text style={styles.settingDescription}>
              {subscriptionInfo?.tier?.replace('_', ' ').toUpperCase() || 'AURA FREE'}
            </Text>
            <Text style={styles.settingSubtext}>
              {getSubscriptionDescription(subscriptionInfo?.tier || 'aura_free')}
            </Text>
            
            {subscriptionInfo?.tier === 'aura_free' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.upgradeButton]}
                onPress={handleUpgradeSubscription}
              >
                <MaterialIcons name="upgrade" size={20} color="white" />
                <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="video-library" size={24} color="#888888" />
            <View style={styles.settingContent}>
              <Text style={styles.settingItemTitle}>Clip History</Text>
              <Text style={styles.settingItemSubtitle}>
                {subscriptionInfo?.tier === 'aura_free' ? '7 days' : 
                 subscriptionInfo?.tier === 'protect' ? '30 days' : '1 year'} available
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="cloud-sync" size={24} color="#888888" />
            <View style={styles.settingContent}>
              <Text style={styles.settingItemTitle}>Data Export</Text>
              <Text style={styles.settingItemSubtitle}>Download your data</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* App Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="notifications" size={24} color="#888888" />
            <View style={styles.settingContent}>
              <Text style={styles.settingItemTitle}>Notifications</Text>
              <Text style={styles.settingItemSubtitle}>Manage alerts and updates</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#333333', true: '#00D2FF' }}
              thumbColor="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="security" size={24} color="#888888" />
            <View style={styles.settingContent}>
              <Text style={styles.settingItemTitle}>Security</Text>
              <Text style={styles.settingItemSubtitle}>Biometric unlock, PIN settings</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="info" size={24} color="#888888" />
            <View style={styles.settingContent}>
              <Text style={styles.settingItemTitle}>Version</Text>
              <Text style={styles.settingItemSubtitle}>Aura Vision 1.0.0</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <MaterialIcons name="description" size={24} color="#888888" />
            <View style={styles.settingContent}>
              <Text style={styles.settingItemTitle}>Privacy Policy</Text>
              <Text style={styles.settingItemSubtitle}>How we protect your data</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#FF6B6B" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  profileInfo: {
    flex: 1,
  },
  profileEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileDate: {
    fontSize: 14,
    color: '#888888',
  },
  settingCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingDescription: {
    fontSize: 16,
    color: '#00D2FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#00D2FF',
  },
  actionButtonText: {
    color: '#00D2FF',
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#00D2FF',
    borderColor: '#00D2FF',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  settingItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  settingContent: {
    flex: 1,
  },
  settingItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  settingItemSubtitle: {
    fontSize: 14,
    color: '#888888',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  logoutButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
});