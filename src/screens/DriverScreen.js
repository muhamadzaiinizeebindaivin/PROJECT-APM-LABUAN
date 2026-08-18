// src/screens/DriverScreen.js
import React, { useState, useEffect, useRef, useMemo, createElement } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SectionList, TextInput, Platform, ScrollView, Modal } from 'react-native';
import { Navigation, StopCircle, ArrowLeft, Search, MapPin, Eye, EyeOff, Lock, Maximize2 } from 'lucide-react-native';

import { getVehicleIcon } from '../utils/vehicleIcons';
import { useAvailableVehicles } from '../hooks/useAvailableVehicles';
import { usePatrolTracking } from '../hooks/usePatrolTracking';
import { useCalamityPoints } from '../hooks/useCalamityPoints';
import { useVehicles } from '../hooks/useVehicles';
import { supabaseSandbox } from '../supabaseSandboxClient';
import { PALETTE } from '../constants/palette';
import { getCalamityMeta, getCalamityLogoUrl } from '../constants/operasiConstants';
import { buildOperasiMapHtml } from './operasi/operasiMapTemplate';

const DRIVER_ACCESS_KEY = 'apm_driver_access_verified';

const STATUS_META = {
  Baik: { label: 'Baik', bg: PALETTE.successSoft, color: PALETTE.success },
  Selenggara: { label: 'Selenggara', bg: '#fffbeb', color: '#d97706' },
  Rosak: { label: 'Rosak', bg: PALETTE.dangerSoft, color: PALETTE.danger },
};
const getStatusMeta = (status) => STATUS_META[status] || { label: status || 'Tidak diketahui', bg: PALETTE.surface, color: PALETTE.textMutedDark };

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
  const [activeCategory, setActiveCategory] = useState(null);
  const numColumns = 2;

  const [accessVerified, setAccessVerified] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [accessError, setAccessError] = useState(null);
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

    const { error } = await supabaseSandbox.rpc('join_driver', { p_code: accessCode.trim() });
    if (error) {
      setAccessError(error.message?.includes('Invalid access code') ? 'Kod akses tidak sah.' : 'Gagal mengesahkan kod. Sila cuba lagi.');
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

  const { calamityPoints } = useCalamityPoints();
  const mapIframeRef = useRef(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [fullscreenBtnHovered, setFullscreenBtnHovered] = useState(false);
  const [confirmStopVisible, setConfirmStopVisible] = useState(false);
  // Source unique de vérité pour "le suivi est réellement actif" — utilisée
  // à la fois par le bouton et par l'effet qui envoie le marqueur à la
  // carte, pour qu'il soit impossible que l'un affiche "TAMAT SYIF" sans
  // que l'autre montre le véhicule (ou l'inverse).
  const hasValidLocation = !!(location && location.latitude != null && location.longitude != null);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      mapIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'FULLSCREEN_STATE', active }), '*');
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const handleMapMessage = (event) => {
      if (event.source !== mapIframeRef.current?.contentWindow) return;
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      if (data?.type === 'EXIT_FULLSCREEN_REQUEST') {
        if (document.exitFullscreen) document.exitFullscreen();
      }
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, []);

  const mapHtml = useMemo(() => buildOperasiMapHtml({ theme: { background: PALETTE.softOrangeBg } }), []);

  const handleMapLoad = () => setMapLoading(false);

  const vehiclesLive = useVehicles((updatedVehicle) => {
    // Le marqueur du véhicule ACTUELLEMENT piloté par ce pemandu est géré en
    // local uniquement (handleToggleTracking, optimiste) — on ignore ici les
    // mises à jour realtime pour ce même véhicule, sinon une confirmation DB
    // en retard (après plusieurs bascules rapides MULA/TAMAT) peut arriver
    // après un message optimiste plus récent et ré-effacer le marqueur à
    // tort, même si le pemandu est bien "en syif". Les autres véhicules
    // restent pilotés normalement par le realtime.
    if (updatedVehicle.id === selectedVehicle?.id) return;
    if (mapIframeRef?.current?.contentWindow) {
      mapIframeRef.current.contentWindow.postMessage(JSON.stringify({
        type: 'UPDATE_LOCATION',
        id: updatedVehicle.id,
        name: updatedVehicle.model,
        reg: updatedVehicle.reg,
        vehicleType: updatedVehicle.type,
        iconKey: updatedVehicle.icon_key,
        lat: updatedVehicle.latitude,
        lng: updatedVehicle.longitude,
        color: updatedVehicle.color || '#ef4444',
        status: updatedVehicle.tracking_status,
      }), '*');
    }
  });

  useEffect(() => {
    // Seule source de vérité pour le marqueur du pemandu lui-même : sa
    // position GPS locale (toujours fraîche, sans aller-retour réseau) —
    // le marqueur n'apparaît donc que lorsqu'une vraie position est reçue,
    // jamais avant, et jamais avec une position périmée.
    if (!isTracking || !selectedVehicle || !hasValidLocation) return;
    if (!mapIframeRef.current?.contentWindow) return;
    mapIframeRef.current.contentWindow.postMessage(JSON.stringify({
      type: 'UPDATE_LOCATION',
      id: selectedVehicle.id,
      name: selectedVehicle.model,
      reg: selectedVehicle.reg,
      vehicleType: selectedVehicle.type,
      iconKey: selectedVehicle.icon_key,
      lat: location.latitude,
      lng: location.longitude,
      color: selectedVehicle.color || '#ef4444',
      status: 'Patrol',
    }), '*');
  }, [location, isTracking, selectedVehicle]);

  useEffect(() => {
    if (!mapLoading && mapIframeRef?.current?.contentWindow && vehiclesLive.length > 0) {
      // Le véhicule du pemandu lui-même est exclu ici aussi : sa présence sur
      // la carte est entièrement pilotée par handleToggleTracking (local),
      // jamais par ce que la base contient déjà au chargement — sinon un
      // ancien statut "Patrol" resté en base (session précédente mal fermée)
      // ferait apparaître le point avant même que le GPS soit autorisé.
      const payload = vehiclesLive
        .filter((v) => v.id !== selectedVehicle?.id)
        .map((v) => ({ ...v, name: v.model, status: v.tracking_status }));
      mapIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'INIT_VEHICLES', payload }), '*');
    }
  }, [vehiclesLive, mapLoading, selectedVehicle]);

  useEffect(() => {
    if (!mapLoading && mapIframeRef?.current?.contentWindow) {
      const payload = calamityPoints.map((c) => ({
        id: c.id,
        category: c.category,
        description: c.description || '',
        lat: c.latitude,
        lng: c.longitude,
        color: getCalamityMeta(c.category).color,
        label: getCalamityMeta(c.category).label,
        logo: getCalamityLogoUrl(c.category),
        created_at: c.created_at,
      }));
      mapIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_CALAMITIES', payload }), '*');
    }
  }, [calamityPoints, mapLoading]);

  const doStopTracking = () => {
    setIsTracking(false);
    // Retire le marqueur du véhicule immédiatement, en même temps que le
    // changement du bouton — sans attendre l'aller-retour Supabase
    // (usePatrolTracking → tracking_status → Realtime → vehiclesLive)
    // qui, sinon, laisse le point visible un court instant après que le
    // bouton soit déjà repassé à "MULA SYIF".
    mapIframeRef.current?.contentWindow?.postMessage(JSON.stringify({
      type: 'UPDATE_LOCATION',
      id: selectedVehicle.id,
      status: 'Idle',
    }), '*');
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('apm_driver_active_vehicle');
    }
  };

  const handleToggleTracking = async () => {
    if (isTracking) {
      setConfirmStopVisible(true);
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

  // Options de catégorie dérivées des véhicules eux-mêmes, avec 'Darat' toujours en premier
  const categoryOptions = [...new Set(vehicles.map(v => v.category || 'Lain-lain'))].sort((a, b) => {
    if (a === 'Darat') return -1;
    if (b === 'Darat') return 1;
    return a.localeCompare(b);
  });

  // Si la catégorie active n'existe plus (ex: données changées) ou n'est pas encore définie,
  // on revient sur la première catégorie disponible
  useEffect(() => {
    if (!loadingVehicles && categoryOptions.length > 0 && !categoryOptions.includes(activeCategory)) {
      setActiveCategory(categoryOptions[0]);
    }
  }, [categoryOptions.join(','), loadingVehicles]);

  // Filter vehicles based on search query and active category
  const filteredVehicles = vehicles.filter(v =>
    (v.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.reg || '').toLowerCase().includes(searchQuery.toLowerCase())) &&
    (v.category || 'Lain-lain') === activeCategory
  );

  // Regroupe les véhicules par catégorie (fallback 'Lain-lain' si absente).
  // Une section n'apparaît que si elle contient au moins un véhicule ; 'Lain-lain' est
  // toujours placée en dernier quand elle existe.
  const vehiclesByCategory = filteredVehicles.reduce((acc, v) => {
    const category = v.category || 'Lain-lain';
    if (!acc[category]) acc[category] = [];
    acc[category].push(v);
    return acc;
  }, {});

  const sortedCategories = Object.keys(vehiclesByCategory).sort((a, b) => {
    if (a === 'Lain-lain') return 1;
    if (b === 'Lain-lain') return -1;
    return a.localeCompare(b);
  });

  const chunkIntoRows = (arr, size) => {
    const rows = [];
    for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
    return rows;
  };

  const vehicleSections = sortedCategories.map((category) => ({
    title: category,
    data: chunkIntoRows(vehiclesByCategory[category], numColumns),
  }));

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
      </View>
    );
  }

  // View 1: Vehicle Selection Screen
  if (!selectedVehicle) {
    return (
      <View style={styles.container}>
        <FlowingBackground />
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

        {categoryOptions.length > 1 && (
        <View style={styles.categorySegmentedControl}>
          {categoryOptions.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categorySegment, activeCategory === cat && styles.categorySegmentActive]}
              onPress={() => setActiveCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categorySegmentText, activeCategory === cat && styles.categorySegmentTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        )}

        {loadingVehicles ? (
          <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
        ) : (
          <SectionList
            sections={vehicleSections}
            keyExtractor={(row, index) => row.map((v) => v.id).join('-') || `row-${index}`}
            style={{ width: '100%' }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            stickySectionHeadersEnabled={false}
            renderItem={({ item: row }) => (
              <View style={styles.cardRow}>
                {row.map((item) => {
                  const stripeColor = item.color || PALETTE.orange;
                  const isRosak = item.status === 'Rosak';
                  const isDisabled = item.isBusy || isRosak;
                  const statusMeta = getStatusMeta(item.status);
                  return (
                    <View key={item.id} style={styles.vehicleCardCol}>
                      <TouchableOpacity
                        style={[styles.vehicleCard, isDisabled && styles.vehicleCardBusy]}
                        onPress={() => { if (!isDisabled) setSelectedVehicle(item); }}
                        activeOpacity={isDisabled ? 1 : 0.7}
                        disabled={isDisabled}
                      >
                        <View style={styles.vehicleCardBody}>
                          <View style={[styles.vehicleIconWrap, { backgroundColor: `${stripeColor}1F` }, isDisabled && { opacity: 0.4 }]}>
                            {getVehicleIcon(item.icon_key, stripeColor, 22)}
                          </View>
                          <Text style={[styles.vehiclePlateText, isDisabled && { opacity: 0.4 }]} numberOfLines={1}>
                            {item.reg || 'TIADA PLAT'}
                          </Text>
                          <Text style={[styles.vehicleModelText, isDisabled && { opacity: 0.4 }]} numberOfLines={2}>
                            {item.model}
                          </Text>
                          <View style={styles.badgeGroup}>
                            <View style={[styles.badge, { backgroundColor: statusMeta.bg }]}>
                              <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                            </View>
                            {!isRosak && (
                              item.isBusy ? (
                                <View style={[styles.badge, { backgroundColor: PALETTE.dangerSoft }]}>
                                  <Text style={[styles.badgeText, { color: PALETTE.danger }]}>Sedang Digunakan</Text>
                                </View>
                              ) : (
                                <View style={[styles.badge, { backgroundColor: PALETTE.successSoft }]}>
                                  <Text style={[styles.badgeText, { color: PALETTE.success }]}>Tersedia</Text>
                                </View>
                              )
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                {row.length < numColumns &&
                  Array.from({ length: numColumns - row.length }).map((_, i) => (
                    <View key={`spacer-${i}`} style={{ flex: 1 }} />
                  ))}
              </View>
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
    <View style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: PALETTE.softOrangeBg }}>
      <FlowingBackground />
      <ScrollView
        contentContainerStyle={{ alignItems: 'center', padding: 20, paddingTop: 50, paddingBottom: 40 }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
      >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          if (isTracking) {
            Alert.alert("Amaran", "Sila hentikan syif sebelum menukar kenderaan.");
            return;
          }
          // Le retour au sélecteur démonte l'iframe de la carte — quand un
          // nouveau véhicule sera choisi, une toute nouvelle instance Leaflet
          // sera créée, vide. Sans ce reset, mapLoading reste déjà à false
          // (jamais remis à true entre-temps), donc l'effet qui renvoie les
          // points kecemasan (dépendant de [calamityPoints, mapLoading]) ne se
          // redéclenche jamais pour cette nouvelle carte — d'où les points
          // manquants après un changement de véhicule.
          setMapLoading(true);
          setSelectedVehicle(null);
        }}
      >
        <ArrowLeft color={PALETTE.textDark} size={22} />
        <Text style={styles.backText}>Tukar Kenderaan</Text>
      </TouchableOpacity>

      <View style={{ width: '100%', maxWidth: 900, alignSelf: 'center', alignItems: 'center' }}>
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
              { backgroundColor: isTracking ? PALETTE.danger : PALETTE.orange, opacity: (isTracking && !hasValidLocation) ? 0.75 : 1 }
            ]}
            onPress={handleToggleTracking}
            activeOpacity={0.85}
          >
            {isTracking && !hasValidLocation ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : isTracking ? (
              <StopCircle color="#fff" size={30} />
            ) : (
              <Navigation color="#fff" size={30} />
            )}
            <Text style={styles.btnTextSmall}>
              {isTracking && !hasValidLocation ? 'MEMULAKAN...' : isTracking ? 'TAMAT SYIF' : 'MULA SYIF'}
            </Text>
          </TouchableOpacity>

          <Modal visible={confirmStopVisible} transparent animationType="fade" onRequestClose={() => setConfirmStopVisible(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
              <View style={{ width: '100%', maxWidth: 380, borderRadius: 24, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20 }}>
                <View style={{ backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <StopCircle size={26} color="#ef4444" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff' }}>Tamat Syif</Text>
                  <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' }}>
                    Adakah anda pasti mahu tamatkan syif ini?
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' }}>
                  <TouchableOpacity
                    onPress={() => setConfirmStopVisible(false)}
                    style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: PALETTE.textMutedDark, fontWeight: '800', fontSize: 14 }}>Batal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => { setConfirmStopVisible(false); doStopTracking(); }}
                    style={{ flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ef4444', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <StopCircle size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Ya, Tamatkan</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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

        <View style={{
          width: '100%', maxWidth: 800, aspectRatio: 1, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', marginTop: 20, position: 'relative',
          borderWidth: 2, borderColor: 'rgba(249, 115, 22, 0.45)',
          shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14, elevation: 3,
        }}>
          {Platform.OS === 'web' ? (
            createElement('iframe', {
              ref: mapIframeRef,
              srcDoc: mapHtml,
              style: { width: '100%', height: '100%', border: 'none' },
              title: 'Peta Kedudukan',
              onLoad: handleMapLoad,
              allowFullScreen: true,
              allow: 'fullscreen',
            })
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.cardLight }}>
              <Text style={{ color: PALETTE.textMutedDark, fontWeight: '600', textAlign: 'center', padding: 16 }}>
                Peta memerlukan 'react-native-webview' pada peranti mudah alih.
              </Text>
            </View>
          )}
          {mapLoading && Platform.OS === 'web' && (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.softOrangeBg }}>
              <ActivityIndicator size="large" color={PALETTE.orange} />
            </View>
          )}
          {Platform.OS === 'web' && !mapLoading && (
            <TouchableOpacity
              style={{
                position: 'absolute', top: 12, right: 12, zIndex: 10,
                width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff',
                justifyContent: 'center', alignItems: 'center',
                shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
              }}
              onPress={() => mapIframeRef.current?.requestFullscreen?.()}
              onMouseEnter={() => setFullscreenBtnHovered(true)}
              onMouseLeave={() => setFullscreenBtnHovered(false)}
            >
              <Maximize2 size={16} color={PALETTE.orange} />
              {fullscreenBtnHovered && (
                <View style={{ position: 'absolute', top: 42, right: 0, backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Skrin Penuh</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: PALETTE.softOrangeBg, position: 'relative', overflow: 'hidden' },
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
  title: { fontSize: 26, fontWeight: '900', color: PALETTE.textDark, marginBottom: 4 },
  subtitle: { fontSize: 13, color: PALETTE.textMutedDark, fontWeight: '600' },
  emptyText: { color: PALETTE.textMutedDark, textAlign: 'center', marginTop: 20 },
  sectionHeaderText: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark, marginBottom: 10, marginTop: 6 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 15,
    borderRadius: 14, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    backgroundColor: PALETTE.cardLight, marginBottom: 20, height: 50,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: '100%', fontSize: 15, color: PALETTE.textDark, outlineStyle: 'none', outlineWidth: 0 },

  categorySegmentedControl: {
    flexDirection: 'row', width: '100%', padding: 4, borderRadius: 14,
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    marginBottom: 20,
  },
  categorySegment: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  categorySegmentActive: {
    backgroundColor: PALETTE.orange,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  categorySegmentText: { fontSize: 13, fontWeight: '700', color: PALETTE.textMutedDark },
  categorySegmentTextActive: { color: '#fff' },

  cardRow: { flexDirection: 'row', gap: 10 },
  vehicleCardCol: { flex: 1, marginBottom: 10 },
  vehicleCard: {
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    borderRadius: 14, overflow: 'hidden',
  },
  vehicleCardBusy: { backgroundColor: PALETTE.surface },
  vehicleCardBody: { padding: 12, alignItems: 'center' },
  vehicleIconWrap: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  vehiclePlateText: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark, textAlign: 'center' },
  vehicleModelText: { fontSize: 11, color: PALETTE.textMutedDark, fontWeight: '600', textAlign: 'center', marginTop: 2, height: 28 },
  badgeGroup: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: '800' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 20, marginBottom: 16,
  },
  sectionHeaderTitle: { fontSize: 15, fontWeight: '900', color: PALETTE.textDark },
  sectionHeaderCountPill: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
  },
  sectionHeaderCountText: { fontSize: 11, fontWeight: '800', color: PALETTE.orange },

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
    marginBottom: 32, alignItems: 'center', padding: 20, borderRadius: 20, width: '100%',
    backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
    shadowColor: '#c9825a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 2,
  },
  statusText: { fontSize: 15, fontWeight: '800', color: PALETTE.textDark },
  statusCoords: { color: PALETTE.textMutedDark, fontSize: 12, marginTop: 5 },

  actionRow: { flexDirection: 'row', gap: 20, alignItems: 'center', justifyContent: 'center' },
  joinButton: { width: '100%', paddingVertical: 16, borderRadius: 14, alignItems: 'center', backgroundColor: PALETTE.orange },
  joinButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  joinErrorText: { color: '#dc2626', fontSize: 13, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  button: {
    width: 200, height: 200, borderRadius: 100, justifyContent: 'center', alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
  },
  buttonSmall: { width: 150, height: 150, borderRadius: 75 },
  btnTextSmall: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 8, textAlign: 'center' },
});