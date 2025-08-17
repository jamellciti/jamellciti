import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const colors = {
  background: '#F8F9FA',
  cardBackground: '#FFFFFF',
  cardBorder: '#DEE2E6',
  selected: '#90CAF9',
  text: '#2E3440',
  textLight: '#5E6875',
  accent: '#81C784',
  emergency: '#FFE8E8',
};

export default function Help() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>How to Use AutismSpeak Pro</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Welcome to AutismSpeak Pro</Text>
          <Text style={styles.description}>
            AutismSpeak Pro is an Augmentative and Alternative Communication (AAC) app 
            designed specifically for autistic individuals. It helps you communicate 
            using symbols, pictures, and text-to-speech technology.
          </Text>
        </View>

        {/* Basic Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Basic Usage</Text>
          
          <View style={styles.helpCard}>
            <View style={styles.helpItem}>
              <Text style={styles.stepNumber}>1</Text>
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Tap Symbols to Communicate</Text>
                <Text style={styles.helpText}>
                  Tap any symbol to hear it spoken aloud immediately. The symbol will also 
                  be added to your sentence at the top of the screen.
                </Text>
              </View>
            </View>
            
            <View style={styles.helpItem}>
              <Text style={styles.stepNumber}>2</Text>
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Build Sentences</Text>
                <Text style={styles.helpText}>
                  Combine multiple symbols to create sentences. Tap the speak button (🔊) 
                  to hear your complete sentence read aloud.
                </Text>
              </View>
            </View>
            
            <View style={styles.helpItem}>
              <Text style={styles.stepNumber}>3</Text>
              <View style={styles.helpContent}>
                <Text style={styles.helpTitle}>Browse Categories</Text>
                <Text style={styles.helpText}>
                  Use the category tabs to find symbols quickly. Categories include 
                  Needs, Feelings, Actions, Food, Family, and many more.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Emergency Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🆘 Emergency Features</Text>
          
          <View style={[styles.helpCard, { backgroundColor: colors.emergency }]}>
            <Text style={styles.emergencyText}>
              For urgent situations, tap the alert icon (🚨) at the top to access 
              emergency symbols like:
            </Text>
            <View style={styles.emergencyList}>
              <Text style={styles.emergencyItem}>🆘 Help - "I need help!"</Text>
              <Text style={styles.emergencyItem}>🚽 Bathroom - "I need to use the bathroom"</Text>
              <Text style={styles.emergencyItem}>😣 Pain - "I am hurt"</Text>
              <Text style={styles.emergencyItem}>🛑 Stop - "Stop please"</Text>
            </View>
            <Text style={styles.emergencyNote}>
              Emergency symbols speak immediately and are heard more clearly.
            </Text>
          </View>
        </View>

        {/* Categories Guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 Categories Guide</Text>
          
          <View style={styles.helpCard}>
            <View style={styles.categoryGrid}>
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>💧</Text>
                <Text style={styles.categoryName}>Needs</Text>
                <Text style={styles.categoryDesc}>Water, food, sleep, quiet</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>😊</Text>
                <Text style={styles.categoryName}>Feelings</Text>
                <Text style={styles.categoryDesc}>Happy, sad, angry, scared</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>✅</Text>
                <Text style={styles.categoryName}>Actions</Text>
                <Text style={styles.categoryDesc}>Yes, no, please, thank you</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>🍎</Text>
                <Text style={styles.categoryName}>Food</Text>
                <Text style={styles.categoryDesc}>Fruits, drinks, meals</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>👨‍👩‍👧‍👦</Text>
                <Text style={styles.categoryName}>Family</Text>
                <Text style={styles.categoryDesc}>Mom, dad, siblings</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>👋</Text>
                <Text style={styles.categoryName}>Social</Text>
                <Text style={styles.categoryDesc}>Greetings, sharing, friends</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>🎯</Text>
                <Text style={styles.categoryName}>Play</Text>
                <Text style={styles.categoryDesc}>Games, toys, activities</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>🏫</Text>
                <Text style={styles.categoryName}>School</Text>
                <Text style={styles.categoryDesc}>Learning, homework, teachers</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>🏠</Text>
                <Text style={styles.categoryName}>Places</Text>
                <Text style={styles.categoryDesc}>Home, park, store</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>🐕</Text>
                <Text style={styles.categoryName}>Animals</Text>
                <Text style={styles.categoryDesc}>Pets and animals</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>🔴</Text>
                <Text style={styles.categoryName}>Colors</Text>
                <Text style={styles.categoryDesc}>Red, blue, green, yellow</Text>
              </View>
              
              <View style={styles.categoryItem}>
                <Text style={styles.categoryEmoji}>☀️</Text>
                <Text style={styles.categoryName}>Weather</Text>
                <Text style={styles.categoryDesc}>Sun, rain, hot, cold</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings & Customization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Settings & Customization</Text>
          
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>Access Your Profile</Text>
            <Text style={styles.helpText}>
              Tap your profile icon (👤) at the top right to:
            </Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• Edit your name and age</Text>
              <Text style={styles.bulletPoint}>• Adjust sensory settings</Text>
              <Text style={styles.bulletPoint}>• View communication statistics</Text>
              <Text style={styles.bulletPoint}>• Enable large touch targets</Text>
              <Text style={styles.bulletPoint}>• Reduce motion for sensitivity</Text>
              <Text style={styles.bulletPoint}>• Toggle high contrast mode</Text>
            </View>
          </View>
        </View>

        {/* Tips for Success */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Tips for Success</Text>
          
          <View style={styles.helpCard}>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>
                📱 <Text style={styles.tipBold}>Start Simple:</Text> Begin with single symbols before building sentences
              </Text>
              <Text style={styles.tipItem}>
                🔄 <Text style={styles.tipBold}>Practice Daily:</Text> Regular use helps build communication skills
              </Text>
              <Text style={styles.tipItem}>
                👨‍👩‍👧‍👦 <Text style={styles.tipBold}>Family Support:</Text> Have family members learn your symbols too
              </Text>
              <Text style={styles.tipItem}>
                🎯 <Text style={styles.tipBold}>Be Patient:</Text> Communication skills develop over time
              </Text>
              <Text style={styles.tipItem}>
                ⚡ <Text style={styles.tipBold}>Emergency Ready:</Text> Practice using emergency symbols when calm
              </Text>
            </View>
          </View>
        </View>

        {/* About AAC */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About AAC</Text>
          
          <View style={styles.helpCard}>
            <Text style={styles.helpTitle}>What is AAC?</Text>
            <Text style={styles.helpText}>
              Augmentative and Alternative Communication (AAC) includes all forms of 
              communication that supplement or replace spoken language. AAC can help 
              people with autism express themselves, understand others, and participate 
              more fully in their communities.
            </Text>
            
            <Text style={styles.helpTitle}>Benefits of AAC:</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bulletPoint}>• Reduces frustration and behavioral challenges</Text>
              <Text style={styles.bulletPoint}>• Increases independence and self-advocacy</Text>
              <Text style={styles.bulletPoint}>• Improves social interaction and relationships</Text>
              <Text style={styles.bulletPoint}>• Supports language development</Text>
              <Text style={styles.bulletPoint}>• Enhances quality of life</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.textLight,
    lineHeight: 24,
  },
  helpCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    backgroundColor: colors.selected,
    color: colors.text,
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  emergencyText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  emergencyList: {
    marginBottom: 12,
  },
  emergencyItem: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 6,
    fontWeight: '500',
  },
  emergencyNote: {
    fontSize: 12,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 12,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
    lineHeight: 20,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    fontSize: 14,
    color: colors.textLight,
    lineHeight: 20,
  },
  tipBold: {
    fontWeight: '600',
    color: colors.text,
  },
  bottomSpace: {
    height: 24,
  },
});