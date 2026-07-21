import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme/colors';

const STORAGE_KEY = '@nappr_saved_routes';

export default function SavedRoutesScreen({ navigation }) {
  const [routes, setRoutes] = useState([]);

  // useFocusEffect ensures the list re-fetches every time you open this screen
  // (so if you save a route in ActiveNap, it appears here immediately).
  useFocusEffect(
    useCallback(() => {
      loadRoutes();
    }, [])
  );

  const loadRoutes = async () => {
    try {
      const storedRoutes = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedRoutes !== null) {
        setRoutes(JSON.parse(storedRoutes));
      }
    } catch (e) {
      console.error('Failed to load routes.', e);
    }
  };

  const handleDeleteRoute = (idToRemove) => {
    Alert.alert(
      "Delete Route",
      "Are you sure you want to delete this saved route?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            const filteredRoutes = routes.filter(route => route.id !== idToRemove);
            try {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRoutes));
              setRoutes(filteredRoutes);
            } catch (e) {
              console.error('Failed to delete route.', e);
            }
          }
        }
      ]
    );
  };

  const handlePlayRoute = (item) => {
    // Quickly launch a nap using the saved coordinates and radius
    navigation.navigate('ActiveNap', {
      destination: item.destinationCoords,
      radius: parseFloat(item.radius)
    });
  };

  const renderRouteCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.routeName}>{item.name}</Text>
        <Text style={styles.routeDetails}>{item.start} → {item.destination}</Text>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>Wake {item.radius} km before</Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteRoute(item.id)}
        >
          <Ionicons name="trash-outline" size={22} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.playButton}
          onPress={() => handlePlayRoute(item)}
        >
          <Ionicons name="play" size={20} color={theme.background} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Saved Routes</Text>
      
      {routes.length === 0 ? (
        <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={60} color={theme.textSecondary} />
            <Text style={styles.emptyText}>No saved routes yet.</Text>
            <Text style={styles.emptySubtext}>Start a nap and tap the bookmark icon to save one.</Text>
        </View>
      ) : (
        <FlatList 
          data={routes}
          keyExtractor={item => item.id}
          renderItem={renderRouteCard}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 60 },
  headerTitle: { color: theme.textPrimary, fontSize: 28, fontWeight: 'bold', paddingHorizontal: 25, marginBottom: 20 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  
  // Empty State styling
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: -50 },
  emptyText: { color: theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  emptySubtext: { color: theme.textSecondary, fontSize: 13, marginTop: 8, paddingHorizontal: 40, textAlign: 'center', lineHeight: 20 },

  // Card styling
  card: {
    backgroundColor: theme.surface, 
    borderRadius: 18, 
    padding: 20,
    marginBottom: 15, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)'
  },
  cardInfo: { flex: 1, paddingRight: 15 },
  routeName: { color: theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 6, letterSpacing: 0.5 },
  routeDetails: { color: theme.textSecondary, fontSize: 13, marginBottom: 12 },
  tagContainer: {
    backgroundColor: 'rgba(0, 245, 212, 0.1)', 
    paddingVertical: 5, 
    paddingHorizontal: 10,
    borderRadius: 8, 
    alignSelf: 'flex-start',
  },
  tagText: { color: theme.accentMint, fontSize: 11, fontWeight: 'bold', letterSpacing: 0.5 },
  
  // Action Buttons
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  deleteButton: { padding: 10, marginRight: 8 },
  playButton: {
    backgroundColor: theme.accentMint, 
    width: 46, 
    height: 46,
    borderRadius: 23, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: theme.accentMint,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});