// src/screens/sekretariat/PetaTab.js
import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Modal, TextInput, ActivityIndicator, Alert, Image, useWindowDimensions } from 'react-native';
import { Map, History, ClipboardList, AlertTriangle, X, Plus, Download, Trash2 } from 'lucide-react-native';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { buildSekretariatMapHtml } from './sekretariatMapTemplate';
import { useOnlineAgencies } from '../../hooks/useOnlineAgencies';
import { useBencanaPoints } from '../../hooks/useBencanaPoints';
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
  const { bencanaPoints, saveBencana, resolveBencana, deleteBencana } = useBencanaPoints();
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
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'bencana' | 'history', id, label }
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

  const petaMapHtml = buildSekretariatMapHtml({ theme, userRole });
  const petaMapSrc = `data:text/html;charset=utf-8,${encodeURIComponent(petaMapHtml)}`;

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
        .filter(b => b.status !== 'resolved')
        .map(b => ({
          id: b.id, category: b.category, description: b.description || '',
          lat: b.latitude, lng: b.longitude, created_at: b.created_at
        }));
      petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_BENCANA', payload }), '*');
    }
  }, [bencanaPoints, mapReady]);

  useEffect(() => {
    // La carte tourne dans une <iframe> web (voir plus bas) : `window` n'existe
    // pas sur mobile natif, donc on ne branche ce listener que sur le web.
    if (Platform.OS !== 'web') return undefined;

    const handleMapMessage = (event) => {
      if (event.source !== petaIframeRef.current?.contentWindow) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'MAP_CLICKED' && isPlacingBencana) {
          setPendingBencanaPlacement({ lat: data.lat, lng: data.lng });
          setBencanaModalVisible(true);
          setIsPlacingBencana(false);
        } else if (data.type === 'DELETE_BENCANA_REQUEST') {
          (async () => {
            const result = await deleteBencana(data.id);
            if (result?.cancelled) return;
            onNotify?.(
              !result?.error ? 'success' : 'error',
              !result?.error ? 'Titik bencana berjaya dipadam.' : 'Gagal memadam titik bencana.'
            );
          })();
        } else if (data.type === 'RESOLVE_BENCANA_REQUEST') {
          resolveBencana(data.id);
        }
      } catch (e) {}
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlacingBencana]);

  const handleSaveBencana = async () => {
    if (!pendingBencanaPlacement) return;

    if (!bencanaCategory.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Sila isi nama bencana.');
      } else {
        Alert.alert('Ralat', 'Sila isi nama bencana.');
      }
      return;
    }

    const { error } = await saveBencana({
      category: bencanaCategory,
      description: bencanaDescription,
      latitude: pendingBencanaPlacement.lat,
      longitude: pendingBencanaPlacement.lng,
    });
    if (!error) {
      setBencanaModalVisible(false);
      setBencanaCategory('');
      setBencanaDescription('');
      setPendingBencanaPlacement(null);
    }
  };

  const handleDeleteBencanaSummary = (id, label) => {
    setDeleteTarget({ type: 'bencana', id, label });
  };

  const handleDeleteTrackingHistory = (id, label) => {
    setDeleteTarget({ type: 'history', id, label });
  };

  const confirmDeleteTarget = async () => {
    if (!deleteTarget) return;
    setDeletingTarget(true);
    const result = deleteTarget.type === 'bencana'
      ? await deleteBencana(deleteTarget.id, { skipConfirm: true })
      : await deleteTrackingHistory(deleteTarget.id, { skipConfirm: true });
    setDeletingTarget(false);
    setDeleteTarget(null);
    const isBencana = deleteTarget.type === 'bencana';
    onNotify?.(
      !result?.error ? 'success' : 'error',
      !result?.error
        ? (isBencana ? 'Rekod bencana berjaya dipadam.' : 'Rekod patrol agensi berjaya dipadam.')
        : (isBencana ? 'Gagal memadam rekod bencana.' : 'Gagal memadam rekod patrol agensi.')
    );
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

  return (
    <View style={styles.petaFixedContainer}>
      <View style={styles.petaMapHalf}>
        <View style={styles.petaMapContainer}>
          {Platform.OS === 'web' ? (
            createElement('iframe', {
              ref: petaIframeRef,
              src: petaMapSrc,
              style: { width: '100%', height: '100%', border: 'none' },
              title: 'Peta Agensi',
              onLoad: handlePetaIframeLoad
            })
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.card || PALETTE.cardLight }}>
              <Map size={48} color={theme?.textSecondary || PALETTE.textMutedDark} />
              <Text style={{ marginTop: 12, color: theme?.textSecondary || PALETTE.textMutedDark, fontWeight: '600' }}>
                Peta memerlukan 'react-native-webview' pada peranti mudah alih.
              </Text>
            </View>
          )}
          {petaIframeLoading && Platform.OS === 'web' && (
            <View style={[styles.loader, { backgroundColor: theme?.background || PALETTE.softOrangeBg }]}>
              <ActivityIndicator size="large" color={PALETTE.orange} />
            </View>
          )}
        </View>

        <View style={styles.petaHeaderCard}>
          <View style={styles.petaIconCircle}><Map color={PALETTE.white} size={20} /></View>
          <View>
            <Text style={styles.petaHeaderTitle}>Peta Agensi</Text>
            <View style={styles.liveTagContainer}>
              {onlineAgencies.length > 0 && <View style={styles.liveDot} />}
              <Text style={[styles.liveText, { color: onlineAgencies.length > 0 ? PALETTE.success : PALETTE.textMutedDark }]}>
                {onlineAgencies.length} AGENSI ONLINE
              </Text>
            </View>
          </View>
        </View>

        {onlineAgencies.length > 0 && (
          <View style={styles.petaListContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {onlineAgencies.map(a => (
                <View key={a.id} style={styles.petaAgencyCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={styles.agencyMarkWrap}>
                      <AgencyMark logo={getAgencyLogo(a.jpbd_directory?.agency)} color={getAgencyColorFromMap(a.jpbd_directory?.agency)} size={22} />
                      <View style={styles.onlineBadge} />
                    </View>
                    <View>
                      <Text style={styles.petaAgencyName} numberOfLines={1}>{a.jpbd_directory?.agency || '-'}</Text>
                      <View style={styles.onlineRow}>
                        <Text style={styles.petaAgencyUser} numberOfLines={1}>{a.member_name}</Text>
                        <Text style={styles.onlineLabel}>● Online</Text>
                      </View>
                    </View>
                  </View>
                </View>
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

        <View style={styles.mapToolbar}>
          <TouchableOpacity
            style={styles.historyToggleBtn}
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
            style={styles.summaryToggleBtn}
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

          {(userRole === 'sekretariat' || userRole === 'admin') && (
            <TouchableOpacity
              style={[styles.addBencanaToggleBtn, isPlacingBencana && styles.addBencanaToggleBtnActive]}
              onPress={() => setIsPlacingBencana(!isPlacingBencana)}
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
        </View>
        {isPlacingBencana && (
          <Text style={styles.placingBencanaHint}>Klik pada peta untuk letak titik</Text>
        )}
      </View>

      {sidePanel === 'history' && (
        <View style={styles.petaHistoryHalf}>
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
        <View style={styles.petaHistoryHalf}>
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

      <Modal visible={bencanaModalVisible} transparent={true} animationType="fade">
        <View style={sekretariatStyles.modalOverlay}>
          <View style={sekretariatStyles.modalContainer}>
            <View style={sekretariatStyles.modalHeader}>
              <Text style={sekretariatStyles.modalTitle}>Tambah Titik Bencana</Text>
              <TouchableOpacity onPress={() => { setBencanaModalVisible(false); setPendingBencanaPlacement(null); setBencanaCategory(''); setBencanaDescription(''); }}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <View style={sekretariatStyles.modalForm}>
              <Text style={sekretariatStyles.inputLabel}>Kategori Bencana *</Text>
              <TextInput
                style={sekretariatStyles.input}
                placeholder="Cth: Banjir Kilat, Tanah Runtuh, Ribut..."
                placeholderTextColor={PALETTE.textMutedDark}
                value={bencanaCategory}
                onChangeText={setBencanaCategory}
              />
              <Text style={sekretariatStyles.inputLabel}>Keterangan (pilihan)</Text>
              <TextInput
                style={[sekretariatStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Cth: Air naik setinggi 1 meter"
                placeholderTextColor={PALETTE.textMutedDark}
                multiline
                value={bencanaDescription}
                onChangeText={setBencanaDescription}
              />
              <TouchableOpacity style={sekretariatStyles.saveButton} onPress={handleSaveBencana}>
                <Text style={sekretariatStyles.saveButtonText}>Simpan Titik</Text>
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
                {deleteTarget?.type === 'bencana' ? 'Padam Rekod Bencana' : 'Padam Rekod Patrol Agensi'}
              </Text>
              <Text style={{ color: '#93c5fd', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                Padam rekod "{deleteTarget?.label || '-'}"? Tindakan ini tidak boleh dibatalkan.
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
    </View>
  );
}