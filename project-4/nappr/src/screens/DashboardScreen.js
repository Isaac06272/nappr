import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Switch, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from '../theme/colors';

export default function DashboardScreen({ navigation }) {
  const [radius, setRadius] = useState(1.0);
  const [isIntense, setIsIntense] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  
  const [routeInfo, setRouteInfo] = useState({ distance: 0, duration: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  const abortControllerRef = useRef(null);
  const isSelectingRef = useRef(false); 
  
  // Default coordinates (Obando)
  const [pointA, setPointA] = useState({ latitude: 14.7150, longitude: 120.9351 });
  const [pointB, setPointB] = useState({ latitude: 14.6540, longitude: 120.9839 });

  const region = {
    latitude: (pointA.latitude + pointB.latitude) / 2,
    longitude: (pointA.longitude + pointB.longitude) / 2,
    latitudeDelta: 0.15, 
    longitudeDelta: 0.15,
  };

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
      
      const response = await fetch(url, {
        signal, 
        headers: { 'User-Agent': 'NapprApp_Radar/1.0' }
      });

      if (response.status === 429) return;
      if (!response.ok) return;

      const data = await response.json();
      if (signal.aborted) return;
      
      if (Array.isArray(data)) setSearchResults(data);
      
    } catch (error) {
      if (error.name === 'AbortError') return;
      setSearchResults([]);
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
      const url = `https://router.project-osrm.org/route/v1/driving/${pointA.longitude},${pointA.latitude};${pointB.longitude},${pointB.latitude}?overview=full&geometries=geojson`;
      const response = await fetch(url, { headers: { 'User-Agent': 'NapprApp/1.0' } });
      
      if (!response.ok) return;

      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        setRouteInfo({
          distance: (route.distance / 1609.34).toFixed(1),
          duration: Math.round(route.duration / 60)
        });

        const coords = route.geometry.coordinates.map(coord => ({
          latitude: coord[1],
          longitude: coord[0]
        }));
        setRouteCoords(coords);
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

      {/* PURE RADAR MAP */}
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map} 
          region={region}
          mapType="standard" 
          customMapStyle={pitchBlackStyle} // Forces the background to be true black
          scrollEnabled={false} 
          zoomEnabled={false}   
          pitchEnabled={false}
          rotateEnabled={false}
        >
          {routeCoords.length > 0 && (
            <Polyline 
              coordinates={routeCoords}
              strokeColor={theme.accentMint}
              strokeWidth={3}
              lineDashPattern={[10, 10]} 
            />
          )}

          <Marker coordinate={pointA} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userDot} />
          </Marker>

          <Marker coordinate={pointB} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.destinationDot} />
          </Marker>

          <Circle
            center={pointB}
            radius={radius * 1609.34} 
            strokeWidth={1.5}
            strokeColor={theme.accentMint}
            fillColor="rgba(0, 245, 212, 0.05)"
          />
        </MapView>
      </View>

      <View style={styles.panelContainer}>
        <View style={styles.panelRow}>
          <Text style={styles.panelTitle}>WAKE-UP RADIUS</Text>
          <Text style={styles.radiusValue}>{radius.toFixed(1)} mi</Text>
        </View>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0.1}
          maximumValue={5.0}
          step={0.1}
          value={radius}
          onValueChange={(val) => setRadius(val)}
          minimumTrackTintColor={theme.accentMint}
          maximumTrackTintColor="#333333"
          thumbTintColor={theme.accentMint}
        />
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabelText}>0.1 mi</Text>
          <Text style={styles.sliderLabelText}>5.0 mi</Text>
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

        {routeInfo.distance > 0 && (
          <View style={styles.estimateContainer}>
             <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
             <Text style={styles.estimateText}>
               Est. Commute: {routeInfo.duration} min ({routeInfo.distance} mi)
             </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => navigation.navigate('ActiveNap', { 
            destination: pointB, 
            radius: radius,
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
  mapContainer: { flex: 1, marginHorizontal: 20, marginVertical: 10, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000000', borderWidth: 1, borderColor: '#1A1A1A', zIndex: 1, minHeight: 300 },
  
  // THE HACK: Pushes the map size way past the container to hide the Google Logo
  map: { width: '100%', height: '130%', marginBottom: '-30%' },
  
  userDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'transparent', borderWidth: 2, borderColor: '#888888' },
  destinationDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.accentMint, shadowColor: theme.accentMint, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  panelContainer: { backgroundColor: theme.surface, marginTop: 20, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  panelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' },
  radiusValue: { color: theme.accentMint, fontSize: 16, fontWeight: 'bold' },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -10 },
  sliderLabelText: { color: theme.textSecondary, fontSize: 12 },
  panelSubtitle: { color: theme.textSecondary, fontSize: 12, marginTop: 4 },
  estimateContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: -15 },
  estimateText: { color: theme.textSecondary, fontSize: 14, marginLeft: 6, fontWeight: '500' },
  startButton: { backgroundColor: theme.accentMint, borderRadius: 25, height: 55, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  startButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
});

// THE PITCH BLACK MAP STYLE
const pitchBlackStyle = [
  { elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', stylers: [{ color: '#000000' }] }
];