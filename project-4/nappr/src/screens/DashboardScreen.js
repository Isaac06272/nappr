import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Switch, TouchableOpacity, ScrollView, Keyboard, Animated } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../theme/colors';

// MATHEMATICS: The Haversine Formula to calculate true straight-line distance in Kilometers
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function DashboardScreen({ navigation }) {
  const [radiusKm, setRadiusKm] = useState(1.0);
  const [radiusInput, setRadiusInput] = useState("1.0"); 
  const [isIntense, setIsIntense] = useState(false);
  
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const abortControllerRef = useRef(null);
  const isSelectingRef = useRef(false); 
  
  const [pointA, setPointA] = useState({ latitude: 14.7150, longitude: 120.9351 });
  const [pointB, setPointB] = useState({ latitude: 14.6540, longitude: 120.9839 });

  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();

    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2 && !isSelectingRef.current) {
        fetchSearchResults(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 1500); 

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchSearchResults = async (text) => {
    try {
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;
      const encodedText = encodeURIComponent(text);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedText}&format=json&limit=4&countrycodes=ph`;
      
      const response = await fetch(url, { signal, headers: { 'User-Agent': 'NapprApp_Radar/1.0' } });

      if (response.status === 429 || !response.ok) return;

      const data = await response.json();
      if (!signal.aborted && Array.isArray(data)) setSearchResults(data);
    } catch (error) {
      if (error.name !== 'AbortError') setSearchResults([]);
    }
  };

  const selectPlace = (place) => {
    Keyboard.dismiss();
    isSelectingRef.current = true; 
    setSearchQuery(place.name || place.display_name.split(',')[0]);
    setSearchResults([]); 
    setPointB({
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
    });
    setTimeout(() => { isSelectingRef.current = false; }, 2000);
  };

  const fetchRoute = async () => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${pointA.longitude},${pointA.latitude};${pointB.longitude},${pointB.latitude}?overview=false`;
      const response = await fetch(url, { headers: { 'User-Agent': 'NapprApp/1.0' } });
      
      if (!response.ok) return;
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distNum = route.distance / 1000; 
        
        setRouteInfo({
          distance: distNum.toFixed(1),
          duration: Math.round(route.duration / 60)
        });

        if (radiusKm > distNum && distNum >= 0.1) {
          setRadiusKm(distNum);
          setRadiusInput(distNum.toFixed(1));
        }
      }
    } catch (error) {
      console.warn("Could not fetch route: ", error.message);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        let location = await Location.getLastKnownPositionAsync({});
        if (!location) {
          location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        }
        
        if (location) {
          setPointA({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      } catch (error) {
        console.warn(error);
      }
    })();
  }, []);

  useEffect(() => {
    fetchRoute();
  }, [pointA, pointB]);


  // ==========================================
  // === ADVANCED RADAR MATH & POSITIONING ====
  // ==========================================
  
  const maxAllowedRadius = routeInfo.distance > 0 ? Math.max(0.2, parseFloat(routeInfo.distance)) : 10.0;

  const handleRadiusSubmit = () => {
    let val = parseFloat(radiusInput);
    if (isNaN(val) || val < 0.1) val = 0.1;
    if (val > maxAllowedRadius) val = maxAllowedRadius; 
    
    setRadiusKm(val);
    setRadiusInput(val.toFixed(1));
  };

  const straightLineDistKm = getDistanceKm(pointA.latitude, pointA.longitude, pointB.latitude, pointB.longitude);
  const baseScale = routeInfo.distance > 0 ? parseFloat(routeInfo.distance) : straightLineDistKm;
  const radarMaxKm = Math.max(baseScale, radiusKm) * 1.2 || 1; 

  const RADAR_SCREEN_RADIUS = 120; 

  const userDistPx = Math.min((straightLineDistKm / radarMaxKm) * RADAR_SCREEN_RADIUS, RADAR_SCREEN_RADIUS);
  const wakeUpRadiusPx = Math.min((radiusKm / radarMaxKm) * RADAR_SCREEN_RADIUS, RADAR_SCREEN_RADIUS * 1.5);

  const dx = pointA.longitude - pointB.longitude;
  const dy = pointA.latitude - pointB.latitude;
  const angle = Math.atan2(dy, dx);
  
  const userX = Math.cos(angle) * userDistPx;
  const userY = -Math.sin(angle) * userDistPx; 
  const lineAngleDeg = Math.atan2(userY, userX) * (180 / Math.PI);

  return (
    <View style={styles.container}>
      <View style={{ zIndex: 10 }}> 
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search destination..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)} 
          />
          
          {searchQuery.length > 0 ? (
            <TouchableOpacity 
                onPress={() => {
                isSelectingRef.current = true;
                setSearchQuery('');
                setSearchResults([]); 
                setTimeout(() => { isSelectingRef.current = false; }, 500);
                }}
                style={{ padding: 5 }}
            >
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            ) : null}
        </View>

        {searchResults.length > 0 ? (
        <View style={styles.dropdown}>
            <ScrollView keyboardShouldPersistTaps="handled">
            {searchResults.map((place, index) => (
                <TouchableOpacity 
                key={index} 
                style={styles.dropdownItem}
                onPress={() => selectPlace(place)}
                >
                <Ionicons name="location-outline" size={16} color={theme.accentMint} style={{marginRight: 10}} />
                <Text style={styles.dropdownText} numberOfLines={1}>
                    {place.display_name}
                </Text>
                </TouchableOpacity>
            ))}
            </ScrollView>
        </View>
        ) : null}
      </View>

      {/* CUSTOM UI RADAR */}
      <View style={styles.radarWrapper}>
        <View style={styles.radarContainer}>
          
          <Animated.View style={[
            styles.pulseRing, 
            {
              width: wakeUpRadiusPx * 2,
              height: wakeUpRadiusPx * 2,
              borderRadius: wakeUpRadiusPx,
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
              opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] })
            }
          ]} />

          <View style={[
            styles.wakeUpRadius, 
            { 
              width: wakeUpRadiusPx * 2, 
              height: wakeUpRadiusPx * 2, 
              borderRadius: wakeUpRadiusPx 
            }
          ]} />

          {/* THE FIXED CONNECTING LINE (Dashed) */}
          <View style={[
            styles.trackingLine,
            {
              width: userDistPx,
              transform: [
                { rotate: `${lineAngleDeg}deg` }, 
                { translateX: userDistPx / 2 }
              ]
            }
          ]} />

          {/* Point B: Destination Target Base (Center) - Pure Icon */}
          <View style={styles.destinationTarget}>
            <Ionicons name="location" size={24} color={theme.accentMint} />
          </View>

          {/* Point A: User Location Blip - Pure Icon */}
          <View style={[styles.userBlip, { transform: [{ translateX: userX }, { translateY: userY }] }]}>
            <Ionicons name="person" size={18} color="#FFFFFF" />
          </View>

        </View>
      </View>

      <View style={styles.panelContainer}>
        <View style={styles.panelRow}>
          <Text style={styles.panelTitle}>WAKE-UP RADIUS</Text>
          
          <View style={styles.radiusInputContainer}>
            <TextInput
              style={styles.radiusValueInput}
              value={radiusInput}
              onChangeText={setRadiusInput}
              keyboardType="numeric"
              returnKeyType="done"
              onBlur={handleRadiusSubmit} 
              onSubmitEditing={handleRadiusSubmit} 
            />
            <Text style={styles.radiusValueKm}> km</Text>
            <Ionicons name="pencil" size={12} color={theme.accentMint} style={{marginLeft: 6, opacity: 0.7}} />
          </View>
        </View>
        
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0.1}
          maximumValue={maxAllowedRadius} 
          step={0.1}
          value={radiusKm}
          onValueChange={(val) => {
            setRadiusKm(val);
            setRadiusInput(val.toFixed(1)); 
          }}
          minimumTrackTintColor={theme.accentMint}
          maximumTrackTintColor="#333333"
          thumbTintColor={theme.accentMint}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>0.1 km</Text>
          <Text style={styles.sliderLabelText}>{maxAllowedRadius.toFixed(1)} km</Text>
        </View>

        <View style={[styles.panelRow, { marginTop: 20 }]}>
          <View>
            <Text style={styles.panelTitle}>INTENSE ALARM</Text>
            <Text style={styles.panelSubtitle}>Overrides silent mode</Text>
          </View>
          <Switch
            trackColor={{ false: '#333333', true: theme.accentMint }}
            thumbColor={'#FFFFFF'}
            onValueChange={() => setIsIntense(!isIntense)}
            value={isIntense}
          />
        </View>

        {routeInfo.distance > 0 ? (
          <View style={styles.estimateContainer}>
             <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
             <Text style={styles.estimateText}>
               Est. Commute: {routeInfo.duration} min ({routeInfo.distance} km)
             </Text>
          </View>
        ) : null}

        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => navigation.navigate('ActiveNap', { 
            destination: pointB, 
            radius: radiusKm,
            isIntense: isIntense
          })}
        >
          <Text style={styles.startButtonText}>START NAP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 50 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface, marginHorizontal: 20, borderRadius: 25, paddingHorizontal: 15, height: 50, marginBottom: 10 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: theme.textPrimary, fontSize: 16 },
  dropdown: { position: 'absolute', top: 65, left: 20, right: 20, backgroundColor: theme.surface, borderRadius: 15, padding: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10, maxHeight: 200 },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  dropdownText: { color: theme.textPrimary, fontSize: 14, flex: 1 },
  
  // === RADAR CONTAINER ===
  radarWrapper: { flex: 1, marginHorizontal: 20, marginVertical: 10, borderRadius: 20, backgroundColor: '#000000', borderWidth: 1, borderColor: '#1A1A1A', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  radarContainer: { width: 240, height: 240, justifyContent: 'center', alignItems: 'center' },
  
  wakeUpRadius: { position: 'absolute', borderWidth: 1.5, borderColor: theme.accentMint, backgroundColor: 'rgba(0, 245, 212, 0.05)' },
  pulseRing: { position: 'absolute', backgroundColor: theme.accentMint, borderRadius: 100 },
  
  trackingLine: { position: 'absolute', height: 1, borderBottomWidth: 1.5, borderColor: theme.accentMint, borderStyle: 'dashed', opacity: 0.6 },
  
  // PURE ICONS
  destinationTarget: { position: 'absolute', width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  userBlip: { position: 'absolute', width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  
  panelContainer: { backgroundColor: theme.surface, marginTop: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  panelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' },
  
  radiusInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 245, 212, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  radiusValueInput: { color: theme.accentMint, fontSize: 16, fontWeight: 'bold', minWidth: 25, textAlign: 'right' },
  radiusValueKm: { color: theme.accentMint, fontSize: 16, fontWeight: 'bold' },
  
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 },
  sliderLabelText: { color: theme.textSecondary, fontSize: 12 },
  panelSubtitle: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  estimateContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: -15 },
  estimateText: { color: theme.textSecondary, fontSize: 14, marginLeft: 6, fontWeight: '500' },
  startButton: { backgroundColor: theme.accentMint, borderRadius: 25, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  startButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
});