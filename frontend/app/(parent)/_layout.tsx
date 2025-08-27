import React from 'react';
import { Tabs } from 'expo-router';
import { ParentTabIcon } from '../../components/ParentTabIcon';

export default function ParentLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e1e5e9',
          paddingTop: 4,
          height: 84,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#4A90E2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Family Dashboard',
          tabBarIcon: ({ color }) => (
            <ParentTabIcon name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          headerTitle: 'Manage Tasks',
          tabBarIcon: ({ color }) => (
            <ParentTabIcon name="assignment" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          headerTitle: 'Family Members',
          tabBarIcon: ({ color }) => (
            <ParentTabIcon name="people" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          headerTitle: 'Rewards & Points',
          tabBarIcon: ({ color }) => (
            <ParentTabIcon name="card-giftcard" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color }) => (
            <ParentTabIcon name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}