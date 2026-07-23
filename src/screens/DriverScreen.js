// src/screens/DriverScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, TextInput, Platform } from 'react-native';
import { Navigation, StopCircle, ArrowLeft, Search, MapPin } from 'lucide-react-native';

import { getVehicleIcon } from '../utils/vehicleIcons';
import { useAvailableVehicles } from '../hooks/useAvailableVehicles';
import { usePatrolTracking } from '../hooks/usePatrolTracking';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';

export default function DriverScreen({ onLogout }) {
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
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pilih Kenderaan</Text>
          <Text style={styles.subtitle}>Sila pilih kenderaan untuk syif anda</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search color={PALETTE.textMutedDark} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari no. plat atau jenis..."
            placeholderTextColor={PALETTE.textMutedDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loadingVehicles ? (
          <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
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
                style={[styles.vehicleCard, item.isBusy && styles.vehicleCardBusy]}
                onPress={() => { if (!item.isBusy) setSelectedVehicle(item); }}
                activeOpacity={item.isBusy ? 1 : 0.7}
                disabled={item.isBusy}
              >
                <View style={[styles.iconContainer, item.isBusy && { opacity: 0.4 }]}>
                  {getVehicleIcon(item.icon_key, PALETTE.orange, 32)}
                </View>

                <Text style={[styles.vehiclePlateText, item.isBusy && { opacity: 0.4 }]} numberOfLines={1}>
                  {item.reg || 'TIADA PLAT'}
                </Text>

                <Text style={[styles.vehicleNameText, item.isBusy && { opacity: 0.4 }]} numberOfLines={2}>
                  {item.model}
                </Text>

                {item.isBusy ? (
                  <View style={[styles.badge, { backgroundColor: PALETTE.dangerSoft }]}>
                    <Text style={[styles.badgeText, { color: PALETTE.danger }]}>Sedang Digunakan</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: PALETTE.successSoft }]}>
                    <Text style={[styles.badgeText, { color: PALETTE.success }]}>Tersedia</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Tiada kenderaan dijumpai.</Text>
            }
          />
        )}

      </View>
    );
  }

  // View 2: Tracking Screen
  return (
    <View style={styles.container}>

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
        <ArrowLeft color={PALETTE.textDark} size={22} />
        <Text style={styles.backText}>Tukar Kenderaan</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Pemandu</Text>
        <View style={styles.activeVehicleCard}>
          <View style={styles.activeVehicleIconWrap}>
            {getVehicleIcon(selectedVehicle.icon_key, PALETTE.orange, 32)}
          </View>
          <Text style={styles.activeVehiclePlate}>{selectedVehicle.reg || 'TIADA PLAT'}</Text>
          <Text style={styles.activeVehicleModel}>{selectedVehicle.model}</Text>
        </View>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>Status: {status}</Text>
        {location && (
          <Text style={styles.statusCoords}>
            Lat: {location.latitude.toFixed(5)} | Lng: {location.longitude.toFixed(5)}
          </Text>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSmall,
            { backgroundColor: isTracking ? PALETTE.danger : PALETTE.success }
          ]}
          onPress={handleToggleTracking}
          activeOpacity={0.85}
        >
          {isTracking ? <StopCircle color="#fff" size={30} /> : <Navigation color="#fff" size={30} />}
          <Text style={styles.btnTextSmall}>{isTracking ? 'TAMAT SYIF' : 'MULA SYIF'}</Text>
        </TouchableOpacity>

        {isTracking && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.buttonSmall,
              { backgroundColor: location ? PALETTE.orange : PALETTE.cardLightBorder }
            ]}
            onPress={handleMarkPoint}
            disabled={!location}
            activeOpacity={location ? 0.85 : 1}
          >
            <MapPin color="#fff" size={30} />
            <Text style={styles.btnTextSmall}>
              {location ? 'TANDA TITIK' : 'MENUNGGU GPS...'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {isTracking && <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: PALETTE.softOrangeBg },
  header: { marginBottom: 20, alignItems: 'center', width: '100%' },
  title: { fontSize: 26, fontWeight: '900', color: PALETTE.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: PALETTE.textMutedDark, fontWeight: '600' },
  emptyText: { color: PALETTE.textMutedDark, textAlign: 'center', marginTop: 20 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 15,
    borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    backgroundColor: PALETTE.cardLight, marginBottom: 20, height: 50,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 15, color: PALETTE.textDark, outlineStyle: 'none', outlineWidth: 0 },

  row: { justifyContent: 'space-between', marginBottom: 15 },
  vehicleCard: {
    width: '48%', padding: 16, borderRadius: 18, alignItems: 'center',
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  vehicleCardBusy: { opacity: 0.7, backgroundColor: PALETTE.surface },
  iconContainer: {
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)', marginBottom: 12,
  },
  vehiclePlateText: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark, marginBottom: 4, textAlign: 'center' },
  vehicleNameText: { fontSize: 12, color: PALETTE.textMutedDark, textAlign: 'center', marginBottom: 10, height: 34 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '800' },

  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark },

  activeVehicleCard: {
    alignItems: 'center', marginTop: 20, padding: 22, borderRadius: 18, width: '100%',
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  activeVehicleIconWrap: {
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  activeVehiclePlate: { color: PALETTE.textDark, fontSize: 19, fontWeight: '900', marginTop: 12 },
  activeVehicleModel: { color: PALETTE.textMutedDark, fontSize: 13, textAlign: 'center', marginTop: 4, fontWeight: '600' },

  statusBox: {
    marginBottom: 40, alignItems: 'center', padding: 18, borderRadius: 16, width: '100%',
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  statusText: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark },
  statusCoords: { color: PALETTE.textMutedDark, fontSize: 12, marginTop: 5 },

  actionRow: { flexDirection: 'row', gap: 20, alignItems: 'center', justifyContent: 'center' },
  button: {
    width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
  },
  buttonSmall: { width: 150, height: 150, borderRadius: 75 },
  btnTextSmall: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 8, textAlign: 'center' },
});