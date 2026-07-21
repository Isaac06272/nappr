import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { theme } from '../theme/colors';

const SETTINGS_STORAGE_KEY = '@nappr_settings';
const HISTORY_STORAGE_KEY = '@nappr_history';
const ROUTES_STORAGE_KEY = '@nappr_saved_routes';

export default function SettingsScreen() {
  const [settings, setSettings] = useState({
    gradualVolume: true,
    offlineMode: false,
  });
  const [locationStatus, setLocationStatus] = useState('Checking...');

  useEffect(() => {
    loadSettings();
    checkPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error("Failed to save setting", e);
    }
  };

  const checkPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationStatus(status === 'granted' ? 'Always On' : 'Denied');
    } catch (e) {
      setLocationStatus('Unknown');
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  const handleClearData = (key, title) => {
    Alert.alert(
      `Clear ${title}`,
      `Are you sure you want to delete all your ${title.toLowerCase()}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(key);
              Alert.alert("Success", `${title} has been cleared.`);
            } catch (e) {
              Alert.alert("Error", `Failed to clear ${title.toLowerCase()}.`);
            }
          }
        }
      ]
    );
  };

  const SettingRow = ({ icon, title, value, type = 'chevron', onPress, onToggle }) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      activeOpacity={type === 'switch' ? 1 : 0.7}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={theme.textPrimary} />
        </View>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      
      {type === 'switch' ? (
        <Switch
          trackColor={{ false: '#333333', true: theme.accentMint }}
          thumbColor={'#FFFFFF'}
          onValueChange={onToggle}
          value={value}
        />
      ) : type === 'text' ? (
        <Text style={styles.settingValue}>{value}</Text>
      ) : (
        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
      <Text style={styles.headerTitle}>Settings</Text>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ALARM PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow icon="musical-notes" title="Alarm Sound" value="Radar (Default)" type="text" />
          <View style={styles.divider} />
          <SettingRow 
            icon="volume-high" 
            title="Gradual Volume Increase" 
            value={settings.gradualVolume} 
            type="switch" 
            onToggle={(val) => updateSetting('gradualVolume', val)} 
          />
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>TRACKING & DATA</Text>
        <View style={styles.card}>
          <SettingRow 
            icon="location" 
            title="Location Permissions" 
            value={locationStatus} 
            type="text" 
            onPress={handleOpenSettings}
          />
          <View style={styles.divider} />
          <SettingRow 
            icon="cloud-offline" 
            title="Offline Mode" 
            value={settings.offlineMode} 
            type="switch" 
            onToggle={(val) => updateSetting('offlineMode', val)} 
          />
          <View style={styles.divider} />
          <SettingRow 
            icon="trash-outline" 
            title="Clear History" 
            type="chevron" 
            onPress={() => handleClearData(HISTORY_STORAGE_KEY, 'Nap History')}
          />
          <View style={styles.divider} />
          <SettingRow 
            icon="bookmark-outline" 
            title="Clear Saved Routes" 
            type="chevron" 
            onPress={() => handleClearData(ROUTES_STORAGE_KEY, 'Saved Routes')}
          />
        </View>
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SUPPORT</Text>
        <View style={styles.card}>
          <SettingRow icon="help-circle" title="Help & Feedback" type="chevron" />
          <View style={styles.divider} />
          <SettingRow icon="information-circle" title="About Nappr" value="v1.0.0" type="text" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 60 },
  headerTitle: { color: theme.textPrimary, fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 20 },
  section: { marginBottom: 25, paddingHorizontal: 20 },
  sectionHeader: { color: theme.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1, paddingLeft: 5 },
  card: { backgroundColor: theme.surface, borderRadius: 15, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, backgroundColor: theme.surface },
  settingLeft: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  settingTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: '500' },
  settingValue: { color: theme.textSecondary, fontSize: 14 },
  divider: { height: 1, backgroundColor: '#222', marginLeft: 65 },
});