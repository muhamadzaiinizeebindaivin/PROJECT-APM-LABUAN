// src/screens/sekretariat/PetaTab.js
import React, { useState, useEffect, useRef, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Map, History, ClipboardList, AlertTriangle, X, Plus } from 'lucide-react-native';
import { supabase } from '../../supabaseClient';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { buildSekretariatMapHtml } from '../../mapTemplates/sekretariatMapTemplate';
import { useOnlineAgencies } from '../../hooks/useOnlineAgencies';
import { useBencanaPoints } from '../../hooks/useBencanaPoints';
import { useAgencyTrackingHistory } from '../../hooks/useAgencyTrackingHistory';
import ModalSelectField from '../../components/ModalSelectField';
import { sharedStyles } from './sharedStyles';
import { petaStyles as styles } from './petaStyles';

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

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}jam ${m} minit`;
  return `${m} minit`;
};

export default function PetaTab({ theme, userRole }) {
  const now = new Date();
  const petaIframeRef = useRef(null);

  const { onlineAgencies } = useOnlineAgencies();
  const { bencanaPoints, saveBencana, resolveBencana, deleteBencana } = useBencanaPoints();
  const { trackingHistory, loadingHistory } = useAgencyTrackingHistory();

  // Liste légère des agences, uniquement pour la légende de couleurs de la carte
  const [agencyNames, setAgencyNames] = useState([]);
  useEffect(() => {
    const fetchAgencyNames = async () => {
      const { data } = await supabase.from('jpbd_directory').select('id, agency').order('created_at', { ascending: true });
      setAgencyNames(data || []);
    };
    fetchAgencyNames();
    const subscription = supabase
      .channel('peta_jpbd_directory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jpbd_directory' }, () => {
        fetchAgencyNames();
      })
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, []);

  const [petaIframeLoading, setPetaIframeLoading] = useState(true);

  // --- Placement de bencana ---
  const [isPlacingBencana, setIsPlacingBencana] = useState(false);
  const [pendingBencanaPlacement, setPendingBencanaPlacement] = useState(null);
  const [bencanaCategory, setBencanaCategory] = useState('');
  const [bencanaDescription, setBencanaDescription] = useState('');
  const [bencanaModalVisible, setBencanaModalVisible] = useState(false);

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

  const agencyColorMap = buildAgencyColorMap(agencyNames);
  const getAgencyColorFromMap = (agencyName) => agencyColorMap[agencyName] || '#64748b';

  const petaMapHtml = buildSekretariatMapHtml({ theme, userRole });
  const petaMapSrc = `data:text/html;charset=utf-8,${encodeURIComponent(petaMapHtml)}`;

  const handlePetaIframeLoad = () => {
    setPetaIframeLoading(false);
    setTimeout(() => {
      if (petaIframeRef?.current?.contentWindow) {
        const agencyPayload = onlineAgencies.map(a => ({
          id: a.id,
          name: a.member_name,
          agency: a.jpbd_directory?.agency || '',
          lat: a.latitude,
          lng: a.longitude,
          color: getAgencyColorFromMap(a.jpbd_directory?.agency || ''),
          updated: a.last_updated ? new Date(a.last_updated).toLocaleTimeString() : ''
        }));
        petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_AGENCIES', payload: agencyPayload }), '*');

        const bencanaPayload = bencanaPoints
          .filter(b => b.status !== 'resolved')
          .map(b => ({
            id: b.id, category: b.category, description: b.description || '',
            lat: b.latitude, lng: b.longitude, created_at: b.created_at
          }));
        petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_BENCANA', payload: bencanaPayload }), '*');
      }
    }, 300);
  };

  useEffect(() => {
    if (petaIframeRef?.current?.contentWindow) {
      const payload = onlineAgencies.map(a => ({
        id: a.id,
        name: a.member_name,
        agency: a.jpbd_directory?.agency || '',
        lat: a.latitude,
        lng: a.longitude,
        color: getAgencyColorFromMap(a.jpbd_directory?.agency || ''),
        updated: a.last_updated ? new Date(a.last_updated).toLocaleTimeString() : ''
      }));
      petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_AGENCIES', payload }), '*');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlineAgencies, agencyNames]);

  useEffect(() => {
    if (petaIframeRef?.current?.contentWindow) {
      const payload = bencanaPoints
        .filter(b => b.status !== 'resolved')
        .map(b => ({
          id: b.id, category: b.category, description: b.description || '',
          lat: b.latitude, lng: b.longitude, created_at: b.created_at
        }));
      petaIframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_BENCANA', payload }), '*');
    }
  }, [bencanaPoints]);

  useEffect(() => {
    const handleMapMessage = (event) => {
      if (event.source !== petaIframeRef.current?.contentWindow) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'MAP_CLICKED' && isPlacingBencana) {
          setPendingBencanaPlacement({ lat: data.lat, lng: data.lng });
          setBencanaModalVisible(true);
          setIsPlacingBencana(false);
        } else if (data.type === 'DELETE_BENCANA_REQUEST') {
          deleteBencana(data.id);
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

  // --- Filtre/pagination : Sejarah Patrol Agensi ---
  const availableHistoryYears = React.useMemo(() => {
    const years = new Set(trackingHistory.map(h => new Date(h.ended_at).getFullYear()));
    years.add(now.getFullYear());
    return Array.from(years).sort((a, b) => b - a).map(String);
  }, [trackingHistory]);

  const filteredHistory = React.useMemo(() => {
    return trackingHistory.filter(h => {
      const d = new Date(h.ended_at);
      if (d.getFullYear() !== historyYear) return false;
      if (historyMonth !== null && d.getMonth() !== historyMonth) return false;
      return true;
    });
  }, [trackingHistory, historyYear, historyMonth]);

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
    return bencanaPoints
      .filter(b => {
        const d = new Date(b.created_at);
        if (d.getFullYear() !== summaryYear) return false;
        if (summaryMonth !== null && d.getMonth() !== summaryMonth) return false;
        return true;
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [bencanaPoints, summaryYear, summaryMonth]);

  const summaryTotalPages = Math.max(1, Math.ceil(filteredBencanaSummary.length / PAGE_SIZE));
  const pagedBencanaSummary = React.useMemo(() => {
    const start = summaryPage * PAGE_SIZE;
    return filteredBencanaSummary.slice(start, start + PAGE_SIZE);
  }, [filteredBencanaSummary, summaryPage]);

  useEffect(() => { setSummaryPage(0); }, [summaryYear, summaryMonth]);

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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme?.card || '#fff' }}>
              <Map size={48} color={theme?.textSecondary || '#64748b'} />
              <Text style={{ marginTop: 12, color: theme?.textSecondary || '#64748b', fontWeight: '600' }}>
                Peta memerlukan 'react-native-webview' pada peranti mudah alih.
              </Text>
            </View>
          )}
          {petaIframeLoading && Platform.OS === 'web' && (
            <View style={[styles.loader, { backgroundColor: theme?.background || '#f8fafc' }]}>
              <ActivityIndicator size="large" color="#1E3A8A" />
            </View>
          )}
        </View>

        <View style={styles.petaHeaderCard}>
          <View style={styles.petaIconCircle}><Map color="#fff" size={20} /></View>
          <View>
            <Text style={styles.petaHeaderTitle}>Peta Agensi</Text>
            <View style={styles.liveTagContainer}>
              {onlineAgencies.length > 0 && <View style={styles.liveDot} />}
              <Text style={[styles.liveText, { color: onlineAgencies.length > 0 ? '#22c55e' : '#94a3b8' }]}>
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
                    <View style={[styles.petaAgencyDot, { backgroundColor: getAgencyColorFromMap(a.jpbd_directory?.agency) }]} />
                    <View>
                      <Text style={styles.petaAgencyName} numberOfLines={1}>{a.jpbd_directory?.agency || '-'}</Text>
                      <Text style={styles.petaAgencyUser}>{a.member_name}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {agencyNames.length > 0 && (
          <View style={styles.agencyLegendPalette}>
            <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
              {agencyNames.map(a => (
                <View key={a.id} style={styles.agencyLegendRow}>
                  <View style={[styles.agencyLegendDot, { backgroundColor: getAgencyColorFromMap(a.agency) }]} />
                  <Text style={styles.agencyLegendLabel} numberOfLines={1}>{a.agency}</Text>
                </View>
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
          <ClipboardList size={18} color="#1E3A8A" />
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
              <X size={18} color="#fff" />
            ) : (
              <Plus size={18} color="#ea580c" />
            )}
            {addBencanaBtnHovered && !isPlacingBencana && (
              <View style={styles.historyTooltip}>
                <Text style={styles.historyTooltipText}>Tambah Bencana</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {isPlacingBencana && (
          <Text style={styles.placingBencanaHint}>Klik pada peta untuk letak titik</Text>
        )}
      </View>

      {sidePanel === 'history' && (
        <View style={styles.petaHistoryHalf}>
          <View style={styles.petaHistoryHeader}>
            <Text style={styles.petaHistoryTitle}>Sejarah Patrol Agensi</Text>
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
          ) : pagedHistory.length === 0 ? (
            <Text style={styles.emptyText}>Tiada rekod sejarah untuk tempoh ini.</Text>
          ) : (
            <>
              <View style={styles.calamityTableWrapper}>
                <View style={styles.calamityTableHeaderRow}>
                  <View style={[styles.historyAgencyColFlex, styles.calamityHeaderCellBox]}>
                    <Text style={styles.calamityTableHeaderCell}>Agensi</Text>
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
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  {pagedHistory.map((h, index) => (
                    <View key={h.id} style={[styles.calamityTableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                      <View style={[styles.historyAgencyColFlex, { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 16, paddingVertical: 10 }]}>
                        <View style={[styles.petaAgencyDot, { backgroundColor: getAgencyColorFromMap(h.jpbd_directory?.agency) }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tableCellAgency} numberOfLines={1}>{h.jpbd_directory?.agency || '-'}</Text>
                          <Text style={styles.tableCellMember} numberOfLines={1}>{h.member_name}</Text>
                        </View>
                      </View>
                      <Text style={[styles.calamityTableCell, styles.calamityCatColFlex]}>{formatDuration(h.duration_seconds)}</Text>
                      <Text style={[styles.calamityTableCell, styles.calamityCatColFlex]}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                      <View style={[styles.calamityTotalColFlex, { paddingVertical: 10 }]}>
                        <Text style={styles.tableCellDate}>{new Date(h.ended_at).toLocaleDateString('ms-MY')}</Text>
                        <Text style={styles.tableCellTime}>{new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
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
        </View>
      )}

      {sidePanel === 'summary' && (
        <View style={styles.petaHistoryHalf}>
          <View style={styles.petaHistoryHeader}>
            <Text style={styles.petaHistoryTitle}>Ringkasan Bencana</Text>
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

          {pagedBencanaSummary.length === 0 ? (
            <Text style={styles.emptyText}>Tiada rekod bencana untuk tempoh ini.</Text>
          ) : (
            <>
              <View style={styles.calamityTableWrapper}>
                <View style={styles.calamityTableHeaderRow}>
                  <View style={[styles.historyAgencyColFlex, styles.calamityHeaderCellBox]}>
                    <Text style={styles.calamityTableHeaderCell}>Nama Bencana</Text>
                  </View>
                  <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                    <Text style={styles.calamityTableHeaderCell}>Tarikh Mula</Text>
                  </View>
                  <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
                    <Text style={styles.calamityTableHeaderCell}>Tarikh Tamat</Text>
                  </View>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  {pagedBencanaSummary.map((b, index) => (
                    <View key={b.id} style={[styles.calamityTableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                      <Text style={[styles.calamityTableCell, styles.historyAgencyColFlex, { textAlign: 'left', paddingLeft: 16, fontWeight: '700' }]} numberOfLines={1}>
                        {b.category}
                      </Text>
                      <Text style={[styles.calamityTableCell, styles.calamityTotalColFlex]}>
                        {new Date(b.created_at).toLocaleDateString('ms-MY')}
                      </Text>
                      <Text style={[styles.calamityTableCell, styles.calamityTotalColFlex]}>
                        {b.resolved_at ? new Date(b.resolved_at).toLocaleDateString('ms-MY') : '-'}
                      </Text>
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
        </View>
      )}

      <Modal visible={bencanaModalVisible} transparent={true} animationType="fade">
        <View style={sharedStyles.modalOverlay}>
          <View style={sharedStyles.modalContainer}>
            <View style={sharedStyles.modalHeader}>
              <Text style={sharedStyles.modalTitle}>Tambah Titik Bencana</Text>
              <TouchableOpacity onPress={() => { setBencanaModalVisible(false); setPendingBencanaPlacement(null); setBencanaCategory(''); setBencanaDescription(''); }}>
                <X size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={sharedStyles.modalForm}>
              <Text style={sharedStyles.inputLabel}>Kategori Bencana *</Text>
              <TextInput
                style={sharedStyles.input}
                placeholder="Cth: Banjir Kilat, Tanah Runtuh, Ribut..."
                placeholderTextColor="#94a3b8"
                value={bencanaCategory}
                onChangeText={setBencanaCategory}
              />
              <Text style={sharedStyles.inputLabel}>Keterangan (pilihan)</Text>
              <TextInput
                style={[sharedStyles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Cth: Air naik setinggi 1 meter"
                placeholderTextColor="#94a3b8"
                multiline
                value={bencanaDescription}
                onChangeText={setBencanaDescription}
              />
              <TouchableOpacity style={sharedStyles.saveButton} onPress={handleSaveBencana}>
                <Text style={sharedStyles.saveButtonText}>Simpan Titik</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}