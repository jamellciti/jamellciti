import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface TaskInstance {
  id: string;
  title: string;
  description?: string;
  due_at: string;
  status: string;
  reward_points: number;
  requires_proof: boolean;
}

export default function ChildHome() {
  const { user, logout } = useAuth();
  const [taskInstances, setTaskInstances] = useState<TaskInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get('/api/task-instances');
      setTaskInstances(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const pickImage = async (taskId: string) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photos to submit task proof.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      submitTaskWithPhoto(taskId, result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const takePhoto = async (taskId: string) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      submitTaskWithPhoto(taskId, result.assets[0].base64, result.assets[0].mimeType || 'image/jpeg');
    }
  };

  const submitTaskWithPhoto = async (taskId: string, base64: string, mimeType: string) => {
    setSubmittingTask(taskId);
    try {
      await axios.post(`/api/task-instances/${taskId}/submit`, {
        media_base64: base64,
        media_type: mimeType,
        caption: 'Task completed'
      });
      
      Alert.alert('Success!', 'Task submitted for review!');
      loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Error submitting task:', error);
      Alert.alert('Error', 'Failed to submit task. Please try again.');
    } finally {
      setSubmittingTask(null);
    }
  };

  const submitTaskWithoutPhoto = async (taskId: string) => {
    setSubmittingTask(taskId);
    try {
      await axios.post(`/api/task-instances/${taskId}/submit`, {
        caption: 'Task completed'
      });
      
      Alert.alert('Success!', 'Task submitted for review!');
      loadTasks(); // Refresh tasks
    } catch (error) {
      console.error('Error submitting task:', error);
      Alert.alert('Error', 'Failed to submit task. Please try again.');
    } finally {
      setSubmittingTask(null);
    }
  };

  const handleTaskSubmission = (task: TaskInstance) => {
    if (task.requires_proof) {
      Alert.alert(
        'Submit Task',
        'This task requires photo proof. How would you like to add it?',
        [
          { text: 'Take Photo', onPress: () => takePhoto(task.id) },
          { text: 'Choose from Gallery', onPress: () => pickImage(task.id) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      Alert.alert(
        'Complete Task',
        'Mark this task as completed?',
        [
          { text: 'Yes', onPress: () => submitTaskWithoutPhoto(task.id) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return '#FF9800';
      case 'submitted': return '#2196F3';
      case 'approved': return '#4CAF50';
      case 'rejected': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'To Do';
      case 'submitted': return 'Waiting for Review';
      case 'approved': return 'Completed! 🎉';
      case 'rejected': return 'Try Again';
      default: return status;
    }
  };

  const todayTasks = taskInstances.filter(task => {
    const today = new Date().toDateString();
    const taskDate = new Date(task.due_at).toDateString();
    return today === taskDate;
  });

  const upcomingTasks = taskInstances.filter(task => {
    const today = new Date();
    const taskDate = new Date(task.due_at);
    return taskDate > today;
  });

  const completedTasks = taskInstances.filter(task => task.status === 'approved');
  const totalPoints = completedTasks.reduce((sum, task) => sum + task.reward_points, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
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
            <Text style={styles.greeting}>Hi, {user?.display_name}! 👋</Text>
            <Text style={styles.pointsText}>You have {totalPoints} points!</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color="#EF5350" />
          </TouchableOpacity>
        </View>

        {!user?.family_id ? (
          <View style={styles.noFamilyCard}>
            <MaterialIcons name="family-restroom" size={64} color="#FF6B6B" />
            <Text style={styles.noFamilyTitle}>Join Your Family</Text>
            <Text style={styles.noFamilyText}>
              Ask your parent for the family invite code to start doing tasks and earning rewards!
            </Text>
          </View>
        ) : (
          <>
            {todayTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Tasks</Text>
                {todayTasks.map((task) => (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskContent}>
                      <View style={styles.taskHeader}>
                        <Text style={styles.taskTitle}>{task.title}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status) }]}>
                          <Text style={styles.statusText}>{getStatusText(task.status)}</Text>
                        </View>
                      </View>
                      
                      {task.description && (
                        <Text style={styles.taskDescription}>{task.description}</Text>
                      )}
                      
                      <View style={styles.taskFooter}>
                        <View style={styles.taskInfo}>
                          <Text style={styles.pointsLabel}>Reward: {task.reward_points} points</Text>
                          {task.requires_proof && (
                            <Text style={styles.proofRequired}>📸 Photo required</Text>
                          )}
                        </View>
                        
                        {task.status === 'scheduled' && (
                          <TouchableOpacity 
                            style={[
                              styles.completeButton,
                              submittingTask === task.id && styles.completeButtonDisabled
                            ]}
                            onPress={() => handleTaskSubmission(task)}
                            disabled={submittingTask === task.id}
                          >
                            {submittingTask === task.id ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <>
                                <MaterialIcons name="check-circle" size={20} color="#fff" />
                                <Text style={styles.completeButtonText}>Done!</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {upcomingTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
                {upcomingTasks.slice(0, 3).map((task) => (
                  <View key={task.id} style={[styles.taskCard, styles.upcomingTaskCard]}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.dueDate}>
                      Due: {new Date(task.due_at).toLocaleDateString()}
                    </Text>
                    <Text style={styles.pointsLabel}>{task.reward_points} points</Text>
                  </View>
                ))}
              </View>
            )}

            {todayTasks.length === 0 && upcomingTasks.length === 0 && (
              <View style={styles.emptyState}>
                <MaterialIcons name="assignment-turned-in" size={64} color="#FF6B6B" />
                <Text style={styles.emptyTitle}>All Done! 🎉</Text>
                <Text style={styles.emptyText}>
                  You've completed all your tasks. Great job!
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff5f5',
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
  pointsText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
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
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  upcomingTaskCard: {
    opacity: 0.7,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  proofRequired: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 4,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  completeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
});