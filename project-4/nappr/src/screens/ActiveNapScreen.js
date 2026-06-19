import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';

export default function ActiveNapScreen({ navigation }) {
  // In the future, this will be dynamically updated by your GPS logic
  const distanceRemaining = "1.2"; 

  const handleCancel = () => {
    // Navigates back to the Dashboard tabs
    navigation.goBack(); 
  };

  return (
    <View style={styles.container}>
      {/* Top Section */}
      <View style={styles.header}>
        <Text style={styles.statusText}>APPROACHING</Text>
        <View style={styles.distanceContainer}>
          <Text style={styles.distanceNumber}>{distanceRemaining}</Text>
          <Text style={styles.distanceUnit}> mi</Text>
        </View>
      </View>

      {/* Center Icon (Placeholder for the pulsing animation) */}
      <View style={styles.centerContent}>
        <Ionicons name="moon-outline" size={80} color={theme.textSecondary} style={{ opacity: 0.5 }} />
      </View>

      {/* Bottom Cancel Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>CANCEL NAP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background, // Pitch black for battery saving
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  statusText: {
    color: theme.accentMint,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 10,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distanceNumber: {
    color: theme.textPrimary,
    fontSize: 72,
    fontWeight: 'bold',
  },
  distanceUnit: {
    color: theme.textSecondary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  cancelButton: {
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});