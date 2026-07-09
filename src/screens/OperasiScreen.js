// src/screen/OperasiScreen.js
import React, { useState, useEffect, useRef, useMemo, createElement } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Modal, Alert, TextInput, Platform } from 'react-native';
import { ShieldAlert, MapIcon, BarChart2, AlertTriangle, TrendingDown, TrendingUp, Calendar, ChevronDown, ChevronUp, Plus, Edit2, Trash2, X, History, Download, ClipboardList } from 'lucide-react-native';
import { supabaseSandbox } from '../supabaseSandboxClient';

// Import Universal Edit Button
import AdminEditButton from '../components/AdminEditButton';
import ModalSelectField from '../components/ModalSelectField';

import { CATEGORY_OPTIONS, MONTH_OPTIONS, CALAMITY_CATEGORIES, getCalamityMeta } from '../constants/operasiConstants';
import { getVehicleIcon } from '../utils/vehicleIcons';
import { useVehicles } from '../hooks/useVehicles';
import { useSandboxTable } from '../hooks/useSandboxTable';
import { useNg999Report } from '../hooks/useNg999Report';
import { buildOperasiMapHtml } from './operasiMapTemplate';
import { formStyles } from '../styles/formStyles';
import { generatePatrolHistoryPdf, generateCalamitySummaryPdf } from '../utils/patrolHistoryPdf';

const BULAN_MS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const BULAN_OPTIONS = ['Semua Bulan', ...BULAN_MS];
const HISTORY_PAGE_SIZE = 15;

export default function OperasiScreen({ theme, userRole }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('map');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const iframeRef = useRef(null);

  // --- MASTER EDIT MODE STATE ---
  const [isEditMode, setIsEditMode] = useState(false);

  // CRUD State for Laporan NG999 (data/logic lives in useNg999Report)
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ id: null, kategori_kes: '', month: '', jumlah_kes: '1' });

  // Dropdown States for Modal
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);

  // --- Calamity points ---
  const [activeCalamityTool, setActiveCalamityTool] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [calamityDescription, setCalamityDescription] = useState('');
  const [calamityModalVisible, setCalamityModalVisible] = useState(false);

  // --- Historique de patrouille ---
  const [sidePanel, setSidePanel] = useState('none'); // 'none' | 'history' | 'summary'
  const [historyBtnHovered, setHistoryBtnHovered] = useState(false);
  const [summaryBtnHovered, setSummaryBtnHovered] = useState(false);
  const [calamityTooltip, setCalamityTooltip] = useState(null); // { text, top, left }
  const now = new Date();
  const [historyYear, setHistoryYear] = useState(now.getFullYear());
  const [historyMonth, setHistoryMonth] = useState(now.getMonth()); // 0-11
  const [historyYearOpen, setHistoryYearOpen] = useState(false);
  const [historyMonthOpen, setHistoryMonthOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryYearOpen, setSummaryYearOpen] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(null); // null = Semua Bulan (défaut)
  const [summaryMonthOpen, setSummaryMonthOpen] = useState(false);

  // Vehicles: fetch + realtime, also forwards updates into the Leaflet iframe
  const vehicles = useVehicles((updatedVehicle) => {
    if (iframeRef?.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        type: 'UPDATE_LOCATION',
        id: updatedVehicle.id,
        name: updatedVehicle.model,
        reg: updatedVehicle.reg,
        vehicleType: updatedVehicle.type,
        iconKey: updatedVehicle.icon_key,
        lat: updatedVehicle.latitude,
        lng: updatedVehicle.longitude,
        color: updatedVehicle.color || '#ef4444',
        status: updatedVehicle.tracking_status
      }), '*');
    }
  });

  const { data: calamityPoints, refetch: refetchCalamityPoints } = useSandboxTable({
    table: 'calamity_points',
    channelName: 'operasi_calamity_changes',
  });

  // Requête légère (juste les dates) pour connaître les années disponibles dans le sélecteur
  const { data: historyDates } = useSandboxTable({
    table: 'vehicle_patrol_history',
    channelName: 'vehicle_patrol_history_years',
    columns: 'ended_at',
    orderBy: 'ended_at',
    ascending: false,
  });

  const availableHistoryYears = useMemo(() => {
    const years = new Set(historyDates.map(row => new Date(row.ended_at).getFullYear()));
    years.add(now.getFullYear()); // toujours proposer l'année en cours, même sans données
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [historyDates]);

  const historyMonthFilters = useMemo(() => {
    const start = historyMonth === null
      ? new Date(historyYear, 0, 1).toISOString()
      : new Date(historyYear, historyMonth, 1).toISOString();
    const end = historyMonth === null
      ? new Date(historyYear + 1, 0, 1).toISOString()
      : new Date(historyYear, historyMonth + 1, 1).toISOString();
    return [
      { method: 'gte', column: 'ended_at', value: start },
      { method: 'lt', column: 'ended_at', value: end },
    ];
  }, [historyYear, historyMonth]);

  // Contenu du mois/année sélectionné (mois en cours par défaut, ou toute l'année si "Semua Bulan")
  const { data: patrolHistory, loading: loadingHistory } = useSandboxTable({
    table: 'vehicle_patrol_history',
    channelName: 'vehicle_patrol_history_detail',
    orderBy: 'ended_at',
    ascending: false,
    filters: historyMonthFilters,
  });

  // Revenir à la page 1 à chaque changement de filtre
  useEffect(() => {
    setHistoryPage(0);
  }, [historyYear, historyMonth]);

  const historyTotalPages = Math.max(1, Math.ceil(patrolHistory.length / HISTORY_PAGE_SIZE));
  const pagedHistory = useMemo(() => {
    const start = historyPage * HISTORY_PAGE_SIZE;
    return patrolHistory.slice(start, start + HISTORY_PAGE_SIZE);
  }, [patrolHistory, historyPage]);
  // Pivot mois × catégorie de sinistre, indépendant du filtre historique de patrouille
  const availableSummaryYears = useMemo(() => {
    const years = new Set(calamityPoints.filter(c => c.created_at).map(c => new Date(c.created_at).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [calamityPoints]);

  const calamityYearRows = useMemo(() => {
    return calamityPoints.filter(c => c.created_at && new Date(c.created_at).getFullYear() === summaryYear);
  }, [calamityPoints, summaryYear]);

  const calamityMonthlyBreakdown = useMemo(() => {
    return BULAN_MS.map((label, monthIndex) => {
      const counts = {};
      let total = 0;
      CALAMITY_CATEGORIES.forEach(cat => { counts[cat.key] = 0; });
      calamityYearRows.forEach(c => {
        const d = new Date(c.created_at);
        if (d.getMonth() !== monthIndex) return;
        if (counts[c.category] !== undefined) {
          counts[c.category] += 1;
          total += 1;
        }
      });
      return { month: label, counts, total };
    });
  }, [calamityYearRows]);

  // Si un mois précis est choisi, ne garder que cette ligne ; sinon les 12 mois + une ligne cumulative
  const calamitySummaryRows = useMemo(() => {
    if (summaryMonth !== null) {
      return calamityMonthlyBreakdown.filter((_, idx) => idx === summaryMonth);
    }
    const cumulativeCounts = {};
    let cumulativeTotal = 0;
    CALAMITY_CATEGORIES.forEach(cat => { cumulativeCounts[cat.key] = 0; });
    calamityMonthlyBreakdown.forEach(row => {
      CALAMITY_CATEGORIES.forEach(cat => { cumulativeCounts[cat.key] += row.counts[cat.key]; });
      cumulativeTotal += row.total;
    });
    return [
      ...calamityMonthlyBreakdown,
      { month: 'Kumulatif', counts: cumulativeCounts, total: cumulativeTotal, isCumulative: true },
    ];
  }, [calamityMonthlyBreakdown, summaryMonth]);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingSummaryPdf, setExportingSummaryPdf] = useState(false);

  const summaryPeriodLabel = summaryMonth === null
    ? `Tahun ${summaryYear}`
    : `${BULAN_MS[summaryMonth]} ${summaryYear}`;

  const handleExportSummaryPdf = async () => {
    setExportingSummaryPdf(true);
    try {
      await generateCalamitySummaryPdf({
        rows: calamitySummaryRows,
        categories: CALAMITY_CATEGORIES,
        periodLabel: summaryPeriodLabel,
      });
    } catch (e) {
      console.error('Gagal menjana PDF:', e);
      Alert.alert('Ralat', 'Gagal menjana PDF. Sila cuba lagi.');
    } finally {
      setExportingSummaryPdf(false);
    }
  };

  const historyPeriodLabel = historyMonth === null
    ? `Tahun ${historyYear}`
    : `${BULAN_MS[historyMonth]} ${historyYear}`;

  // Pivot mois × catégorie recalculé pour l'année/mois du panneau Sejarah (pas Ringkasan),
  // pour que la page Kes Kecemasan incluse dans le PDF suive le même filtre que le bouton PDF.
  const historyCalamityRows = useMemo(() => {
    const yearRows = calamityPoints.filter(c => c.created_at && new Date(c.created_at).getFullYear() === historyYear);
    const fullBreakdown = BULAN_MS.map((label, monthIndex) => {
      const counts = {};
      let total = 0;
      CALAMITY_CATEGORIES.forEach(cat => { counts[cat.key] = 0; });
      yearRows.forEach(c => {
        const d = new Date(c.created_at);
        if (d.getMonth() !== monthIndex) return;
        if (counts[c.category] !== undefined) {
          counts[c.category] += 1;
          total += 1;
        }
      });
      return { month: label, counts, total };
    });
    if (historyMonth !== null) {
      return fullBreakdown.filter((_, idx) => idx === historyMonth);
    }
    const cumulativeCounts = {};
    let cumulativeTotal = 0;
    CALAMITY_CATEGORIES.forEach(cat => { cumulativeCounts[cat.key] = 0; });
    fullBreakdown.forEach(row => {
      CALAMITY_CATEGORIES.forEach(cat => { cumulativeCounts[cat.key] += row.counts[cat.key]; });
      cumulativeTotal += row.total;
    });
    return [
      ...fullBreakdown,
      { month: 'Kumulatif', counts: cumulativeCounts, total: cumulativeTotal, isCumulative: true },
    ];
  }, [calamityPoints, historyYear, historyMonth]);

  const handleExportHistoryPdf = async () => {
    setExportingPdf(true);
    try {
      await generatePatrolHistoryPdf({
        rows: patrolHistory,
        periodLabel: historyPeriodLabel,
        calamityBreakdown: {
          year: historyYear,
          categories: CALAMITY_CATEGORIES,
          rows: historyCalamityRows,
        },
      });
    } catch (e) {
      console.error('Gagal menjana PDF:', e);
      Alert.alert('Ralat', 'Gagal menjana PDF. Sila cuba lagi.');
    } finally {
      setExportingPdf(false);
    }
  };

  const { ngData, loadingNg, saveRecord, deleteRecord, stats } = useNg999Report();
  const { dynamicMonthlyTrend, dynamicCaseBreakdown, topCaseData, totalMersCases } = stats;

  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}j ${m}m`;
    return `${m}m`;
  };

  const handleSaveCalamity = async () => {
    if (!pendingPlacement || !activeCalamityTool) return;
    const { error } = await supabaseSandbox.from('calamity_points').insert([{
      category: activeCalamityTool,
      description: calamityDescription.trim() || null,
      latitude: pendingPlacement.lat,
      longitude: pendingPlacement.lng
    }]);
    if (!error) {
      setCalamityModalVisible(false);
      setCalamityDescription('');
      setPendingPlacement(null);
      setActiveCalamityTool(null);
      refetchCalamityPoints();
    }
  };

  const handleDeleteCalamity = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Padam titik bencana ini?') : true;
    if (!confirmed) return;
    const { error } = await supabaseSandbox.from('calamity_points').delete().eq('id', id);
    if (!error) refetchCalamityPoints();
  };

  const handleResolveCalamity = async (id) => {
    const confirmed = Platform.OS === 'web' ? window.confirm('Tandakan titik ini sebagai selesai?') : true;
    if (!confirmed) return;
    const { error } = await supabaseSandbox.from('calamity_points').update({ status: 'resolved' }).eq('id', id);
    if (!error) refetchCalamityPoints();
  };

  useEffect(() => {
    const handleMapMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      if (data.type === 'MAP_CLICKED' && activeCalamityTool) {
        setPendingPlacement({ lat: data.lat, lng: data.lng });
        setCalamityModalVisible(true);
      } else if (data.type === 'DELETE_CALAMITY_REQUEST') {
        handleDeleteCalamity(data.id);
      } else if (data.type === 'RESOLVE_CALAMITY_REQUEST') {
        handleResolveCalamity(data.id);
      }
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
  }, [activeCalamityTool]);

  useEffect(() => {
    if (!loading && iframeRef?.current?.contentWindow) {
      const payload = calamityPoints
        .filter(c => c.status !== 'resolved')
        .map(c => ({
          id: c.id,
          category: c.category,
          description: c.description || '',
          lat: c.latitude,
          lng: c.longitude,
          color: getCalamityMeta(c.category).color,
          label: getCalamityMeta(c.category).label,
          created_at: c.created_at
        }));
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_CALAMITIES', payload }), '*');
    }
  }, [calamityPoints, loading]);

  useEffect(() => {
    if (!loading && iframeRef?.current?.contentWindow && vehicles.length > 0) {
      const payload = vehicles.map(v => ({
        ...v,
        name: v.model,
        status: v.tracking_status
      }));
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'INIT_VEHICLES', payload }), '*');
    }
  }, [vehicles, loading]);

  const handleSaveNg = async () => {
    if (!form.kategori_kes || !form.month || !form.jumlah_kes) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const caseAmount = parseInt(form.jumlah_kes, 10);
    if (isNaN(caseAmount) || caseAmount < 1) {
      Alert.alert('Error', 'Amount of cases must be a valid number greater than 0.');
      return;
    }

    await saveRecord({ id: form.id, kategori_kes: form.kategori_kes, month: form.month, jumlah_kes: caseAmount });
    closeModal();
  };

  const handleDeleteNg = async (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this record?');
      if (confirmed) {
        await deleteRecord(id);
      }
    } else {
      Alert.alert('Confirmation', 'Are you sure you want to delete this record?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRecord(id);
          }
        }
      ]);
    }
  };

  const openEditModal = (record) => {
    setForm({
      id: record.id,
      kategori_kes: record.kategori_kes,
      month: record.month,
      jumlah_kes: (record.jumlah_kes || 1).toString()
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCategoryOpen(false);
    setMonthOpen(false);
    setForm({ id: null, kategori_kes: '', month: '', jumlah_kes: '1' });
  };

  const getTrendData = () => {
    if (dynamicMonthlyTrend.length >= 2) {
      const current = dynamicMonthlyTrend[dynamicMonthlyTrend.length - 1];
      const prev = dynamicMonthlyTrend[dynamicMonthlyTrend.length - 2];
      const diff = current.total - prev.total;

      if (diff > 0) return { text: `+${diff} Cases`, color: '#b91c1c', bg: '#fef2f2', border: '#ef4444', icon: <TrendingUp size={16} color="#b91c1c" />, sub: `Compared to ${prev.month}` };
      if (diff < 0) return { text: `${diff} Cases`, color: '#15803d', bg: '#f0fdf4', border: '#22c55e', icon: <TrendingDown size={16} color="#15803d" />, sub: `Compared to ${prev.month}` };
      return { text: "No Change", color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: <BarChart2 size={16} color="#64748b" />, sub: `Compared to ${prev.month}` };
    }
    return { text: "N/A", color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: <BarChart2 size={16} color="#64748b" />, sub: "Need 2 months of data" };
  };
  const trendData = getTrendData();

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const mapHtml = buildOperasiMapHtml({ theme, userRole });
  const mapSrc = `data:text/html;charset=utf-8,${encodeURIComponent(mapHtml)}`;

  const activeVehicles = vehicles.filter(v => v.tracking_status === 'Patrol');
  const activeVehiclesCount = activeVehicles.length;

  return (
    <View style={[styles.container, { flex: 1, backgroundColor: theme.background }]}>

      {/* --- TOGGLE BUTTONS --- */}
      <View style={[styles.toggleWrapper, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'map' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('map')}
          activeOpacity={0.8}
        >
          <MapIcon size={16} color={activeTab === 'map' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.toggleText, activeTab === 'map' ? styles.toggleTextActive : { color: theme.textSecondary }]}>Live Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, activeTab === 'report' && styles.toggleBtnActive]}
          onPress={() => setActiveTab('report')}
          activeOpacity={0.8}
        >
          <BarChart2 size={16} color={activeTab === 'report' ? '#fff' : theme.textSecondary} />
          <Text style={[styles.toggleText, activeTab === 'report' ? styles.toggleTextActive : { color: theme.textSecondary }]}>NG999 Report</Text>
        </TouchableOpacity>
      </View>

      {/* --- VIEW 1: LIVE MAP --- */}
      <View style={[styles.viewContainer, { display: activeTab === 'map' ? 'flex' : 'none', flexDirection: 'row' }]}>
        <View style={{ flex: 1, position: 'relative' }}>
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              createElement('iframe', {
                ref: iframeRef,
                src: mapSrc,
                style: { width: '100%', height: '100%', border: 'none' },
                title: "Leaflet Map",
                onLoad: handleIframeLoad
              })
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.card }}>
                <MapIcon size={48} color={theme.textSecondary} />
                <Text style={{ marginTop: 12, color: theme.textSecondary, fontWeight: '600' }}>
                  Live Map memerlukan 'react-native-webview' pada peranti mudah alih.
                </Text>
              </View>
            )}
            {loading && Platform.OS === 'web' && (
              <View style={[styles.loader, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color="#f97316" /></View>
            )}
          </View>

          <View style={[styles.headerCard, { backgroundColor: theme.card }]}>
            <View style={styles.iconCircle}><ShieldAlert color="#fff" size={20} /></View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }]}>Live Tracking</Text>
              <View style={styles.liveTagContainer}>
                {activeVehiclesCount > 0 && <View style={styles.liveDot} />}
                <Text style={[styles.liveText, { color: activeVehiclesCount > 0 ? '#22c55e' : theme.textSecondary }]}>
                  {activeVehiclesCount} ACTIVE ASSETS
                </Text>
              </View>
            </View>
          </View>

          {activeVehiclesCount > 0 && (
            <View style={styles.vehicleListContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {activeVehicles.map(v => (
                  <VehicleCard
                    key={v.id}
                    name={v.reg || v.model}
                    status={v.tracking_status}
                    icon={getVehicleIcon(v.icon_key, v.color, 16)}
                    theme={theme}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          <TouchableOpacity
            style={styles.historyToggleBtn}
            onPress={() => setSidePanel(sidePanel === 'history' ? 'none' : 'history')}
            {...(Platform.OS === 'web' ? {
              onMouseEnter: () => setHistoryBtnHovered(true),
              onMouseLeave: () => setHistoryBtnHovered(false),
            } : {})}
          >
            <History size={18} color="#1E3A8A" />
            {historyBtnHovered && (
              <View style={styles.historyTooltip}>
                <Text style={styles.historyTooltipText}>Sejarah Patrol Kenderaan</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.summaryToggleBtn}
            onPress={() => setSidePanel(sidePanel === 'summary' ? 'none' : 'summary')}
            {...(Platform.OS === 'web' ? {
              onMouseEnter: () => setSummaryBtnHovered(true),
              onMouseLeave: () => setSummaryBtnHovered(false),
            } : {})}
          >
            <ClipboardList size={18} color="#1E3A8A" />
            {summaryBtnHovered && (
              <View style={styles.historyTooltip}>
                <Text style={styles.historyTooltipText}>Ringkasan Kecemasan</Text>
              </View>
            )}
          </TouchableOpacity>

          {(userRole === 'sekretariat' || userRole === 'admin') && (
            <View style={styles.calamityPalette}>
              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {CALAMITY_CATEGORIES.map(cat => {
                  const isActive = activeCalamityTool === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.calamityToolBtn, { backgroundColor: isActive ? cat.color : '#fff', borderColor: cat.color }]}
                      onPress={() => setActiveCalamityTool(isActive ? null : cat.key)}
                      {...(Platform.OS === 'web' ? {
                        onMouseEnter: (e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setCalamityTooltip({ text: cat.key, top: rect.top, left: rect.left });
                        },
                        onMouseLeave: () => setCalamityTooltip(null),
                      } : {})}
                    >
                      <Text style={[styles.calamityToolText, { color: isActive ? '#fff' : cat.color }]}>{cat.key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              {activeCalamityTool && (
                <Text style={styles.calamityHint}>Klik pada peta untuk letak titik</Text>
              )}
            </View>
          )}
        </View>

        {sidePanel === 'history' && (
          <View style={styles.historyHalf}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Sejarah Patrol Kenderaan</Text>
              <TouchableOpacity
                onPress={handleExportHistoryPdf}
                disabled={exportingPdf}
                style={[styles.pdfExportBtn, exportingPdf && styles.pdfExportBtnDisabled]}
              >
                {exportingPdf ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Download size={14} color="#fff" />
                    <Text style={styles.pdfExportBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

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

            {loadingHistory ? (
              <ActivityIndicator size="small" color="#1E3A8A" style={{ marginTop: 20 }} />
            ) : patrolHistory.length === 0 ? (
              <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
                Tiada rekod sejarah untuk {historyMonth === null ? historyYear : `${BULAN_MS[historyMonth]} ${historyYear}`}.
              </Text>
            ) : (
              <>
                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
                <View style={styles.calamityTableWrapper}>
                  <View style={styles.calamityTableHeaderRow}>
                    <View style={[styles.historyKenderaanColFlex, styles.calamityHeaderCellBox]}>
                      <Text style={styles.calamityTableHeaderCell}>Kenderaan</Text>
                    </View>
                    <View style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
                      <Text style={styles.calamityTableHeaderCell}>Tempoh</Text>
                    </View>
                    <View style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
                      <Text style={styles.calamityTableHeaderCell}>Jarak</Text>
                    </View>
                    <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                      <Text style={styles.calamityTableHeaderCell}>Tarikh</Text>
                    </View>
                  </View>
                  {pagedHistory.map((h, index) => (
                    <View key={h.id} style={[styles.calamityTableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                      <View style={[styles.historyKenderaanColFlex, { paddingLeft: 16, paddingVertical: 10 }]}>
                        <Text style={styles.tableCellAgency} numberOfLines={1} ellipsizeMode="tail">{h.vehicle_reg}</Text>
                        <Text style={styles.tableCellMember} numberOfLines={1} ellipsizeMode="tail">{h.vehicle_model}</Text>
                      </View>
                      <Text style={[styles.calamityTableCell, styles.calamityCatColFlex]}>{formatDuration(h.duration_seconds)}</Text>
                      <Text style={[styles.calamityTableCell, styles.calamityCatColFlex]}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                      <View style={[styles.calamityTotalColFlex, { paddingVertical: 10 }]}>
                        <Text style={styles.tableCellDate}>{new Date(h.ended_at).toLocaleDateString('ms-MY')}</Text>
                        <Text style={styles.tableCellTime}>{new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                    </View>
                  ))}
                </View>
                </ScrollView>

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
          </View>
        )}

        {sidePanel === 'summary' && (
          <View style={styles.historyHalf}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Ringkasan Kecemasan</Text>
              <TouchableOpacity
                onPress={handleExportSummaryPdf}
                disabled={exportingSummaryPdf}
                style={[styles.pdfExportBtn, exportingSummaryPdf && styles.pdfExportBtnDisabled]}
              >
                {exportingSummaryPdf ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Download size={14} color="#fff" />
                    <Text style={styles.pdfExportBtnText}>PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

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

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
            <View style={styles.calamityTableWrapper}>
              <View style={styles.calamityTableHeaderRow}>
                <View style={[styles.calamityMonthColFlex, styles.calamityHeaderCellBox]}>
                  <Text style={styles.calamityTableHeaderCell}>Bulan</Text>
                </View>
                {CALAMITY_CATEGORIES.map(cat => (
                  <View key={cat.key} style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
                    <Text style={styles.calamityTableHeaderCell}>{cat.key}</Text>
                  </View>
                ))}
                <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                  <Text style={styles.calamityTableHeaderCell}>Jumlah</Text>
                </View>
              </View>
              {calamitySummaryRows.map((row, idx) => (
                <View
                  key={row.month}
                  style={[
                    styles.calamityTableRow,
                    row.isCumulative
                      ? styles.calamityCumulativeRow
                      : { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' },
                  ]}
                >
                  <Text style={[styles.calamityTableCell, styles.calamityMonthColFlex, { fontWeight: '800', textAlign: 'left' }]}>{row.month}</Text>
                  {CALAMITY_CATEGORIES.map(cat => (
                    <Text key={cat.key} style={[styles.calamityTableCell, styles.calamityCatColFlex, row.isCumulative && { fontWeight: '700' }]}>{row.counts[cat.key] || '–'}</Text>
                  ))}
                  <View style={[styles.calamityTotalColFlex, styles.calamityTotalBadge]}>
                    <Text style={styles.calamityTotalBadgeText}>{row.total}</Text>
                  </View>
                </View>
              ))}
            </View>
            </ScrollView>
          </View>
        )}
      </View>

      {/* --- VIEW 2: MERS 999 REPORT --- */}
      {activeTab === 'report' && (
        <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>

          <AdminEditButton
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            userRole={userRole}
          />

          <View style={styles.reportHeader}>
            <Text style={[styles.reportTitle, { color: theme.text }]}>Emergency Case Report</Text>
            <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>NG 999 W.P. Labuan {new Date().getFullYear()}</Text>
          </View>

          <View style={styles.statsRow}>
            {dynamicMonthlyTrend.length === 0 ? (
               <View style={[styles.statBox, { backgroundColor: theme.card }]}>
                  <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>No Monthly Data</Text>
               </View>
            ) : (
               dynamicMonthlyTrend.slice(-2).map((item, index) => (
                <View key={index} style={[styles.statBox, { backgroundColor: theme.card }]}>
                  <View style={styles.statBoxTop}>
                    <Calendar size={16} color={theme.accent} />
                    <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{item.month}</Text>
                  </View>
                  <Text style={[styles.statBoxValue, { color: theme.text }]}>{item.total}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Total Cases</Text>
                </View>
              ))
            )}

            <View style={[styles.statBox, { backgroundColor: trendData.bg, borderColor: trendData.border, borderWidth: 1 }]}>
               <View style={styles.statBoxTop}>
                  {trendData.icon}
                  <Text style={{ color: trendData.color, fontWeight: '700' }}>Trend</Text>
                </View>
                <Text style={[styles.statBoxValue, { color: trendData.color, fontSize: 20 }]}>{trendData.text}</Text>
                <Text style={{ color: trendData.color, fontSize: 10 }}>{trendData.sub}</Text>
            </View>
          </View>

          <View style={[styles.highlightCard, { backgroundColor: '#fff7ed', borderColor: '#f97316', borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <AlertTriangle size={24} color="#ea580c" />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#9a3412', textTransform: 'uppercase' }}>Highest Case Overall</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#ea580c' }}>{topCaseData.label}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#c2410c', marginTop: 4 }}>
              Contributing {topCaseData.total} out of {totalMersCases} total calls.
            </Text>
          </View>

          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity
              style={[styles.dropdownHeaderBtn, { backgroundColor: theme.card, borderColor: '#e2e8f0' }]}
              onPress={() => setDropdownOpen(!dropdownOpen)}
              activeOpacity={0.7}
            >
              <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
                {selectedMonth ? `Category Breakdown: ${selectedMonth}` : 'Select Month For Category Breakdown'}
              </Text>
              {dropdownOpen ? <ChevronUp size={20} color={theme.textSecondary} /> : <ChevronDown size={20} color={theme.textSecondary} />}
            </TouchableOpacity>

            {dropdownOpen && (
              <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: '#e2e8f0' }]}>
                {dynamicMonthlyTrend.map((m, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dropdownItem, index < dynamicMonthlyTrend.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}
                    onPress={() => { setSelectedMonth(m.month); setDropdownOpen(false); }}
                  >
                    <Text style={{ color: selectedMonth === m.month ? '#3b82f6' : theme.text, fontWeight: selectedMonth === m.month ? '800' : '500' }}>
                      {m.month}
                    </Text>
                  </TouchableOpacity>
                ))}
                {dynamicMonthlyTrend.length === 0 && (
                   <View style={styles.dropdownItem}><Text style={{ color: theme.textSecondary }}>No data available</Text></View>
                )}
              </View>
            )}
          </View>

          {selectedMonth && (
            <View style={[styles.breakdownContainer, { backgroundColor: theme.card }]}>
              <Text style={[styles.breakdownTitle, { color: theme.text }]}>Case Breakdown ({selectedMonth})</Text>

              {dynamicCaseBreakdown.map((item, index) => {
                const monthVal = item[selectedMonth];
                if (!monthVal || monthVal === 0) return null;

                const monthTotal = dynamicMonthlyTrend.find(m => m.month === selectedMonth)?.total || 1;
                const percent = Math.round((monthVal / monthTotal) * 100);

                return (
                  <View key={index} style={styles.breakdownRow}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>[{item.id}] {item.label}</Text>
                      <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>
                        {monthVal} <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '600' }}>({percent}%)</Text>
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { backgroundColor: item.color, width: `${percent}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {isEditMode && (
            <View style={[styles.crudContainer, { backgroundColor: theme.card }]}>
              <View style={styles.crudHeader}>
                <Text style={[styles.breakdownTitle, { color: theme.text, marginBottom: 0 }]}>NG999 Data Management</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => { setForm({ id: null, kategori_kes: '', month: '', jumlah_kes: '1' }); setModalVisible(true); }}
                >
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Add New</Text>
                </TouchableOpacity>
              </View>

              {loadingNg ? (
                <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 20 }} />
              ) : ngData.length === 0 ? (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 10 }}>No records found.</Text>
              ) : (
                ngData.map((item) => (
                  <View key={item.id} style={[styles.crudItem, { borderBottomColor: theme.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{item.kategori_kes}</Text>
                      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                        Month: {item.month} | Total: <Text style={{fontWeight: '800', color: theme.text}}>{item.jumlah_kes || 1}</Text> cases
                      </Text>
                    </View>
                    <View style={styles.actionBtns}>
                      <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                        <Edit2 size={18} color="#22c55e" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteNg(item.id)} style={styles.iconBtn}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

        </ScrollView>
      )}

      {/* --- CRUD MODAL --- */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={formStyles.modalOverlay}>
          <View style={[formStyles.modalContent, { backgroundColor: theme.background }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>
                {form.id ? 'Update Record' : 'Add New Record'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ModalSelectField
              theme={theme}
              label="Case Category"
              value={form.kategori_kes}
              placeholder="Select Category..."
              options={CATEGORY_OPTIONS}
              isOpen={categoryOpen}
              onToggle={() => { setCategoryOpen(!categoryOpen); setMonthOpen(false); }}
              onSelect={(opt) => { setForm({ ...form, kategori_kes: opt }); setCategoryOpen(false); }}
              stackIndex={2000}
            />

            <ModalSelectField
              theme={theme}
              label="Month"
              value={form.month}
              placeholder="Select Month..."
              options={MONTH_OPTIONS}
              isOpen={monthOpen}
              onToggle={() => { setMonthOpen(!monthOpen); setCategoryOpen(false); }}
              onSelect={(opt) => { setForm({ ...form, month: opt }); setMonthOpen(false); }}
              stackIndex={1000}
            />

            <View style={[formStyles.inputGroup, { zIndex: 1 }]}>
              <Text style={[formStyles.inputLabel, { color: theme.textSecondary }]}>Amount of Cases</Text>
              <TextInput
                style={[formStyles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="E.g., 5"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={form.jumlah_kes.toString()}
                onChangeText={(text) => setForm({ ...form, jumlah_kes: text.replace(/[^0-9]/g, '') })}
              />
            </View>

            <TouchableOpacity
              style={[formStyles.saveBtn, (loadingNg || categoryOpen || monthOpen) && { opacity: 0.7 }]}
              onPress={handleSaveNg}
              disabled={loadingNg || categoryOpen || monthOpen}
            >
              {loadingNg ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Save Record</Text>}
            </TouchableOpacity>
          </View>
        </View>
</Modal>

      <Modal visible={calamityModalVisible} transparent animationType="fade">
        <View style={formStyles.modalOverlay}>
          <View style={[formStyles.modalContent, { backgroundColor: theme.card }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Tambah Titik Bencana</Text>
              <TouchableOpacity onPress={() => { setCalamityModalVisible(false); setPendingPlacement(null); }}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={[formStyles.inputLabel, { color: theme.textSecondary }]}>
              Kategori: {getCalamityMeta(activeCalamityTool).label}
            </Text>
            <Text style={[formStyles.inputLabel, { color: theme.textSecondary, marginTop: 10 }]}>Keterangan (pilihan)</Text>
            <TextInput
              style={[formStyles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border, height: 80, textAlignVertical: 'top' }]}
              placeholder="Cth: Air naik setinggi 1 meter"
              placeholderTextColor={theme.textSecondary}
              multiline
              value={calamityDescription}
              onChangeText={setCalamityDescription}
            />
            <TouchableOpacity style={formStyles.saveBtn} onPress={handleSaveCalamity}>
              <Text style={formStyles.saveBtnText}>Simpan Titik</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {Platform.OS === 'web' && calamityTooltip &&
              createElement('div', {
                style: {
                  position: 'fixed',
                  top: `${calamityTooltip.top}px`,
                  left: `${calamityTooltip.left - 175}px`,
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: '600',
                  width: '160px',
                  zIndex: 9999,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                }
              }, calamityTooltip.text)
            }

          </View>
        );
      }

const VehicleCard = ({ name, status, icon, theme }) => (
  <View style={[styles.vehicleCard, { backgroundColor: theme.card }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {icon}
      <View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text, maxWidth: 120 }} numberOfLines={1}>{name}</Text>
        <Text style={{ fontSize: 10, color: theme.textSecondary }}>{status}</Text>
      </View>
    </View>
    <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
  </View>
);

const styles = StyleSheet.create({
  container: { position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 24, paddingBottom: 16 },
  toggleWrapper: { flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, zIndex: 20 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  toggleBtnActive: { backgroundColor: '#3b82f6' },
  toggleText: { fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: '#fff' },
  viewContainer: { flex: 1, position: 'relative', marginHorizontal: 16, marginTop: 16 },
  mapContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, borderRadius: 20, overflow: 'hidden' },

  historyToggleBtn: {
    position: 'absolute', top: 16, right: 116, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  historyToggleBtn: {
    position: 'absolute', top: 16, right: 116, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  summaryToggleBtn: {
    position: 'absolute', top: 16, right: 164, zIndex: 10,
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
  },
  historyTooltip: {
    position: 'absolute', top: 46, right: 0, zIndex: 20,
    backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  historyTooltipText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  calamityPalette: {
    position: 'absolute', top: 16, right: 16, zIndex: 10, backgroundColor: '#fff',
    borderRadius: 16, padding: 10, gap: 6, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 10, elevation: 4, width: 90,
  },
  calamityToolBtn: { paddingVertical: 8, borderRadius: 8, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  calamityToolText: { fontSize: 11, fontWeight: '800' },
  calamityHint: { fontSize: 10, color: '#64748b', textAlign: 'center', marginTop: 4 },

  historyHalf: { flex: 1, backgroundColor: '#fff', borderLeftWidth: 1, borderLeftColor: '#e2e8f0', borderTopRightRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  pdfExportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1E3A8A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, minWidth: 60, justifyContent: 'center' },
  pdfExportBtnDisabled: { backgroundColor: '#cbd5e1' },
  pdfExportBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  historyTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  historyFilterRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, zIndex: 50 },
  summaryYearBtnWrap: { width: 120 },
  calamityTableWrapper: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden', marginHorizontal: 16 },
  calamityTableHeaderRow: { flexDirection: 'row', backgroundColor: '#1E3A8A' },
  calamityHeaderCellBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 6, gap: 5 },
  calamityCatDot: { width: 8, height: 8, borderRadius: 4 },
  calamityTableHeaderCell: { fontSize: 13, fontWeight: '800', color: '#fff', textAlign: 'center' },
  calamityTableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  calamityTableCell: { fontSize: 14, color: '#334155', textAlign: 'center', paddingVertical: 14, paddingHorizontal: 6 },
  calamityMonthColFlex: { flex: 2, paddingLeft: 16 },
  historyKenderaanColFlex: { flex: 2 },
  calamityCatColFlex: { flex: 1 },
  calamityTotalColFlex: { flex: 1.2, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
  calamityTotalBadge: {},
  calamityCumulativeRow: { backgroundColor: '#fef3c7' },
  calamityTotalBadgeText: { fontSize: 15, fontWeight: '900', color: '#1E3A8A' },
  historyTableWrapper: { marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tableHeaderCell: { fontSize: 10, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'left' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableCell: { fontSize: 12, fontWeight: '700', color: '#334155', textAlign: 'left' },
  tableCellAgency: { fontSize: 13, fontWeight: '800', color: '#0f172a', textAlign: 'left' },
  tableCellMember: { fontSize: 11, color: '#64748b', marginTop: 1, textAlign: 'left' },
  tableCellDate: { fontSize: 11, fontWeight: '700', color: '#334155', textAlign: 'left' },
  tableCellTime: { fontSize: 10, color: '#94a3b8', marginTop: 1, textAlign: 'left' },
  colKenderaan: { flex: 1, maxWidth: 180 },
  colTempoh: { width: '12%', minWidth: 55, maxWidth: 90, flexShrink: 0 },
  colJarak: { width: '13%', minWidth: 60, maxWidth: 100, flexShrink: 0 },
  colTarikh: { width: '16%', minWidth: 80, maxWidth: 130, flexShrink: 0 },
  paginationRow: { alignItems: 'center', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8 },
  pageArrowRow: { flexDirection: 'row', gap: 10 },
  pageBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { backgroundColor: '#f1f5f9' },
  pageBtnText: { fontSize: 16, fontWeight: '700', color: '#1E3A8A' },
  pageBtnTextDisabled: { color: '#cbd5e1' },
  pageIndicator: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  loader: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  headerCard: { position: 'absolute', top: 16, left: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4, minWidth: 200 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  liveTagContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  liveText: { fontSize: 10, fontWeight: '700' },
  vehicleListContainer: { position: 'absolute', bottom: 16, left: 16, right: 16, zIndex: 10 },
  vehicleCard: { padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, minWidth: 180 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },
  reportContainer: { flex: 1, paddingHorizontal: 16 },
  reportHeader: { marginBottom: 20, marginTop: 10 },
  reportTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: { flex: 1, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statBoxTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  statBoxValue: { fontSize: 28, fontWeight: '900' },
  highlightCard: { padding: 20, borderRadius: 16, marginBottom: 20 },
  dropdownHeaderBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  dropdownList: { marginTop: 8, borderRadius: 12, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1 },
  dropdownItem: { padding: 16 },
  breakdownContainer: { padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginBottom: 20 },
  breakdownTitle: { fontSize: 16, fontWeight: '800', marginBottom: 20 },
  breakdownRow: { marginBottom: 16 },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  crudContainer: { padding: 20, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2, marginBottom: 30 },
  crudHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22c55e', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  crudItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  actionBtns: { flexDirection: 'row', gap: 16 },
  iconBtn: { padding: 4 },
});
