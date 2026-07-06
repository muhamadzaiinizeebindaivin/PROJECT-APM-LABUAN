// src/screens/AgencyTrackingScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, FlatList, TextInput, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Navigation, StopCircle, ArrowLeft, Search, Building2 } from 'lucide-react-native';
import { supabaseSandbox as supabase } from '../supabaseSandboxClient';

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

export default function AgencyTrackingScreen({ onLogout, theme }) {
  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgency, setSelectedAgency] = useState(null);

  const [memberName, setMemberName] = useState('');
  const [trackerId, setTrackerId] = useState(null);
  const [joining, setJoining] = useState(false);

  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('Sedia');
  const [isRestoring, setIsRestoring] = useState(true);
  

  useEffect(() => {
    let isMounted = true;
    const fetchAgencies = async () => {
      const { data, error } = await supabase
        .from('jpbd_directory')
        .select('id, agency')
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
      Alert.alert('Ralat', 'Sila masukkan nama anda.');
      return;
    }
    setJoining(true);
    const { data, error } = await supabase
      .from('agency_trackers')
      .insert([{ agency_id: selectedAgency.id, member_name: memberName.trim(), tracking_status: 'Offline' }])
      .select('id')
      .single();

    if (error) {
      Alert.alert('Ralat', 'Gagal mendaftar. Sila cuba lagi.');
      setJoining(false);
      return;
    }
    setTrackerId(data.id);
    saveSession({ selectedAgency, memberName: memberName.trim(), trackerId: data.id });
    setJoining(false);
  };

  useEffect(() => {
    let subscriptionPromise = null;
    let isMounted = true;

    const startWatching = async () => {
      let { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        if (isMounted) {
          Alert.alert('Akses Ditolak', 'Sila benarkan akses lokasi untuk menjejak.');
          setIsTracking(false);
        }
        return;
      }

      await supabase.from('agency_trackers').update({ tracking_status: 'Online' }).eq('id', trackerId);

      subscriptionPromise = Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 2 },
        async (loc) => {
          if (!isMounted) return;
          setLocation(loc.coords);
          setStatus('Mengemaskini Pangkalan Data...');

          const { error } = await supabase
            .from('agency_trackers')
            .update({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              last_updated: new Date().toISOString(),
              tracking_status: 'Online'
            })
            .eq('id', trackerId);

          if (error) {
            if (isMounted) setStatus(`Ralat: ${error.message}`);
          } else if (isMounted) {
            setStatus(`Terakhir dihantar: ${new Date().toLocaleTimeString()}`);
          }
        }
      );
    };

    if (!trackerId) return;

    if (isTracking) {
      setStatus('Mendapatkan isyarat GPS...');
      startWatching();
    } else {
      setStatus('Sedia');
      supabase.from('agency_trackers').update({ tracking_status: 'Offline' }).eq('id', trackerId)
        .then(({ error }) => { if (error) console.error(error); });
    }

    return () => {
      isMounted = false;
      if (subscriptionPromise) subscriptionPromise.then(sub => { if (sub) sub.remove(); });
    };
  }, [isTracking, trackerId]);

  const filteredAgencies = agencies.filter(a => a.agency.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isRestoring) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.background || '#f8fafc', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={theme?.accent || '#1E3A8A'} />
      </View>
    );
  }

  // VIEW 1 : Sélection de l'agence
  if (!selectedAgency) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.background || '#f8fafc' }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme?.text || '#0f172a' }]}>Pilih Agensi</Text>
          <Text style={{ color: theme?.textSecondary || '#64748b' }}>Sila pilih agensi anda</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme?.card || '#fff', borderColor: theme?.border || '#ccc' }]}>
          <Search color={theme?.textSecondary || '#64748b'} size={20} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme?.text || '#0f172a' }]}
            placeholder="Cari nama agensi..."
            placeholderTextColor={theme?.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {loadingAgencies ? (
          <ActivityIndicator size="large" color={theme?.accent || '#1E3A8A'} style={{ marginTop: 20 }} />
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
                style={[styles.agencyCard, { borderColor: theme?.border || '#e5e7eb', backgroundColor: theme?.card || '#fff' }]}
                onPress={() => setSelectedAgency(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: (theme?.accent || '#1E3A8A') + '15' }]}>
                  <Building2 color={theme?.accent || '#1E3A8A'} size={28} />
                </View>
                <Text style={[styles.agencyCardText, { color: theme?.text || '#0f172a' }]} numberOfLines={2}>
                  {item.agency}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={{ color: theme?.textSecondary || '#64748b', textAlign: 'center', marginTop: 20 }}>
                Tiada agensi dijumpai.
              </Text>
            }
          />
        )}

        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={{ color: theme?.textSecondary || '#64748b', fontWeight: 'bold' }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // VIEW 2 : Saisie du nom (si pas encore rejoint)
  if (!trackerId) {
    return (
      <View style={[styles.container, { backgroundColor: theme?.background || '#f8fafc', justifyContent: 'center' }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => setSelectedAgency(null)}>
          <ArrowLeft color={theme?.text || '#0f172a'} size={24} />
          <Text style={[styles.backText, { color: theme?.text || '#0f172a' }]}>Tukar Agensi</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Building2 color={theme?.accent || '#1E3A8A'} size={48} />
          <Text style={[styles.title, { color: theme?.text || '#0f172a', marginTop: 10 }]}>{selectedAgency.agency}</Text>
          <Text style={{ color: theme?.textSecondary || '#64748b' }}>Masukkan nama anda untuk mula</Text>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: theme?.card || '#fff', borderColor: theme?.border || '#ccc', marginBottom: 20 }]}>
          <TextInput
            style={[styles.searchInput, { color: theme?.text || '#0f172a' }]}
            placeholder="Nama anda"
            placeholderTextColor={theme?.textSecondary}
            value={memberName}
            onChangeText={setMemberName}
          />
        </View>

        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: theme?.accent || '#1E3A8A' }, joining && { opacity: 0.7 }]}
          onPress={handleJoin}
          disabled={joining}
        >
          {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.joinButtonText}>Sertai</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  // VIEW 3 : Tracking
  return (
    <View style={[styles.container, { backgroundColor: theme?.background || '#f8fafc' }]}>
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
        <ArrowLeft color={theme?.text || '#0f172a'} size={24} />
        <Text style={[styles.backText, { color: theme?.text || '#0f172a' }]}>Tukar Agensi</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <Building2 color={theme?.accent || '#1E3A8A'} size={40} />
        <Text style={[styles.title, { color: theme?.text || '#0f172a' }]}>{selectedAgency.agency}</Text>
        <Text style={{ color: theme?.textSecondary || '#64748b' }}>{memberName}</Text>
      </View>

      <View style={[styles.statusBox, { borderColor: theme?.border || '#ccc', backgroundColor: theme?.card || '#fff' }]}>
        <Text style={[styles.statusText, { color: theme?.text || '#0f172a' }]}>Status: {status}</Text>
        {location && (
          <Text style={{ color: theme?.textSecondary || '#64748b', fontSize: 12, marginTop: 5 }}>
            Lat: {location.latitude.toFixed(5)} | Lng: {location.longitude.toFixed(5)}
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: isTracking ? '#ef4444' : '#22c55e' }]}
        onPress={() => setIsTracking(!isTracking)}
        activeOpacity={0.8}
      >
        {isTracking ? <StopCircle color="#fff" size={36} /> : <Navigation color="#fff" size={36} />}
        <Text style={styles.btnText}>{isTracking ? 'TAMAT JEJAK' : 'MULA JEJAK'}</Text>
      </TouchableOpacity>

      {isTracking && <ActivityIndicator size="large" color={theme?.accent || '#3b82f6'} style={{ marginTop: 20 }} />}

      <TouchableOpacity onPress={() => { clearSession(); onLogout(); }} style={{ marginTop: 'auto', paddingBottom: 20 }}>
        <Text style={{ color: theme?.textSecondary || '#64748b', textDecorationLine: 'underline' }}>Log Keluar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 50 },
  header: { marginBottom: 20, alignItems: 'center', width: '100%' },
  title: { fontSize: 24, fontWeight: '900', marginBottom: 5, textAlign: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 16 },
  row: { justifyContent: 'space-between', marginBottom: 15 },
  agencyCard: { width: '48%', padding: 15, borderWidth: 1, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 3 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  agencyCardText: { fontSize: 13, fontWeight: 'bold', textAlign: 'center' },
  logoutBtn: { paddingVertical: 15, marginTop: 10 },
  backButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { fontSize: 16, marginLeft: 5, fontWeight: '600' },
  statusBox: { marginBottom: 40, alignItems: 'center', padding: 20, borderWidth: 1, borderRadius: 16, width: '100%' },
  statusText: { fontSize: 16, fontWeight: 'bold' },
  button: { width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center', elevation: 10 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  joinButton: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  joinButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});