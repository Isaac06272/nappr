import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';

// Mock data based on your location
const SAVED_ROUTES = [
  { id: '1', name: 'Home to Work', start: 'Obando', destination: 'PUP Manila', radius: '1.0 mi' },
  { id: '2', name: 'Campus Express', start: 'School', destination: 'LRT Monumento', radius: '0.5 mi' },
  { id: '3', name: 'Weekend Route', start: 'Home', destination: 'SM North EDSA', radius: '2.0 mi' },
];

export default function SavedRoutesScreen() {
  const renderRouteCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardInfo}>
        <Text style={styles.routeName}>{item.name}</Text>
        <Text style={styles.routeDetails}>{item.start} → {item.destination}</Text>
        <View style={styles.tagContainer}>
          <Text style={styles.tagText}>Wake {item.radius} before</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.playButton}>
        <Ionicons name="play" size={24} color={theme.background} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Saved Routes</Text>
      
      <FlatList 
        data={SAVED_ROUTES}
        keyExtractor={item => item.id}
        renderItem={renderRouteCard}
        contentContainerStyle={styles.listContainer}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={30} color={theme.background} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 60 },
  headerTitle: { color: theme.textPrimary, fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 20 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    backgroundColor: theme.surface, borderRadius: 15, padding: 20,
    marginBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cardInfo: { flex: 1 },
  routeName: { color: theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  routeDetails: { color: theme.textSecondary, fontSize: 14, marginBottom: 10 },
  tagContainer: {
    backgroundColor: 'rgba(0, 245, 212, 0.1)', paddingVertical: 4, paddingHorizontal: 8,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  tagText: { color: theme.accentMint, fontSize: 12, fontWeight: 'bold' },
  playButton: {
    backgroundColor: theme.accentMint, width: 50, height: 50,
    borderRadius: 25, justifyContent: 'center', alignItems: 'center',
  },
  fab: {
    position: 'absolute', bottom: 20, right: 20, backgroundColor: theme.accentMint,
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.accentMint, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5,
  }
});