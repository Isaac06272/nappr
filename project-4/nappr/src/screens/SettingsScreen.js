import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';

export default function SettingsScreen() {
  const [vibrate, setVibrate] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);

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
          <SettingRow icon="volume-high" title="Gradual Volume Increase" value={true} type="switch" onToggle={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="phone-portrait-outline" title="Vibrate on Wake" value={vibrate} type="switch" onToggle={() => setVibrate(!vibrate)} />
        </View>
      </View>

      {/* Location Section */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>TRACKING & DATA</Text>
        <View style={styles.card}>
          <SettingRow icon="location" title="Location Permissions" value="Always On" type="text" />
          <View style={styles.divider} />
          <SettingRow icon="cloud-offline" title="Offline Mode" value={offlineMode} type="switch" onToggle={() => setOfflineMode(!offlineMode)} />
          <View style={styles.divider} />
          <SettingRow icon="trash-outline" title="Clear History" type="chevron" />
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

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
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
  divider: { height: 1, backgroundColor: '#222', marginLeft: 65 }, // Aligns with the text, not the icon
  logoutButton: { marginHorizontal: 20, marginTop: 10, backgroundColor: 'rgba(255, 76, 76, 0.1)', padding: 15, borderRadius: 15, alignItems: 'center' },
  logoutText: { color: theme.danger, fontSize: 16, fontWeight: 'bold' },
});