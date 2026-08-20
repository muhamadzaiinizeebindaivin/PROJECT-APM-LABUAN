// src/screens/sekretariat/PetaTab.js
import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Modal, TextInput, ActivityIndicator, Alert, Image, useWindowDimensions } from 'react-native';
import { Map, History, ClipboardList, AlertTriangle, X, Plus, Download, Trash2, Maximize2, MapPin, ChevronLeft, PlusCircle, Check, Droplets, Waves, Mountain, Flame, Wind, CloudRain, Zap, Siren } from 'lucide-react-native';

const CATEGORY_ICON_OPTIONS = [
  { key: 'MapPin', Icon: MapPin },
  { key: 'Droplets', Icon: Droplets },
  { key: 'Waves', Icon: Waves },
  { key: 'Mountain', Icon: Mountain },
  { key: 'Flame', Icon: Flame },
  { key: 'Wind', Icon: Wind },
  { key: 'CloudRain', Icon: CloudRain },
  { key: 'Zap', Icon: Zap },
  { key: 'Siren', Icon: Siren },
];
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { buildSekretariatMapHtml } from './sekretariatMapTemplate';
import { useOnlineAgencies } from '../../hooks/useOnlineAgencies';
import { useBencanaPoints } from '../../hooks/useBencanaPoints';
import { useHotspots } from '../../hooks/useHotspots';
import { useHotspotCategories } from '../../hooks/useHotspotCategories';
import { useAgencyTrackingHistory } from '../../hooks/useAgencyTrackingHistory';
import ModalSelectField from '../../components/ModalSelectField';
import FullscreenViewer from '../../components/FullscreenViewer';
import { generateAgencyHistoryPdf, generateBencanaHistoryPdf } from '../../utils/agencyReportsPdf';
import { appStyles as sekretariatStyles } from '../../styles/appStyles';
import { petaStyles as styles } from './petaStyles';
import { PALETTE } from '../../constants/palette';

const BULAN_MS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const BULAN_OPTIONS = ['Semua Bulan', ...BULAN_MS];
const PAGE_SIZE = 15;

const buildAgencyColorMap = (agencyList) => {
  const map = {};
  const total = agencyList.length || 1;
  agencyList.forEach((a, index) => {
    const hue = Math.round((360 / total) * index);
    map[a.agency] = `hsl(${hue}, 70%, 45%)`;
  });
  return map;
};

// Logo de l'agence, ou pastille de couleur en fallback
const AgencyMark = ({ logo, color, size = 18 }) => {
  if (logo) {
    return <Image source={{ uri: logo }} style={{ width: size, height: size, borderRadius: 4 }} resizeMode="contain" />;
  }
  return <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />;
};

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}jam ${m} minit`;
  return `${m} minit`;
};

export default function PetaTab({ theme, userRole, isEditMode, onNotify }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const now = new Date();
  const petaIframeRef = useRef(null);

  const { onlineAgencies } = useOnlineAgencies();
  const onlineAgenciesRef = useRef([]);
  onlineAgenciesRef.current = onlineAgencies;
  const { bencanaPoints, saveBencana, completeBencana, updateBencana, deleteBencana } = useBencanaPoints();
  const [editingBencana, setEditingBencana] = useState(null);
  const [editForm, setEditForm] = useState({ category: '', lokasi: '', pps: '', description: '' });
  const [editingSaving, setEditingSaving] = useState(false);

  const openEditBencana = (id) => {
    const item = bencanaPointsRef.current.find((b) => b.id === id);
    if (!item) return;
    setEditingBencana(item);
    setEditForm({ category: item.category || '', lokasi: item.lokasi || '', pps: item.pps || '', description: item.description || '' });
  };

  const handleEditSave = async () => {
    if (!editingBencana) return;
    setEditingSaving(true);
    const { error } = await updateBencana(editingBencana.id, editForm);
    setEditingSaving(false);
    if (!error) {
      onNotify?.('success', 'Titik bencana berjaya dikemaskini.');
      setEditingBencana(null);
    } else {
      onNotify?.('error', 'Gagal mengemaskini titik bencana.');
    }
  };
  const { hotspotList } = useHotspots(onNotify);
  const { categories: hotspotCategories } = useHotspotCategories(onNotify);

  // Étape du flux "Tambah Titik Bencana" : null (fermé) → 'choice' (choix
  // initial) → soit 'existingList' (cartes de hotspots, clic = plot direct),
  // soit map en mode placement puis le formulaire "point libre".
  const [bencanaFlowStep, setBencanaFlowStep] = useState(null); // null | 'choice' | 'existingList'
  const [newHotspotCategory, setNewHotspotCategory] = useState('');
  const [newHotspotCategoryOpen, setNewHotspotCategoryOpen] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [customCategoryColor, setCustomCategoryColor] = useState('#1D4E89');
  const [customCategoryIcon, setCustomCategoryIcon] = useState('MapPin');
  const [savingBencana, setSavingBencana] = useState(false);
  const { addCategory: addHotspotCategory } = useHotspotCategories(onNotify);

  const CATEGORY_COLORS = ['#1D4E89', '#F4762B', '#7c3aed', '#dc2626', '#16a34a', '#0891b2', '#d97706', '#db2777'];

  const resetBencanaForm = () => {
    setBencanaModalVisible(false);
    setBencanaFlowStep(null);
    setIsPlacingBencana(false);
    setPendingBencanaPlacement(null);
    setBencanaCategory('');
    setBencanaDescription('');
    setNewHotspotCategory('');
    setCustomCategoryText('');
    setCustomCategoryColor('#1D4E89');
    setCustomCategoryIcon('MapPin');
    setSelectedExistingHotspot(null);
    setExistingKeterangan('');
    setExistingLokasi('');
    setExistingPps('');
    setExistingCategoryFilter(null);
    setBencanaLokasi('');
    setBencanaPps('');
  };

  const [existingCategoryFilter, setExistingCategoryFilter] = useState(null);
  const [selectedExistingHotspot, setSelectedExistingHotspot] = useState(null);
  const [existingKeterangan, setExistingKeterangan] = useState('');
  const [existingLokasi, setExistingLokasi] = useState('');
  const [existingPps, setExistingPps] = useState('');
  const [savingExistingHotspot, setSavingExistingHotspot] = useState(false);
  const [bencanaLokasi, setBencanaLokasi] = useState('');
  const [bencanaPps, setBencanaPps] = useState('');

  // "Selesai" — formulaire de clôture d'un titik bencana actif
  const [completingBencana, setCompletingBencana] = useState(null); // le point en cours de clôture, ou null
  const [completeForm, setCompleteForm] = useState({ jenis_bencana: '', lokasi: '', jumlah_kir: '', jumlah_mangsa: '', pps: '', description: '' });
  const [completingSaving, setCompletingSaving] = useState(false);

  // Ref pour éviter la closure périmée dans handleMapMessage ci-dessous —
  // cet effet ne se réabonne que sur [isPlacingBencana], pas sur bencanaPoints.
  const bencanaPointsRef = useRef([]);
  bencanaPointsRef.current = bencanaPoints;

  const openCompleteBencana = (id) => {
    const item = bencanaPointsRef.current.find((b) => b.id === id);
    if (!item) return;
    setCompletingBencana(item);
    setCompleteForm({ jenis_bencana: item.jenis_bencana || '', lokasi: item.lokasi || '', jumlah_kir: item.jumlah_kir?.toString() || '', jumlah_mangsa: item.jumlah_mangsa?.toString() || '', pps: item.pps || '', description: item.description || '' });
  };

  const handleCompleteSave = async () => {
    if (!completingBencana) return;
    setCompletingSaving(true);
    const { error } = await completeBencana(completingBencana.id, completeForm);
    setCompletingSaving(false);
    if (!error) {
      onNotify?.('success', 'Titik bencana berjaya dikemaskini.');
      setCompletingBencana(null);
    } else {
      onNotify?.('error', 'Gagal mengemaskini titik bencana.');
    }
  };

  const handlePickExistingHotspot = (hotspot) => {
    if (hotspot.latitude == null || hotspot.longitude == null) return;
    setSelectedExistingHotspot(hotspot);
    setExistingLokasi(hotspot.area || '');
    setExistingPps('');
  };

  const confirmSaveExistingHotspot = async () => {
    if (!selectedExistingHotspot) return;
    setSavingExistingHotspot(true);
    const categoryLabel = hotspotCategories.find((c) => c.key === selectedExistingHotspot.category)?.label || selectedExistingHotspot.category;
    const { error } = await saveBencana({
      category: selectedExistingHotspot.category,
      description: existingKeterangan,
      latitude: selectedExistingHotspot.latitude,
      longitude: selectedExistingHotspot.longitude,
      hotspot_id: selectedExistingHotspot.id,
      jenis_bencana: categoryLabel,
      lokasi: existingLokasi,
      pps: existingPps,
    });
    setSavingExistingHotspot(false);
    if (!error) {
      onNotify?.('success', 'Titik bencana ditambah.');
      resetBencanaForm();
    }
  };
  const { trackingHistory, loadingHistory, deleteTrackingHistory } = useAgencyTrackingHistory();

  // Liste légère des agences, uniquement pour la légende de couleurs de la carte
  const [agencyNames, setAgencyNames] = useState([]);
  useEffect(() => {
    const fetchAgencyNames = async () => {
      const { data } = await supabaseSandbox.from('jpbd_directory').select('id, agency, logo_url').order('created_at', { ascending: true });
      setAgencyNames(data || []);
    };
    fetchAgencyNames();
    const subscription = supabaseSandbox
      .channel('peta_jpbd_directory_changes')
      .on('postgres_changes', { event: '*', schema: 'sandbox', table: 'jpbd_directory' }, () => {
        fetchAgencyNames();
      })
      .subscribe();
    return () => { supabaseSandbox.removeChannel(subscription); };
  }, []);

  const [petaIframeLoading, setPetaIframeLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // L'iframe signale quand la carte est initialisée
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'MAP_READY') setMapReady(true);
      } catch (e) { /* messages non-JSON (HMR etc.) */ }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // --- Placement de bencana ---
  const [isPlacingBencana, setIsPlacingBencana] = useState(false);
  const [pendingBencanaPlacement, setPendingBencanaPlacement] = useState(null);
  const [bencanaCategory, setBencanaCategory] = useState('');
  const [bencanaDescription, setBencanaDescription] = useState('');
  const [bencanaModalVisible, setBencanaModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'bencana' | 'history' | 'agency', id, label }
  const displayDeleteTargetRef = useRef(null);
  if (deleteTarget) displayDeleteTargetRef.current = deleteTarget;
  const [deletingTarget, setDeletingTarget] = useState(false);

  // --- Panneau latéral ---
  const [sidePanel, setSidePanel] = useState('none'); // 'none' | 'history' | 'summary'
  const [historyBtnHovered, setHistoryBtnHovered] = useState(false);
  const [summaryBtnHovered, setSummaryBtnHovered] = useState(false);
  const [addBencanaBtnHovered, setAddBencanaBtnHovered] = useState(false);

  const [historyYear, setHistoryYear] = useState(now.getFullYear());
  const [historyMonth, setHistoryMonth] = useState(now.getMonth());
  const [historyYearOpen, setHistoryYearOpen] = useState(false);
  const [historyMonthOpen, setHistoryMonthOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);

  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth());
  const [summaryYearOpen, setSummaryYearOpen] = useState(false);
  const [summaryMonthOpen, setSummaryMonthOpen] = useState(false);
  const [summaryPage, setSummaryPage] = useState(0);

  const [exportingHistoryPdf, setExportingHistoryPdf] = useState(false);
  const [exportingSummaryPdf, setExportingSummaryPdf] = useState(false);

  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [searchSummaryQuery, setSearchSummaryQuery] = useState('');

  const historyPeriodLabel = historyMonth === null
    ? `Tahun ${historyYear}`
    : `${BULAN_MS[historyMonth]} ${historyYear}`;

  const summaryPeriodLabel = summaryMonth === null
    ? `Tahun ${summaryYear}`
    : `${BULAN_MS[summaryMonth]} ${summaryYear}`;

  const handleExportHistoryPdf = async () => {
    setExportingHistoryPdf(true);
    try {
      await generateAgencyHistoryPdf({ rows: filteredHistory, periodLabel: historyPeriodLabel });
    } catch (e) {
      console.error('Gagal menjana PDF:', e);
    } finally {
      setExportingHistoryPdf(false);
    }
  };

  const handleExportSummaryPdf = async () => {
    setExportingSummaryPdf(true);
    try {
      await generateBencanaHistoryPdf({ rows: filteredBencanaSummary, periodLabel: summaryPeriodLabel });
    } catch (e) {
      console.error('Gagal menjana PDF:', e);
    } finally {
      setExportingSummaryPdf(false);
    }
  };

  const agencyColorMap = buildAgencyColorMap(agencyNames);
  const getAgencyColorFromMap = (agencyName) => agencyColorMap[agencyName] || PALETTE.textMutedDark;
  const agencyLogoMap = {};
  agencyNames.forEach((a) => { if (a.logo_url) agencyLogoMap[a.agency] = a.logo_url; });
  const getAgencyLogo = (agencyName) => agencyLogoMap[agencyName] || null;

  const [fullscreenBtnHovered, setFullscreenBtnHovered] = useState(false);
  // Voir la même note dans LiveMapTab.js : iOS n'a jamais la vraie
  // Fullscreen API pour une iframe, donc on la simule en CSS sur cette
  // plateforme uniquement.
  const isIOS = Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [confirmStopVisible, setConfirmStopVisible] = useState(false);
  const petaMapHtml = buildSekretariatMapHtml({ theme, userRole });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      petaIframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'FULLSCREEN_STATE', active }), '*');
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePetaIframeLoad = () => {
    setPetaIframeLoading(false);
  };

  useEffect(() => {
    if (mapReady && petaIframeRef?.current?.contentWindow) {
      const payload = onlineAgencies.map(a => ({
        id: a.id,
        name: a.member_name,
        agency: a.jpbd_directory?.agency || '',
        lat: a.latitude,
        lng: a.longitude,
        color: getAgencyColorFromMap(a.jpbd_directory?.agency || ''),
        logo: getAgencyLogo(a.jpbd_directory?.agency || ''),
        updated: a.last_updated ? new Date(a.last_updated).toLocaleTimeString() : ''
      }));
      petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_AGENCIES', payload }), '*');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineAgencies, agencyNames, mapReady]);

  useEffect(() => {
    if (mapReady && petaIframeRef?.current?.contentWindow) {
      const payload = bencanaPoints
        .filter(b => b.status !== 'resolved' && b.latitude != null && b.longitude != null)
        .map(b => {
          const cat = hotspotCategories.find((c) => c.key === b.category);
          return {
            id: b.id,
            category: b.category,
            categoryLabel: cat?.label || b.category,
            icon: cat?.icon || 'MapPin',
            color: cat?.color || '#f97316',
            description: b.description || '',
            lokasi: b.lokasi || '',
            pps: b.pps || '',
            lat: b.latitude, lng: b.longitude, created_at: b.created_at,
          };
        });
      petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_BENCANA', payload }), '*');
    }
  }, [bencanaPoints, hotspotCategories, mapReady]);

  useEffect(() => {
    // La carte tourne dans une <iframe> web (voir plus bas) : `window` n'existe
    // pas sur mobile natif, donc on ne branche ce listener que sur le web.
    if (Platform.OS !== 'web') return undefined;

    const handleMapMessage = (event) => {
      if (event.source !== petaIframeRef.current?.contentWindow) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'EXIT_FULLSCREEN_REQUEST') {
          if (document.exitFullscreen) document.exitFullscreen();
        } else if (data.type === 'MAP_CLICKED' && isPlacingBencana) {
          setPendingBencanaPlacement({ lat: data.lat, lng: data.lng });
          setBencanaModalVisible(true);
          setIsPlacingBencana(false);
        } else if (data.type === 'DELETE_BENCANA_REQUEST') {
          const point = bencanaPointsRef.current.find((b) => b.id === data.id);
          handleDeleteBencanaSummary(data.id, point?.category || 'Titik Bencana');
        } else if (data.type === 'RESOLVE_BENCANA_REQUEST') {
          openCompleteBencana(data.id);
        } else if (data.type === 'EDIT_BENCANA_REQUEST') {
          openEditBencana(data.id);
        } else if (data.type === 'DELETE_AGENCY_TRACKER_REQUEST') {
          const agency = onlineAgenciesRef.current.find(a => a.id === data.id);
          const label = [agency?.jpbd_directory?.agency, agency?.member_name].map(s => s?.trim()).find(s => s) || '-';
          handleDeleteOnlineAgency(data.id, label);
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlacingBencana]);

  const showBencanaError = (msg) => {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Ralat', msg);
  };

  const handleSaveBencana = async () => {
    if (!pendingBencanaPlacement) return;

    const isCustom = newHotspotCategory === '__custom__';
    if (!newHotspotCategory || (isCustom && !customCategoryText.trim())) {
      showBencanaError(isCustom ? 'Sila taip kategori.' : 'Sila pilih kategori.');
      return;
    }

    setSavingBencana(true);
    let categoryKey = newHotspotCategory;

    if (isCustom) {
      const ok = await addHotspotCategory({
        label: customCategoryText.trim(), sub: '', color: customCategoryColor, prefix: 'ID', icon: customCategoryIcon,
      });
      if (!ok) { setSavingBencana(false); return; }
      // Même dérivation de clé que useHotspotCategories.addCategory
      categoryKey = customCategoryText.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    }

    // Point libre — pas lié à un hotspot (hotspots ne sert que de raccourci
    // pour pointer un lieu déjà connu, pas à enregistrer de nouvelles données).
    const categoryLabel = hotspotCategories.find((c) => c.key === categoryKey)?.label || (isCustom ? customCategoryText.trim() : categoryKey);
    const { error } = await saveBencana({
      category: categoryKey,
      description: bencanaDescription,
      latitude: pendingBencanaPlacement.lat,
      longitude: pendingBencanaPlacement.lng,
      hotspot_id: null,
      jenis_bencana: categoryLabel,
      lokasi: bencanaLokasi,
      pps: bencanaPps,
    });
    setSavingBencana(false);
    if (!error) resetBencanaForm();
  };

  const handleDeleteBencanaSummary = (id, label) => {
    setDeleteTarget({ type: 'bencana', id, label });
  };

  const handleDeleteTrackingHistory = (id, label) => {
    setDeleteTarget({ type: 'history', id, label });
  };

  const handleDeleteOnlineAgency = (id, label) => {
    setDeleteTarget({ type: 'agency', id, label });
  };

  const confirmDeleteTarget = async () => {
    if (!deleteTarget) return;
    setDeletingTarget(true);

    let result;
    if (deleteTarget.type === 'bencana') {
      result = await deleteBencana(deleteTarget.id, { skipConfirm: true });
    } else if (deleteTarget.type === 'history') {
      result = await deleteTrackingHistory(deleteTarget.id, { skipConfirm: true });
    } else {
      const { error } = await supabaseSandbox.from('agency_trackers').delete().eq('id', deleteTarget.id);
      result = { error };
    }

    setDeletingTarget(false);
    const type = deleteTarget.type;
    setDeleteTarget(null);

    const messages = {
      bencana: ['Rekod bencana berjaya dipadam.', 'Gagal memadam rekod bencana.'],
      history: ['Rekod patrol agensi berjaya dipadam.', 'Gagal memadam rekod patrol agensi.'],
      agency: ['Agensi berjaya diputuskan daripada peta.', 'Gagal memutuskan agensi.'],
    };
    const [successMsg, errorMsg] = messages[type];
    onNotify?.(!result?.error ? 'success' : 'error', !result?.error ? successMsg : errorMsg);
  };

  // --- Filtre/pagination : Sejarah Patrol Agensi ---
  const availableHistoryYears = React.useMemo(() => {
    const years = new Set(trackingHistory.map(h => new Date(h.ended_at).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [trackingHistory]);

  const filteredHistory = React.useMemo(() => {
    const q = searchHistoryQuery.trim().toLowerCase();
    return trackingHistory.filter(h => {
      const d = new Date(h.ended_at);
      if (d.getFullYear() !== historyYear) return false;
      if (historyMonth !== null && d.getMonth() !== historyMonth) return false;
      if (q) {
        const agency = (h.jpbd_directory?.agency || '').toLowerCase();
        const member = (h.member_name || '').toLowerCase();
        if (!agency.includes(q) && !member.includes(q)) return false;
      }
      return true;
    });
  }, [trackingHistory, historyYear, historyMonth, searchHistoryQuery]);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const pagedHistory = React.useMemo(() => {
    const start = historyPage * PAGE_SIZE;
    return filteredHistory.slice(start, start + PAGE_SIZE);
  }, [filteredHistory, historyPage]);

  useEffect(() => { setHistoryPage(0); }, [historyYear, historyMonth]);

  // --- Filtre/pagination : Ringkasan Bencana ---
  const availableSummaryYears = React.useMemo(() => {
    const years = new Set(bencanaPoints.map(b => new Date(b.created_at).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [bencanaPoints]);

  const filteredBencanaSummary = React.useMemo(() => {
    const q = searchSummaryQuery.trim().toLowerCase();
    return bencanaPoints
      .filter(b => {
        const d = new Date(b.created_at);
        if (d.getFullYear() !== summaryYear) return false;
        if (summaryMonth !== null && d.getMonth() !== summaryMonth) return false;
        if (q && !(b.category || '').toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [bencanaPoints, summaryYear, summaryMonth, searchSummaryQuery]);

  const summaryTotalPages = Math.max(1, Math.ceil(filteredBencanaSummary.length / PAGE_SIZE));
  const pagedBencanaSummary = React.useMemo(() => {
    const start = summaryPage * PAGE_SIZE;
    return filteredBencanaSummary.slice(start, start + PAGE_SIZE);
  }, [filteredBencanaSummary, summaryPage]);

  useEffect(() => { setSummaryPage(0); }, [summaryYear, summaryMonth]);

  const renderHistoryTable = (large = false) => (
    <>
      <View style={styles.historyFilterRow}>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Tahun"
            value={String(historyYear)}
            placeholder="Tahun"
            options={availableHistoryYears}
            isOpen={historyYearOpen}
            onToggle={() => { setHistoryYearOpen(!historyYearOpen); setHistoryMonthOpen(false); }}
            onSelect={(opt) => { setHistoryYear(Number(opt)); setHistoryYearOpen(false); }}
            stackIndex={2000}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Bulan"
            value={historyMonth === null ? 'Semua Bulan' : BULAN_MS[historyMonth]}
            placeholder="Bulan"
            options={BULAN_OPTIONS}
            isOpen={historyMonthOpen}
            onToggle={() => { setHistoryMonthOpen(!historyMonthOpen); setHistoryYearOpen(false); }}
            onSelect={(opt) => { setHistoryMonth(opt === 'Semua Bulan' ? null : BULAN_MS.indexOf(opt)); setHistoryMonthOpen(false); }}
            stackIndex={1000}
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <TextInput
          style={sekretariatStyles.input}
          placeholder="Cari agensi atau ahli..."
          placeholderTextColor={PALETTE.textMutedDark}
          value={searchHistoryQuery}
          onChangeText={setSearchHistoryQuery}
        />
      </View>

      {loadingHistory ? (
        <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginTop: 20 }} />
      ) : pagedHistory.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod sejarah untuk tempoh ini.</Text>
      ) : (
        <>
          {!isMobile ? (
          <View style={styles.calamityTableWrapper}>
            <View style={styles.calamityTableHeaderRow}>
              <View style={[styles.historyAgencyColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Agensi</Text>
              </View>
              <View style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Tempoh</Text>
              </View>
              <View style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Jarak</Text>
              </View>
              <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Tarikh</Text>
              </View>
              {isEditMode && (userRole === 'sekretariat' || userRole === 'admin') && (
                <View style={[{ width: 50 }, styles.calamityHeaderCellBox]}>
                  <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}></Text>
                </View>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {pagedHistory.map((h, index) => (
                <View key={h.id} style={[styles.calamityTableRow, { backgroundColor: index % 2 === 0 ? PALETTE.cardLight : PALETTE.surface }]}>
                  <View style={[styles.historyAgencyColFlex, { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingVertical: 10 }]}>
                    <AgencyMark logo={getAgencyLogo(h.jpbd_directory?.agency)} color={getAgencyColorFromMap(h.jpbd_directory?.agency)} size={20} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tableCellAgency, large && { fontSize: 16 }]} numberOfLines={1}>{h.jpbd_directory?.agency || '-'}</Text>
                      <Text style={[styles.tableCellMember, large && { fontSize: 13 }]} numberOfLines={1}>{h.member_name}</Text>
                    </View>
                  </View>
                  <Text style={[styles.calamityTableCell, styles.calamityCatColFlex, large && { fontSize: 16 }]}>{formatDuration(h.duration_seconds)}</Text>
                  <Text style={[styles.calamityTableCell, styles.calamityCatColFlex, large && { fontSize: 16 }]}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                  <View style={[styles.calamityTotalColFlex, { paddingVertical: 10 }]}>
                    <Text style={[styles.tableCellDate, large && { fontSize: 13 }]}>{new Date(h.ended_at).toLocaleDateString('ms-MY')}</Text>
                    <Text style={[styles.tableCellTime, large && { fontSize: 12 }]}>{new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                  {isEditMode && (userRole === 'sekretariat' || userRole === 'admin') && (
                    <View style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => handleDeleteTrackingHistory(h.id, h.jpbd_directory?.agency || h.member_name)}
                        style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(220, 38, 38, 0.10)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={13} color={PALETTE.danger || '#dc2626'} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
          ) : (
          <View>
            {pagedHistory.map((h) => (
              <View key={h.id} style={styles.historyCardMobile}>
                <View style={styles.historyCardMobileTopRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AgencyMark logo={getAgencyLogo(h.jpbd_directory?.agency)} color={getAgencyColorFromMap(h.jpbd_directory?.agency)} size={20} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tableCellAgency} numberOfLines={1}>{h.jpbd_directory?.agency || '-'}</Text>
                      <Text style={styles.tableCellMember} numberOfLines={1}>{h.member_name}</Text>
                    </View>
                  </View>
                  {isEditMode && (userRole === 'sekretariat' || userRole === 'admin') && (
                    <TouchableOpacity
                      onPress={() => handleDeleteTrackingHistory(h.id, h.jpbd_directory?.agency || h.member_name)}
                      style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(220, 38, 38, 0.10)', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={13} color={PALETTE.danger || '#dc2626'} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.historyCardMobileStatsRow}>
                  <Text style={styles.historyCardMobileStat}>{formatDuration(h.duration_seconds)}</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={styles.historyCardMobileStat}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={styles.historyCardMobileStat}>{new Date(h.ended_at).toLocaleDateString('ms-MY')} {new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            ))}
          </View>
          )}

          <View style={styles.paginationRow}>
            <Text style={styles.pageIndicator}>{historyPage + 1} / {historyTotalPages}</Text>
            <View style={styles.pageArrowRow}>
              <TouchableOpacity
                onPress={() => setHistoryPage(p => Math.max(0, p - 1))}
                disabled={historyPage === 0}
                style={[styles.pageBtn, historyPage === 0 && styles.pageBtnDisabled]}
              >
                <Text style={[styles.pageBtnText, historyPage === 0 && styles.pageBtnTextDisabled]}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setHistoryPage(p => Math.min(historyTotalPages - 1, p + 1))}
                disabled={historyPage >= historyTotalPages - 1}
                style={[styles.pageBtn, historyPage >= historyTotalPages - 1 && styles.pageBtnDisabled]}
              >
                <Text style={[styles.pageBtnText, historyPage >= historyTotalPages - 1 && styles.pageBtnTextDisabled]}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </>
  );

  const renderSummaryContent = (large = false) => (
    <>
      <View style={styles.historyFilterRow}>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Tahun"
            value={String(summaryYear)}
            placeholder="Tahun"
            options={availableSummaryYears}
            isOpen={summaryYearOpen}
            onToggle={() => { setSummaryYearOpen(!summaryYearOpen); setSummaryMonthOpen(false); }}
            onSelect={(opt) => { setSummaryYear(Number(opt)); setSummaryYearOpen(false); }}
            stackIndex={2000}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Bulan"
            value={summaryMonth === null ? 'Semua Bulan' : BULAN_MS[summaryMonth]}
            placeholder="Bulan"
            options={BULAN_OPTIONS}
            isOpen={summaryMonthOpen}
            onToggle={() => { setSummaryMonthOpen(!summaryMonthOpen); setSummaryYearOpen(false); }}
            onSelect={(opt) => { setSummaryMonth(opt === 'Semua Bulan' ? null : BULAN_MS.indexOf(opt)); setSummaryMonthOpen(false); }}
            stackIndex={1000}
          />
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <TextInput
          style={sekretariatStyles.input}
          placeholder="Cari nama bencana..."
          placeholderTextColor={PALETTE.textMutedDark}
          value={searchSummaryQuery}
          onChangeText={setSearchSummaryQuery}
        />
      </View>

      {pagedBencanaSummary.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod bencana untuk tempoh ini.</Text>
      ) : (
        <>
          {!isMobile ? (
          <View style={styles.calamityTableWrapper}>
            <View style={styles.calamityTableHeaderRow}>
              <View style={[styles.historyAgencyColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Nama Bencana</Text>
              </View>
              <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Tarikh Mula</Text>
              </View>
              <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Tarikh Tamat</Text>
              </View>
              {isEditMode && (userRole === 'sekretariat' || userRole === 'admin') && (
                <View style={[{ width: 50 }, styles.calamityHeaderCellBox]}>
                  <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}></Text>
                </View>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {pagedBencanaSummary.map((b, index) => (
                <View key={b.id} style={[styles.calamityTableRow, { backgroundColor: index % 2 === 0 ? PALETTE.cardLight : PALETTE.surface }]}>
                  <Text style={[styles.calamityTableCell, styles.historyAgencyColFlex, { textAlign: 'left', paddingLeft: 16, fontWeight: '700' }, large && { fontSize: 16 }]} numberOfLines={1}>
                    {b.category}
                  </Text>
                  <Text style={[styles.calamityTableCell, styles.calamityTotalColFlex, large && { fontSize: 16 }]}>
                    {new Date(b.created_at).toLocaleDateString('ms-MY')}
                  </Text>
                  <Text style={[styles.calamityTableCell, styles.calamityTotalColFlex, !b.resolved_at && { fontStyle: 'italic', color: PALETTE.orangeDark }, large && { fontSize: 16 }]}>
                    {b.resolved_at ? new Date(b.resolved_at).toLocaleDateString('ms-MY') : 'Bencana Belum Selesai'}
                  </Text>
                  {isEditMode && (userRole === 'sekretariat' || userRole === 'admin') && (
                    <View style={{ width: 50, alignItems: 'center', justifyContent: 'center' }}>
                      <TouchableOpacity
                        onPress={() => handleDeleteBencanaSummary(b.id, b.category)}
                        style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(220, 38, 38, 0.10)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={13} color={PALETTE.danger || '#dc2626'} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
          ) : (
          <View>
            {pagedBencanaSummary.map((b) => (
              <View key={b.id} style={styles.historyCardMobile}>
                <View style={styles.historyCardMobileTopRow}>
                  <Text style={[styles.tableCellAgency, { flex: 1 }]} numberOfLines={1}>{b.category}</Text>
                  {isEditMode && (userRole === 'sekretariat' || userRole === 'admin') && (
                    <TouchableOpacity
                      onPress={() => handleDeleteBencanaSummary(b.id, b.category)}
                      style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'rgba(220, 38, 38, 0.10)', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={13} color={PALETTE.danger || '#dc2626'} />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.historyCardMobileStatsRow}>
                  <Text style={styles.historyCardMobileStat}>Mula: {new Date(b.created_at).toLocaleDateString('ms-MY')}</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={[styles.historyCardMobileStat, !b.resolved_at && { fontStyle: 'italic', color: PALETTE.orangeDark }]}>
                    {b.resolved_at ? `Tamat: ${new Date(b.resolved_at).toLocaleDateString('ms-MY')}` : 'Belum Selesai'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          )}

          <View style={styles.paginationRow}>
            <Text style={styles.pageIndicator}>{summaryPage + 1} / {summaryTotalPages}</Text>
            <View style={styles.pageArrowRow}>
              <TouchableOpacity
                onPress={() => setSummaryPage(p => Math.max(0, p - 1))}
                disabled={summaryPage === 0}
                style={[styles.pageBtn, summaryPage === 0 && styles.pageBtnDisabled]}
              >
                <Text style={[styles.pageBtnText, summaryPage === 0 && styles.pageBtnTextDisabled]}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setSummaryPage(p => Math.min(summaryTotalPages - 1, p + 1))}
                disabled={summaryPage >= summaryTotalPages - 1}
                style={[styles.pageBtn, summaryPage >= summaryTotalPages - 1 && styles.pageBtnDisabled]}
              >
                <Text style={[styles.pageBtnText, summaryPage >= summaryTotalPages - 1 && styles.pageBtnTextDisabled]}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </>
  );

  const showMobilePanelFullscreen = isMobile && sidePanel !== 'none';
  const PetaContainerWrapper = isMobile && !showMobilePanelFullscreen ? ScrollView : View;
  const petaContainerWrapperProps = showMobilePanelFullscreen
    ? { style: styles.petaFixedContainer }
    : isMobile
      ? { style: { flex: 1 }, contentContainerStyle: [styles.petaFixedContainer, styles.petaFixedContainerMobile] }
      : { style: styles.petaFixedContainer };

  return (
    <PetaContainerWrapper {...petaContainerWrapperProps}>
      {!showMobilePanelFullscreen && (
      <View style={[styles.petaMapHalf, isMobile && styles.petaMapHalfMobile]}>
        <View style={styles.petaMapContainer}>
          {!pseudoFullscreen && (Platform.OS === 'web' ? (
            createElement('iframe', {
              ref: petaIframeRef,
              srcDoc: petaMapHtml,
              style: { width: '100%', height: '100%', border: 'none' },
              title: 'Peta Agensi',
              onLoad: handlePetaIframeLoad,
              allowFullScreen: true,
              allow: 'fullscreen',
            })
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.card || PALETTE.cardLight }}>
              <Map size={48} color={theme?.textSecondary || PALETTE.textMutedDark} />
              <Text style={{ marginTop: 12, color: theme?.textSecondary || PALETTE.textMutedDark, fontWeight: '600' }}>
                Peta memerlukan 'react-native-webview' pada peranti mudah alih.
              </Text>
            </View>
          ))}
          {petaIframeLoading && Platform.OS === 'web' && (
            <View style={[styles.loader, { backgroundColor: theme?.background || PALETTE.softOrangeBg }]}>
              <ActivityIndicator size="large" color={PALETTE.orange} />
            </View>
          )}
        </View>

        <Modal visible={pseudoFullscreen} animationType="fade" onRequestClose={() => setPseudoFullscreen(false)}>
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            {Platform.OS === 'web' && pseudoFullscreen ? (
              createElement('iframe', {
                ref: petaIframeRef,
                srcDoc: petaMapHtml,
                style: { width: '100%', height: '100%', border: 'none' },
                title: 'Peta Agensi',
                onLoad: handlePetaIframeLoad,
              })
            ) : null}
            {petaIframeLoading && (
              <View style={[styles.loader, { backgroundColor: theme?.background || PALETTE.softOrangeBg }]}>
                <ActivityIndicator size="large" color={PALETTE.orange} />
              </View>
            )}
            <TouchableOpacity
              onPress={() => setPseudoFullscreen(false)}
              style={{ position: 'absolute', top: 12, right: 12, zIndex: 10000, width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}
            >
              <X size={18} color={PALETTE.orange} />
            </TouchableOpacity>
          </View>
        </Modal>

        <View style={[styles.petaHeaderCard, isMobile && { padding: 10, gap: 8, minWidth: 0, borderRadius: 12 }]}>
          <View style={[styles.petaIconCircle, isMobile && { width: 30, height: 30, borderRadius: 9 }]}>
            <Map color={PALETTE.white} size={isMobile ? 15 : 20} />
          </View>
          <View>
            <Text style={[styles.petaHeaderTitle, isMobile && { fontSize: 12 }]}>Peta Agensi</Text>
            <View style={styles.liveTagContainer}>
              {onlineAgencies.length > 0 && <View style={[styles.liveDot, isMobile && { width: 5, height: 5 }]} />}
              <Text style={[styles.liveText, isMobile && { fontSize: 8 }, { color: onlineAgencies.length > 0 ? PALETTE.success : PALETTE.textMutedDark }]}>
                {onlineAgencies.length} AGENSI ONLINE
              </Text>
            </View>
          </View>
        </View>

        {onlineAgencies.length > 0 && (
          <View style={styles.petaListContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {onlineAgencies.map(a => (
                <TouchableOpacity
                  key={a.id}
                  activeOpacity={0.7}
                  style={styles.petaAgencyCard}
                  onPress={() => {
                    if (petaIframeRef?.current?.contentWindow) {
                      petaIframeRef.current.contentWindow.postMessage(JSON.stringify({
                        type: 'FOCUS_AGENCY', id: a.id, lat: a.latitude, lng: a.longitude,
                      }), '*');
                    }
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.agencyMarkWrap}>
                      <AgencyMark logo={getAgencyLogo(a.jpbd_directory?.agency)} color={getAgencyColorFromMap(a.jpbd_directory?.agency)} size={22} />
                      <View style={styles.onlineBadge} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.petaAgencyName} numberOfLines={1}>{a.jpbd_directory?.agency || '-'}</Text>
                      <View style={styles.onlineRow}>
                        <Text style={styles.petaAgencyUser} numberOfLines={1}>{a.member_name}</Text>
                        <Text style={styles.onlineLabel}>● Online</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={(e) => { e.stopPropagation?.(); handleDeleteOnlineAgency(a.id, `${a.jpbd_directory?.agency || '-'} (${a.member_name})`); }}
                      style={{ padding: 6 }}
                    >
                      <Trash2 size={15} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {agencyNames.length > 0 && (
          <View style={[styles.agencyLegendPalette, isMobile && styles.agencyLegendPaletteMobile]}>
            <Text style={[styles.agencyLegendHeader, isMobile && styles.agencyLegendHeaderMobile]}>AGENSI</Text>
            <ScrollView style={{ maxHeight: isMobile ? 140 : 220 }} showsVerticalScrollIndicator={false}>
              {agencyNames.map((a, index) => (
                <View
                  key={a.id}
                  style={[styles.agencyLegendRow, isMobile && styles.agencyLegendRowMobile]}
                >
                  <View style={[styles.agencyLegendDot, { backgroundColor: getAgencyColorFromMap(a.agency) }, isMobile && styles.agencyLegendDotMobile]} />
                  <AgencyMark logo={getAgencyLogo(a.agency)} color={getAgencyColorFromMap(a.agency)} size={isMobile ? 14 : 20} />
                  <Text style={[styles.agencyLegendLabel, isMobile && styles.agencyLegendLabelMobile]} numberOfLines={1}>{a.agency}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={[styles.mapToolbar, { flexDirection: 'column' }]}>
          {(userRole === 'sekretariat' || userRole === 'admin') && (
            <TouchableOpacity
              style={[styles.addBencanaToggleBtn, isPlacingBencana && styles.addBencanaToggleBtnActive, addBencanaBtnHovered && { zIndex: 100, elevation: 100 }]}
              onPress={() => {
                if (isPlacingBencana) { setIsPlacingBencana(false); return; }
                setBencanaFlowStep('choice');
              }}
              {...(Platform.OS === 'web' ? {
                onMouseEnter: () => setAddBencanaBtnHovered(true),
                onMouseLeave: () => setAddBencanaBtnHovered(false),
              } : {})}
            >
              {isPlacingBencana ? (
                <X size={18} color={PALETTE.white} />
              ) : (
                <Plus size={18} color={PALETTE.orange} />
              )}
              {addBencanaBtnHovered && !isPlacingBencana && (
                <View style={styles.historyTooltip}>
                  <Text style={styles.historyTooltipText}>Tambah Bencana</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.summaryToggleBtn, summaryBtnHovered && { zIndex: 100, elevation: 100 }]}
            onPress={() => setSidePanel(sidePanel === 'summary' ? 'none' : 'summary')}
            {...(Platform.OS === 'web' ? {
              onMouseEnter: () => setSummaryBtnHovered(true),
              onMouseLeave: () => setSummaryBtnHovered(false),
            } : {})}
          >
            <ClipboardList size={18} color={PALETTE.orange} />
            {summaryBtnHovered && (
              <View style={styles.historyTooltip}>
                <Text style={styles.historyTooltipText}>Ringkasan Bencana</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.historyToggleBtn, historyBtnHovered && { zIndex: 100, elevation: 100 }]}
            onPress={() => setSidePanel(sidePanel === 'history' ? 'none' : 'history')}
            {...(Platform.OS === 'web' ? {
              onMouseEnter: () => setHistoryBtnHovered(true),
              onMouseLeave: () => setHistoryBtnHovered(false),
            } : {})}
          >
            <History size={18} color={PALETTE.orange} />
            {historyBtnHovered && (
              <View style={styles.historyTooltip}>
                <Text style={styles.historyTooltipText}>Sejarah Patrol Agensi</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.historyToggleBtn, fullscreenBtnHovered && { zIndex: 100, elevation: 100 }]}
            onPress={() => {
              if (isMobile) {
                setPetaIframeLoading(true);
                setPseudoFullscreen(true);
              } else {
                petaIframeRef.current?.requestFullscreen?.();
              }
            }}
            {...(Platform.OS === 'web' ? {
              onMouseEnter: () => setFullscreenBtnHovered(true),
              onMouseLeave: () => setFullscreenBtnHovered(false),
            } : {})}
          >
            <Maximize2 size={18} color={PALETTE.orange} />
            {fullscreenBtnHovered && (
              <View style={styles.historyTooltip}>
                <Text style={styles.historyTooltipText}>Skrin Penuh</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        {isPlacingBencana && (
          <View
            style={{
              position: 'absolute', top: 16, left: 0, right: 0,
              alignItems: 'center', zIndex: 500, pointerEvents: 'none',
            }}
          >
            <View
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 999,
                paddingHorizontal: 16, paddingVertical: 10,
                shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
              }}
            >
              <MapPin size={16} color={PALETTE.orange} />
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Klik pada peta untuk letak titik</Text>
            </View>
          </View>
        )}
      </View>
      )}

      {sidePanel === 'history' && (
        <View style={[styles.petaHistoryHalf, isMobile && styles.petaHistoryHalfMobile]}>
          <View style={[styles.petaHistoryHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={styles.petaHistoryTitle}>Sejarah Patrol Agensi</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <FullscreenViewer title="Sejarah Patrol Agensi">
                {renderHistoryTable(true)}
              </FullscreenViewer>
              <TouchableOpacity
                onPress={handleExportHistoryPdf}
                disabled={exportingHistoryPdf}
                style={[sekretariatStyles.pdfExportBtn, exportingHistoryPdf && sekretariatStyles.pdfExportBtnDisabled]}
              >
                {exportingHistoryPdf ? (
                  <ActivityIndicator size="small" color={PALETTE.white} />
                ) : (
                  <>
                    <Download size={14} color={PALETTE.white} />
                    <Text style={sekretariatStyles.pdfExportBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSidePanel('none')} style={styles.panelCloseBtn}>
                <X size={16} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {renderHistoryTable()}
          </ScrollView>
        </View>
      )}

      {sidePanel === 'summary' && (
        <View style={[styles.petaHistoryHalf, isMobile && styles.petaHistoryHalfMobile]}>
          <View style={[styles.petaHistoryHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={styles.petaHistoryTitle}>Ringkasan Bencana</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <FullscreenViewer title="Ringkasan Bencana">
                {renderSummaryContent(true)}
              </FullscreenViewer>
              <TouchableOpacity
                onPress={handleExportSummaryPdf}
                disabled={exportingSummaryPdf}
                style={[sekretariatStyles.pdfExportBtn, exportingSummaryPdf && sekretariatStyles.pdfExportBtnDisabled]}
              >
                {exportingSummaryPdf ? (
                  <ActivityIndicator size="small" color={PALETTE.white} />
                ) : (
                  <>
                    <Download size={14} color={PALETTE.white} />
                    <Text style={sekretariatStyles.pdfExportBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSidePanel('none')} style={styles.panelCloseBtn}>
                <X size={16} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {renderSummaryContent()}
          </ScrollView>
        </View>
      )}

      {/* Étape 1 — choix initial, dès le clic sur "+" */}
      <Modal visible={bencanaFlowStep === 'choice'} transparent={true} animationType="fade">
        <View style={sekretariatStyles.modalOverlay}>
          <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%' }]}>
            <View style={sekretariatStyles.modalHeader}>
              <Text style={sekretariatStyles.modalTitle}>Tambah Titik Bencana</Text>
              <TouchableOpacity onPress={resetBencanaForm}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <View style={[sekretariatStyles.modalForm, { gap: 12 }]}>
              <TouchableOpacity
                onPress={() => setBencanaFlowStep('existingList')}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
                  borderRadius: 14, borderWidth: 1.5, borderColor: PALETTE.orange, backgroundColor: '#fff7ed',
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.orange, alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textDark }}>Pilih Hotspot Sedia Ada</Text>
                  <Text style={{ fontSize: 12, color: PALETTE.textMutedDark, marginTop: 2 }}>Titik diletakkan terus pada lokasi hotspot</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setBencanaFlowStep(null); setIsPlacingBencana(true); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
                  borderRadius: 14, borderWidth: 1.5, borderColor: PALETTE.cardLightBorder || '#e2e8f0', backgroundColor: '#fff',
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: PALETTE.surface || '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusCircle size={20} color={PALETTE.orange} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: PALETTE.textDark }}>Hotspot Baharu</Text>
                  <Text style={{ fontSize: 12, color: PALETTE.textMutedDark, marginTop: 2 }}>Tandakan lokasi sendiri pada peta</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Étape 2a — liste des hotspots existants, clic = plot direct */}
      <Modal visible={bencanaFlowStep === 'existingList'} transparent={true} animationType="fade">
        <View style={sekretariatStyles.modalOverlay}>
          <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%', maxHeight: '90%' }]}>
            <View style={sekretariatStyles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedExistingHotspot) setSelectedExistingHotspot(null);
                  else if (existingCategoryFilter) setExistingCategoryFilter(null);
                  else setBencanaFlowStep('choice');
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <ChevronLeft size={20} color={PALETTE.textMutedDark} />
                <Text style={sekretariatStyles.modalTitle}>
                  {selectedExistingHotspot ? 'Keterangan' : existingCategoryFilter ? 'Pilih Hotspot' : 'Pilih Kategori'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={resetBencanaForm}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>

            {selectedExistingHotspot ? (
              <View style={sekretariatStyles.modalForm}>
                <Text style={sekretariatStyles.inputLabel}>Kategori *</Text>
                <View style={[sekretariatStyles.input, { justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 14, color: PALETTE.textDark }}>
                    {hotspotCategories.find((c) => c.key === selectedExistingHotspot.category)?.label || selectedExistingHotspot.category}
                  </Text>
                </View>
                <Text style={sekretariatStyles.inputLabel}>Kawasan Terjejas</Text>
                <TextInput
                  style={sekretariatStyles.input}
                  placeholder="Cth: Kg Rancha-Rancha"
                  placeholderTextColor={PALETTE.textMutedDark}
                  value={existingLokasi}
                  onChangeText={setExistingLokasi}
                />
                <Text style={sekretariatStyles.inputLabel}>PPS</Text>
                <TextInput
                  style={sekretariatStyles.input}
                  placeholder="Cth: Dewan Komuniti Kg X"
                  placeholderTextColor={PALETTE.textMutedDark}
                  value={existingPps}
                  onChangeText={setExistingPps}
                />
                <Text style={sekretariatStyles.inputLabel}>Catatan (pilihan)</Text>
                <TextInput
                  style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Cth: Air naik setinggi 1 meter"
                  placeholderTextColor={PALETTE.textMutedDark}
                  multiline
                  value={existingKeterangan}
                  onChangeText={setExistingKeterangan}
                />
                <TouchableOpacity style={sekretariatStyles.saveButton} onPress={confirmSaveExistingHotspot} disabled={savingExistingHotspot}>
                  {savingExistingHotspot ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sekretariatStyles.saveButtonText}>Simpan Titik</Text>}
                </TouchableOpacity>
              </View>
            ) : existingCategoryFilter ? (
              <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
                {hotspotList.filter((h) => h.category === existingCategoryFilter.key).length === 0 ? (
                  <Text style={{ fontSize: 13, color: PALETTE.textMutedDark, textAlign: 'center', paddingVertical: 20 }}>
                    Tiada hotspot direkodkan untuk kategori ini.
                  </Text>
                ) : hotspotList.filter((h) => h.category === existingCategoryFilter.key).map((h) => {
                  const hasCoords = h.latitude != null && h.longitude != null;
                  return (
                    <TouchableOpacity
                      key={h.id}
                      disabled={!hasCoords}
                      onPress={() => handlePickExistingHotspot(h)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
                        borderRadius: 12, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0',
                        backgroundColor: hasCoords ? '#fff' : '#f8fafc', opacity: hasCoords ? 1 : 0.6,
                      }}
                    >
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: '#fff7ed', alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={16} color={PALETTE.orange} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark }}>{h.river}, {h.area}</Text>
                        {!hasCoords && (
                          <Text style={{ fontSize: 11, color: '#dc2626', marginTop: 2 }}>Tiada koordinat direkodkan</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: 16, gap: 10 }}>
                {hotspotCategories.length === 0 ? (
                  <Text style={{ fontSize: 13, color: PALETTE.textMutedDark, textAlign: 'center', paddingVertical: 20 }}>
                    Tiada kategori direkodkan lagi.
                  </Text>
                ) : hotspotCategories.map((cat) => {
                  const pointCount = hotspotList.filter((h) => h.category === cat.key).length;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setExistingCategoryFilter(cat)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
                        borderRadius: 12, borderWidth: 1, borderColor: PALETTE.cardLightBorder || '#e2e8f0', backgroundColor: '#fff',
                      }}
                    >
                      <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: `${cat.color}18`, alignItems: 'center', justifyContent: 'center' }}>
                        <MapPin size={16} color={cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: PALETTE.textDark }}>{cat.label}</Text>
                        {!!cat.sub && <Text style={{ fontSize: 11, color: PALETTE.textMutedDark, marginTop: 1 }}>{cat.sub}</Text>}
                      </View>
                      <View style={{ backgroundColor: `${cat.color}18`, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ fontSize: 12, fontWeight: '800', color: cat.color }}>{pointCount}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Étape 2b — formulaire point libre, après avoir cliqué sur la carte */}
      <Modal visible={bencanaModalVisible} transparent={true} animationType="fade">
        <View style={sekretariatStyles.modalOverlay}>
          <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%' }]}>
            <View style={sekretariatStyles.modalHeader}>
              <Text style={sekretariatStyles.modalTitle}>Titik Baharu</Text>
              <TouchableOpacity onPress={resetBencanaForm}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <View style={sekretariatStyles.modalForm}>
              <ModalSelectField
                theme={theme}
                label="Kategori *"
                value={
                  newHotspotCategory === '__custom__'
                    ? 'Lain-lain'
                    : newHotspotCategory ? (hotspotCategories.find((c) => c.key === newHotspotCategory)?.label || newHotspotCategory) : ''
                }
                placeholder="Pilih kategori"
                options={[...hotspotCategories.map((c) => c.label), 'Lain-lain']}
                isOpen={newHotspotCategoryOpen}
                onToggle={() => setNewHotspotCategoryOpen((v) => !v)}
                onSelect={(label) => {
                  if (label === 'Lain-lain') {
                    setNewHotspotCategory('__custom__');
                  } else {
                    const match = hotspotCategories.find((c) => c.label === label);
                    setNewHotspotCategory(match ? match.key : '');
                    setCustomCategoryText('');
                  }
                  setNewHotspotCategoryOpen(false);
                }}
                stackIndex={500}
              />
              {newHotspotCategory === '__custom__' && (
                <View style={{ marginBottom: 14 }}>
                  <Text style={sekretariatStyles.inputLabel}>Nama Kategori Baharu *</Text>
                  <TextInput
                    style={sekretariatStyles.input}
                    placeholder="Cth: Ribut Petir"
                    placeholderTextColor={PALETTE.textMutedDark}
                    value={customCategoryText}
                    onChangeText={setCustomCategoryText}
                    autoFocus
                  />
                  <Text style={[sekretariatStyles.inputLabel, { marginTop: 10 }]}>Ikon</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                    {CATEGORY_ICON_OPTIONS.map(({ key, Icon }) => {
                      const selected = customCategoryIcon === key;
                      return (
                        <TouchableOpacity
                          key={key}
                          onPress={() => setCustomCategoryIcon(key)}
                          style={{
                            width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                            backgroundColor: selected ? customCategoryColor : '#f1f5f9',
                            borderWidth: selected ? 0 : 1, borderColor: '#e2e8f0',
                          }}
                        >
                          <Icon size={17} color={selected ? '#fff' : PALETTE.textMutedDark} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={sekretariatStyles.inputLabel}>Warna</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {CATEGORY_COLORS.map((color) => {
                      const selected = customCategoryColor === color;
                      return (
                        <TouchableOpacity
                          key={color}
                          onPress={() => setCustomCategoryColor(color)}
                          style={{
                            width: 30, height: 30, borderRadius: 15, backgroundColor: color,
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: selected ? 3 : 0, borderColor: '#fff',
                            shadowColor: selected ? color : 'transparent', shadowOpacity: selected ? 0.5 : 0, shadowRadius: 4, elevation: selected ? 3 : 0,
                          }}
                        >
                          {selected && <Check size={14} color="#fff" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
              <Text style={sekretariatStyles.inputLabel}>Kawasan Terjejas</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Kg Rancha-Rancha"
                placeholderTextColor={PALETTE.textMutedDark}
                value={bencanaLokasi}
                onChangeText={setBencanaLokasi}
              />
              <Text style={sekretariatStyles.inputLabel}>PPS</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Dewan Komuniti Kg X"
                placeholderTextColor={PALETTE.textMutedDark}
                value={bencanaPps}
                onChangeText={setBencanaPps}
              />
              <Text style={sekretariatStyles.inputLabel}>Catatan (pilihan)</Text>
              <TextInput
                style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Cth: Air naik setinggi 1 meter"
                placeholderTextColor={PALETTE.textMutedDark}
                multiline
                value={bencanaDescription}
                onChangeText={setBencanaDescription}
              />
              <TouchableOpacity style={sekretariatStyles.saveButton} onPress={handleSaveBencana} disabled={savingBencana}>
                {savingBencana ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sekretariatStyles.saveButtonText}>Simpan Titik</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal confirmation padam (Ringkasan Bencana / Sejarah Patrol Agensi), même style que Peta Kecemasan */}
      <Modal visible={!!deleteTarget} transparent animationType="fade">
        <View style={sekretariatStyles.modalOverlay}>
          <View style={{ width: 340, maxWidth: '90%', borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff' }}>
            <View style={{ backgroundColor: '#111318', paddingVertical: 28, paddingHorizontal: 20, alignItems: 'center' }}>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: 'rgba(220,38,38,0.15)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 8 }}>
                {displayDeleteTargetRef.current?.type === 'bencana' ? 'Padam Rekod Bencana' : displayDeleteTargetRef.current?.type === 'agency' ? 'Putuskan Agensi' : 'Padam Rekod Patrol Agensi'}
              </Text>
              <Text style={{ color: '#93c5fd', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                {displayDeleteTargetRef.current?.type === 'agency'
                  ? `Putuskan agensi "${displayDeleteTargetRef.current?.label || '-'}" daripada peta? Mereka perlu log masuk semula dengan kod akses.`
                  : `Padam rekod "${displayDeleteTargetRef.current?.label || '-'}"? Tindakan ini tidak boleh dibatalkan.`}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
              <TouchableOpacity
                disabled={deletingTarget}
                onPress={() => setDeleteTarget(null)}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 12,
                  borderWidth: 1, borderColor: '#e2e8f0',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: deletingTarget ? 0.5 : 1,
                }}
              >
                <Text style={{ color: '#334155', fontSize: 14, fontWeight: '700' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={deletingTarget}
                onPress={confirmDeleteTarget}
                style={{
                  flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 13, borderRadius: 12,
                  backgroundColor: '#ef4444',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: deletingTarget ? 0.7 : 1,
                }}
              >
                {deletingTarget ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={completingBencana !== null} transparent={true} animationType="fade">
        <View style={sekretariatStyles.modalOverlay}>
          <View style={[sekretariatStyles.modalContainer, { maxWidth: 640, width: '100%', maxHeight: '90%' }]}>
            <View style={sekretariatStyles.modalHeader}>
              <Text style={sekretariatStyles.modalTitle}>Lengkapkan Titik Bencana</Text>
              <TouchableOpacity onPress={() => setCompletingBencana(null)} disabled={completingSaving}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 640 }} contentContainerStyle={sekretariatStyles.modalForm}>
              <Text style={sekretariatStyles.inputLabel}>Jenis Bencana</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Banjir Kilat"
                placeholderTextColor={PALETTE.textMutedDark}
                value={completeForm.jenis_bencana}
                onChangeText={(t) => setCompleteForm((f) => ({ ...f, jenis_bencana: t }))}
              />
              <Text style={sekretariatStyles.inputLabel}>Lokasi</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Kampung Bebuloh"
                placeholderTextColor={PALETTE.textMutedDark}
                value={completeForm.lokasi}
                onChangeText={(t) => setCompleteForm((f) => ({ ...f, lokasi: t }))}
              />
              <Text style={sekretariatStyles.inputLabel}>Jumlah KIR</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: 4"
                placeholderTextColor={PALETTE.textMutedDark}
                keyboardType="number-pad"
                value={completeForm.jumlah_kir}
                onChangeText={(t) => setCompleteForm((f) => ({ ...f, jumlah_kir: t.replace(/[^0-9]/g, '') }))}
              />
              <Text style={sekretariatStyles.inputLabel}>Jumlah Mangsa</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: 12"
                placeholderTextColor={PALETTE.textMutedDark}
                keyboardType="number-pad"
                value={completeForm.jumlah_mangsa}
                onChangeText={(t) => setCompleteForm((f) => ({ ...f, jumlah_mangsa: t.replace(/[^0-9]/g, '') }))}
              />
              <Text style={sekretariatStyles.inputLabel}>PPS</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Dewan Serbaguna Kampung Bebuloh"
                placeholderTextColor={PALETTE.textMutedDark}
                value={completeForm.pps}
                onChangeText={(t) => setCompleteForm((f) => ({ ...f, pps: t }))}
              />
              <Text style={sekretariatStyles.inputLabel}>Catatan</Text>
              <TextInput
                style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Catatan tambahan"
                placeholderTextColor={PALETTE.textMutedDark}
                multiline
                value={completeForm.description}
                onChangeText={(t) => setCompleteForm((f) => ({ ...f, description: t }))}
              />
              <TouchableOpacity style={sekretariatStyles.saveButton} onPress={handleCompleteSave} disabled={completingSaving}>
                {completingSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sekretariatStyles.saveButtonText}>Simpan & Tandakan Selesai</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={editingBencana !== null} transparent={true} animationType="fade">
        <View style={sekretariatStyles.modalOverlay}>
          <View style={sekretariatStyles.modalContainer}>
            <View style={sekretariatStyles.modalHeader}>
              <Text style={sekretariatStyles.modalTitle}>Kemaskini Titik Bencana</Text>
              <TouchableOpacity onPress={() => setEditingBencana(null)} disabled={editingSaving}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={sekretariatStyles.modalForm}>
              <Text style={sekretariatStyles.inputLabel}>Kategori</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Kategori"
                placeholderTextColor={PALETTE.textMutedDark}
                value={editForm.category}
                onChangeText={(t) => setEditForm((f) => ({ ...f, category: t }))}
              />
              <Text style={sekretariatStyles.inputLabel}>Kawasan Terjejas</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Kg Rancha-Rancha"
                placeholderTextColor={PALETTE.textMutedDark}
                value={editForm.lokasi}
                onChangeText={(t) => setEditForm((f) => ({ ...f, lokasi: t }))}
              />
              <Text style={sekretariatStyles.inputLabel}>PPS</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Dewan Serbaguna Kampung Bebuloh"
                placeholderTextColor={PALETTE.textMutedDark}
                value={editForm.pps}
                onChangeText={(t) => setEditForm((f) => ({ ...f, pps: t }))}
              />
              <Text style={sekretariatStyles.inputLabel}>Catatan</Text>
              <TextInput
                style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Catatan tambahan"
                placeholderTextColor={PALETTE.textMutedDark}
                multiline
                value={editForm.description}
                onChangeText={(t) => setEditForm((f) => ({ ...f, description: t }))}
              />
              <TouchableOpacity style={sekretariatStyles.saveButton} onPress={handleEditSave} disabled={editingSaving}>
                {editingSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={sekretariatStyles.saveButtonText}>Simpan</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </PetaContainerWrapper>
  );
}