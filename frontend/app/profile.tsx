import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  Switch
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

interface UserProfile {
  id: string;
  name: string;
  age: number;
  age_group: 'early_childhood' | 'school_age' | 'teen_adult';
  developmental_level: number;
  sensory_profile: {
    contrast_level: number;
    reduce_motion: boolean;
    large_touch_targets: boolean;
    high_contrast_mode: boolean;
  };
}

const colors = {
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  cardBorder: '#DEE2E6',
  selected: '#90CAF9',
  text: '#2E3440',
  textLight: '#5E6875',
  accent: '#81C784',
  danger: '#F44336'
};

export default function Profile() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedAge, setEditedAge] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadAnalytics();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      const userData = await AsyncStorage.getItem('userProfile');
      if (userData) {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setEditedName(user.name);
        setEditedAge(user.age.toString());
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const loadAnalytics = async () => {
    if (!currentUser) return;
    
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/analytics/user/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const saveProfile = async () => {
    if (!currentUser || !editedName.trim() || !editedAge.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const age = parseInt(editedAge);
    if (isNaN(age) || age < 1 || age > 100) {
      Alert.alert('Error', 'Please enter a valid age (1-100)');
      return;
    }

    const updatedUser = {
      ...currentUser,
      name: editedName.trim(),
      age: age
    };

    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const updateSensoryProfile = async (key: keyof UserProfile['sensory_profile'], value: any) => {
    if (!currentUser) return;

    const updatedUser = {
      ...currentUser,
      sensory_profile: {
        ...currentUser.sensory_profile,
        [key]: value
      }
    };

    try {
      // Update locally
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // Update on server
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/users/${currentUser.id}/sensory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser.sensory_profile),
      });

      if (!response.ok) {
        console.error('Failed to update sensory profile on server');
      }
    } catch (error) {
      console.error('Failed to update sensory profile:', error);
    }
  };

  const createNewProfile = () => {
    Alert.alert(
      'Create New Profile',
      'This will create a new user profile and reset all data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create New',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('userProfile');
              router.replace('/');
            } catch (error) {
              console.error('Failed to create new profile:', error);
            }
          }
        }
      ]
    );
  };

  const getAgeGroupText = (ageGroup: string) => {
    switch (ageGroup) {
      case 'early_childhood':
        return 'Early Childhood (2-6 years)';
      case 'school_age':
        return 'School Age (7-13 years)';
      case 'teen_adult':
        return 'Teen/Adult (14+ years)';
      default:
        return 'Unknown';
    }
  };

  const getDevelopmentalLevelText = (level: number) => {
    switch (level) {
      case 1:
        return 'Beginner';
      case 2:
        return 'Intermediate';
      case 3:
        return 'Advanced';
      default:
        return 'Unknown';
    }
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          onPress={() => isEditing ? saveProfile() : setIsEditing(true)}
          style={styles.editButton}
        >
          <Ionicons 
            name={isEditing ? "checkmark" : "pencil"} 
            size={20} 
            color={colors.accent} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Name:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter name"
                />
              ) : (
                <Text style={styles.value}>{currentUser.name}</Text>
              )}
            </View>
            
            <View style={styles.cardRow}>
              <Text style={styles.label}>Age:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedAge}
                  onChangeText={setEditedAge}
                  placeholder="Enter age"
                  keyboardType="numeric"
                />
              ) : (
                <Text style={styles.value}>{currentUser.age} years</Text>
              )}
            </View>
            
            <View style={styles.cardRow}>
              <Text style={styles.label}>Age Group:</Text>
              <Text style={styles.value}>{getAgeGroupText(currentUser.age_group)}</Text>
            </View>
            
            <View style={styles.cardRow}>
              <Text style={styles.label}>Level:</Text>
              <Text style={styles.value}>{getDevelopmentalLevelText(currentUser.developmental_level)}</Text>
            </View>
          </View>
        </View>

        {/* Sensory Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensory Settings</Text>
          
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Large Touch Targets</Text>
              <Switch
                value={currentUser.sensory_profile.large_touch_targets}
                onValueChange={(value) => updateSensoryProfile('large_touch_targets', value)}
                trackColor={{ false: '#767577', true: colors.accent }}
                thumbColor={currentUser.sensory_profile.large_touch_targets ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.cardRow}>
              <Text style={styles.label}>Reduce Motion</Text>
              <Switch
                value={currentUser.sensory_profile.reduce_motion}
                onValueChange={(value) => updateSensoryProfile('reduce_motion', value)}
                trackColor={{ false: '#767577', true: colors.accent }}
                thumbColor={currentUser.sensory_profile.reduce_motion ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.cardRow}>
              <Text style={styles.label}>High Contrast Mode</Text>
              <Switch
                value={currentUser.sensory_profile.high_contrast_mode}
                onValueChange={(value) => updateSensoryProfile('high_contrast_mode', value)}
                trackColor={{ false: '#767577', true: colors.accent }}
                thumbColor={currentUser.sensory_profile.high_contrast_mode ? '#FFFFFF' : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.cardRow}>
              <Text style={styles.label}>Contrast Level</Text>
              <Text style={styles.value}>{currentUser.sensory_profile.contrast_level.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Usage Statistics */}
        {analytics && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Statistics</Text>
            
            <View style={styles.card}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{analytics.total_communications}</Text>
                  <Text style={styles.statLabel}>Total Communications</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{Math.round(analytics.success_rate)}%</Text>
                  <Text style={styles.statLabel}>Success Rate</Text>
                </View>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{analytics.successful_communications}</Text>
                  <Text style={styles.statLabel}>Successful</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{analytics.most_used_symbols?.length || 0}</Text>
                  <Text style={styles.statLabel}>Favorite Symbols</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.actionButton} onPress={createNewProfile}>
            <Ionicons name="person-add" size={20} color={colors.danger} />
            <Text style={[styles.actionText, { color: colors.danger }]}>Create New Profile</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 16,
    color: colors.textLight,
    flex: 1,
    textAlign: 'right',
  },
  input: {
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flex: 1,
    marginLeft: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 8,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.accent,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});