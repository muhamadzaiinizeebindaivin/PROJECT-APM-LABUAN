// src/screens/DriverScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, TextInput } from 'react-native';
import { Navigation, StopCircle, ArrowLeft, Search } from 'lucide-react-native';

import { getVehicleIcon } from '../utils/vehicleIcons';
import { useAvailableVehicles } from '../hooks/useAvailableVehicles';
import { usePatrolTracking } from '../hooks/usePatrolTracking';

export default function DriverScreen({ onLogout, theme }) {
  const { vehicles, loading: loadingVehicles } = useAvailableVehicles();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { location, status } = usePatrolTracking(
    selectedVehicle,
    isTracking,
    () => setIsTracking(false)
  );

  // Filter vehicles based on search query
  const filteredVehicles = vehicles.filter(v =>
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.reg || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // View 1: Vehicle Selection Screen
  if (!selectedVehicle) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Pilih Kenderaan</Text>
          <Text style={{ color: theme.textSecondary }}>Sila pilih kenderaan untuk syif anda</Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.cardBackground || '#fff', borderColor: theme.border || '#ccc' }]}>
          <Search color={theme.textSecondary} size={20} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cari no. plat atau jenis..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loadingVehicles ? (
          <ActivityIndicator size="large" color={theme.accent || '#3b82f6'} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredVehicles}
            keyExtractor={(item) => item.id}
            style={{ width: '100%' }}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.vehicleCard, { borderColor: theme.border || '#e5e7eb', backgroundColor: theme.cardBackground || '#fff' }]}
                onPress={() => setSelectedVehicle(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: (theme.accent || '#3b82f6') + '15' }]}>
                  {getVehicleIcon('driver', item.type, theme.accent || '#3b82f6', 32)}
                </View>

                <Text style={[styles.vehiclePlateText, { color: theme.text }]} numberOfLines={1}>
                  {item.reg || 'TIADA PLAT'}
                </Text>

                <Text style={[styles.vehicleNameText, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.model}
                </Text>

                <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                  <Text style={[styles.badgeText, { color: '#166534' }]}>Tersedia</Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>
                Tiada kenderaan dijumpai.
              </Text>
            }
          />
        )}

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Log Keluar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // View 2: Tracking Screen
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (isTracking) {
            Alert.alert("Amaran", "Sila hentikan syif sebelum menukar kenderaan.");
            return;
          }
          setSelectedVehicle(null);
        }}
      >
        <ArrowLeft color={theme.text} size={24} />
        <Text style={[styles.backText, { color: theme.text }]}>Tukar Kenderaan</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Pemandu</Text>
        <View style={styles.activeVehicleCard}>
          {getVehicleIcon('driver', selectedVehicle.type, theme.accent || '#3b82f6', 32)}
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: 'bold', marginTop: 10 }}>
            {selectedVehicle.reg || 'TIADA PLAT'}
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 5 }}>
            {selectedVehicle.model}
          </Text>
        </View>
      </View>

      <View style={[styles.statusBox, { borderColor: theme.border || '#ccc', backgroundColor: theme.cardBackground || '#fff' }]}>
        <Text style={[styles.statusText, { color: theme.text }]}>Status: {status}</Text>
        {location && (
          <Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 5 }}>
            Lat: {location.latitude.toFixed(5)} | Lng: {location.longitude.toFixed(5)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isTracking ? '#ef4444' : '#22c55e' }
        ]}
        onPress={() => setIsTracking(!isTracking)}
        activeOpacity={0.8}
      >
        {isTracking ? <StopCircle color="#fff" size={36} /> : <Navigation color="#fff" size={36} />}
        <Text style={styles.btnText}>{isTracking ? 'TAMAT SYIF' : 'MULA SYIF'}</Text>
      </TouchableOpacity>

      {isTracking && <ActivityIndicator size="large" color={theme.accent || '#3b82f6'} style={{ marginTop: 20 }} />}

      <TouchableOpacity onPress={onLogout} style={{ marginTop: 'auto', paddingBottom: 20 }}>
        <Text style={{ color: theme.textSecondary, textDecorationLine: 'underline' }}>Log Keluar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 50 },
  header: { marginBottom: 20, alignItems: 'center', width: '100%' },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 16 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  vehicleCard: { width: '48%', padding: 15, borderWidth: 1, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  vehiclePlateText: { fontSize: 16, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  vehicleNameText: { fontSize: 12, textAlign: 'center', marginBottom: 10, height: 34 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  logoutBtn: { paddingVertical: 15, marginTop: 10 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { fontSize: 16, marginLeft: 5, fontWeight: '600' },
  activeVehicleCard: { alignItems: 'center', marginTop: 20, padding: 20, borderRadius: 16, width: '100%' },
  statusBox: { marginBottom: 40, alignItems: 'center', padding: 20, borderWidth: 1, borderRadius: 16, width: '100%', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  button: { width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 10 }
});
