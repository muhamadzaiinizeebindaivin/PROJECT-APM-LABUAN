// src/screens/LaporKesScreen.js
import React, { useState, useEffect, useRef, useMemo, createElement } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, ActivityIndicator, Alert, Image, Platform, ScrollView, Modal, useWindowDimensions } from 'react-native';
import { Search, ArrowLeft, Send, CheckCircle2, MapPin, FilePlus, ChevronRight, AlertCircle, Trash2, Eye, EyeOff, Lock, AlertTriangle, XCircle } from 'lucide-react-native';
import { useCalamityPoints } from '../hooks/useCalamityPoints';
import { CALAMITY_CATEGORIES, getCalamityLogoUrl } from '../constants/operasiConstants';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';

const STATUS_OPTIONS = [
  { key: 'berjaya', label: 'Berjaya' },
  { key: 'gagal', label: 'Gagal' },
  { key: 'batal', label: 'Batal' },
  { key: 'tunda', label: 'Tunda' },
  { key: 'diambil agensi lain', label: 'Diambil Agensi Lain' },
  { key: 'diserah ke agensi lain', label: 'Diserah ke Agensi Lain' },
];

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

// Centre par défaut (Labuan) quand aucun point n'est encore placé.
const DEFAULT_LAT = 5.2831;
const DEFAULT_LNG = 115.2308;

// --- Mini-carte d'aperçu (lecture seule) pour Senarai Kecemasan ---
const buildMiniMapHtml = (lat, lng) => `
  <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body,#map{height:100%;margin:0;padding:0;}.leaflet-control-attribution{font-size:9px;}</style>
  </head><body><div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', {
      zoomControl: true, dragging: true, touchZoom: true, scrollWheelZoom: true,
      doubleClickZoom: true, boxZoom: false, keyboard: false, attributionControl: true,
    }).setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 20,
    }).addTo(map);
    L.marker([${lat}, ${lng}]).addTo(map);
  </script>
  </body></html>
`;

function MiniMapPreview({ latitude, longitude }) {
  if (!latitude || !longitude) {
    return (
      <View style={styles.miniMapFallback}>
        <MapPin color={PALETTE.textMutedDark} size={18} />
        <Text style={styles.miniMapFallbackText}>Tiada koordinat</Text>
      </View>
    );
  }
  if (Platform.OS === 'web') {
    return createElement('iframe', {
      srcDoc: buildMiniMapHtml(latitude, longitude),
      style: { width: '100%', height: '100%', border: 'none', borderRadius: 12 },
      title: 'Lokasi Kes',
      scrolling: 'no',
    });
  }
  return (
    <View style={styles.miniMapFallback}>
      <MapPin color={PALETTE.orange} size={18} />
      <Text style={styles.miniMapFallbackText}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
    </View>
  );
}

// --- Carte de pointage (cliquable) pour "Kes Baru" ---
const buildPinpointMapHtml = (lat, lng, hasMarker) => `
  <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html,body,#map{height:100%;margin:0;padding:0;cursor:crosshair;}.leaflet-control-attribution{font-size:9px;}</style>
  </head><body><div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([${lat}, ${lng}], ${hasMarker ? 16 : 12});
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri', maxZoom: 20,
    }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
    }).addTo(map);

    var marker = ${hasMarker ? `L.marker([${lat}, ${lng}], { draggable: true })` : 'null'};
    if (marker) marker.addTo(map);

    function sendPosition(latlng) {
      window.parent.postMessage({ type: 'pinpoint', lat: latlng.lat, lng: latlng.lng }, '*');
    }
    function attachDrag(m) {
      m.on('dragend', function () { sendPosition(m.getLatLng()); });
    }
    if (marker) attachDrag(marker);

    // Premier clic : dépose un marqueur déplaçable. Clics suivants : le repositionne
    // (mais c'est le glisser-déposer qui reste la façon principale de l'ajuster).
    map.on('click', function (e) {
      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng, { draggable: true }).addTo(map);
        attachDrag(marker);
      }
      sendPosition(e.latlng);
    });
  </script>
  </body></html>
`;

function PinpointMap({ latitude, longitude, onPick }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const iframeRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handler = (e) => {
      if (e.data && e.data.type === 'pinpoint') onPick(e.data.lat, e.data.lng);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onPick]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.miniMapFallback}>
        <MapPin color={PALETTE.textMutedDark} size={18} />
        <Text style={styles.miniMapFallbackText}>Peta hanya tersedia di versi web. Sila isi alamat sahaja.</Text>
      </View>
    );
  }

  const mapHtml = useMemo(
    () => buildPinpointMapHtml(latitude ?? DEFAULT_LAT, longitude ?? DEFAULT_LNG, !!(latitude && longitude)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <View style={{ flex: 1 }}>
      {createElement('iframe', {
        key: 'pinpoint-map',
        ref: iframeRef,
        srcDoc: mapHtml,
        style: { width: '100%', height: '100%', border: 'none', borderRadius: 12 },
        title: 'Tandakan Lokasi',
        scrolling: 'no',
      })}
    </View>
  );
}

export default function LaporKesScreen({ onLogout }) {
  const { calamityPoints, saveCalamity, resolveTreatedCalamity, deleteCalamity } = useCalamityPoints();
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = React.useRef(null);
  const showNotification = (type, message) => {
    setNotification({ type, message });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 3000);
  };

  const [accessVerified, setAccessVerified] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessFocused, setAccessFocused] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState('choice'); // 'choice' | 'peta' | 'baru' | 'form-peta'
  const [selectedPoint, setSelectedPoint] = useState(null);

  const [status, setStatus] = useState('berjaya');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Champs spécifiques à "Kes Baru"
  const [address, setAddress] = useState('');
  const [pinLat, setPinLat] = useState(null);
  const [pinLng, setPinLng] = useState(null);

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
      setAccessError('Sila masukkan kod akses.');
      return;
    }
    setAccessError(null);
    setVerifying(true);
    const { data: authData, error: authError } = await supabaseSandbox.auth.signInAnonymously();
    if (authError || !authData?.user) {
      setAccessError('Gagal memulakan sesi. Sila cuba lagi.');
      setVerifying(false);
      return;
    }
    const { error } = await supabaseSandbox.rpc('join_operasi', { p_code: accessCode.trim() });
    if (error) {
      setAccessError(error.message?.includes('Invalid access code') ? 'Kod akses tidak sah.' : 'Gagal mengesahkan kod. Sila cuba lagi.');
      setVerifying(false);
      return;
    }
    setAccessVerified(true);
    setVerifying(false);
  };

  const filteredCategories = CALAMITY_CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePointsForCategory = selectedCategory
    ? calamityPoints.filter(c => c.category === selectedCategory.key && c.status === 'active')
    : [];

  const resetAll = () => {
    setSelectedCategory(null);
    setMode('choice');
    setSelectedPoint(null);
    setStatus('berjaya');
    setDescription('');
    setAddress('');
    setPinLat(null);
    setPinLng(null);
    setSubmitted(false);
  };

  const backToChoice = () => {
    setMode('choice');
    setSelectedPoint(null);
    setStatus('berjaya');
    setDescription('');
    setAddress('');
    setPinLat(null);
    setPinLng(null);
  };

  const openPointForm = (point) => {
    setSelectedPoint(point);
    setDescription(point.description || '');
    setStatus('berjaya');
  };

  const closeResolveModal = () => {
    setSelectedPoint(null);
    setDescription('');
    setStatus('berjaya');
  };

  const handleSubmitResolve = async () => {
    setSubmitting(true);
    const result = await resolveTreatedCalamity(selectedPoint, { status, description });
    setSubmitting(false);
    if (!result.error) {
      closeResolveModal();
      showNotification('success', 'Kes berjaya dikemaskini.');
    } else {
      showNotification('error', 'Gagal mengemaskini kes.');
    }
  };

  const handleSubmitBaru = async () => {
    if (!pinLat || !pinLng) return;
    setSubmitting(true);
    const fullDescription = address.trim()
      ? `Alamat: ${address.trim()}${description.trim() ? `\n${description.trim()}` : ''}`
      : description;
    const result = await saveCalamity({
      category: selectedCategory.key,
      description: fullDescription,
      latitude: pinLat,
      longitude: pinLng,
    });
    setSubmitting(false);
    if (!result.error) {
      setSubmitted(true);
    } else {
      showNotification('error', 'Gagal menghantar kes. Sila cuba lagi.');
    }
  };

  if (checkingAccess) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={PALETTE.orange} />
      </View>
    );
  }

// View 0: code d'accès
  if (!accessVerified) {
    return (
      <ScrollView style={styles.screenScroll} contentContainerStyle={[styles.scrollContent, { justifyContent: 'center' }]}>
        <FlowingBackground />
        <View style={styles.authCard}>
          <View style={styles.authBanner}>
            <Text style={styles.authKicker}>APM W.P LABUAN</Text>
            <Text style={styles.authBannerTitle}>Kod Akses Operasi</Text>
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

            {!!accessError && <Text style={styles.joinErrorText}>{accessError}</Text>}

            <TouchableOpacity
              style={[styles.authSaveButton, verifying && { opacity: 0.7 }]}
              onPress={handleVerifyAccess}
              disabled={verifying}
            >
              {verifying ? <ActivityIndicator color="#fff" /> : <Text style={styles.authSaveButtonText}>Sahkan</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // View 1: sélection du jenis kes
  if (!selectedCategory) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pilih Jenis Kes</Text>
          <Text style={styles.subtitle}>Sila pilih jenis kes yang telah ditangani</Text>
        </View>

        <View style={styles.searchContainer}>
          <Search color={PALETTE.textMutedDark} size={20} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari jenis kes..."
            placeholderTextColor={PALETTE.textMutedDark}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => item.key}
          style={{ width: '100%' }}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vehicleCard}
              onPress={() => setSelectedCategory(item)}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                <Image source={{ uri: getCalamityLogoUrl(item.key) }} style={{ width: 42, height: 42 }} resizeMode="contain" />
              </View>

              <Text style={styles.vehiclePlateText} numberOfLines={2}>{item.label}</Text>

              <View style={[styles.badge, { backgroundColor: `${item.color}22` }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>{item.key}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Tiada jenis kes dijumpai.</Text>}
        />
      </View>
    );
  }

  // View 2: choix "Senarai Kecemasan" vs "Kes Baru"
  if (mode === 'choice') {
    return (
      <ScrollView style={styles.screenScroll} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={resetAll}>
          <ArrowLeft color={PALETTE.textDark} size={22} />
          <Text style={styles.backText}>Tukar Jenis Kes</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Rekod Kes</Text>
          <View style={styles.activeVehicleCard}>
            <View style={styles.activeVehicleIconWrap}>
              <Image source={{ uri: getCalamityLogoUrl(selectedCategory.key) }} style={{ width: 32, height: 32 }} resizeMode="contain" />
            </View>
            <Text style={styles.activeVehiclePlate}>{selectedCategory.label}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.choiceCard} onPress={() => setMode('peta')} activeOpacity={0.85}>
          <View style={styles.choiceIconWrap}>
            <MapPin color={PALETTE.orange} size={28} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.choiceTitle}>Senarai Kecemasan</Text>
            <Text style={styles.choiceSubtitle}>{activePointsForCategory.length} kes aktif ditandakan</Text>
          </View>
          <ChevronRight color={PALETTE.textMutedDark} size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.choiceCard, { marginBottom: 0 }]} onPress={() => setMode('baru')} activeOpacity={0.85}>
          <View style={styles.choiceIconWrap}>
            <FilePlus color={PALETTE.orange} size={28} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.choiceTitle}>Kes Baru</Text>
            <Text style={styles.choiceSubtitle}>Tandakan lokasi baru di peta</Text>
          </View>
          <ChevronRight color={PALETTE.textMutedDark} size={20} />
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // View 3a: Senarai Kecemasan — liste des points actifs de cette catégorie
  if (mode === 'peta') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={backToChoice}>
          <ArrowLeft color={PALETTE.textDark} size={22} />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Senarai Kecemasan</Text>
          <Text style={styles.subtitle}>{selectedCategory.label}</Text>
        </View>

        <FlatList
          data={activePointsForCategory}
          keyExtractor={(item) => item.id}
          style={{ width: '100%' }}
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          renderItem={({ item }) => (
            <View style={styles.pointCard}>
              <View style={styles.miniMapWrap}>
                <MiniMapPreview latitude={item.latitude} longitude={item.longitude} />
              </View>
              <Text style={styles.pointDate}>{item.tarikh}</Text>
              <Text style={styles.pointDesc} numberOfLines={2}>{item.description || 'Tiada keterangan'}</Text>

              <View style={styles.pointActionsRow}>
                <TouchableOpacity
                  style={[styles.pointActionBtn, styles.pointActionSelesai]}
                  onPress={() => openPointForm(item)}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={16} color="#16a34a" />
                  <Text style={styles.pointActionSelesaiText}>Selesai</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pointActionBtn, styles.pointActionPadam]}
                  onPress={() => setPendingDeleteId(item.id)}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#dc2626" />
                  <Text style={styles.pointActionPadamText}>Padam</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyStateBox}>
              <View style={styles.emptyStateIconWrap}>
                <MapPin color={PALETTE.textMutedDark} size={28} />
              </View>
              <Text style={styles.emptyStateTitle}>Tiada Kes Aktif</Text>
              <Text style={styles.emptyStateText}>Tiada kes aktif untuk jenis "{selectedCategory.label}" buat masa ini.</Text>
            </View>
          }
        />

        <Modal visible={!!pendingDeleteId} transparent animationType="fade" onRequestClose={() => setPendingDeleteId(null)}>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <View style={styles.confirmBanner}>
                <View style={styles.confirmIconWrap}>
                  <AlertTriangle size={22} color="#dc2626" />
                </View>
                <Text style={styles.confirmTitle}>Padam titik bencana ini?</Text>
                <Text style={styles.confirmText}>Tindakan ini tidak boleh dibuat asal.</Text>
              </View>

              <View style={styles.confirmBody}>
                <TouchableOpacity
                  style={[styles.confirmCancelBtn, isDeleting && { opacity: 0.5 }]}
                  onPress={() => setPendingDeleteId(null)}
                  disabled={isDeleting}
                >
                  <Text style={styles.confirmCancelText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmDeleteBtn, isDeleting && { opacity: 0.7 }]}
                  disabled={isDeleting}
                  onPress={async () => {
                    setIsDeleting(true);
                    const ok = await deleteCalamity(pendingDeleteId);
                    setIsDeleting(false);
                    setPendingDeleteId(null);
                    showNotification(ok ? 'success' : 'error', ok ? 'Titik berjaya dipadam.' : 'Gagal memadam titik.');
                  }}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Trash2 size={16} color="#fff" />
                      <Text style={styles.confirmDeleteText}>Padam</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={!!selectedPoint} transparent animationType="fade" onRequestClose={closeResolveModal}>
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmCard}>
              <View style={[styles.confirmBanner, { backgroundColor: '#0c0c0e' }]}>
                <View style={[styles.confirmIconWrap, { backgroundColor: 'rgba(22, 163, 74, 0.15)' }]}>
                  <CheckCircle2 size={22} color="#16a34a" />
                </View>
                <Text style={styles.confirmTitle}>Tandakan Selesai</Text>
                <Text style={styles.confirmText}>Pilih status penyelesaian untuk kes ini.</Text>
              </View>

              <View style={[styles.confirmBody, { flexDirection: 'column', gap: 0 }]}>
                <Text style={styles.fieldLabel}>Status</Text>
                <View style={styles.statusWrap}>
                  {STATUS_OPTIONS.map(s => (
                    <TouchableOpacity
                      key={s.key}
                      onPress={() => setStatus(s.key)}
                      style={[styles.statusChip, status === s.key && styles.statusChipActive]}
                    >
                      <Text style={[styles.statusChipText, status === s.key && styles.statusChipTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Keterangan (pilihan)</Text>
                <View style={[styles.searchContainer, { height: 90, alignItems: 'flex-start', paddingTop: 12, marginBottom: 20 }]}>
                  <TextInput
                    style={[styles.searchInput, { height: '100%', textAlignVertical: 'top' }]}
                    placeholder="Catatan tambahan..."
                    placeholderTextColor={PALETTE.textMutedDark}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.confirmCancelBtn, submitting && { opacity: 0.5 }]}
                    onPress={closeResolveModal}
                    disabled={submitting}
                  >
                    <Text style={styles.confirmCancelText}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmDeleteBtn, { backgroundColor: PALETTE.orange }, submitting && { opacity: 0.7 }]}
                    onPress={handleSubmitResolve}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Send size={16} color="#fff" />
                        <Text style={styles.confirmDeleteText}>Hantar</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={!!notification} transparent animationType="fade">
          <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', paddingTop: 60 }}>
            {notification && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '90%',
                backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
                borderWidth: 1, borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
                borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
              }}>
                {notification.type === 'success' ? <CheckCircle2 size={17} color="#16a34a" /> : <XCircle size={17} color="#dc2626" />}
                <Text style={{ color: notification.type === 'success' ? '#166534' : '#991b1b', fontWeight: '700', fontSize: 13, flexShrink: 1 }}>
                  {notification.message}
                </Text>
              </View>
            )}
          </View>
        </Modal>
      </View>
    );
  }

  // View 4: Kes Baru — tandakan lokasi (dummy) + description
  if (mode === 'baru') {
    return (
      <ScrollView style={styles.screenScroll} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={backToChoice}>
          <ArrowLeft color={PALETTE.textDark} size={22} />
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Kes Baru</Text>
          <View style={styles.activeVehicleCard}>
            <View style={styles.activeVehicleIconWrap}>
              <Image source={{ uri: getCalamityLogoUrl(selectedCategory.key) }} style={{ width: 32, height: 32 }} resizeMode="contain" />
            </View>
            <Text style={styles.activeVehiclePlate}>{selectedCategory.label}</Text>
          </View>
        </View>

        {submitted ? (
          <View style={styles.statusBox}>
            <CheckCircle2 size={40} color={PALETTE.success} style={{ marginBottom: 10 }} />
            <Text style={styles.statusText}>Kes telah ditandakan.</Text>
            <TouchableOpacity style={[styles.joinButton, { marginTop: 16 }]} onPress={resetAll}>
              <Text style={styles.joinButtonText}>Rekod Kes Lain</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: '100%' }}>
            <View style={styles.mapSectionHeader}>
              <Text style={[styles.fieldLabel, { marginBottom: 0 }]}>Tandakan Lokasi</Text>
              <View style={[styles.requiredPill, pinLat && pinLng && styles.requiredPillDone]}>
                {pinLat && pinLng ? (
                  <CheckCircle2 size={12} color="#16a34a" />
                ) : (
                  <AlertCircle size={12} color="#dc2626" />
                )}
                <Text style={[styles.requiredPillText, pinLat && pinLng && styles.requiredPillTextDone]}>
                  {pinLat && pinLng ? 'Ditanda' : 'Wajib'}
                </Text>
              </View>
            </View>
            <View style={[styles.pinpointMapWrap, !pinLat && styles.pinpointMapWrapRequired]}>
              <PinpointMap latitude={pinLat} longitude={pinLng} onPick={(lat, lng) => { setPinLat(lat); setPinLng(lng); }} />
            </View>
            {pinLat && pinLng ? (
              <Text style={styles.coordText}>📍 {pinLat.toFixed(5)}, {pinLng.toFixed(5)}</Text>
            ) : (
              <Text style={styles.coordHintText}>Ketik pada peta untuk menandakan lokasi kes.</Text>
            )}

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>Alamat (pilihan)</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Cth: Jalan OKK Awang Besar, Labuan"
                placeholderTextColor={PALETTE.textMutedDark}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            <Text style={styles.fieldLabel}>Keterangan (pilihan)</Text>
            <View style={[styles.searchContainer, { height: 90, alignItems: 'flex-start', paddingTop: 12, marginBottom: 20 }]}>
              <TextInput
                style={[styles.searchInput, { height: '100%', textAlignVertical: 'top' }]}
                placeholder="Catatan tambahan..."
                placeholderTextColor={PALETTE.textMutedDark}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.joinButton, { flexDirection: 'row', justifyContent: 'center', gap: 8 }, (submitting || !pinLat || !pinLng) && { opacity: 0.5 }]}
              onPress={handleSubmitBaru}
              disabled={submitting || !pinLat || !pinLng}
            >
              {!submitting && <Send color="#fff" size={16} />}
              <Text style={styles.joinButtonText}>{submitting ? '...' : 'Tandakan Kes'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal visible={!!notification} transparent animationType="fade">
          <View pointerEvents="none" style={{ flex: 1, alignItems: 'center', paddingTop: 60 }}>
            {notification && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '90%',
                backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
                borderWidth: 1, borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
                borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
              }}>
                {notification.type === 'success' ? <CheckCircle2 size={17} color="#16a34a" /> : <XCircle size={17} color="#dc2626" />}
                <Text style={{ color: notification.type === 'success' ? '#166534' : '#991b1b', fontWeight: '700', fontSize: 13, flexShrink: 1 }}>
                  {notification.message}
                </Text>
              </View>
            )}
          </View>
        </Modal>
      </ScrollView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  screenScroll: { flex: 1, backgroundColor: PALETTE.softOrangeBg, position: 'relative' },
  container: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: PALETTE.softOrangeBg },
  scrollContent: { flexGrow: 1, alignItems: 'center', padding: 20, paddingTop: 50, paddingBottom: 40, backgroundColor: PALETTE.softOrangeBg },
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
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  authSaveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  joinErrorText: { color: '#dc2626', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 14 },

  title: { fontSize: 26, fontWeight: '900', color: PALETTE.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: PALETTE.textMutedDark, fontWeight: '600' },
  emptyText: { color: PALETTE.textMutedDark, textAlign: 'center', marginTop: 20 },

  emptyStateBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 30,
  },
  emptyStateIconWrap: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: PALETTE.cardLight,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyStateTitle: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark, marginBottom: 6 },
  emptyStateText: { fontSize: 13, color: PALETTE.textMutedDark, textAlign: 'center', lineHeight: 18 },

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
  iconContainer: {
    width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)', marginBottom: 12,
  },
  vehiclePlateText: { fontSize: 13, fontWeight: '800', color: PALETTE.textDark, marginBottom: 10, textAlign: 'center', height: 34 },
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
  activeVehiclePlate: { color: PALETTE.textDark, fontSize: 19, fontWeight: '900', marginTop: 12, textAlign: 'center' },

  choiceCard: {
    flexDirection: 'row', alignItems: 'center', width: '100%', padding: 18, borderRadius: 18, marginBottom: 15, marginTop: 4,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  choiceIconWrap: {
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  choiceTitle: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark },
  choiceSubtitle: { fontSize: 12, color: PALETTE.textMutedDark, marginTop: 2, fontWeight: '600' },

  pointCard: {
    width: '100%', padding: 16, borderRadius: 18, marginBottom: 12,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  pointDate: { fontSize: 11, fontWeight: '800', color: PALETTE.orange, marginBottom: 4 },
  pointDesc: { fontSize: 13, color: PALETTE.textDark, marginBottom: 4, fontWeight: '600' },
  pointJumlah: { fontSize: 11, color: PALETTE.textMutedDark },

  pointActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pointActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  pointActionSelesai: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  pointActionSelesaiText: { fontSize: 12, fontWeight: '800', color: '#16a34a' },
  pointActionPadam: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  pointActionPadamText: { fontSize: 12, fontWeight: '800', color: '#dc2626' },

  miniMapWrap: {
    width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 10,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.surface,
  },
  pinpointMapWrap: {
    width: '100%', height: 420, borderRadius: 16, overflow: 'hidden',
    borderWidth: 2, borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.surface,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 14, elevation: 2,
  },
  pinpointMapWrapRequired: {
    borderColor: PALETTE.orange, borderStyle: 'dashed',
  },
  mapSectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginBottom: 10,
  },
  requiredPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
  },
  requiredPillDone: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  requiredPillText: { fontSize: 10, fontWeight: '800', color: '#dc2626' },
  requiredPillTextDone: { color: '#16a34a' },
  coordText: { fontSize: 12, fontWeight: '700', color: PALETTE.textDark, marginTop: 10, marginBottom: 4 },
  coordHintText: { fontSize: 12, fontWeight: '600', color: PALETTE.textMutedDark, marginTop: 10, marginBottom: 4, fontStyle: 'italic' },

  miniMapFallback: {
    width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 16,
    backgroundColor: PALETTE.surface,
  },
  miniMapFallbackText: { fontSize: 11, fontWeight: '700', color: PALETTE.textMutedDark, textAlign: 'center' },

  statusBox: {
    marginTop: 10, alignItems: 'center', padding: 24, borderRadius: 16, width: '100%',
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1,
  },
  statusText: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark },

  fieldLabel: { fontSize: 12, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, alignSelf: 'flex-start' },

  statusWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statusChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  statusChipActive: {
    backgroundColor: PALETTE.orange, borderColor: PALETTE.orange,
    shadowColor: PALETTE.orange, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  statusChipText: { fontSize: 11, fontWeight: '700', color: PALETTE.textMutedDark },
  statusChipTextActive: { color: '#fff' },
  joinButton: {
    width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: PALETTE.orange,
    shadowColor: PALETTE.orange, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4,
  },
  joinButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmCard: {
    width: '100%', maxWidth: 360, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, elevation: 15,
  },
  confirmBanner: { backgroundColor: '#0c0c0e', paddingVertical: 28, paddingHorizontal: 24, alignItems: 'center' },
  confirmIconWrap: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  confirmTitle: { fontSize: 16, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 6 },
  confirmText: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 18 },
  confirmBody: { flexDirection: 'row', gap: 10, padding: 24, backgroundColor: '#fff' },
  confirmCancelBtn: {
    flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  confirmCancelText: { fontSize: 14, fontWeight: '700', color: PALETTE.textMutedDark },
  confirmDeleteBtn: {
    flex: 1, height: 46, borderRadius: 12, flexDirection: 'row', gap: 6,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#dc2626',
  },
  confirmDeleteText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  
});
