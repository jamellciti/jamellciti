import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface TaskInstance {
  id: string;
  title: string;
  child_id: string;
  due_at: string;
  status: string;
  reward_points: number;
}

interface FamilyMember {
  id: string;
  display_name: string;
  role: string;
}

export default function ParentHome() {
  const { user, logout } = useAuth();
  const [taskInstances, setTaskInstances] = useState<TaskInstance[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksResponse, membersResponse] = await Promise.all([
        axios.get('/api/task-instances'),
        axios.get('/api/families/members'),
      ]);

      setTaskInstances(tasksResponse.data);
      setFamilyMembers(membersResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getChildName = (childId: string) => {
    const child = familyMembers.find(member => member.id === childId);
    return child?.display_name || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#FFA726';
      case 'submitted': return '#42A5F5';
      case 'approved': return '#66BB6A';
      case 'rejected': return '#EF5350';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'To Do';
      case 'submitted': return 'Pending Review';
      case 'approved': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const pendingTasks = taskInstances.filter(task => task.status === 'submitted');
  const todayTasks = taskInstances.filter(task => {
    const today = new Date().toDateString();
    const taskDate = new Date(task.due_at).toDateString();
    return today === taskDate;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.display_name}!</Text>
            <Text style={styles.subGreeting}>
              {user?.family_id ? 'Family Dashboard' : 'Create or join a family to get started'}
            </Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#EF5350" />
          </TouchableOpacity>
        </View>

        {!user?.family_id ? (
          <View style={styles.noFamilyCard}>
            <MaterialIcons name="family-restroom" size={64} color="#4A90E2" />
            <Text style={styles.noFamilyTitle}>No Family Yet</Text>
            <Text style={styles.noFamilyText}>
              Create a family or join one using an invite code to start managing tasks.
            </Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <MaterialIcons name="pending-actions" size={32} color="#FF9800" />
                <Text style={styles.statNumber}>{pendingTasks.length}</Text>
                <Text style={styles.statLabel}>Pending Approval</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialIcons name="today" size={32} color="#4A90E2" />
                <Text style={styles.statNumber}>{todayTasks.length}</Text>
                <Text style={styles.statLabel}>Due Today</Text>
              </View>
              <View style={styles.statCard}>
                <MaterialIcons name="people" size={32} color="#66BB6A" />
                <Text style={styles.statNumber}>{familyMembers.filter(m => m.role === 'child').length}</Text>
                <Text style={styles.statLabel}>Kids</Text>
              </View>
            </View>

            {pendingTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Approvals</Text>
                {pendingTasks.slice(0, 3).map((task) => (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskChild}>{getChildName(task.child_id)}</Text>
                    </View>
                    <View style={styles.taskMeta}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
                      </View>
                      <Text style={styles.pointsBadge}>+{task.reward_points} pts</Text>
                    </View>
                  </View>
                ))}
                {pendingTasks.length > 3 && (
                  <TouchableOpacity style={styles.seeMoreButton}>
                    <Text style={styles.seeMoreText}>See {pendingTasks.length - 3} more</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Today's Tasks</Text>
              {todayTasks.length > 0 ? (
                todayTasks.slice(0, 5).map((task) => (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <Text style={styles.taskChild}>{getChildName(task.child_id)}</Text>
                    </View>
                    <View style={styles.taskMeta}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                        <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
                      </View>
                      <Text style={styles.pointsBadge}>+{task.reward_points} pts</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <MaterialIcons name="assignment-turned-in" size={48} color="#ccc" />
                  <Text style={styles.emptyText}>No tasks for today</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  noFamilyCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noFamilyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  noFamilyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  actionButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  taskChild: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  taskMeta: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsBadge: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  seeMoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  seeMoreText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
});