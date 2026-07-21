import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme/colors';

const HISTORY_STORAGE_KEY = '@nappr_history';

export default function HistoryScreen({ navigation }) {
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const storedHistory = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
        if (storedHistory) {
          const parsedHistory = JSON.parse(storedHistory);
          setHistoryData(parsedHistory.reverse());
        }
      } catch (e) {
        console.error("Failed to load nap history:", e);
      }
    };

    loadHistory();

    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });

    return unsubscribe;
  }, [navigation]);

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to delete all your nap history? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
              setHistoryData([]); 
            } catch (e) {
              Alert.alert("Error", "Failed to clear history.");
            }
          }
        }
      ]
    );
  };

  const renderHistoryCard = ({ item }) => {
    const isCompleted = item.status === 'Completed';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.dateContainer}>
            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} style={{ marginRight: 5 }} />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isCompleted ? 'rgba(0, 245, 212, 0.1)' : 'rgba(255, 76, 76, 0.1)' }]}>
            <Text style={[styles.statusText, { color: isCompleted ? theme.accentMint : theme.danger }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeLine}>
            <View style={styles.dotStart} />
            <View style={styles.verticalLine} />
            <View style={styles.dotEnd} />
          </View>
          <View style={styles.routeDetails}>
            <Text style={styles.locationText}>{item.start}</Text>
            <View style={{ height: 15 }} /> 
            <Text style={styles.locationText}>{item.destination}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={styles.footerText}>{item.duration}</Text>
          </View>
          
          {item.distance && (
            <View style={styles.footerItem}>
              <Ionicons name="map-outline" size={14} color={theme.textSecondary} />
              <Text style={styles.footerText}>{item.distance}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="moon" size={60} color="#222" />
      <Text style={styles.emptyText}>No naps recorded yet.</Text>
      <Text style={styles.emptySubtext}>Your completed and cancelled naps will appear here.</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Nap History</Text>
        {historyData.length > 0 && (
          <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton} activeOpacity={0.6}>
            <Ionicons name="trash-outline" size={24} color={theme.danger} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList 
        data={historyData}
        keyExtractor={item => item.id}
        renderItem={renderHistoryCard}
        ListEmptyComponent={renderEmptyState}
        // FIX: Replaced { flex: 1 } with flexGrow and justifyContent logic for the empty state
        contentContainerStyle={historyData.length === 0 ? styles.emptyListContainer : styles.listContainer}
        showsVerticalScrollIndicator={false}
        scrollEnabled={historyData.length > 0} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 60 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { color: theme.textPrimary, fontSize: 28, fontWeight: 'bold' },
  clearButton: { padding: 8, marginRight: -8 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  
  // NEW: specific container style to strictly center the empty component
  emptyListContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  
  card: { backgroundColor: theme.surface, borderRadius: 15, padding: 20, marginBottom: 15, width: '100%' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  dateContainer: { flexDirection: 'row', alignItems: 'center' },
  dateText: { color: theme.textSecondary, fontSize: 14, fontWeight: '500' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  routeContainer: { flexDirection: 'row', marginBottom: 15 },
  routeLine: { alignItems: 'center', marginRight: 15, marginTop: 2 },
  dotStart: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: theme.textSecondary },
  verticalLine: { width: 2, height: 20, backgroundColor: '#333', marginVertical: 2 },
  dotEnd: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.accentMint },
  routeDetails: { flex: 1, justifyContent: 'space-between' },
  locationText: { color: theme.textPrimary, fontSize: 16, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#222', paddingTop: 15, marginTop: 5 },
  footerItem: { flexDirection: 'row', alignItems: 'center', marginRight: 25 },
  footerText: { color: theme.textSecondary, fontSize: 14, marginLeft: 6 },
  
  // FIX: Removed flex: 1 and margins here since the parent container now handles centering
  emptyContainer: { alignItems: 'center', paddingBottom: 60 }, 
  emptyText: { color: theme.textPrimary, fontSize: 18, fontWeight: 'bold', marginTop: 15 },
  emptySubtext: { color: theme.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});