import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage utility that works on both native and web
class StorageManager {
  private isWeb = Platform.OS === 'web';

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb) {
        // Use AsyncStorage for web (falls back to localStorage)
        await AsyncStorage.setItem(key, value);
        console.log(`💾 Token saved to AsyncStorage: ${value.slice(0, 12)}...`);
      } else {
        // Use SecureStore for native
        await SecureStore.setItemAsync(key, value);
        console.log(`🔒 Token saved to SecureStore: ${value.slice(0, 12)}...`);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.setItem(key, value);
      console.log(`📱 Token saved to AsyncStorage (fallback): ${value.slice(0, 12)}...`);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb) {
        const value = await AsyncStorage.getItem(key);
        if (value) console.log(`💾 Token retrieved from AsyncStorage: ${value.slice(0, 12)}...`);
        return value;
      } else {
        const value = await SecureStore.getItemAsync(key);
        if (value) console.log(`🔒 Token retrieved from SecureStore: ${value.slice(0, 12)}...`);
        return value;
      }
    } catch (error) {
      console.error('Storage getItem error:', error);
      // Fallback to AsyncStorage
      const value = await AsyncStorage.getItem(key);
      if (value) console.log(`📱 Token retrieved from AsyncStorage (fallback): ${value.slice(0, 12)}...`);
      return value;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb) {
        await AsyncStorage.removeItem(key);
        console.log('💾 Token removed from AsyncStorage');
      } else {
        await SecureStore.deleteItemAsync(key);
        console.log('🔒 Token removed from SecureStore');
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
      // Fallback to AsyncStorage
      await AsyncStorage.removeItem(key);
      console.log('📱 Token removed from AsyncStorage (fallback)');
    }
  }

  async clear(): Promise<void> {
    try {
      await this.removeItem('auth_token');
      await this.removeItem('user_info');
      console.log('🧹 All auth data cleared from storage');
    } catch (error) {
      console.error('Storage clear error:', error);
    }
  }

  // Debug method to check all stored keys
  async debugKeys(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log('🔍 All AsyncStorage keys:', keys);
      
      const authToken = await this.getItem('auth_token');
      const userInfo = await this.getItem('user_info');
      
      console.log('🔍 Auth token exists:', !!authToken);
      console.log('🔍 User info exists:', !!userInfo);
      
      if (authToken) {
        console.log('🔍 Token preview:', authToken.slice(0, 20) + '...');
      }
    } catch (error) {
      console.error('Storage debug error:', error);
    }
  }
}

export const storage = new StorageManager();
export default storage;