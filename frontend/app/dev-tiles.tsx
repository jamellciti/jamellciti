import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { fetcher, endpoints } from '../services/api';

const { width, height } = Dimensions.get('window');

interface TileData {
  hard_brakes: number;
  potholes: number;
  near_misses: number;
  total_events: number;
}

export default function DevTilesScreen() {
  const [selectedTile, setSelectedTile] = useState<{x: number, y: number, data: TileData} | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Only show in development builds
  if (!__DEV__) {
    return null;
  }

  const fetchTileData = async (x: number, y: number) => {
    setLoading(true);
    try {
      // Using zoom level 10 for demo (adjust as needed)
      const tileData = await fetcher(endpoints.CITYSCAPE_TILE(10, x, y));
      setSelectedTile({ x, y, data: tileData });
    } catch (error) {
      console.error('Tile fetch error:', error);
      // Use mock data for demo
      setSelectedTile({
        x,
        y,
        data: {
          hard_brakes: Math.floor(Math.random() * 50),
          potholes: Math.floor(Math.random() * 20),
          near_misses: Math.floor(Math.random() * 15),
          total_events: Math.floor(Math.random() * 100),
        },
      });
      Alert.alert('Demo Mode', 'Using mock tile data for development');
    } finally {
      setLoading(false);
    }
  };

  const renderTileGrid = () => {
    const tiles = [];
    const tileSize = Math.floor(width / 6); // 6x6 grid
    
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        const isSelected = selectedTile && selectedTile.x === x && selectedTile.y === y;
        
        tiles.push(
          <TouchableOpacity
            key={`${x}-${y}`}
            style={[
              styles.tile,
              {
                width: tileSize,
                height: tileSize,
                backgroundColor: isSelected ? '#00D2FF20' : '#1A1A1A',
                borderColor: isSelected ? '#00D2FF' : '#333333',
              },
            ]}
            onPress={() => fetchTileData(x, y)}
          >
            <Text style={styles.tileCoords}>{x},{y}</Text>
            {isSelected && selectedTile.data && (
              <View style={styles.tileData}>
                <Text style={styles.tileCount}>{selectedTile.data.total_events}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      }
    }
    
    return (
      <View style={styles.tileGrid}>
        {tiles}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>CityScape™ Tiles (DEV)</Text>
        <View style={styles.devBadge}>
          <Text style={styles.devBadgeText}>DEV ONLY</Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <MaterialIcons name="info" size={20} color="#FFA726" />
        <Text style={styles.instructionsText}>
          Tap tiles to load CityScape™ API data. Each tile represents a geographic region with aggregated traffic events.
        </Text>
      </View>

      {/* Tile Grid */}
      {renderTileGrid()}

      {/* Selected Tile Details */}
      {selectedTile && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>
            Tile ({selectedTile.x}, {selectedTile.y})
          </Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Hard Brakes</Text>
              <Text style={styles.detailValue}>{selectedTile.data.hard_brakes}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Potholes</Text>
              <Text style={styles.detailValue}>{selectedTile.data.potholes}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Near Misses</Text>
              <Text style={styles.detailValue}>{selectedTile.data.near_misses}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Events</Text>
              <Text style={styles.detailValue}>{selectedTile.data.total_events}</Text>
            </View>
          </View>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading tile data...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  devBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  devBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  instructionsCard: {
    backgroundColor: '#2A1F0D',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFA726',
  },
  instructionsText: {
    color: '#FFA726',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tile: {
    borderWidth: 1,
    margin: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  tileCoords: {
    color: '#888888',
    fontSize: 10,
    position: 'absolute',
    top: 2,
    left: 2,
  },
  tileData: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#00D2FF',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tileCount: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    borderWidth: 1,
    borderColor: '#333333',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
});