// src/screens/operasi/LiveMapTab.js
import React, { useState, useRef, useEffect, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Modal, TextInput } from 'react-native';
import { ShieldAlert, MapIcon, History, ClipboardList, Download, Route, X } from 'lucide-react-native';
import { getVehicleIcon } from '../../utils/vehicleIcons';
import { useVehicles } from '../../hooks/useVehicles';
import { useCalamityPoints } from '../../hooks/useCalamityPoints';
import { usePatrolHistoryPanel } from '../../hooks/usePatrolHistoryPanel';
import { useCalamitySummaryPanel } from '../../hooks/useCalamitySummaryPanel';
import { buildOperasiMapHtml } from '../../mapTemplates/operasiMapTemplate';
import { CALAMITY_CATEGORIES, getCalamityMeta } from '../../constants/operasiConstants';
import { BULAN_MS, BULAN_OPTIONS } from '../../constants/bulanMonths';
import ModalSelectField from '../../components/ModalSelectField';
import { formStyles } from '../../styles/formStyles';
import VehicleCard from './VehicleCard';
import { mapStyles as styles } from './mapStyles';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m`;
}

export default function LiveMapTab({ theme, userRole }) {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  const { calamityPoints, saveCalamity, deleteCalamity, resolveCalamity } = useCalamityPoints();
  const history = usePatrolHistoryPanel(calamityPoints);
  const summary = useCalamitySummaryPanel(calamityPoints);

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

  const [activeCalamityTool, setActiveCalamityTool] = useState(null);
  const [pendingPlacement, setPendingPlacement] = useState(null);
  const [calamityDescription, setCalamityDescription] = useState('');
  const [calamityModalVisible, setCalamityModalVisible] = useState(false);
  const [calamityTooltip, setCalamityTooltip] = useState(null); // { text, top, left }

  useEffect(() => {
    const handleMapMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      if (data.type === 'MAP_CLICKED' && activeCalamityTool) {
        setPendingPlacement({ lat: data.lat, lng: data.lng });
        setCalamityModalVisible(true);
      } else if (data.type === 'DELETE_CALAMITY_REQUEST') {
        deleteCalamity(data.id);
      } else if (data.type === 'RESOLVE_CALAMITY_REQUEST') {
        resolveCalamity(data.id);
      }
    };
    window.addEventListener('message', handleMapMessage);
    return () => window.removeEventListener('message', handleMapMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }
  };

  const handleIframeLoad = () => setLoading(false);

  const mapHtml = buildOperasiMapHtml({ theme, userRole });
  const mapSrc = `data:text/html;charset=utf-8,${encodeURIComponent(mapHtml)}`;

  const activeVehicles = vehicles.filter(v => v.tracking_status === 'Patrol');
  const activeVehiclesCount = activeVehicles.length;

  return (
    <>
      <View style={[styles.viewContainer, { flexDirection: 'row' }]}>
        <View style={{ flex: 1, position: 'relative' }}>
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              createElement('iframe', {
                ref: iframeRef,
                src: mapSrc,
                style: { width: '100%', height: '100%', border: 'none' },
                title: 'Leaflet Map',
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
            </View>

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
                      <View style={[styles.routeColFlex, styles.calamityHeaderCellBox]}>
                        <Text style={styles.calamityTableHeaderCell}>Route</Text>
                      </View>
                    </View>
                    {history.pagedHistory.map((h, index) => (
                      <View key={h.id}>
                        <View style={[styles.calamityTableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                          <View style={[styles.historyKenderaanColFlex, { paddingLeft: 16, paddingVertical: 10 }]}>
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
                          <Text style={[styles.calamityTableCell, styles.calamityCatColFlex]}>{formatDuration(h.duration_seconds)}</Text>
                          <Text style={[styles.calamityTableCell, styles.calamityCatColFlex]}>{h.distance_km?.toFixed(2) || '0.00'} km</Text>
                          <View style={[styles.calamityTotalColFlex, { paddingVertical: 10 }]}>
                            <Text style={styles.tableCellDate}>{new Date(h.ended_at).toLocaleDateString('ms-MY')}</Text>
                            <Text style={styles.tableCellTime}>{new Date(h.ended_at).toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' })}</Text>
                          </View>
                          <View style={[styles.routeColFlex, { paddingVertical: 10, alignItems: 'center', justifyContent: 'center' }]}>
                            <TouchableOpacity
                              onPress={() => history.toggleHistoryRow(h.id)}
                              style={[styles.routeBtn, history.expandedHistoryId === h.id && styles.routeBtnActive]}
                            >
                              <Route size={16} color={history.expandedHistoryId === h.id ? '#fff' : '#1E3A8A'} />
                            </TouchableOpacity>
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
          </View>
        )}

        {sidePanel === 'summary' && (
          <View style={styles.historyHalf}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.historyTitle}>Ringkasan Kecemasan</Text>
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
            </View>

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
    </>
  );
}