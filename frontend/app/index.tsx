import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView,
  Dimensions,
  Alert,
  Vibration
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Types
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

interface Symbol {
  id: string;
  name: string;
  category: string;
  emoji: string;
  description: string;
  difficulty_level: number;
  tts_text: string;
  is_emergency: boolean;
}

// Design system colors - autism-friendly muted palette
const colors = {
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  cardBorder: '#DEE2E6',
  selected: '#90CAF9',
  selectedBorder: '#64B5F6',
  emergency: '#FFE8E8',
  emergencyBorder: '#FFCDD2',
  text: '#2E3440',
  textLight: '#5E6875',
  accent: '#81C784'
};

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

export default function Index() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [emergencySymbols, setEmergencySymbols] = useState<Symbol[]>([]);
  const [selectedSymbols, setSelectedSymbols] = useState<Symbol[]>([]);
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [showEmergencyBar, setShowEmergencyBar] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Categories for navigation - greatly expanded
  const categories = [
    { id: 'all', name: 'All', icon: 'apps' },
    { id: 'basic_needs', name: 'Needs', icon: 'water' },
    { id: 'emotions', name: 'Feelings', icon: 'happy' },
    { id: 'actions', name: 'Actions', icon: 'hand-left' },
    { id: 'food', name: 'Food', icon: 'restaurant' },
    { id: 'family', name: 'Family', icon: 'people' },
    { id: 'social', name: 'Social', icon: 'chatbubbles' },
    { id: 'activities', name: 'Play', icon: 'game-controller' },
    { id: 'school', name: 'School', icon: 'library' },
    { id: 'body_parts', name: 'Body', icon: 'body' },
    { id: 'places', name: 'Places', icon: 'location' },
    { id: 'transport', name: 'Travel', icon: 'car' },
    { id: 'weather', name: 'Weather', icon: 'partly-sunny' },
    { id: 'colors', name: 'Colors', icon: 'color-palette' },
    { id: 'numbers', name: 'Numbers', icon: 'calculator' },
    { id: 'animals', name: 'Animals', icon: 'paw' },
    { id: 'time', name: 'Time', icon: 'time' },
    { id: 'medical', name: 'Health', icon: 'medical' },
    { id: 'technology', name: 'Tech', icon: 'phone-portrait' }
  ];

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check for existing user or create demo user
      let user = await loadUserProfile();
      if (!user) {
        user = await createDemoUser();
      }
      
      if (user) {
        setCurrentUser(user);
        await loadSymbols(user.id);
        await loadEmergencySymbols();
      }
    } catch (error) {
      console.error('Failed to initialize app:', error);
      // Fallback to offline mode with basic symbols
      setSymbols(getOfflineSymbols());
      setEmergencySymbols(getOfflineEmergencySymbols());
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (): Promise<UserProfile | null> => {
    try {
      const userData = await AsyncStorage.getItem('userProfile');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      return null;
    }
  };

  const createDemoUser = async (): Promise<UserProfile | null> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Demo User',
          age: 8
        }),
      });

      if (response.ok) {
        const user = await response.json();
        await AsyncStorage.setItem('userProfile', JSON.stringify(user));
        return user;
      }
    } catch (error) {
      console.error('Failed to create demo user:', error);
    }
    return null;
  };

  const loadSymbols = async (userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/symbols/user/${userId}`);
      if (response.ok) {
        const userSymbols = await response.json();
        setSymbols(userSymbols);
      }
    } catch (error) {
      console.error('Failed to load symbols:', error);
      setSymbols(getOfflineSymbols());
    }
  };

  const loadEmergencySymbols = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/symbols/emergency`);
      if (response.ok) {
        const emergencySymbols = await response.json();
        setEmergencySymbols(emergencySymbols);
      }
    } catch (error) {
      console.error('Failed to load emergency symbols:', error);
      setEmergencySymbols(getOfflineEmergencySymbols());
    }
  };

  // Offline fallback symbols - expanded with more categories
  const getOfflineSymbols = (): Symbol[] => [
    // Emergency
    { id: '1', name: 'Help', category: 'emergency', emoji: '🆘', description: 'I need help', difficulty_level: 1, tts_text: 'I need help!', is_emergency: true },
    { id: '2', name: 'Bathroom', category: 'emergency', emoji: '🚽', description: 'I need to use the bathroom', difficulty_level: 1, tts_text: 'I need to use the bathroom', is_emergency: true },
    { id: '3', name: 'Stop', category: 'emergency', emoji: '🛑', description: 'Stop please', difficulty_level: 1, tts_text: 'Stop please', is_emergency: true },
    
    // Basic needs
    { id: '4', name: 'Water', category: 'basic_needs', emoji: '💧', description: 'I want water', difficulty_level: 1, tts_text: 'I want water', is_emergency: false },
    { id: '5', name: 'Food', category: 'basic_needs', emoji: '🍎', description: 'I am hungry', difficulty_level: 1, tts_text: 'I am hungry', is_emergency: false },
    { id: '6', name: 'Sleep', category: 'basic_needs', emoji: '😴', description: 'I am tired', difficulty_level: 1, tts_text: 'I am tired', is_emergency: false },
    { id: '7', name: 'Quiet', category: 'basic_needs', emoji: '🤫', description: 'I need quiet', difficulty_level: 1, tts_text: 'I need quiet', is_emergency: false },
    
    // Emotions
    { id: '8', name: 'Happy', category: 'emotions', emoji: '😊', description: 'I am happy', difficulty_level: 1, tts_text: 'I am happy', is_emergency: false },
    { id: '9', name: 'Sad', category: 'emotions', emoji: '😢', description: 'I am sad', difficulty_level: 1, tts_text: 'I am sad', is_emergency: false },
    { id: '10', name: 'Mad', category: 'emotions', emoji: '😡', description: 'I am angry', difficulty_level: 1, tts_text: 'I am angry', is_emergency: false },
    { id: '11', name: 'Scared', category: 'emotions', emoji: '😰', description: 'I am scared', difficulty_level: 1, tts_text: 'I am scared', is_emergency: false },
    
    // Actions
    { id: '12', name: 'Yes', category: 'actions', emoji: '✅', description: 'Yes', difficulty_level: 1, tts_text: 'Yes', is_emergency: false },
    { id: '13', name: 'No', category: 'actions', emoji: '❌', description: 'No', difficulty_level: 1, tts_text: 'No', is_emergency: false },
    { id: '14', name: 'Please', category: 'actions', emoji: '🙏', description: 'Please', difficulty_level: 1, tts_text: 'Please', is_emergency: false },
    { id: '15', name: 'Thank You', category: 'actions', emoji: '👍', description: 'Thank you', difficulty_level: 1, tts_text: 'Thank you', is_emergency: false },
    { id: '16', name: 'More', category: 'actions', emoji: '➕', description: 'I want more', difficulty_level: 1, tts_text: 'More please', is_emergency: false },
    { id: '17', name: 'All Done', category: 'actions', emoji: '✔️', description: 'I am finished', difficulty_level: 1, tts_text: 'All done', is_emergency: false },
    
    // Family
    { id: '18', name: 'Mom', category: 'family', emoji: '👩', description: 'Mom', difficulty_level: 1, tts_text: 'Mom', is_emergency: false },
    { id: '19', name: 'Dad', category: 'family', emoji: '👨', description: 'Dad', difficulty_level: 1, tts_text: 'Dad', is_emergency: false },
    { id: '20', name: 'Family', category: 'family', emoji: '👨‍👩‍👧‍👦', description: 'Family', difficulty_level: 1, tts_text: 'Family', is_emergency: false },
    
    // Social
    { id: '21', name: 'Hi', category: 'social', emoji: '👋', description: 'Hello', difficulty_level: 1, tts_text: 'Hi', is_emergency: false },
    { id: '22', name: 'Bye', category: 'social', emoji: '👋', description: 'Goodbye', difficulty_level: 1, tts_text: 'Bye', is_emergency: false },
    { id: '23', name: 'Share', category: 'social', emoji: '🤝', description: 'I want to share', difficulty_level: 1, tts_text: 'I want to share', is_emergency: false },
    
    // Activities
    { id: '24', name: 'Play', category: 'activities', emoji: '🎯', description: 'I want to play', difficulty_level: 1, tts_text: 'I want to play', is_emergency: false },
    { id: '25', name: 'Book', category: 'activities', emoji: '📖', description: 'I want to read', difficulty_level: 1, tts_text: 'I want to read', is_emergency: false },
    { id: '26', name: 'TV', category: 'activities', emoji: '📺', description: 'I want to watch TV', difficulty_level: 1, tts_text: 'I want to watch TV', is_emergency: false },
    
    // Food
    { id: '27', name: 'Apple', category: 'food', emoji: '🍎', description: 'Apple', difficulty_level: 1, tts_text: 'Apple', is_emergency: false },
    { id: '28', name: 'Milk', category: 'food', emoji: '🥛', description: 'Milk', difficulty_level: 1, tts_text: 'Milk', is_emergency: false },
    { id: '29', name: 'Cookie', category: 'food', emoji: '🍪', description: 'Cookie', difficulty_level: 1, tts_text: 'Cookie', is_emergency: false },
    
    // Places
    { id: '30', name: 'Home', category: 'places', emoji: '🏠', description: 'Home', difficulty_level: 1, tts_text: 'Home', is_emergency: false },
    { id: '31', name: 'Park', category: 'places', emoji: '🌳', description: 'Park', difficulty_level: 1, tts_text: 'Park', is_emergency: false },
    
    // Animals
    { id: '32', name: 'Dog', category: 'animals', emoji: '🐕', description: 'Dog', difficulty_level: 1, tts_text: 'Dog', is_emergency: false },
    { id: '33', name: 'Cat', category: 'animals', emoji: '🐱', description: 'Cat', difficulty_level: 1, tts_text: 'Cat', is_emergency: false },
    
    // Colors
    { id: '34', name: 'Red', category: 'colors', emoji: '🔴', description: 'Red color', difficulty_level: 1, tts_text: 'Red', is_emergency: false },
    { id: '35', name: 'Blue', category: 'colors', emoji: '🔵', description: 'Blue color', difficulty_level: 1, tts_text: 'Blue', is_emergency: false },
  ];

  const getOfflineEmergencySymbols = (): Symbol[] => [
    { id: 'e1', name: 'Help', category: 'emergency', emoji: '🆘', description: 'I need help', difficulty_level: 1, tts_text: 'I need help!', is_emergency: true },
    { id: 'e2', name: 'Bathroom', category: 'emergency', emoji: '🚽', description: 'I need to use the bathroom', difficulty_level: 1, tts_text: 'I need to use the bathroom', is_emergency: true },
    { id: 'e3', name: 'Pain', category: 'emergency', emoji: '😣', description: 'I am hurt', difficulty_level: 1, tts_text: 'I am hurt', is_emergency: true }
  ];

  const handleSymbolPress = async (symbol: Symbol) => {
    const newSelection = [...selectedSymbols, symbol];
    setSelectedSymbols(newSelection);
    
    // Haptic feedback for touch confirmation
    Vibration.vibrate(50);
    
    // Immediate TTS feedback
    await Speech.speak(symbol.tts_text, {
      rate: 0.8,
      pitch: 1.0,
    });

    // Log communication event
    if (currentUser) {
      logCommunicationEvent(newSelection);
    }
  };

  const handleEmergencyPress = async (symbol: Symbol) => {
    setSelectedSymbols([symbol]);
    
    // Immediate urgent TTS
    await Speech.speak(symbol.tts_text, {
      rate: 0.9,
      pitch: 1.1,
      volume: 1.0
    });

    // Log emergency communication
    if (currentUser) {
      logCommunicationEvent([symbol], 'emergency');
    }

    setShowEmergencyBar(false);
  };

  const logCommunicationEvent = async (symbols: Symbol[], context: string = 'general') => {
    if (!currentUser) return;

    const textOutput = symbols.map(s => s.name).join(' ');
    
    try {
      await fetch(`${BACKEND_URL}/api/communication`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
          symbols_used: symbols.map(s => s.id),
          text_output: textOutput,
          success: true,
          response_time_ms: 1000,
          assistance_level: 'independent',
          context: context
        }),
      });
    } catch (error) {
      console.error('Failed to log communication event:', error);
    }
  };

  const speakSelectedSymbols = async () => {
    if (selectedSymbols.length === 0) return;
    
    const text = selectedSymbols.map(s => s.tts_text).join('. ');
    await Speech.speak(text, {
      rate: 0.8,
      pitch: 1.0,
    });
  };

  const clearSelection = () => {
    setSelectedSymbols([]);
  };

  const getGridColumns = () => {
    if (!currentUser) return 3;
    
    switch (currentUser.age_group) {
      case 'early_childhood':
        return 3; // 2x3 grid
      case 'school_age':
        return 4; // 4x4 grid
      case 'teen_adult':
        return 5; // 5x5 or 6x6 grid
      default:
        return 3;
    }
  };

  const getTouchTargetSize = () => {
    if (!currentUser) return 72;
    
    return currentUser.sensory_profile.large_touch_targets ? 84 : 72;
  };

  const filteredSymbols = currentCategory === 'all' 
    ? symbols.filter(s => !s.is_emergency)
    : symbols.filter(s => s.category === currentCategory && !s.is_emergency);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading AutismSpeak Pro...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      
      {/* Emergency Bar */}
      {showEmergencyBar && (
        <View style={styles.emergencyBar}>
          <Text style={styles.emergencyTitle}>Emergency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {emergencySymbols.map((symbol) => (
              <TouchableOpacity
                key={symbol.id}
                style={styles.emergencyButton}
                onPress={() => handleEmergencyPress(symbol)}
              >
                <Text style={styles.emergencyEmoji}>{symbol.emoji}</Text>
                <Text style={styles.emergencyText}>{symbol.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.emergencyToggle}
          onPress={() => setShowEmergencyBar(!showEmergencyBar)}
        >
          <Ionicons name="alert-circle" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>AutismSpeak Pro</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle" size={20} color={colors.text} />
          </TouchableOpacity>
          {currentUser && (
            <Text style={styles.userName}>{currentUser.name}</Text>
          )}
        </View>
      </View>

      {/* Selected Symbols Bar */}
      {selectedSymbols.length > 0 && (
        <View style={styles.selectedBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedScroll}>
            {selectedSymbols.map((symbol, index) => (
              <View key={`${symbol.id}-${index}`} style={styles.selectedSymbol}>
                <Text style={styles.selectedEmoji}>{symbol.emoji}</Text>
                <Text style={styles.selectedText}>{symbol.name}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.selectedActions}>
            <TouchableOpacity style={styles.speakButton} onPress={speakSelectedSymbols}>
              <Ionicons name="volume-high" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={clearSelection}>
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Category Navigation */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryNav}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryButton,
              currentCategory === category.id && styles.categoryButtonActive
            ]}
            onPress={() => setCurrentCategory(category.id)}
          >
            <Ionicons 
              name={category.icon as any} 
              size={20} 
              color={currentCategory === category.id ? colors.selected : colors.text} 
            />
            <Text style={[
              styles.categoryText,
              currentCategory === category.id && styles.categoryTextActive
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Symbol Grid */}
      <ScrollView style={styles.symbolGrid} showsVerticalScrollIndicator={false}>
        <View style={[styles.grid, { 
          columnGap: 12,
          rowGap: 12
        }]}>
          {filteredSymbols.map((symbol) => (
            <TouchableOpacity
              key={symbol.id}
              style={[styles.symbolTile, {
                width: (width - 48) / getGridColumns() - 8,
                height: getTouchTargetSize()
              }]}
              onPress={() => handleSymbolPress(symbol)}
            >
              <Text style={styles.symbolEmoji}>{symbol.emoji}</Text>
              <Text style={styles.symbolText}>{symbol.name}</Text>
            </TouchableOpacity>
          ))}
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
  emergencyBar: {
    backgroundColor: colors.emergency,
    borderBottomWidth: 2,
    borderBottomColor: colors.emergencyBorder,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emergencyButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.emergencyBorder,
    minWidth: 80,
  },
  emergencyEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 12,
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
  emergencyToggle: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileButton: {
    padding: 8,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    color: colors.textLight,
  },
  selectedBar: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedScroll: {
    flex: 1,
  },
  selectedSymbol: {
    backgroundColor: colors.selected,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  selectedEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  selectedText: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '500',
  },
  selectedActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  speakButton: {
    backgroundColor: colors.accent,
    borderRadius: 20,
    padding: 10,
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: '#F44336',
    borderRadius: 20,
    padding: 10,
  },
  categoryNav: {
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  categoryButtonActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.selected,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.selected,
    fontWeight: '600',
  },
  symbolGrid: {
    flex: 1,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  symbolTile: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  symbolEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  symbolText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
});