// src/screens/operasi/LiveMapTab.js
import React, { useState, useRef, useEffect, useMemo, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import { ShieldAlert, MapIcon, History, ClipboardList, Download, Route, X , Trash2, AlertTriangle, Maximize2} from 'lucide-react-native';
import { getVehicleIcon } from '../../utils/vehicleIcons';
import { PALETTE } from '../../constants/palette';
import { useVehicles } from '../../hooks/useVehicles';
import { useCalamityPoints } from '../../hooks/useCalamityPoints';
import { usePatrolHistoryPanel } from '../../hooks/usePatrolHistoryPanel';
import { useCalamitySummaryPanel } from '../../hooks/useCalamitySummaryPanel';
import { buildOperasiMapHtml } from './operasiMapTemplate';
import { CALAMITY_CATEGORIES, getCalamityMeta, getCalamityLogoUrl } from '../../constants/operasiConstants';
import { BULAN_MS, BULAN_OPTIONS } from '../../constants/bulan';
import ModalSelectField from '../../components/ModalSelectField';
import FullscreenViewer from '../../components/FullscreenViewer';
import { formStyles } from '../../styles/formStyles';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import VehicleCard from './VehicleCard';
import { mapStyles as styles } from './mapStyles';


function CompactTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const nonZero = payload.filter(p => p.value > 0);
  if (nonZero.length === 0) return null;

  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 8, padding: 10,
      maxWidth: 260, boxShadow: '0px 0px 6px rgba(0, 0, 0, 0.2)',
    }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {nonZero.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{p.name}: {p.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

export default function LiveMapTab({ theme, userRole, isEditMode, onNotify }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  const { calamityPoints, saveCalamity, deleteCalamity, resolveCalamity } = useCalamityPoints();
  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [pendingResolveId, setPendingResolveId] = useState(null);
  const [selectedResolveStatus, setSelectedResolveStatus] = useState(null);
  const [resolveReason, setResolveReason] = useState('');
  const history = usePatrolHistoryPanel(calamityPoints);
  const [deletePatrolTarget, setDeletePatrolTarget] = useState(null);
  const displayDeletePatrolTargetRef = useRef(null);
  if (deletePatrolTarget) displayDeletePatrolTargetRef.current = deletePatrolTarget;
  const [forceIdleTarget, setForceIdleTarget] = useState(null); // { id, label }
  const [forcingIdle, setForcingIdle] = useState(false);
  const displayForceIdleTargetRef = useRef(null);
  if (forceIdleTarget) displayForceIdleTargetRef.current = forceIdleTarget;

  const handleForceIdleVehicle = (id, label) => {
    setForceIdleTarget({ id, label });
  };

  const confirmForceIdleVehicle = async () => {
    if (!forceIdleTarget) return;
    setForcingIdle(true);
    const { error } = await supabaseSandbox
      .from('logistik')
      .update({ tracking_status: 'Idle', job_started_at: null, job_distance_km: 0 })
      .eq('id', forceIdleTarget.id);
    setForcingIdle(false);
    setForceIdleTarget(null);
    onNotify?.(!error ? 'success' : 'error', !error ? 'Kenderaan berjaya diputuskan daripada peta.' : 'Gagal memutuskan kenderaan.');
  };
  const [deletingPatrol, setDeletingPatrol] = useState(false);
  const summary = useCalamitySummaryPanel(calamityPoints);

  const vehiclesRef = useRef([]);
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

  const [sidePanel, setSidePanel] = useState('none'); // 'none' | 'history' | 'summary'
  const [historyBtnHovered, setHistoryBtnHovered] = useState(false);
  const [summaryBtnHovered, setSummaryBtnHovered] = useState(false);
  const [fullscreenBtnHovered, setFullscreenBtnHovered] = useState(false);
  // iOS (Safari, et tout navigateur iOS puisqu'ils utilisent tous WebKit)
  // n'implémente jamais la Fullscreen API pour un élément générique comme
  // une iframe — seulement pour <video>. requestFullscreen() n'y fait donc
  // rien, silencieusement. On simule alors le plein écran avec du CSS
  // (position fixed sur tout le viewport) plutôt que la vraie API.
  const isIOS = Platform.OS === 'web' && typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [confirmStopVisible, setConfirmStopVisible] = useState(false);

  const [activeCalamityTool, setActiveCalamityTool] = useState(null);
  const displayActiveCalamityToolRef = useRef(null);
  if (activeCalamityTool) displayActiveCalamityToolRef.current = activeCalamityTool;
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [calamityDescription, setCalamityDescription] = useState('');
  const [calamityModalVisible, setCalamityModalVisible] = useState(false);
  const [calamityTooltip, setCalamityTooltip] = useState(null); // { text, top, left }

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: 'FULLSCREEN_STATE', active }), '*');
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMapMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      if (data.type === 'EXIT_FULLSCREEN_REQUEST') {
        if (document.exitFullscreen) document.exitFullscreen();
      } else if (data.type === 'REQUEST_CALAMITY_REFRESH') {
        sendCalamities();
      } else if (data.type === 'MAP_CLICKED' && activeCalamityTool) {
        
        setPendingPlacement({ lat: data.lat, lng: data.lng });
        setCalamityModalVisible(true);
      } else if (data.type === 'DELETE_CALAMITY_REQUEST') {
        deleteCalamity(data.id).then((ok) => {
          onNotify?.(ok ? 'success' : 'error', ok ? 'Titik berjaya dipadam.' : 'Gagal memadam titik. Sila cuba lagi.');
        });
      } else if (data.type === 'RESOLVE_CALAMITY_REQUEST') {
        setPendingResolveId(data.id);
        setResolveModalVisible(true);
      } else if (data.type === 'FORCE_IDLE_VEHICLE_REQUEST') {
        const vehicle = vehiclesRef.current.find(v => v.id === data.id);
        const label = [vehicle?.reg, vehicle?.model].map(s => s?.trim()).find(s => s) || '-';
        handleForceIdleVehicle(data.id, label);
      }
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCalamityTool]);

  const sendCalamities = () => {
    if (iframeRef?.current?.contentWindow) {
      const payload = calamityPoints
        .filter(c => c.status === 'active')
        .map(c => ({
          id: c.id,
          category: c.category,
          description: c.description || '',
          lat: c.latitude,
          lng: c.longitude,
          color: getCalamityMeta(c.category).color,
          label: getCalamityMeta(c.category).label,
          logo: getCalamityLogoUrl(c.category),
          created_at: c.created_at
        }));
      iframeRef.current.contentWindow.postMessage(JSON.stringify({ type: 'UPDATE_CALAMITIES', payload }), '*');
    }
  };

  useEffect(() => { sendCalamities(); }, [calamityPoints, loading]);

  useEffect(() => {
    if (iframeRef?.current?.contentWindow) {
      const canDelete = userRole === 'admin' || userRole === 'operasi';
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        type: 'UPDATE_PERMISSIONS', canDelete, canManage: canDelete,
      }), '*');
    }
  }, [userRole, loading]);

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

  const handleSaveCalamity = async () => {
    if (!pendingPlacement || !activeCalamityTool) return;
    const { error } = await saveCalamity({
      category: activeCalamityTool,
      description: calamityDescription,
      latitude: pendingPlacement.lat,
      longitude: pendingPlacement.lng,
    });

    if (!error) {
      setCalamityModalVisible(false);
      setCalamityDescription('');
      setPendingPlacement(null);
      setActiveCalamityTool(null);
      onNotify?.('success', 'Titik berjaya ditambah.');
    } else {
      onNotify?.('error', `Gagal menyimpan titik: ${error.message || JSON.stringify(error)}`);
    }
  };

  const handleIframeLoad = () => setLoading(false);

  const mapHtml = useMemo(() => buildOperasiMapHtml({ theme }), [theme]);


  vehiclesRef.current = vehicles;

  const activeVehicles = vehicles.filter(v => v.tracking_status === 'Patrol');
  const activeVehiclesCount = activeVehicles.length;

  const renderHistoryTable = (large = false) => (
    <>
      <View style={styles.historyFilterRow}>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Tahun"
            value={String(history.historyYear)}
            placeholder="Tahun"
            options={history.availableHistoryYears}
            isOpen={history.historyYearOpen}
            onToggle={() => { history.setHistoryYearOpen(!history.historyYearOpen); history.setHistoryMonthOpen(false); }}
            onSelect={(opt) => { history.setHistoryYear(Number(opt)); history.setHistoryYearOpen(false); }}
            stackIndex={2000}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Bulan"
            value={history.historyMonth === null ? 'Semua Bulan' : BULAN_MS[history.historyMonth]}
            placeholder="Bulan"
            options={BULAN_OPTIONS}
            isOpen={history.historyMonthOpen}
            onToggle={() => { history.setHistoryMonthOpen(!history.historyMonthOpen); history.setHistoryYearOpen(false); }}
            onSelect={(opt) => { history.setHistoryMonth(opt === 'Semua Bulan' ? null : BULAN_MS.indexOf(opt)); history.setHistoryMonthOpen(false); }}
            stackIndex={1000}
          />
        </View>
      </View>

      {history.loadingHistory ? (
        <ActivityIndicator size="small" color="#1E3A8A" style={{ marginTop: 20 }} />
      ) : history.patrolHistory.length === 0 ? (
        <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>
          Tiada rekod sejarah untuk {history.historyMonth === null ? history.historyYear : `${BULAN_MS[history.historyMonth]} ${history.historyYear}`}.
        </Text>
      ) : (
        <>
      <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
        {!isMobile ? (
        <View style={styles.calamityTableWrapper}>
          <View style={styles.calamityTableHeaderRow}>
            <View style={[styles.historyKenderaanColFlex, styles.calamityHeaderCellBox]}>
              <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Kenderaan</Text>
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
            <View style={[styles.routeColFlex, styles.calamityHeaderCellBox]}>
              <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Route</Text>
            </View>
          </View>
          {history.pagedHistory.map((h, index) => (
            <View key={h.id}>
              <View style={[styles.calamityTableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                <View style={[styles.historyKenderaanColFlex, { paddingLeft: 16, paddingVertical: 10 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.tableCellAgency, large && { fontSize: 16 }]} numberOfLines={1} ellipsizeMode="tail">{h.vehicle_reg}</Text>
                    {h.status === 'abandoned' && (
                      <View style={styles.abandonedBadge}>
                        <Text style={styles.abandonedBadgeText}>Ditinggalkan</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.tableCellMember, large && { fontSize: 13 }]} numberOfLines={1} ellipsizeMode="tail">{h.vehicle_model}</Text>
                </View>
                <Text style={[styles.calamityTableCell, styles.calamityCatColFlex, large && { fontSize: 16 }]}>{formatDuration(h.duration_seconds)}</Text>
                <Text style={[styles.calamityTableCell, styles.calamityCatColFlex, large && { fontSize: 16 }]}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                <View style={[styles.calamityTotalColFlex, { paddingVertical: 10 }]}>
                  <Text style={[styles.tableCellDate, large && { fontSize: 13 }]}>{new Date(h.ended_at).toLocaleDateString('ms-MY')}</Text>
                  <Text style={[styles.tableCellTime, large && { fontSize: 12 }]}>{new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={[styles.routeColFlex, { paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }]}>
                  <TouchableOpacity
                    onPress={() => history.toggleHistoryRow(h.id)}
                    style={[styles.routeBtn, history.expandedHistoryId === h.id && styles.routeBtnActive]}
                  >
                    <Route size={16} color={history.expandedHistoryId === h.id ? '#fff' : '#1E3A8A'} />
                  </TouchableOpacity>
                  {isEditMode && (
                    <TouchableOpacity
                      disabled={deletingPatrol}
                      onPress={() => setDeletePatrolTarget({ id: h.id, vehicle_reg: h.vehicle_reg })}
                      style={[styles.routeBtn, { backgroundColor: '#dc2626', opacity: deletingPatrol ? 0.5 : 1 }]}
                    >
                      <Trash2 size={16} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {history.expandedHistoryId === h.id && (
                <View style={styles.waypointPanel}>
                  {history.loadingWaypointsId === h.id ? (
                    <ActivityIndicator size="small" color="#1E3A8A" />
                  ) : (history.historyWaypoints[h.id] || []).length === 0 ? (
                    <Text style={styles.waypointEmptyText}>Tiada titik ditanda semasa patrol ini.</Text>
                  ) : (
                    (history.historyWaypoints[h.id] || []).map((wp, wpIndex) => (
                      <View key={wp.id} style={styles.waypointRow}>
                        <Text style={styles.waypointLabel}>
                          {wpIndex === 0 ? 'Pangkalan' : `Titik ${wpIndex}`} → Titik {wpIndex + 1}
                        </Text>
                        <Text style={styles.waypointDetail}>
                          {formatDuration(wp.duration_from_previous_seconds)} · {wp.distance_from_previous_km.toFixed(2)} km · {new Date(wp.marked_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
        ) : (
        <View>
          {history.pagedHistory.map((h) => (
            <View key={h.id}>
              <View style={styles.historyCardMobile}>
                <View style={styles.historyCardMobileTopRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.tableCellAgency} numberOfLines={1} ellipsizeMode="tail">{h.vehicle_reg}</Text>
                      {h.status === 'abandoned' && (
                        <View style={styles.abandonedBadge}>
                          <Text style={styles.abandonedBadgeText}>Ditinggalkan</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.tableCellMember} numberOfLines={1} ellipsizeMode="tail">{h.vehicle_model}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => history.toggleHistoryRow(h.id)}
                      style={[styles.routeBtn, history.expandedHistoryId === h.id && styles.routeBtnActive]}
                    >
                      <Route size={16} color={history.expandedHistoryId === h.id ? '#fff' : '#1E3A8A'} />
                    </TouchableOpacity>
                    {isEditMode && (
                      <TouchableOpacity
                        disabled={deletingPatrol}
                        onPress={() => setDeletePatrolTarget({ id: h.id, vehicle_reg: h.vehicle_reg })}
                        style={[styles.routeBtn, { backgroundColor: '#dc2626', opacity: deletingPatrol ? 0.5 : 1 }]}
                      >
                        <Trash2 size={16} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <View style={styles.historyCardMobileStatsRow}>
                  <Text style={styles.historyCardMobileStat}>{formatDuration(h.duration_seconds)}</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={styles.historyCardMobileStat}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                  <Text style={styles.historyCardMobileStatDivider}>·</Text>
                  <Text style={styles.historyCardMobileStat}>{new Date(h.ended_at).toLocaleDateString('ms-MY')} {new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>

              {history.expandedHistoryId === h.id && (
                <View style={styles.waypointPanel}>
                  {history.loadingWaypointsId === h.id ? (
                    <ActivityIndicator size="small" color="#1E3A8A" />
                  ) : (history.historyWaypoints[h.id] || []).length === 0 ? (
                    <Text style={styles.waypointEmptyText}>Tiada titik ditanda semasa patrol ini.</Text>
                  ) : (
                    (history.historyWaypoints[h.id] || []).map((wp, wpIndex) => (
                      <View key={wp.id} style={styles.waypointRow}>
                        <Text style={styles.waypointLabel}>
                          {wpIndex === 0 ? 'Pangkalan' : `Titik ${wpIndex}`} → Titik {wpIndex + 1}
                        </Text>
                        <Text style={styles.waypointDetail}>
                          {formatDuration(wp.duration_from_previous_seconds)} · {wp.distance_from_previous_km.toFixed(2)} km · {new Date(wp.marked_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
        )}
      </ScrollView>

      <View style={styles.paginationRow}>
        <Text style={styles.pageIndicator}>{history.historyPage + 1} / {history.historyTotalPages}</Text>
        <View style={styles.pageArrowRow}>
          <TouchableOpacity
            onPress={() => history.setHistoryPage(p => Math.max(0, p - 1))}
            disabled={history.historyPage === 0}
            style={[styles.pageBtn, history.historyPage === 0 && styles.pageBtnDisabled]}
          >
            <Text style={[styles.pageBtnText, history.historyPage === 0 && styles.pageBtnTextDisabled]}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => history.setHistoryPage(p => Math.min(history.historyTotalPages - 1, p + 1))}
            disabled={history.historyPage >= history.historyTotalPages - 1}
            style={[styles.pageBtn, history.historyPage >= history.historyTotalPages - 1 && styles.pageBtnDisabled]}
          >
            <Text style={[styles.pageBtnText, history.historyPage >= history.historyTotalPages - 1 && styles.pageBtnTextDisabled]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
        </>
      )}
    </>
  );
  const renderSummaryContent = (large = false) => (
    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
      <View style={styles.historyFilterRow}>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Tahun"
            value={String(summary.summaryYear)}
            placeholder="Tahun"
            options={summary.availableSummaryYears}
            isOpen={summary.summaryYearOpen}
            onToggle={() => { summary.setSummaryYearOpen(!summary.summaryYearOpen); summary.setSummaryMonthOpen(false); }}
            onSelect={(opt) => { summary.setSummaryYear(Number(opt)); summary.setSummaryYearOpen(false); }}
            stackIndex={2000}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Bulan"
            value={summary.summaryMonth === null ? 'Semua Bulan' : BULAN_MS[summary.summaryMonth]}
            placeholder="Bulan"
            options={BULAN_OPTIONS}
            isOpen={summary.summaryMonthOpen}
            onToggle={() => { summary.setSummaryMonthOpen(!summary.summaryMonthOpen); summary.setSummaryYearOpen(false); }}
            onSelect={(opt) => { summary.setSummaryMonth(opt === 'Semua Bulan' ? null : BULAN_MS.indexOf(opt)); summary.setSummaryMonthOpen(false); }}
            stackIndex={1000}
          />
        </View>
      </View>

      <View style={styles.calamityTableWrapper}>
        <View style={styles.calamityTableHeaderRow}>
          <View style={[styles.calamityMonthColFlex, styles.calamityHeaderCellBox]}>
            <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Bulan</Text>
          </View>
          {CALAMITY_CATEGORIES.map(cat => (
            <View key={cat.key} style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
              <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>{cat.key}</Text>
            </View>
          ))}
          <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
            <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Jumlah</Text>
          </View>
        </View>
        {summary.calamitySummaryRows.map((row, idx) => (
          <View
            key={row.month}
            style={[
              styles.calamityTableRow,
              row.isCumulative
                ? styles.calamityCumulativeRow
                : { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' },
            ]}
          >
            <View style={[styles.calamityMonthColFlex, styles.calamitySummaryCellBox]}>
              <Text style={[styles.calamityTableCell, { fontWeight: '800' }, large && { fontSize: 16 }]}>{row.month}</Text>
            </View>
            {CALAMITY_CATEGORIES.map(cat => (
              <View key={cat.key} style={[styles.calamityCatColFlex, styles.calamitySummaryCellBox]}>
                <Text style={[styles.calamityTableCell, row.isCumulative && { fontWeight: '700' }, large && { fontSize: 16 }]}>{row.counts[cat.key] || '–'}</Text>
              </View>
            ))}
            <View style={[styles.calamityTotalColFlex, styles.calamityTotalBadge]}>
              <Text style={[styles.calamityTotalBadgeText, large && { fontSize: 18 }]}>{row.total}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const showMobileFullscreenHistory = isMobile && sidePanel === 'history';
  const ViewContainerWrapper = isMobile && !showMobileFullscreenHistory ? ScrollView : View;
  const viewContainerWrapperProps = showMobileFullscreenHistory
    ? { style: styles.viewContainer }
    : isMobile
      ? { style: { flex: 1 }, contentContainerStyle: [styles.viewContainer, styles.viewContainerMobile] }
      : { style: styles.viewContainer };

  return (
    <>
      <ViewContainerWrapper {...viewContainerWrapperProps}>
        {!showMobileFullscreenHistory && (
        <View style={[{ flex: 1, position: 'relative' }, isMobile && { flex: undefined, minHeight: 420 }]}>
          <View style={styles.mapContainer}>
            {!pseudoFullscreen && (Platform.OS === 'web' ? (
              createElement('iframe', {
                ref: iframeRef,
                srcDoc: mapHtml,
                style: { width: '100%', height: '100%', border: 'none' },
                title: 'Leaflet Map',
                onLoad: handleIframeLoad,
                allowFullScreen: true,
                allow: 'fullscreen',
              })
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.card }}>
                <MapIcon size={48} color={theme.textSecondary} />
                <Text style={{ marginTop: 12, color: theme.textSecondary, fontWeight: '600' }}>
                  Live Map memerlukan 'react-native-webview' pada peranti mudah alih.
                </Text>
              </View>
            ))}
            {loading && Platform.OS === 'web' && (
              <View style={[styles.loader, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color="#f97316" /></View>
            )}
          </View>

          <Modal visible={pseudoFullscreen} animationType="fade" onRequestClose={() => setPseudoFullscreen(false)}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              {Platform.OS === 'web' && pseudoFullscreen ? (
                createElement('iframe', {
                  ref: iframeRef,
                  srcDoc: mapHtml,
                  style: { width: '100%', height: '100%', border: 'none' },
                  title: 'Leaflet Map',
                  onLoad: handleIframeLoad,
                })
              ) : null}
              {loading && (
                <View style={[styles.loader, { backgroundColor: theme.background }]}><ActivityIndicator size="large" color="#f97316" /></View>
              )}
              <TouchableOpacity
                onPress={() => setPseudoFullscreen(false)}
                style={{ position: 'absolute', top: 12, right: 12, zIndex: 10000, width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 }}
              >
                <X size={18} color="#1E3A8A" />
              </TouchableOpacity>
            </View>
          </Modal>

          <View style={[styles.headerCard, { backgroundColor: theme.card }, isMobile && { padding: 10, gap: 8, minWidth: 0, borderRadius: 12 }]}>
            <View style={[styles.iconCircle, isMobile && { width: 30, height: 30, borderRadius: 9 }]}>
              <ShieldAlert color="#fff" size={isMobile ? 15 : 20} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: theme.text }, isMobile && { fontSize: 12 }]}>Live Tracking</Text>
              <View style={styles.liveTagContainer}>
                {activeVehiclesCount > 0 && <View style={[styles.liveDot, isMobile && { width: 5, height: 5 }]} />}
                <Text style={[styles.liveText, isMobile && { fontSize: 8 }, { color: activeVehiclesCount > 0 ? '#22c55e' : theme.textSecondary }]}>
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
                    onForceIdle={() => handleForceIdleVehicle(v.id, [v.reg, v.model].map(s => s?.trim()).find(s => s) || '-')}
                    onPress={() => {
                      if (iframeRef?.current?.contentWindow) {
                        iframeRef.current.contentWindow.postMessage(JSON.stringify({
                          type: 'FOCUS_VEHICLE', id: v.id, lat: v.latitude, lng: v.longitude,
                        }), '*');
                      }
                    }}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {(() => {
            const canAddCalamity = userRole === 'admin' || userRole === 'operasi';
            return (
              <>
                <TouchableOpacity
                  style={[styles.historyToggleBtn, { right: canAddCalamity ? (isMobile ? 88 : 116) : 16 }]}
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

                {false && (
                <TouchableOpacity
                  style={[styles.summaryToggleBtn, { right: canAddCalamity ? 164 : 64 }]}
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
                )}

                <TouchableOpacity
                  style={[
                    styles.summaryToggleBtn,
                    isMobile
                      ? { right: canAddCalamity ? (isMobile ? 88 : 116) : 16, top: 64 }
                      : { right: canAddCalamity ? 164 : 64 },
                  ]}
                  onPress={() => {
                    if (isMobile) {
                      setLoading(true);
                      setPseudoFullscreen(true);
                    } else {
                      iframeRef.current?.requestFullscreen?.();
                    }
                  }}
                  {...(Platform.OS === 'web' ? {
                    onMouseEnter: () => setFullscreenBtnHovered(true),
                    onMouseLeave: () => setFullscreenBtnHovered(false),
                  } : {})}
                >
                  <Maximize2 size={18} color="#1E3A8A" />
                  {fullscreenBtnHovered && (
                    <View style={styles.historyTooltip}>
                      <Text style={styles.historyTooltipText}>Skrin Penuh</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            );
          })()}

          {(userRole === 'admin' || userRole === 'operasi') && (
            <View style={[styles.calamityPalette, isMobile && styles.calamityPaletteMobile]}>
              <ScrollView style={{ maxHeight: isMobile ? 200 : 280 }} showsVerticalScrollIndicator={false}>
                {CALAMITY_CATEGORIES.map(cat => {
                  const isActive = activeCalamityTool === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[
                        styles.calamityToolBtn,
                        isMobile && styles.calamityToolBtnMobile,
                        { backgroundColor: isActive ? cat.color : '#fff', borderColor: cat.color },
                      ]}
                      onPress={() => setActiveCalamityTool(isActive ? null : cat.key)}
                      {...(Platform.OS === 'web' ? {
                        onMouseEnter: (e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setCalamityTooltip({ text: getCalamityMeta(cat.key).label, top: rect.top, left: rect.left });
                        },
                        onMouseLeave: () => setCalamityTooltip(null),
                      } : {})}
                    >
                      <Text style={[styles.calamityToolText, isMobile && styles.calamityToolTextMobile, { color: isActive ? '#fff' : cat.color }]}>{cat.key}</Text>
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
        )}

        {sidePanel === 'history' && (
          <View style={[styles.historyHalf, isMobile && styles.historyHalfMobile]}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Sejarah Patrol Kenderaan</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <FullscreenViewer title="Sejarah Patrol Kenderaan">
                  {renderHistoryTable(true)}
                </FullscreenViewer>
                <TouchableOpacity
                  onPress={history.handleExportHistoryPdf}
                disabled={history.exportingPdf}
                style={[styles.pdfExportBtn, history.exportingPdf && styles.pdfExportBtnDisabled]}
              >
                {history.exportingPdf ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Download size={14} color="#fff" />
                    <Text style={styles.pdfExportBtnText}>PDF</Text>
                  </>
                )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSidePanel('none')} style={styles.panelCloseBtn}>
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {renderHistoryTable()}
            </ScrollView>
          </View>
        )}

        {false && sidePanel === 'summary' && (
          <View style={styles.historyHalf}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Ringkasan Kecemasan</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <FullscreenViewer title="Ringkasan Kecemasan">
                  {renderSummaryContent(true)}
                </FullscreenViewer>
                <TouchableOpacity
                  onPress={summary.handleExportSummaryPdf}
                disabled={summary.exportingSummaryPdf}
                style={[styles.pdfExportBtn, summary.exportingSummaryPdf && styles.pdfExportBtnDisabled]}
              >
                {summary.exportingSummaryPdf ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Download size={14} color="#fff" />
                    <Text style={styles.pdfExportBtnText}>PDF</Text>
                  </>
                )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSidePanel('none')} style={styles.panelCloseBtn}>
                  <X size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {renderSummaryContent()}
          </View>
        )}
      </ViewContainerWrapper>

      {/* Modal sélection statut résolution */}
      <Modal visible={resolveModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={formStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[formStyles.modalContent, { backgroundColor: theme.background }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Kemaskini Status</Text>
              <TouchableOpacity onPress={() => {
                setResolveModalVisible(false);
                setPendingResolveId(null);
                setSelectedResolveStatus(null);
                setResolveReason('');
              }}>
                <X size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {!selectedResolveStatus ? (
              <>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>Pilih hasil tindakan untuk titik ini:</Text>
                {['berjaya', 'gagal', 'batal', 'tunda', 'diambil agensi lain', 'diserah ke agensi lain'].map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      if (s === 'berjaya') {
                        resolveCalamity(pendingResolveId, s);
                        setResolveModalVisible(false);
                        setPendingResolveId(null);
                      } else {
                        setSelectedResolveStatus(s);
                      }
                    }}
                    style={{
                      paddingVertical: 14, paddingHorizontal: 16,
                      borderRadius: 10, marginBottom: 8,
                      backgroundColor: s === 'berjaya' ? '#f0fdf4' : s === 'gagal' ? '#fef2f2' : s === 'batal' ? '#fef9c3' : '#f8fafc',
                      borderWidth: 1,
                      borderColor: s === 'berjaya' ? '#bbf7d0' : s === 'gagal' ? '#fecaca' : s === 'batal' ? '#fde68a' : '#e2e8f0',
                    }}
                  >
                    <Text style={{
                      fontSize: 14, fontWeight: '700',
                      color: s === 'berjaya' ? '#16a34a' : s === 'gagal' ? '#dc2626' : s === 'batal' ? '#d97706' : '#475569',
                      textTransform: 'capitalize',
                    }}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 8, textTransform: 'capitalize' }}>
                  Sebab — {selectedResolveStatus}:
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1.5, borderColor: theme.border || '#e2e8f0', borderRadius: 10,
                    padding: 12, minHeight: 90, textAlignVertical: 'top',
                    fontSize: 14, color: theme.text, marginBottom: 16,
                  }}
                  placeholder="Nyatakan sebab..."
                  placeholderTextColor={theme.textSecondary}
                  value={resolveReason}
                  onChangeText={setResolveReason}
                  multiline
                  autoFocus
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => { setSelectedResolveStatus(null); setResolveReason(''); }}
                    style={{ flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary }}>Kembali</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      resolveCalamity(pendingResolveId, selectedResolveStatus, resolveReason);
                      setResolveModalVisible(false);
                      setPendingResolveId(null);
                      setSelectedResolveStatus(null);
                      setResolveReason('');
                    }}
                    disabled={!resolveReason.trim()}
                    style={{ flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: resolveReason.trim() ? PALETTE.orange : '#e2e8f0', alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: '700', color: resolveReason.trim() ? '#fff' : '#94a3b8' }}>Sahkan</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={calamityModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={formStyles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[formStyles.modalContent, { backgroundColor: theme.card, maxHeight: '80%' }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Tambah Titik Bencana</Text>
              <TouchableOpacity onPress={() => { setCalamityModalVisible(false); setPendingPlacement(null); }}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                alignSelf: 'flex-start', backgroundColor: theme.background,
                borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 18,
                borderWidth: 1, borderColor: theme.border,
              }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getCalamityMeta(displayActiveCalamityToolRef.current).color || '#ea580c' }} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: theme.text, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  {getCalamityMeta(displayActiveCalamityToolRef.current).label}
                </Text>
              </View>

              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 }}>
                Keterangan (pilihan)
              </Text>
              <TextInput
                style={{
                  backgroundColor: theme.background, color: theme.text, borderColor: theme.border,
                  borderWidth: 1.5, borderRadius: 12, padding: 14,
                  height: 90, textAlignVertical: 'top', fontSize: 14, marginBottom: 20,
                  outlineStyle: 'none',
                }}
                placeholder="Cth: Air naik setinggi 1 meter"
                placeholderTextColor={theme.textSecondary}
                multiline
                value={calamityDescription}
                onChangeText={setCalamityDescription}
              />

              <TouchableOpacity
                style={{
                  backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 15, alignItems: 'center',
                  shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
                }}
                onPress={handleSaveCalamity}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Simpan Titik</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal confirmation padam rekod patrol */}
      <Modal visible={!!deletePatrolTarget} transparent animationType="fade">
        <View style={formStyles.modalOverlay}>
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
                Padam Rekod Patrol
              </Text>
              <Text style={{ color: '#93c5fd', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                Padam rekod patrol kenderaan "{displayDeletePatrolTargetRef.current?.vehicle_reg}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
              <TouchableOpacity
                disabled={deletingPatrol}
                onPress={() => setDeletePatrolTarget(null)}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 12,
                  borderWidth: 1, borderColor: '#e2e8f0',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: deletingPatrol ? 0.5 : 1,
                }}
              >
                <Text style={{ color: '#334155', fontSize: 14, fontWeight: '700' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={deletingPatrol}
                onPress={async () => {
                  const target = deletePatrolTarget;
                  setDeletingPatrol(true);
                  const ok = await history.deletePatrolRecord(target.id);
                  setDeletingPatrol(false);
                  setDeletePatrolTarget(null);
                  onNotify?.(ok ? 'success' : 'error', ok ? 'Rekod patrol berjaya dipadam.' : 'Gagal memadam rekod patrol.');
                }}
                style={{
                  flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 13, borderRadius: 12,
                  backgroundColor: '#ef4444',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: deletingPatrol ? 0.7 : 1,
                }}
              >
                {deletingPatrol ? (
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

      {/* Modal confirmation putuskan kenderaan daripada peta */}
      <Modal visible={!!forceIdleTarget} transparent animationType="fade">
        <View style={formStyles.modalOverlay}>
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
                Padam Kenderaan
              </Text>
              <Text style={{ color: '#93c5fd', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                Padam kenderaan "{displayForceIdleTargetRef.current?.label}" daripada peta? Pemandu perlu memulakan syif baharu.
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
              <TouchableOpacity
                disabled={forcingIdle}
                onPress={() => setForceIdleTarget(null)}
                style={{
                  flex: 1, paddingVertical: 13, borderRadius: 12,
                  borderWidth: 1, borderColor: '#e2e8f0',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: forcingIdle ? 0.5 : 1,
                }}
              >
                <Text style={{ color: '#334155', fontSize: 14, fontWeight: '700' }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={forcingIdle}
                onPress={confirmForceIdleVehicle}
                style={{
                  flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 13, borderRadius: 12,
                  backgroundColor: '#ef4444',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: forcingIdle ? 0.7 : 1,
                }}
              >
                {forcingIdle ? (
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
    </>
  );
}