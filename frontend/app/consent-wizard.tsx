import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

type ConsentLevel = 'personal' | 'network' | 'civic';

interface ConsentOption {
  level: ConsentLevel;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  features: string[];
  privacy: string;
}

const consentOptions: ConsentOption[] = [
  {
    level: 'personal',
    title: 'Personal Only',
    description: 'Keep your data private and use basic features',
    icon: 'person',
    features: [
      'Personal dashcam recording',
      'Basic incident detection',
      '7-day clip history',
      'Local data storage only',
    ],
    privacy: 'Your data stays on your device. No sharing with authorities or other users.',
  },
  {
    level: 'network',
    title: 'Network Sharing',
    description: 'Share safety data with other Aura Vision users',
    icon: 'people',
    features: [
      'All Personal features',
      'Anonymous safety alerts',
      'Community hazard warnings',
      '30-day clip history',
      'Network-wide incident mapping',
    ],
    privacy: 'Anonymized safety data shared within the Aura Vision network for community protection.',
  },
  {
    level: 'civic',
    title: 'Civic Assist',
    description: 'Full civic participation and enforcement support',
    icon: 'account-balance',
    features: [
      'All Network features',
      'Traffic violation reporting',
      'Law enforcement integration',
      'Infrastructure issue reporting',
      'CPRA-compliant data export',
      'Full civic assistance workflows',
    ],
    privacy: 'Data may be shared with law enforcement and civic authorities when violations are detected. Full transparency and export controls available.',
  },
];

export default function ConsentWizard() {
  const [selectedLevel, setSelectedLevel] = useState<ConsentLevel | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSelectLevel = (level: ConsentLevel) => {
    setSelectedLevel(level);
  };

  const handleContinue = async () => {
    if (!selectedLevel) {
      Alert.alert('Selection Required', 'Please choose a privacy level to continue.');
      return;
    }

    setIsLoading(true);

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Error', 'Authentication required. Please login again.');
        router.replace('/login');
        return;
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/v1/consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ level: selectedLevel }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update user info in storage
        const userInfoStr = await AsyncStorage.getItem('user_info');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          userInfo.consent_level = selectedLevel;
          await AsyncStorage.setItem('user_info', JSON.stringify(userInfo));
        }

        Alert.alert(
          'Privacy Level Set',
          `You have selected ${selectedLevel.toUpperCase()} privacy level. You can change this anytime in Settings.`,
          [
            {
              text: 'Continue',
              onPress: () => router.replace('/dashboard'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.detail || 'Failed to set privacy level');
      }
    } catch (error) {
      console.error('Consent setting error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="privacy-tip" size={48} color="#00D2FF" />
            <Text style={styles.title}>Privacy First</Text>
            <Text style={styles.subtitle}>
              Choose how you want to use Aura Vision. You can change this anytime.
            </Text>
          </View>

          {/* Consent Options */}
          <View style={styles.optionsContainer}>
            {consentOptions.map((option) => (
              <TouchableOpacity
                key={option.level}
                style={[
                  styles.optionCard,
                  selectedLevel === option.level && styles.selectedCard,
                ]}
                onPress={() => handleSelectLevel(option.level)}
              >
                <View style={styles.optionHeader}>
                  <MaterialIcons 
                    name={option.icon} 
                    size={24} 
                    color={selectedLevel === option.level ? '#00D2FF' : '#888888'}
                  />
                  <Text style={[
                    styles.optionTitle,
                    selectedLevel === option.level && styles.selectedText
                  ]}>
                    {option.title}
                  </Text>
                  {selectedLevel === option.level && (
                    <MaterialIcons name="check-circle" size={24} color="#00D2FF" />
                  )}
                </View>
                
                <Text style={styles.optionDescription}>{option.description}</Text>
                
                <View style={styles.featuresList}>
                  {option.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <MaterialIcons name="check" size={16} color="#4CAF50" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={styles.privacyNote}>
                  <MaterialIcons name="info" size={16} color="#FFA726" />
                  <Text style={styles.privacyText}>{option.privacy}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              (!selectedLevel || isLoading) && styles.disabledButton,
            ]}
            onPress={handleContinue}
            disabled={!selectedLevel || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔒 Your privacy choice is encrypted and can be changed anytime
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  optionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333333',
  },
  selectedCard: {
    borderColor: '#00D2FF',
    backgroundColor: '#0D1B2A',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  selectedText: {
    color: '#00D2FF',
  },
  optionDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    gap: 8,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#2A1F0D',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFA726',
  },
  privacyText: {
    fontSize: 12,
    color: '#FFA726',
    flex: 1,
    lineHeight: 16,
  },
  continueButton: {
    backgroundColor: '#00D2FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#004C66',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#666666',
    fontSize: 12,
    textAlign: 'center',
  },
});