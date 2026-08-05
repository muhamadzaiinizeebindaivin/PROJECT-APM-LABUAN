// src/screens/DriverScreen.js
import React, { useState, useEffect, createElement } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, TextInput, Platform } from 'react-native';
import { Navigation, StopCircle, ArrowLeft, Search, MapPin, Eye, EyeOff, Lock } from 'lucide-react-native';

import { getVehicleIcon } from '../utils/vehicleIcons';
import { useAvailableVehicles } from '../hooks/useAvailableVehicles';
import { usePatrolTracking } from '../hooks/usePatrolTracking';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';

const DRIVER_ACCESS_KEY = 'apm_driver_access_verified';

// Rubans dégradés bleu/orange qui ondulent lentement, effet "peinture dans l'eau"
// (repris tel quel de SetPasswordScreen.js)
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('flowing-ribbons-css')) {
  const style = document.createElement('style');
  style.id = 'flowing-ribbons-css';
  style.textContent = `
    @keyframes ribbonDrift1 {
      0%, 100% { transform: translate(0px, 0px) scale(1); }
      50% { transform: translate(60px, -30px) scale(1.05); }
    }
    @keyframes ribbonDrift2 {
      0%, 100% { transform: translate(0px, 0px) scale(1); }
      50% { transform: translate(-50px, 40px) scale(1.08); }
    }
    @keyframes ribbonDrift3 {
      0%, 100% { transform: translate(0px, 0px) scale(1); }
      50% { transform: translate(40px, 30px) scale(1.04); }
    }
    .ribbon-1 { animation: ribbonDrift1 11s ease-in-out infinite; }
    .ribbon-2 { animation: ribbonDrift2 14s ease-in-out infinite; }
    .ribbon-3 { animation: ribbonDrift3 9s ease-in-out infinite; }
  `;
  document.head.appendChild(style);
}

function FlowingBackground() {
  if (Platform.OS !== 'web') return null;
  return (
    <View style={[bgStyles.container, { pointerEvents: 'none' }]}>
      {createElement('svg', {
        viewBox: '0 0 1200 800',
        preserveAspectRatio: 'xMidYMid slice',
        style: { width: '100%', height: '100%', position: 'absolute' },
      },
        createElement('defs', {},
          createElement('linearGradient', { id: 'ribbonGrad1', x1: '0%', y1: '0%', x2: '100%', y2: '100%' },
            createElement('stop', { offset: '0%', stopColor: '#f97316' }),
            createElement('stop', { offset: '50%', stopColor: '#fb923c' }),
            createElement('stop', { offset: '100%', stopColor: '#60a5fa' }),
          ),
          createElement('linearGradient', { id: 'ribbonGrad2', x1: '100%', y1: '0%', x2: '0%', y2: '100%' },
            createElement('stop', { offset: '0%', stopColor: '#2563eb' }),
            createElement('stop', { offset: '50%', stopColor: '#60a5fa' }),
            createElement('stop', { offset: '100%', stopColor: '#f97316' }),
          ),
          createElement('linearGradient', { id: 'ribbonGrad3', x1: '0%', y1: '100%', x2: '100%', y2: '0%' },
            createElement('stop', { offset: '0%', stopColor: '#fb923c' }),
            createElement('stop', { offset: '100%', stopColor: '#2563eb' }),
          ),
        ),
        createElement('path', {
          className: 'ribbon-1',
          d: 'M -100,150 C 200,50 400,250 700,150 C 950,70 1100,180 1300,120 L 1300,220 C 1100,280 950,170 700,250 C 400,350 200,150 -100,250 Z',
          fill: 'url(#ribbonGrad1)', opacity: 0.35,
        }),
        createElement('path', {
          className: 'ribbon-2',
          d: 'M -100,420 C 250,320 450,480 750,380 C 1000,300 1150,420 1300,360 L 1300,460 C 1150,520 1000,400 750,480 C 450,580 250,420 -100,520 Z',
          fill: 'url(#ribbonGrad2)', opacity: 0.3,
        }),
        createElement('path', {
          className: 'ribbon-3',
          d: 'M -100,650 C 200,580 500,700 800,600 C 1000,540 1150,650 1300,600 L 1300,700 C 1150,750 1000,640 800,700 C 500,800 200,680 -100,750 Z',
          fill: 'url(#ribbonGrad3)', opacity: 0.28,
        }),
      )}
    </View>
  );
}

const bgStyles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
});

export default function DriverScreen({ onLogout }) {
  const { vehicles, loading: loadingVehicles } = useAvailableVehicles();

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [accessVerified, setAccessVerified] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessFocused, setAccessFocused] = useState(false);

  // Vérifie s'il existe une vraie session Supabase active (pas juste un drapeau local)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabaseSandbox.auth.getSession();
      setAccessVerified(!!session);
      setCheckingAccess(false);
    };
    checkSession();
  }, []);

  const handleVerifyAccess = async () => {
    if (!accessCode.trim()) {
      Alert.alert('Ralat', 'Sila masukkan kod akses.');
      return;
    }
    setVerifying(true);

    const { data: authData, error: authError } = await supabaseSandbox.auth.signInAnonymously();
    if (authError || !authData?.user) {
      Alert.alert('Ralat', 'Gagal memulakan sesi. Sila cuba lagi.');
      setVerifying(false);
      return;
    }

    const { error } = await supabaseSandbox.rpc('join_driver', { p_code: accessCode.trim() });
    if (error) {
      Alert.alert('Ralat', error.message?.includes('Invalid access code') ? 'Kod akses tidak sah.' : 'Gagal mengesahkan kod. Sila cuba lagi.');
      setVerifying(false);
      return;
    }

    setAccessVerified(true);
    setVerifying(false);
  };

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
    () => setIsTracking(false),
    () => {
      setIsTracking(false);
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.removeItem('apm_driver_active_vehicle');
      }
      Alert.alert('Syif Ditamatkan', 'Syif anda telah ditamatkan oleh pentadbir.');
    }
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

  if (checkingAccess) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

  if (!accessVerified) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <FlowingBackground />
        <View style={styles.authCard}>
          <View style={styles.authBanner}>
            <Text style={styles.authKicker}>APM W.P LABUAN</Text>
            <Text style={styles.authBannerTitle}>Kod Akses Pemandu</Text>
            <Text style={styles.authBannerSubtitle}>Masukkan kod akses untuk teruskan</Text>
          </View>

          <View style={styles.authBody}>
            <View style={[styles.authInputGroup, accessFocused && styles.authInputGroupFocused]}>
              <View style={styles.authInputIconWrap}>
                <Lock size={17} color={accessFocused ? PALETTE.orange : '#94a3b8'} />
              </View>
              <TextInput
                style={styles.authInput}
                placeholder="Kod akses"
                placeholderTextColor="#94a3b8"
                value={accessCode}
                onChangeText={setAccessCode}
                secureTextEntry={!showAccessCode}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleVerifyAccess}
                onFocus={() => setAccessFocused(true)}
                onBlur={() => setAccessFocused(false)}
              />
              <TouchableOpacity style={styles.authEyeBtn} onPress={() => setShowAccessCode(v => !v)}>
                {showAccessCode ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.authSaveButton, verifying && { opacity: 0.7 }]}
              onPress={handleVerifyAccess}
              disabled={verifying}
            >
              {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.authSaveButtonText}>Sahkan</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

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

  authCard: {
    width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  authBanner: { backgroundColor: '#0c0c0e', padding: 24, paddingBottom: 28 },
  authKicker: { fontSize: 10, fontWeight: '800', color: PALETTE.orange, letterSpacing: 2, textTransform: 'uppercase' },
  authBannerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', marginTop: 3 },
  authBannerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  authBody: { padding: 24, gap: 4, backgroundColor: '#fff' },
  authInputGroup: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: '#f8fafc', marginBottom: 12,
  },
  authInputGroupFocused: { borderColor: PALETTE.orange, backgroundColor: 'rgba(249, 115, 22, 0.04)' },
  authInputIconWrap: { marginRight: 10 },
  authEyeBtn: { paddingLeft: 10 },
  authInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0f172a', outlineStyle: 'none' },
  authSaveButton: {
    flexDirection: 'row', backgroundColor: PALETTE.orange, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10,
  },
  authSaveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
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
  joinButton: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: PALETTE.orange },
  joinButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  button: {
    width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
  },
  buttonSmall: { width: 150, height: 150, borderRadius: 75 },
  btnTextSmall: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 8, textAlign: 'center' },
});