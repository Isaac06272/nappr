import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Vibration, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../theme/colors';

// MATHEMATICS: The Haversine Formula
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function ActiveNapScreen({ route, navigation }) {
  const { destination, radius, isIntense } = route.params;

  const [currentDistance, setCurrentDistance] = useState(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  
  const locationSubscription = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // ==========================================
  // 1. REAL-TIME TRACKING ENGINE
  // ==========================================
  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert("Location permission is required to wake you up!");
        return;
      }

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, 
          distanceInterval: 10,
        },
        (newLocation) => {
          if (!isMounted) return;

          const dist = getDistanceKm(
            newLocation.coords.latitude,
            newLocation.coords.longitude,
            destination.latitude,
            destination.longitude
          );

          setCurrentDistance(dist);

          if (dist <= radius && !isAlarmActive) {
            triggerAlarm();
          }
        }
      );
    };

    startTracking();

    return () => {
      isMounted = false;
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      stopAlarm(); 
    };
  }, [isAlarmActive, soundEnabled, vibrateEnabled]); 

  // ==========================================
  // 2. ALARM LOGIC (VIBRATION ONLY - AUDIO BYPASSED)
  // ==========================================
  const triggerAlarm = () => {
    setIsAlarmActive(true);
    
    if (vibrateEnabled) {
      Vibration.vibrate([1000, 1000], true);
    }

    if (soundEnabled) {
      // Audio engine removed to prevent crash. 
      console.log("ALARM TRIGGERED: Sound is visually ON, but audio engine is bypassed.");
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 500, useNativeDriver: false })
      ])
    ).start();
  };

  const stopAlarm = () => {
    Vibration.cancel();
  };

  const handleCancelNap = () => {
    stopAlarm();
    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }
    navigation.goBack();
  };

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    if (isAlarmActive) {
        console.log(`Sound toggled to ${newVal ? 'ON' : 'OFF'} during active alarm.`);
    }
  };

  const toggleVibrate = () => {
    const newVal = !vibrateEnabled;
    setVibrateEnabled(newVal);
    if (isAlarmActive) {
      if (newVal) Vibration.vibrate([1000, 1000], true);
      else Vibration.cancel();
    }
  };

  // ==========================================
  // 3. UI RENDERING
  // ==========================================
  const displayDistance = currentDistance !== null ? currentDistance.toFixed(1) : "--";
  
  const backgroundColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.background, 'rgba(255, 76, 76, 0.4)'] 
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      
      {/* Top Header */}
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={24} color={isAlarmActive ? theme.danger : theme.accentMint} />
        <Text style={styles.headerText}>
          {isAlarmActive ? "WAKE UP!" : "NAPPR IS ACTIVE"}
        </Text>
      </View>

      {/* Main Distance Readout */}
      <View style={styles.distanceContainer}>
        <Text style={styles.distanceValue}>{displayDistance}</Text>
        <Text style={styles.distanceUnit}>KM TO DESTINATION</Text>
      </View>

      {/* Quick Toggles */}
      <View style={styles.toggleRow}>
        <TouchableOpacity 
          style={[styles.toggleBtn, soundEnabled ? styles.toggleActive : styles.toggleInactive]} 
          onPress={toggleSound}
          activeOpacity={0.7}
        >
          <Ionicons name={soundEnabled ? "volume-high" : "volume-mute"} size={22} color={soundEnabled ? '#000' : '#FFF'} />
          <Text style={[styles.toggleText, soundEnabled ? {color: '#000'} : {color: '#FFF'}]}>Sound</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.toggleBtn, vibrateEnabled ? styles.toggleActive : styles.toggleInactive]} 
          onPress={toggleVibrate}
          activeOpacity={0.7}
        >
          <Ionicons name={vibrateEnabled ? "phone-portrait" : "phone-portrait-outline"} size={22} color={vibrateEnabled ? '#000' : '#FFF'} />
          <Text style={[styles.toggleText, vibrateEnabled ? {color: '#000'} : {color: '#FFF'}]}>Vibrate</Text>
        </TouchableOpacity>
      </View>

      {/* Geofence Data */}
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Wake-Up Radius:</Text>
          <Text style={styles.infoData}>{radius.toFixed(1)} km</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={[styles.infoData, { color: isAlarmActive ? theme.danger : theme.accentMint }]}>
            {isAlarmActive ? "ALARM RINGING" : "MONITORING"}
          </Text>
        </View>
      </View>

      {/* Big Cancel/Wake Up Button */}
      <TouchableOpacity 
        style={[styles.cancelButton, isAlarmActive && styles.wakeUpButton]} 
        onPress={handleCancelNap}
        activeOpacity={0.8}
      >
        <Ionicons name={isAlarmActive ? "alarm" : "close"} size={28} color={isAlarmActive ? '#FFF' : theme.danger} />
        <Text style={[styles.cancelButtonText, isAlarmActive && { color: '#FFF' }]}>
          {isAlarmActive ? "TURN OFF ALARM" : "CANCEL NAP"}
        </Text>
      </TouchableOpacity>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: 60, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 15, borderRadius: 20 },
  headerText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 2, marginLeft: 10 },
  
  distanceContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  distanceValue: { color: '#FFFFFF', fontSize: 110, fontWeight: 'bold', includeFontPadding: false },
  distanceUnit: { color: theme.textSecondary, fontSize: 18, letterSpacing: 3, marginTop: -10, fontWeight: '600' },
  
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingHorizontal: 10 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 15, marginHorizontal: 5, borderWidth: 1 },
  toggleActive: { backgroundColor: theme.accentMint, borderColor: theme.accentMint },
  toggleInactive: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: '#333' },
  toggleText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  infoBox: { backgroundColor: theme.surface, borderRadius: 20, padding: 25, marginBottom: 30, borderWidth: 1, borderColor: '#222' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  infoLabel: { color: theme.textSecondary, fontSize: 14 },
  infoData: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },
  
  cancelButton: { flexDirection: 'row', backgroundColor: 'rgba(255, 76, 76, 0.1)', height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.danger },
  wakeUpButton: { backgroundColor: theme.danger, borderColor: theme.danger },
  cancelButtonText: { color: theme.danger, fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
});