import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface KPIData {
  events_today: number;
  work_orders_open: number;
  work_orders_closed: number;
  citations_issued: number;
  citations_paid: number;
  total_fine_value: number;
  grant_potential: number;
  video_reviews_queued: number;
}

interface EventData {
  id: string;
  type: string;
  lat: number;
  lon: number;
  severity: number;
  timestamp: string;
  ai_flagged?: boolean;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [recentEvents, setRecentEvents] = useState<EventData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, loading, logout } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.replace('/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);

      const headers = {
        Authorization: `Bearer ${user.token || 'placeholder'}`, // Will be handled by the hook
        'Content-Type': 'application/json',
      };

      // For now, we'll use mock data since the user object from the hook
      // might not have the token directly accessible
      setKpis({
        events_today: 124,
        work_orders_open: 8,
        work_orders_closed: 15,
        citations_issued: 23,
        citations_paid: 18,
        total_fine_value: 45000,
        grant_potential: 6750,
        video_reviews_queued: 12
      });

      setRecentEvents([
        {
          id: '1',
          type: 'pothole',
          lat: 40.7128,
          lon: -74.0060,
          severity: 4,
          timestamp: '2024-01-15T14:30:00Z',
          ai_flagged: true
        },
        {
          id: '2', 
          type: 'storm_drain_clog',
          lat: 40.7589,
          lon: -73.9851,
          severity: 3,
          timestamp: '2024-01-15T13:15:00Z',
          ai_flagged: false
        }
      ]);

    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };

  const getEventIcon = (eventType: string) => {
    const iconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
      pothole: 'warning',
      storm_drain_clog: 'water-damage',
      near_miss: 'traffic',
      litter_dumping: 'delete',
      ada_obstruction: 'accessible',
      illegal_uturn: 'u-turn-left',
      failure_to_yield: 'stop',
      reckless_merge: 'merge-type',
      speeding_school_zone: 'school',
    };
    return iconMap[eventType] || 'event';
  };

  const getEventColor = (eventType: string) => {
    const colorMap: Record<string, string> = {
      pothole: '#FF6B6B',
      storm_drain_clog: '#4ECDC4',
      near_miss: '#FFE66D',
      litter_dumping: '#FF8E53',
      ada_obstruction: '#95E1D3',
      illegal_uturn: '#F38BA8',
      failure_to_yield: '#FFC09F',
      reckless_merge: '#FFEE93',
      speeding_school_zone: '#FCF6BD',
    };
    return colorMap[eventType] || '#888888';
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D2FF" />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#00D2FF"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <MaterialIcons name="settings" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statusBar}>
            <View style={styles.statusItem}>
              <MaterialIcons name="privacy-tip" size={16} color="#00D2FF" />
              <Text style={styles.statusText}>
                {user?.consent_level?.toUpperCase() || 'NOT SET'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <MaterialIcons name="card-membership" size={16} color="#FFA726" />
              <Text style={styles.statusText}>
                {user?.subscription_tier?.replace('_', ' ').toUpperCase() || 'FREE'}
              </Text>
            </View>
          </View>
        </View>

        {/* KPI Cards */}
        {kpis && (
          <View style={styles.kpiSection}>
            <Text style={styles.sectionTitle}>Today's Activity</Text>
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, styles.kpiCardPrimary]}>
                <MaterialIcons name="event" size={24} color="#00D2FF" />
                <Text style={styles.kpiValue}>{kpis.events_today}</Text>
                <Text style={styles.kpiLabel}>Events Detected</Text>
              </View>
              
              <View style={styles.kpiCard}>
                <MaterialIcons name="work" size={24} color="#4CAF50" />
                <Text style={styles.kpiValue}>{kpis.work_orders_open}</Text>
                <Text style={styles.kpiLabel}>Work Orders</Text>
              </View>
              
              <View style={styles.kpiCard}>
                <MaterialIcons name="gavel" size={24} color="#FF6B6B" />
                <Text style={styles.kpiValue}>{kpis.citations_issued}</Text>
                <Text style={styles.kpiLabel}>Citations</Text>
              </View>
              
              <View style={styles.kpiCard}>
                <MaterialIcons name="attach-money" size={24} color="#FFA726" />
                <Text style={styles.kpiValue}>${kpis.total_fine_value.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Fine Value</Text>
              </View>
            </View>
            
            {kpis.grant_potential > 0 && (
              <View style={styles.grantCard}>
                <MaterialIcons name="account-balance" size={24} color="#4CAF50" />
                <Text style={styles.grantValue}>
                  ${kpis.grant_potential.toLocaleString()} Grant Potential
                </Text>
                <Text style={styles.grantText}>15% of fine revenue eligible</Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Events */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Events</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/events')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#00D2FF" />
            </TouchableOpacity>
          </View>

          {recentEvents.length > 0 ? (
            <View style={styles.eventsList}>
              {recentEvents.slice(0, 5).map((event) => (
                <View key={event.id} style={styles.eventCard}>
                  <View style={[styles.eventIcon, { backgroundColor: getEventColor(event.type) }]}>
                    <MaterialIcons 
                      name={getEventIcon(event.type)} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>
                      {formatEventType(event.type)}
                    </Text>
                    <Text style={styles.eventDetails}>
                      Severity: {event.severity}/5 • {event.lat.toFixed(4)}, {event.lon.toFixed(4)}
                    </Text>
                    <Text style={styles.eventTime}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                  {event.ai_flagged && (
                    <View style={styles.aiBadge}>
                      <MaterialIcons name="smart-toy" size={16} color="#FF6B6B" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.noEventsCard}>
              <MaterialIcons name="event-available" size={48} color="#666666" />
              <Text style={styles.noEventsText}>No events detected today</Text>
              <Text style={styles.noEventsSubtext}>
                Events will appear here as they're processed
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/live-map')}
            >
              <MaterialIcons name="map" size={24} color="#00D2FF" />
              <Text style={styles.actionText}>Live Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/video-reviews')}
            >
              <MaterialIcons name="videocam" size={24} color="#FF6B6B" />
              <Text style={styles.actionText}>Video Reviews</Text>
              {kpis && kpis.video_reviews_queued > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{kpis.video_reviews_queued}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/work-orders')}
            >
              <MaterialIcons name="build" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Work Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/trust')}
            >
              <MaterialIcons name="security" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Trust Dashboard</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
  },
  statusBar: {
    flexDirection: 'row',
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  kpiSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#333333',
  },
  kpiCardPrimary: {
    borderColor: '#00D2FF',
    backgroundColor: '#0D1B2A',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginTop: 4,
  },
  grantCard: {
    backgroundColor: '#1A2E1A',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  grantValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  grantText: {
    fontSize: 12,
    color: '#4CAF50',
    opacity: 0.8,
  },
  eventsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: '#00D2FF',
    fontSize: 14,
    fontWeight: '500',
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  eventDetails: {
    fontSize: 12,
    color: '#CCCCCC',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 12,
    color: '#888888',
  },
  aiBadge: {
    backgroundColor: '#2A0D0D',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  noEventsCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  noEventsText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
    fontWeight: '500',
  },
  noEventsSubtext: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsSection: {
    paddingHorizontal: 24,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    borderWidth: 1,
    borderColor: '#333333',
    position: 'relative',
  },
  actionText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});