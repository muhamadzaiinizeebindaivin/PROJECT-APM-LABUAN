// src/screens/DriverScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, TextInput, Platform } from 'react-native';
import { Navigation, StopCircle, ArrowLeft, Search, MapPin } from 'lucide-react-native';

import { getVehicleIcon } from '../utils/vehicleIcons';
import { useAvailableVehicles } from '../hooks/useAvailableVehicles';
import { usePatrolTracking } from '../hooks/usePatrolTracking';
import { supabaseSandbox } from '../supabaseSandboxClient';

export default function DriverScreen({ onLogout, theme }) {
  const { vehicles, loading: loadingVehicles } = useAvailableVehicles();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Restaure la patrouille en cours si le driver recharge la page ou revient par erreur
  useEffect(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('apm_driver_active_vehicle');
      if (saved) {
        try {
          const parsedVehicle = JSON.parse(saved);
          setSelectedVehicle(parsedVehicle);
          setIsTracking(true);
        } catch (e) {}
      }
    }
  }, []);

  const { location, status, markPoint } = usePatrolTracking(
    selectedVehicle,
    isTracking,
    () => setIsTracking(false)
  );

  const handleToggleTracking = async () => {
    if (isTracking) {
      const doStop = () => {
        setIsTracking(false);
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          localStorage.removeItem('apm_driver_active_vehicle');
        }
      };
      if (Platform.OS === 'web') {
        if (window.confirm('Adakah anda pasti mahu tamatkan syif ini?')) doStop();
      } else {
        Alert.alert('Tamat Syif', 'Adakah anda pasti mahu tamatkan syif ini?', [
          { text: 'Batal', style: 'cancel' },
          { text: 'Ya, Tamatkan', style: 'destructive', onPress: doStop },
        ]);
      }
    } else {
      const STALE_JOB_THRESHOLD_MS = 12 * 60 * 60 * 1000; // même seuil que usePatrolTracking.js

      const { data: freshVehicle } = await supabaseSandbox
        .from('logistik')
        .select('tracking_status, job_started_at')
        .eq('id', selectedVehicle.id)
        .maybeSingle();

      const jobAgeMs = freshVehicle?.job_started_at
        ? Date.now() - new Date(freshVehicle.job_started_at).getTime()
        : null;
      const jobIsStale = jobAgeMs !== null && jobAgeMs > STALE_JOB_THRESHOLD_MS;

      if (freshVehicle?.tracking_status === 'Patrol' && !jobIsStale) {
        const label = selectedVehicle.reg || selectedVehicle.model;
        const message = `Kenderaan ${label} sedang digunakan oleh pemandu lain. Sila pilih kenderaan lain.`;
        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert('Kenderaan Sedang Digunakan', message);
        }
        return;
      }

      setIsTracking(true);
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem('apm_driver_active_vehicle', JSON.stringify(selectedVehicle));
      }
    }
  };

  const handleMarkPoint = () => {
    markPoint();
  };

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
                style={[
                  styles.vehicleCard,
                  { borderColor: theme.border || '#e5e7eb', backgroundColor: theme.cardBackground || '#fff' },
                  item.isBusy && styles.vehicleCardBusy,
                ]}
                onPress={() => { if (!item.isBusy) setSelectedVehicle(item); }}
                activeOpacity={item.isBusy ? 1 : 0.7}
                disabled={item.isBusy}
              >
                <View style={[styles.iconContainer, { backgroundColor: (theme.accent || '#3b82f6') + '15' }, item.isBusy && { opacity: 0.4 }]}>
                  {getVehicleIcon(item.icon_key, theme.accent || '#3b82f6', 32)}
                </View>

                <Text style={[styles.vehiclePlateText, { color: theme.text }, item.isBusy && { opacity: 0.4 }]} numberOfLines={1}>
                  {item.reg || 'TIADA PLAT'}
                </Text>

                <Text style={[styles.vehicleNameText, { color: theme.textSecondary }, item.isBusy && { opacity: 0.4 }]} numberOfLines={2}>
                  {item.model}
                </Text>

                {item.isBusy ? (
                  <View style={[styles.badge, { backgroundColor: '#fee2e2' }]}>
                    <Text style={[styles.badgeText, { color: '#991b1b' }]}>Sedang Digunakan</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
                    <Text style={[styles.badgeText, { color: '#166534' }]}>Tersedia</Text>
                  </View>
                )}
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
          {getVehicleIcon(selectedVehicle.icon_key, theme.accent || '#3b82f6', 32)}
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
        onPress={handleToggleTracking}
        activeOpacity={0.8}
      >
        {isTracking ? <StopCircle color="#fff" size={36} /> : <Navigation color="#fff" size={36} />}
        <Text style={styles.btnText}>{isTracking ? 'TAMAT SYIF' : 'MULA SYIF'}</Text>
      </TouchableOpacity>

      {isTracking && (
        <TouchableOpacity
          style={styles.markPointBtn}
          onPress={handleMarkPoint}
          activeOpacity={0.8}
        >
          <MapPin color="#fff" size={22} />
          <Text style={styles.markPointBtnText}>TANDA TITIK</Text>
        </TouchableOpacity>
      )}

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
  vehicleCardBusy: { opacity: 0.7, backgroundColor: '#f8fafc' },
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
  markPointBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f97316', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, marginTop: 24 },
  markPointBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  markPointBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f97316', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, marginTop: 24 },
  markPointBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  btnText: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 10 }
});
