import React from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/colors';

// Mock data to show what a populated history looks like
const NAP_HISTORY = [
  { id: '1', date: 'Today, 8:30 AM', start: 'Obando', destination: 'PUP Manila', duration: '45 min', status: 'Completed' },
  { id: '2', date: 'Yesterday, 5:15 PM', start: 'PUP Manila', destination: 'Obando', duration: '55 min', status: 'Completed' },
  { id: '3', date: 'Mon, 7:00 AM', start: 'Home', destination: 'LRT Monumento', duration: '20 min', status: 'Cancelled' },
  { id: '4', date: 'Fri, 9:00 PM', start: 'SM North', destination: 'Home', duration: '35 min', status: 'Completed' },
];

export default function HistoryScreen() {
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
            <View style={{ height: 15 }} /> {/* Spacing */}
            <Text style={styles.locationText}>{item.destination}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
          <Text style={styles.durationText}>Nap Duration: {item.duration}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Nap History</Text>
      <FlatList 
        data={NAP_HISTORY}
        keyExtractor={item => item.id}
        renderItem={renderHistoryCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingTop: 60 },
  headerTitle: { color: theme.textPrimary, fontSize: 28, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 20 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  card: { backgroundColor: theme.surface, borderRadius: 15, padding: 20, marginBottom: 15 },
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
  durationText: { color: theme.textSecondary, fontSize: 14, marginLeft: 5 },
});