import React from 'react';
import { Tabs } from 'expo-router';
import { ChildTabIcon } from '../../components/ChildTabIcon';

export default function ChildLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e1e5e9',
          paddingTop: 8,
          height: 88,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FF6B6B',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 20,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Tasks',
          headerTitle: 'Today\'s Tasks',
          tabBarIcon: ({ color }) => (
            <ChildTabIcon name="today" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'My Rewards',
          headerTitle: 'My Points & Rewards',
          tabBarIcon: ({ color }) => (
            <ChildTabIcon name="stars" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color }) => (
            <ChildTabIcon name="face" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}