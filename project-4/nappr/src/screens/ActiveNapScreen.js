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
  const { destination, radius } = route.params;

  const [currentDistance, setCurrentDistance] = useState(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  
  // Toggles
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
  // 2. ALARM LOGIC (AUDIO BYPASSED)
  // ==========================================
  const triggerAlarm = () => {
    setIsAlarmActive(true);
    
    if (vibrateEnabled) {
      Vibration.vibrate([1000, 1000], true);
    }

    if (soundEnabled) {
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

  // ==========================================
  // 3. UI RENDERING
  // ==========================================
  const displayDistance = currentDistance !== null ? currentDistance.toFixed(1) : "--";
  
  const backgroundColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000000', 'rgba(255, 30, 30, 0.4)'] 
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      
      <View style={styles.mainContent}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancelNap} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, isAlarmActive && { color: theme.danger }]}>
            {isAlarmActive ? "WAKE UP!" : "APPROACHING"}
          </Text>
          <View style={{ width: 24 }} /> {/* Spacer to perfectly center title */}
        </View>

        {/* Minimalist Typography Distance Readout */}
        <View style={styles.distanceWrapper}>
          <Text style={styles.distanceValue}>{displayDistance}</Text>
          <Text style={styles.distanceUnit}>km</Text>
        </View>

        {/* MASSIVE SLEEP ICON CENTERED BELOW DISTANCE */}
        <View style={styles.moonContainer}>
          <Ionicons name="moon-outline" size={120} color="#1A1A1A" />
        </View>

      </View>

      {/* BOTTOM CONTROLS (Toggles & Cancel) */}
      <View style={styles.bottomSection}>
        
        <View style={styles.togglesRow}>
          <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)} style={styles.iconButton}>
            <Ionicons name={soundEnabled ? "volume-high" : "volume-mute"} size={26} color={soundEnabled ? '#666' : '#222'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setVibrateEnabled(!vibrateEnabled)} style={styles.iconButton}>
            <Ionicons name={vibrateEnabled ? "phone-portrait" : "phone-portrait-outline"} size={26} color={vibrateEnabled ? '#666' : '#222'} />
          </TouchableOpacity>
        </View>

        {/* BOTTOM CANCEL BUTTON */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity onPress={handleCancelNap} activeOpacity={0.6}>
            <Text style={[styles.cancelText, isAlarmActive && { color: theme.danger }]}>
              {isAlarmActive ? "STOP ALARM" : "CANCEL NAP"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1 },
  
  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 60 },
  backButton: { padding: 5 },
  headerTitle: { color: theme.accentMint, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  
  // DISTANCE TYPOGRAPHY
  distanceWrapper: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 80 },
  distanceValue: { color: '#FFFFFF', fontSize: 110, fontWeight: 'bold', includeFontPadding: false, tracking: -2 },
  distanceUnit: { color: '#888888', fontSize: 32, marginLeft: 8, fontWeight: '400' },
  
  // MOON GRAPHIC
  moonContainer: { alignItems: 'center', marginTop: 60 },
  
  // BOTTOM SECTION
  bottomSection: { paddingBottom: 60 },
  togglesRow: { flexDirection: 'row', justifyContent: 'center', gap: 60, paddingVertical: 20 },
  iconButton: { padding: 15 },
  
  // CANCEL BUTTON
  bottomContainer: { alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#5A7580', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
});