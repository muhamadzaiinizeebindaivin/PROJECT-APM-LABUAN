// src/screens/AgencyTrackingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, TextInput, Platform, Image, Modal } from 'react-native';
import * as Location from 'expo-location';

// Sur web (notamment Safari iOS), on contourne expo-location et on utilise
// directement l'API native du navigateur — plus fiable, évite les bugs du
// shim web d'expo-location qui peut ne jamais déclencher le callback.
const requestPermissionCompat = async () => {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return { status: 'unavailable' };
    }
    return { status: 'granted' };
  }
  return Location.requestForegroundPermissionsAsync();
};

const watchPositionCompat = (callback, onError) => {
  if (Platform.OS === 'web') {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      onError?.(new Error('Geolocation tidak disokong pada pelayar ini.'));
      return Promise.resolve(null);
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => callback({ coords: pos.coords }),
      (err) => onError?.(err),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    return Promise.resolve({ remove: () => navigator.geolocation.clearWatch(watchId) });
  }
  return Location.watchPositionAsync(
    { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2 },
    callback
  );
};
import { Navigation, StopCircle, ArrowLeft, Search, Building2, X, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';

const STORAGE_KEY = 'apm_agency_session';

const saveSession = (data) => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
};

const loadSession = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
  return null;
};

const clearSession = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// Distance en km entre deux points GPS (formule de Haversine)
const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function AgencyLogo({ url, size, fallbackSize }) {
  if (url) {
    return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />;
  }
  return <Building2 color={PALETTE.orange} size={fallbackSize} />;
}

export default function AgencyTrackingScreen({ onLogout }) {
  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState(null);
  const lastSelectedAgencyRef = useRef(null);
  if (selectedAgency) lastSelectedAgencyRef.current = selectedAgency;

  const [memberName, setMemberName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const accessCodeInputRef = useRef(null);
  const [trackerId, setTrackerId] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);

  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('Sedia');
  const [isRestoring, setIsRestoring] = useState(true);

  const jobStartTimeRef = useRef(null);
  const lastCoordsRef = useRef(null);
  const distanceAccumRef = useRef(0);
  const wasTrackingRef = useRef(false);


  useEffect(() => {
    let isMounted = true;
    const fetchAgencies = async () => {
      const { data, error } = await supabase
        .from('jpbd_directory')
        .select('id, agency, logo_url')
        .order('agency', { ascending: true });

      if (data && isMounted) setAgencies(data);
      if (error) console.error(error);
      setLoadingAgencies(false);
    };
    fetchAgencies();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const restore = async () => {
      const saved = loadSession();
      if (saved?.trackerId && saved?.selectedAgency && saved?.memberName) {
        // Vérifie que la session Supabase Auth anonyme est toujours valide — sans ça, les
        // update() vers agency_trackers échoueraient silencieusement côté RLS (has_role()),
        // alors que l'écran affiche à tort un tracker actif.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          clearSession();
          setIsRestoring(false);
          return;
        }

        // Vérifie que le tracker existe toujours en base
        const { data } = await supabase
          .from('agency_trackers')
          .select('id, tracking_status')
          .eq('id', saved.trackerId)
          .maybeSingle();

        if (data) {
          setSelectedAgency(saved.selectedAgency);
          setMemberName(saved.memberName);
          setTrackerId(saved.trackerId);
          setIsTracking(data.tracking_status === 'Online');
        } else {
          clearSession();
        }
      }
      setIsRestoring(false);
    };
    restore();
  }, []);

  const handleJoin = async () => {
    if (!memberName.trim()) {
      setJoinError('Sila masukkan nama anda.');
      return;
    }
    if (!accessCode.trim()) {
      setJoinError('Sila masukkan kod akses agensi.');
      return;
    }
    setJoinError(null);
    setJoining(true);

    // Session anonyme requise pour que RLS (has_role) fonctionne côté agency_trackers/profiles
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError || !authData?.user) {
      setJoinError('Gagal memulakan sesi. Sila cuba lagi.');
      setJoining(false);
      return;
    }

    const { data: trackerId, error } = await supabase.rpc('join_agency', {
      p_agency_id: selectedAgency.id,
      p_code: accessCode.trim(),
      p_member_name: memberName.trim(),
    });

    if (error) {
      setJoinError(error.message?.includes('Invalid access code') ? 'Kod akses tidak sah.' : 'Gagal mendaftar. Sila cuba lagi.');
      setJoining(false);
      return;
    }

    setTrackerId(trackerId);
    saveSession({ selectedAgency, memberName: memberName.trim(), trackerId });
    setJoining(false);
  };

  const closeJoinModal = () => {
    setSelectedAgency(null);
    setMemberName('');
    setAccessCode('');
    setJoinError(null);
  };

  useEffect(() => {
    let subscriptionPromise = null;
    let isMounted = true;

    const startWatching = async () => {
      let { status: permStatus } = await requestPermissionCompat();
      if (permStatus !== 'granted') {
        if (isMounted) {
          Alert.alert('Akses Ditolak', 'Sila benarkan akses lokasi untuk menjejak.');
          setIsTracking(false);
        }
        return;
      }

      // Récupère l'état persisté en base (survit à un rechargement de page)
      const { data: existingRow } = await supabase
        .from('agency_trackers')
        .select('current_job_started_at, current_job_distance_km, latitude, longitude')
        .eq('id', trackerId)
        .maybeSingle();

      if (existingRow?.current_job_started_at) {
        // Un travail était déjà en cours avant le rechargement -> on reprend où on en était
        jobStartTimeRef.current = new Date(existingRow.current_job_started_at).getTime();
        distanceAccumRef.current = existingRow.current_job_distance_km || 0;
        lastCoordsRef.current = (existingRow.latitude && existingRow.longitude)
          ? { latitude: existingRow.latitude, longitude: existingRow.longitude }
          : null;
      } else {
        // Nouveau travail -> on initialise proprement, y compris en base
        jobStartTimeRef.current = Date.now();
        distanceAccumRef.current = 0;
        lastCoordsRef.current = null;

        await supabase
          .from('agency_trackers')
          .update({
            current_job_started_at: new Date(jobStartTimeRef.current).toISOString(),
            current_job_distance_km: 0,
          })
          .eq('id', trackerId);
      }

      wasTrackingRef.current = true;

      await supabase.from('agency_trackers').update({ tracking_status: 'Online' }).eq('id', trackerId);

      subscriptionPromise = watchPositionCompat(
        async (loc) => {
          if (!isMounted) return;
          setLocation(loc.coords);
          setStatus('Mengemaskini Pangkalan Data...');

          if (lastCoordsRef.current) {
            const delta = haversineDistanceKm(
              lastCoordsRef.current.latitude, lastCoordsRef.current.longitude,
              loc.coords.latitude, loc.coords.longitude
            );
            distanceAccumRef.current += delta;
          }
          lastCoordsRef.current = loc.coords;

          const { error } = await supabase
            .from('agency_trackers')
            .update({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              last_updated: new Date().toISOString(),
              tracking_status: 'Online',
              current_job_distance_km: Number(distanceAccumRef.current.toFixed(3)),
            })
            .eq('id', trackerId);

          if (error) {
            if (isMounted) setStatus(`Ralat: ${error.message}`);
          } else if (isMounted) {
            setStatus(`Terakhir dihantar: ${new Date().toLocaleTimeString()}`);
          }
        },
        (geoErr) => {
          if (isMounted) {
            const code = geoErr?.code;
            const msg = code === 1 ? 'Akses lokasi ditolak oleh pelayar.'
              : code === 2 ? 'Lokasi tidak dapat dikesan (isyarat lemah).'
              : code === 3 ? 'Tamat masa menunggu isyarat GPS.'
              : (geoErr?.message || 'Ralat lokasi tidak diketahui.');
            setStatus('Ralat GPS: ' + msg);
          }
        }
      );
    };

    const recordHistoryAndStop = async () => {
      // Relit l'état persisté en base -> fiable même après un rechargement
      const { data: existingRow } = await supabase
        .from('agency_trackers')
        .select('current_job_started_at, current_job_distance_km')
        .eq('id', trackerId)
        .maybeSingle();

      if (existingRow?.current_job_started_at) {
        const startedAt = new Date(existingRow.current_job_started_at);
        const endedAt = new Date();
        const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

        await supabase.from('agency_tracking_history').insert([{
          agency_id: selectedAgency?.id,
          member_name: memberName,
          started_at: startedAt.toISOString(),
          ended_at: endedAt.toISOString(),
          duration_seconds: durationSeconds,
          distance_km: Number((existingRow.current_job_distance_km || 0).toFixed(2)),
        }]);
      }

      wasTrackingRef.current = false;
      jobStartTimeRef.current = null;
      lastCoordsRef.current = null;
      distanceAccumRef.current = 0;

      await supabase
        .from('agency_trackers')
        .update({
          tracking_status: 'Offline',
          current_job_started_at: null,
          current_job_distance_km: 0,
        })
        .eq('id', trackerId);
    };

    if (!trackerId) return;

    if (isTracking) {
      setStatus('Mendapatkan isyarat GPS...');
      startWatching();
    } else {
      setStatus('Sedia');
      recordHistoryAndStop().catch((err) => console.error(err));
    }

    return () => {
      isMounted = false;
      if (subscriptionPromise) {
        subscriptionPromise.then(sub => {
          try { sub?.remove(); } catch (e) { /* expo-location web : removeSubscription non implémenté, sans impact */ }
        });
      }
    };
  }, [isTracking, trackerId]);

  // Détecte en temps réel si un admin supprime ce tracker depuis la carte — ramène
  // immédiatement à l'écran de connexion sans attendre un rechargement de page.
  useEffect(() => {
    if (!trackerId) return;
    const channel = supabase
      .channel(`agency_tracker_self_${trackerId}`)
      .on('postgres_changes', { event: 'DELETE', schema: 'sandbox', table: 'agency_trackers', filter: `id=eq.${trackerId}` }, () => {
        clearSession();
        setSelectedAgency(null);
        setMemberName('');
        setAccessCode('');
        setTrackerId(null);
        setIsTracking(false);
        setLocation(null);
        setStatus('Sedia');
        Alert.alert('Sesi Ditamatkan', 'Akses anda telah ditamatkan oleh pentadbir. Sila log masuk semula.');
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [trackerId]);

  const filteredAgencies = agencies.filter(a => a.agency.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isRestoring) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

  // VIEW 1 : Sélection de l'agence + popup pour rejoindre (affichée dès qu'une agence est choisie)
  if (!trackerId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pilih Agensi</Text>
          <Text style={styles.subtitle}>Sila pilih agensi anda</Text>
        </View>

        <View style={styles.searchContainer}>
          <Search color={PALETTE.textMutedDark} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama agensi..."
            placeholderTextColor={PALETTE.textMutedDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loadingAgencies ? (
          <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredAgencies}
            keyExtractor={(item) => item.id}
            style={{ width: '100%' }}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            columnWrapperStyle={styles.row}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.agencyCard}
                onPress={() => setSelectedAgency(item)}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <AgencyLogo url={item.logo_url} size={44} fallbackSize={28} />
                </View>
                <Text style={styles.agencyCardText} numberOfLines={2}>
                  {item.agency}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Tiada agensi dijumpai.</Text>
            }
          />
        )}

        {/* ---- Popup : rejoindre une agence (nom + code d'accès) ---- */}
        <Modal visible={!!selectedAgency && !trackerId} transparent animationType="fade" onRequestClose={closeJoinModal}>
          <View style={joinStyles.overlay}>
            <View style={joinStyles.authCard}>
              <TouchableOpacity style={joinStyles.closeBtn} onPress={closeJoinModal}>
                <X size={20} color="#fff" />
              </TouchableOpacity>

              <View style={joinStyles.authBanner}>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <AgencyLogo url={lastSelectedAgencyRef.current?.logo_url} size={56} fallbackSize={36} />
                </View>
                <Text style={joinStyles.authKicker}>APM W.P LABUAN</Text>
                <Text style={joinStyles.authBannerTitle}>{lastSelectedAgencyRef.current?.agency}</Text>
                <Text style={joinStyles.authBannerSubtitle}>Masukkan nama anda untuk mula</Text>
              </View>

              <View style={joinStyles.authBody}>
                <View style={[joinStyles.authInputGroup, nameFocused && joinStyles.authInputGroupFocused]}>
                  <View style={joinStyles.authInputIconWrap}>
                    <UserIcon size={17} color={nameFocused ? PALETTE.orange : '#94a3b8'} />
                  </View>
                  <TextInput
                    style={joinStyles.authInput}
                    placeholder="Nama anda"
                    placeholderTextColor="#94a3b8"
                    value={memberName}
                    onChangeText={setMemberName}
                    returnKeyType="next"
                    onSubmitEditing={() => accessCodeInputRef.current?.focus()}
                    blurOnSubmit={false}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                  />
                </View>

                <View style={[joinStyles.authInputGroup, codeFocused && joinStyles.authInputGroupFocused]}>
                  <View style={joinStyles.authInputIconWrap}>
                    <Lock size={17} color={codeFocused ? PALETTE.orange : '#94a3b8'} />
                  </View>
                  <TextInput
                    ref={accessCodeInputRef}
                    style={joinStyles.authInput}
                    placeholder="Kod akses agensi"
                    placeholderTextColor="#94a3b8"
                    value={accessCode}
                    onChangeText={setAccessCode}
                    secureTextEntry={!showAccessCode}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleJoin}
                    onFocus={() => setCodeFocused(true)}
                    onBlur={() => setCodeFocused(false)}
                  />
                  <TouchableOpacity style={joinStyles.authEyeBtn} onPress={() => setShowAccessCode(v => !v)}>
                    {showAccessCode ? <EyeOff size={17} color="#94a3b8" /> : <Eye size={17} color="#94a3b8" />}
                  </TouchableOpacity>
                </View>

                {!!joinError && <Text style={styles.joinErrorText}>{joinError}</Text>}

                <TouchableOpacity
                  style={[joinStyles.authSaveButton, joining && { opacity: 0.7 }]}
                  onPress={handleJoin}
                  disabled={joining}
                >
                  {joining ? <ActivityIndicator color="#fff" /> : <Text style={joinStyles.authSaveButtonText}>Sertai</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // VIEW 3 : Tracking
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (isTracking) {
            Alert.alert("Amaran", "Sila hentikan jejak sebelum menukar agensi.");
            return;
          }
          clearSession();
          setSelectedAgency(null);
          setTrackerId(null);
          setMemberName('');
        }}
      >
        <ArrowLeft color={PALETTE.textDark} size={22} />
        <Text style={styles.backText}>Tukar Agensi</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.agencyIconWrapLarge}>
          <AgencyLogo url={selectedAgency.logo_url} size={56} fallbackSize={36} />
        </View>
        <Text style={styles.title}>{selectedAgency.agency}</Text>
        <Text style={styles.subtitle}>{memberName}</Text>
      </View>

      <View style={styles.statusBox}>
        <Text style={styles.statusText}>Status: {status}</Text>
        {location && (
          <Text style={styles.statusCoords}>
            Lat: {location.latitude.toFixed(5)} | Lng: {location.longitude.toFixed(5)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isTracking ? PALETTE.danger : PALETTE.success }]}
        onPress={() => setIsTracking(!isTracking)}
        activeOpacity={0.85}
      >
        {isTracking ? <StopCircle color="#fff" size={36} /> : <Navigation color="#fff" size={36} />}
        <Text style={styles.btnText}>{isTracking ? 'TAMAT JEJAK' : 'MULA JEJAK'}</Text>
      </TouchableOpacity>

      {isTracking && <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: PALETTE.softOrangeBg },
  header: { marginBottom: 20, alignItems: 'center', width: '100%' },
  title: { fontSize: 22, fontWeight: '900', color: PALETTE.textDark, marginBottom: 4, textAlign: 'center' },
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
  agencyCard: {
    width: '48%', padding: 16, borderRadius: 18, alignItems: 'center',
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  iconContainer: {
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)', marginBottom: 12,
  },
  agencyCardText: { fontSize: 13, fontWeight: '800', color: PALETTE.textDark, textAlign: 'center' },

  agencyIconWrapLarge: {
    width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },

  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 6 },
  backText: { fontSize: 14, fontWeight: '700', color: PALETTE.textDark },

  statusBox: {
    marginBottom: 40, alignItems: 'center', padding: 18, borderRadius: 16, width: '100%',
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  statusText: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark },
  statusCoords: { color: PALETTE.textMutedDark, fontSize: 12, marginTop: 5 },

  button: {
    width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 10, textAlign: 'center' },

  joinButton: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: PALETTE.orange },
  joinButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  joinErrorText: { color: '#dc2626', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
});

const joinStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  closeBtn: { position: 'absolute', top: 16, right: 16, zIndex: 2, padding: 4 },
  authCard: {
    width: '100%', maxWidth: 480, borderRadius: 24, overflow: 'hidden', position: 'relative',
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
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  authSaveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});