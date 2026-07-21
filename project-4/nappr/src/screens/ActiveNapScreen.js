import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Vibration, Animated, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { theme } from '../theme/colors';

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const STORAGE_KEY = '@nappr_saved_routes';

let backgroundNapSettings = null; 

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// BACKGROUND TASK
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }) => {
  if (error) return;
  if (data && backgroundNapSettings) {
    const { locations } = data;
    const latestLocation = locations[0];
    const { destination, radius, vibrateEnabled } = backgroundNapSettings;

    const dist = getDistanceKm(
      latestLocation.coords.latitude, latestLocation.coords.longitude,
      destination.latitude, destination.longitude
    );

    if (dist <= radius) {
      if (vibrateEnabled) Vibration.vibrate([0, 1000, 500], true); 
    }
  }
});

export default function ActiveNapScreen({ route, navigation }) {
  const { destination, radius } = route.params;

  const [currentDistance, setCurrentDistance] = useState(null);
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [startName, setStartName] = useState('');
  const [destName, setDestName] = useState('');
  
  const locationSubscription = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef(null); 

  // THE FIX: Refs bypass the React render cycle, stopping the instant-cancel bug.
  const hasTriggeredRef = useRef(false);
  const settingsRef = useRef({ sound: true, vibrate: true });

  // Keep refs and background tasks synced with the latest UI toggles
  useEffect(() => {
    settingsRef.current = { sound: soundEnabled, vibrate: vibrateEnabled };
    backgroundNapSettings = { destination, radius, vibrateEnabled, soundEnabled };
  }, [destination, radius, vibrateEnabled, soundEnabled]);

  // INITIALIZE TRACKING 
  // Notice the empty [] at the end. This prevents the tracker from refreshing and killing the alarm!
  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') return;

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      locationSubscription.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (newLocation) => {
          if (!isMounted) return;
          const dist = getDistanceKm(
            newLocation.coords.latitude, newLocation.coords.longitude,
            destination.latitude, destination.longitude
          );
          
          setCurrentDistance(dist);
          
          // Trigger alarm ONLY if it hasn't triggered yet
          if (dist <= radius && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            triggerAlarm();
          }
        }
      );

      if (backgroundStatus === 'granted') {
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10,
          foregroundService: {
            notificationTitle: "Nappr is Active",
            notificationBody: "Monitoring your commute...",
            notificationColor: theme.accentMint,
          },
        });
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (locationSubscription.current) locationSubscription.current.remove();
      // stopAlarm() now ONLY runs when you physically leave the screen, not during a UI refresh.
      stopAlarm(); 
    };
  }, []); 

  // ALARM LOGIC 
  const triggerAlarm = async () => {
    setIsAlarmActive(true); // Tell UI to flash red
    
    // Read directly from the Ref so it doesn't wait for a React render
    const { vibrate, sound } = settingsRef.current;

    if (vibrate) {
      Vibration.vibrate([0, 1000, 500], true); 
    }

    if (sound) {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: audioObject } = await Audio.Sound.createAsync(
          require('../../assets/alarm.mp3') 
        );
        soundRef.current = audioObject;
        await audioObject.setIsLoopingAsync(true);
        await audioObject.playAsync();
      } catch (error) {
        console.error("Failed to play the alarm sound:", error);
      }
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 500, useNativeDriver: false })
      ])
    ).start();
  };

  const stopAlarm = async () => {
    Vibration.cancel();
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  };

  const handleCancelNap = async () => {
    await stopAlarm();
    backgroundNapSettings = null; 
    hasTriggeredRef.current = false;
    
    if (locationSubscription.current) locationSubscription.current.remove();
    
    const started = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (started) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    navigation.goBack();
  };

  const handleSaveRoute = async () => {
    if (!routeName || !startName || !destName) {
      Alert.alert('Missing Info', 'Please fill out all fields.');
      return;
    }

    const newRoute = {
      id: Date.now().toString(),
      name: routeName,
      start: startName,
      destination: destName,
      radius: radius.toFixed(1),
      destinationCoords: destination
    };

    try {
      const existingRoutes = await AsyncStorage.getItem(STORAGE_KEY);
      const parsedRoutes = existingRoutes ? JSON.parse(existingRoutes) : [];
      const updatedRoutes = [...parsedRoutes, newRoute];
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRoutes));
      setIsSaveModalVisible(false);
      Alert.alert('Success', 'Route saved to your list!');
    } catch (e) {
      Alert.alert('Error', 'Failed to save route.');
    }
  };

  const displayDistance = currentDistance !== null ? currentDistance.toFixed(1) : "--";
  
  const backgroundColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#000000', 'rgba(255, 30, 30, 0.4)'] 
  });

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      
      <View style={styles.mainContent}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancelNap} style={styles.iconButtonSmall}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, isAlarmActive && { color: theme.danger }]}>
            {isAlarmActive ? "WAKE UP!" : "APPROACHING"}
          </Text>
          
          <TouchableOpacity onPress={() => setIsSaveModalVisible(true)} style={styles.iconButtonSmall}>
            <Ionicons name="bookmark-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.distanceWrapper}>
          <Text style={styles.distanceValue}>{displayDistance}</Text>
          <Text style={styles.distanceUnit}>km</Text>
        </View>

        <Text style={styles.radiusSubtext}>ALARM SET AT {radius.toFixed(1)} KM</Text>

        <View style={styles.moonContainer}>
          <Ionicons name="moon-outline" size={120} color="#1A1A1A" />
        </View>

      </View>

      <View style={styles.bottomSection}>
        <View style={styles.togglesRow}>
          <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)} style={styles.iconButton}>
            <Ionicons name={soundEnabled ? "volume-high" : "volume-mute"} size={26} color={soundEnabled ? '#666' : '#222'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setVibrateEnabled(!vibrateEnabled)} style={styles.iconButton}>
            <Ionicons name={vibrateEnabled ? "phone-portrait" : "phone-portrait-outline"} size={26} color={vibrateEnabled ? '#666' : '#222'} />
          </TouchableOpacity>
        </View>

        {/* Test button safely removed since we verified hardware works! */}

        <View style={styles.bottomContainer}>
          <TouchableOpacity onPress={handleCancelNap} activeOpacity={0.6}>
            <Text style={[styles.cancelText, isAlarmActive && { color: theme.danger }]}>
              {isAlarmActive ? "STOP ALARM" : "CANCEL NAP"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isSaveModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsSaveModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Save Current Route</Text>
                <TouchableOpacity onPress={() => setIsSaveModalVisible(false)}>
                    <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Route Name (e.g., Obando to PUP Manila)"
              placeholderTextColor="#555"
              value={routeName}
              onChangeText={setRouteName}
            />
            <TextInput
              style={styles.input}
              placeholder="Starting Point"
              placeholderTextColor="#555"
              value={startName}
              onChangeText={setStartName}
            />
            <TextInput
              style={styles.input}
              placeholder="Destination"
              placeholderTextColor="#555"
              value={destName}
              onChangeText={setDestName}
            />

            <View style={styles.radiusLockContainer}>
              <Ionicons name="lock-closed-outline" size={16} color={theme.accentMint} />
              <Text style={styles.radiusLockText}>Radius locked at {radius.toFixed(1)} km</Text>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveRoute}>
              <Text style={styles.saveButtonText}>SAVE ROUTE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainContent: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 25, paddingTop: 60 },
  iconButtonSmall: { padding: 5 },
  headerTitle: { color: theme.accentMint, fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  distanceWrapper: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 80 },
  distanceValue: { color: '#FFFFFF', fontSize: 110, fontWeight: 'bold', includeFontPadding: false, tracking: -2 },
  distanceUnit: { color: '#888888', fontSize: 32, marginLeft: 8, fontWeight: '400' },
  radiusSubtext: { color: '#444', fontSize: 12, fontWeight: 'bold', letterSpacing: 2, textAlign: 'center', marginTop: 5 },
  moonContainer: { alignItems: 'center', marginTop: 45 }, 
  bottomSection: { paddingBottom: 60, paddingHorizontal: 40 }, 
  togglesRow: { flexDirection: 'row', justifyContent: 'center', gap: 60, paddingVertical: 20 },
  iconButton: { padding: 15 },
  bottomContainer: { alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#5A7580', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 50, borderWidth: 1, borderColor: '#222' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 },
  input: { backgroundColor: '#1A1A1A', color: '#FFF', borderRadius: 12, padding: 18, marginBottom: 15, fontSize: 15 },
  radiusLockContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 25, marginTop: 10 },
  radiusLockText: { color: theme.accentMint, fontSize: 13, marginLeft: 8, letterSpacing: 0.5 },
  saveButton: { backgroundColor: theme.accentMint, padding: 18, borderRadius: 15, alignItems: 'center' },
  saveButtonText: { color: '#000', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
});