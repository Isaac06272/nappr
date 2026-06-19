import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import SavedRoutesScreen from '../screens/SavedRoutesScreen';
import ActiveNapScreen from '../screens/ActiveNapScreen'; // We will build this next
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { theme } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const PlaceholderScreen = () => <View style={{ flex: 1, backgroundColor: theme.background }} />;

// 1. This is your existing bottom tab setup
function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopWidth: 0,
          height: 60,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: theme.accentMint,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') iconName = 'map';
          else if (route.name === 'Saved Routes') iconName = 'bookmark';
          else if (route.name === 'History') iconName = 'time';
          else if (route.name === 'Settings') iconName = 'settings';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Saved Routes" component={SavedRoutesScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// 2. This Stack wraps the tabs AND the full-screen views
export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* The main app with tabs */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      
      {/* Full screen overlays that hide the tabs */}
      <Stack.Screen 
        name="ActiveNap" 
        component={ActiveNapScreen} 
        options={{ gestureEnabled: false }} // Prevents swiping back by accident
      />
    </Stack.Navigator>
  );
}