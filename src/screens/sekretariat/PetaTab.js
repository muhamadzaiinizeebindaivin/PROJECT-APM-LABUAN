// src/screens/sekretariat/PetaTab.js
//
// Orchestrateur de l'onglet "Peta Bencana" (Sekretariat) : données temps réel,
// carte Leaflet (iframe), panneaux latéraux et enchaînement des formulaires.
// Le rendu détaillé vit dans ./peta/ (une responsabilité par fichier).
import React, { useState, useRef, useMemo, createElement } from 'react';
import { View, Text, ScrollView, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Map, MapPin, Droplets } from 'lucide-react-native';
import { Asset } from 'expo-asset';
import pemantauanIconAsset from '../../../assets/pemantauan-icon.png';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { buildSekretariatMapHtml } from './sekretariatMapTemplate';
import { useOnlineAgencies } from '../../hooks/useOnlineAgencies';
import { useOnlinePemantauan } from '../../hooks/useOnlinePemantauan';
import { useBencanaPoints } from '../../hooks/useBencanaPoints';
import { useHotspotKejadian } from '../../hooks/useHotspotKejadian';
import { useHotspots } from '../../hooks/useHotspots';
import { useHotspotCategories } from '../../hooks/useHotspotCategories';
import { useAgencyTrackingHistory } from '../../hooks/useAgencyTrackingHistory';
import { usePemantauanPoints } from '../../hooks/usePemantauanPoints';
import PilihLokasiModal from '../../components/PilihLokasiModal';
import { generateAgencyHistoryPdf, generateKejadianPdf, generatePemantauanPdf } from '../../utils/agencyReportsPdf';
import { petaStyles as styles } from './petaStyles';
import { PALETTE } from '../../constants/palette';

import { useAgencyDirectory } from './peta/useAgencyDirectory';
import { usePetaMapBridge } from './peta/usePetaMapBridge';
import { usePanelFilter } from './peta/usePanelFilter';
import { PanelShell } from './peta/PanelControls';
import HistoryPanelContent from './peta/HistoryPanelContent';
import BencanaSummaryContent from './peta/BencanaSummaryContent';
import PemantauanSummaryContent from './peta/PemantauanSummaryContent';
import MapToolbar from './peta/MapToolbar';
import { MapHeaderCard, OnlineAgencyList, AgencyLegend, PlacementHint } from './peta/MapOverlays';
import BencanaChoiceModal from './peta/BencanaChoiceModal';
import ExistingHotspotModal from './peta/ExistingHotspotModal';
import NewBencanaModal from './peta/NewBencanaModal';
import PemantauanPointModal from './peta/PemantauanPointModal';
import DeleteTargetModal from './peta/DeleteTargetModal';
import BencanaCompleteModal from './peta/BencanaCompleteModal';
import BencanaEditModal from './peta/BencanaEditModal';

const PEMANTAUAN_ICON_URL = Asset.fromModule(pemantauanIconAsset).uri;

const DELETE_MESSAGES = {
  bencana: ['Rekod bencana berjaya dipadam.', 'Gagal memadam rekod bencana.'],
  history: ['Rekod patrol agensi berjaya dipadam.', 'Gagal memadam rekod patrol agensi.'],
  agency: ['Agensi berjaya diputuskan daripada peta.', 'Gagal memutuskan agensi.'],
  pemantauan: ['Titik pemantauan berjaya dipadam.', 'Gagal memadam titik pemantauan.'],
};

export default function PetaTab({ theme, userRole, isEditMode, onNotify }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const canManage = userRole === 'sekretariat' || userRole === 'admin';
  const canDelete = isEditMode && canManage;
  const petaIframeRef = useRef(null);

  // ---- Données ----
  const { onlineAgencies } = useOnlineAgencies();
  const { onlinePemantauan } = useOnlinePemantauan();
  const { bencanaPoints, saveBencana, completeBencana, updateBencana, deleteBencana } = useBencanaPoints();
  const { kejadianList } = useHotspotKejadian();
  const { hotspotList } = useHotspots(onNotify);
  const { categories: hotspotCategories, addCategory: addHotspotCategory } = useHotspotCategories(onNotify);
  const { pemantauanPoints, savePemantauanPoint, updatePemantauanPoint, completePemantauanPoint, deletePemantauanPoint } = usePemantauanPoints();
  const { trackingHistory, loadingHistory, deleteTrackingHistory } = useAgencyTrackingHistory();
  const { agencyNames, getAgencyColor, getAgencyLogo } = useAgencyDirectory();

  // ---- Flux "Tambah Titik Bencana" ----
  // null (fermé) → 'choice' → soit 'existingList' (hotspot existant),
  // soit choix d'un emplacement (PilihLokasiModal ou clic carte) puis formulaire "point libre".
  const [bencanaFlowStep, setBencanaFlowStep] = useState(null); // null | 'choice' | 'existingList'
  const [pilihLokasiBencanaOpen, setPilihLokasiBencanaOpen] = useState(false);
  const [isPlacingBencana, setIsPlacingBencana] = useState(false);
  const [pendingBencanaPlacement, setPendingBencanaPlacement] = useState(null);
  const [bencanaModalVisible, setBencanaModalVisible] = useState(false);

  const resetBencanaFlow = () => {
    setBencanaModalVisible(false);
    setBencanaFlowStep(null);
    setIsPlacingBencana(false);
    setPendingBencanaPlacement(null);
  };

  // ---- Titik pemantauan ----
  const [isPlacingPemantauanPoint, setIsPlacingPemantauanPoint] = useState(false);
  const [pendingPemantauanPlacement, setPendingPemantauanPlacement] = useState(null);
  const [pemantauanPointModalVisible, setPemantauanPointModalVisible] = useState(false);
  const [pemantauanFormMode, setPemantauanFormMode] = useState('create'); // 'create' | 'edit' | 'complete'
  const [editingPemantauanPoint, setEditingPemantauanPoint] = useState(null);

  const openPemantauanPoint = (id, mode) => {
    const point = pemantauanPoints.find((p) => p.id === id);
    if (!point) return;
    setPemantauanFormMode(mode);
    setEditingPemantauanPoint(point);
    setPemantauanPointModalVisible(true);
  };

  const closePemantauanPoint = () => {
    setPemantauanPointModalVisible(false);
    setIsPlacingPemantauanPoint(false);
    setPendingPemantauanPlacement(null);
    // Mode réinitialisé après l'animation de fermeture (fade) du Modal, sinon
    // le titre change visiblement juste avant que le modal ne disparaisse.
    setTimeout(() => {
      setPemantauanFormMode('create');
      setEditingPemantauanPoint(null);
    }, 300);
  };

  // ---- Titik bencana : clôture / modification / suppression ----
  const [completingBencana, setCompletingBencana] = useState(null);
  const [editingBencana, setEditingBencana] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'bencana' | 'history' | 'agency' | 'pemantauan', id, label }
  const [deletingTarget, setDeletingTarget] = useState(false);

  const findBencana = (id) => bencanaPoints.find((b) => b.id === id);

  const handleCompleteSave = async (item, form) => {
    const { error } = await completeBencana(item.id, form);
    if (!error) {
      onNotify?.('success', 'Titik bencana berjaya dikemaskini.');
      setCompletingBencana(null);
    } else {
      onNotify?.('error', 'Gagal mengemaskini titik bencana.');
    }
  };

  const handleEditSave = async (item, form) => {
    const { error } = await updateBencana(item.id, form);
    if (!error) {
      onNotify?.('success', 'Titik bencana berjaya dikemaskini.');
      setEditingBencana(null);
    } else {
      onNotify?.('error', 'Gagal mengemaskini titik bencana.');
    }
  };

  const confirmDeleteTarget = async () => {
    if (!deleteTarget) return;
    setDeletingTarget(true);

    let result;
    if (deleteTarget.type === 'bencana') {
      result = await deleteBencana(deleteTarget.id, { skipConfirm: true });
    } else if (deleteTarget.type === 'history') {
      result = await deleteTrackingHistory(deleteTarget.id, { skipConfirm: true });
    } else if (deleteTarget.type === 'pemantauan') {
      result = await deletePemantauanPoint(deleteTarget.id, { skipConfirm: true });
    } else {
      const { error } = await supabaseSandbox.from('agency_trackers').delete().eq('id', deleteTarget.id);
      result = { error };
    }

    setDeletingTarget(false);
    const [successMsg, errorMsg] = DELETE_MESSAGES[deleteTarget.type];
    setDeleteTarget(null);
    onNotify?.(!result?.error ? 'success' : 'error', !result?.error ? successMsg : errorMsg);
  };

  // ---- Carte (iframe) ----
  const [petaIframeLoading, setPetaIframeLoading] = useState(true);
  const petaMapHtml = useMemo(
    () => buildSekretariatMapHtml({ theme, userRole, pemantauanIconUrl: PEMANTAUAN_ICON_URL }),
    [theme, userRole]
  );

  // Messages envoyés par la carte (clic, boutons des popups de marqueurs)
  const handleMapMessage = (data) => {
    if (data.type === 'MAP_CLICKED' && isPlacingBencana) {
      setPendingBencanaPlacement({ lat: data.lat, lng: data.lng });
      setBencanaModalVisible(true);
      setIsPlacingBencana(false);
    } else if (data.type === 'MAP_CLICKED' && isPlacingPemantauanPoint) {
      setPendingPemantauanPlacement({ lat: data.lat, lng: data.lng });
      setPemantauanPointModalVisible(true);
      setIsPlacingPemantauanPoint(false);
    } else if (data.type === 'DELETE_BENCANA_REQUEST') {
      setDeleteTarget({ type: 'bencana', id: data.id, label: findBencana(data.id)?.category || 'Titik Bencana' });
    } else if (data.type === 'RESOLVE_BENCANA_REQUEST') {
      const item = findBencana(data.id);
      if (item) setCompletingBencana(item);
    } else if (data.type === 'EDIT_BENCANA_REQUEST') {
      const item = findBencana(data.id);
      if (item) setEditingBencana(item);
    } else if (data.type === 'DELETE_PEMANTAUAN_POINT_REQUEST') {
      setDeleteTarget({ type: 'pemantauan', id: data.id, label: 'Titik Pemantauan' });
    } else if (data.type === 'EDIT_PEMANTAUAN_POINT_REQUEST') {
      openPemantauanPoint(data.id, 'edit');
    } else if (data.type === 'RESOLVE_PEMANTAUAN_POINT_REQUEST') {
      openPemantauanPoint(data.id, 'complete');
    } else if (data.type === 'DELETE_AGENCY_TRACKER_REQUEST') {
      const agency = onlineAgencies.find((a) => a.id === data.id);
      const label = [agency?.jpbd_directory?.agency, agency?.member_name].map((s) => s?.trim()).find((s) => s) || '-';
      setDeleteTarget({ type: 'agency', id: data.id, label });
    }
  };

  const { postToMap } = usePetaMapBridge({
    iframeRef: petaIframeRef,
    onMapMessage: handleMapMessage,
    onlineAgencies, onlinePemantauan, getAgencyColor, getAgencyLogo, agencyNames,
    bencanaPoints, hotspotCategories, pemantauanPoints,
  });

  // ---- Panneaux latéraux ----
  const [sidePanel, setSidePanel] = useState('none'); // 'none' | 'history' | 'summary' | 'pemantauanSummary'

  const historyFilter = usePanelFilter({
    items: trackingHistory,
    getDate: (h) => h.ended_at,
    matchesQuery: (h, q) => (h.jpbd_directory?.agency || '').toLowerCase().includes(q) || (h.member_name || '').toLowerCase().includes(q),
  });
  const summaryFilter = usePanelFilter({
    items: bencanaPoints,
    getDate: (b) => b.created_at,
    matchesQuery: (b, q) => (b.category || '').toLowerCase().includes(q),
    sortByDateDesc: true,
  });
  const pemantauanFilter = usePanelFilter({
    items: pemantauanPoints,
    getDate: (p) => p.created_at,
    matchesQuery: (p, q) => (p.lokasi || '').toLowerCase().includes(q),
    sortByDateDesc: true,
  });

  // Le PDF "Ringkasan Bencana" exporte les rekod kejadian de la même période
  const kejadianForSummaryPdf = useMemo(() => (kejadianList || []).filter((k) => {
    if (!k.tarikh) return false;
    const d = new Date(k.tarikh);
    if (d.getFullYear() !== summaryFilter.year) return false;
    if (summaryFilter.month !== null && d.getMonth() !== summaryFilter.month) return false;
    return true;
  }), [kejadianList, summaryFilter.year, summaryFilter.month]);

  // ---- Mise en page : carte + panneau ; sur mobile, un panneau ouvert prend tout l'écran ----
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
          {Platform.OS === 'web' ? (
            createElement('iframe', {
              ref: petaIframeRef,
              srcDoc: petaMapHtml,
              style: { width: '100%', height: '100%', border: 'none' },
              title: 'Peta Agensi',
              onLoad: () => setPetaIframeLoading(false),
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

        <MapHeaderCard isMobile={isMobile} onlineCount={onlineAgencies.length} />

        <OnlineAgencyList
          onlineAgencies={onlineAgencies}
          getAgencyLogo={getAgencyLogo}
          getAgencyColor={getAgencyColor}
          onFocus={(a) => postToMap({ type: 'FOCUS_AGENCY', id: a.id, lat: a.latitude, lng: a.longitude })}
          onDelete={(id, label) => setDeleteTarget({ type: 'agency', id, label })}
        />

        <AgencyLegend isMobile={isMobile} agencyNames={agencyNames} getAgencyLogo={getAgencyLogo} getAgencyColor={getAgencyColor} />

        <MapToolbar
          canAdd={canManage}
          isPlacingBencana={isPlacingBencana}
          onAddPress={() => {
            if (isPlacingBencana) { setIsPlacingBencana(false); return; }
            setBencanaFlowStep('choice');
          }}
          sidePanel={sidePanel}
          onTogglePanel={setSidePanel}
        />

        {isPlacingBencana && <PlacementHint Icon={MapPin} iconColor={PALETTE.orange} />}
        {isPlacingPemantauanPoint && <PlacementHint Icon={Droplets} iconColor={PALETTE.blue} />}
      </View>
      )}

      {sidePanel === 'history' && (
        <PanelShell
          title="Sejarah Patrol Agensi"
          onClose={() => setSidePanel('none')}
          onExportPdf={() => generateAgencyHistoryPdf({ rows: historyFilter.filtered, periodLabel: historyFilter.periodLabel })}
          renderContent={(large) => (
            <HistoryPanelContent
              large={large}
              theme={theme}
              isMobile={isMobile}
              filter={historyFilter}
              loading={loadingHistory}
              canDelete={canDelete}
              onDelete={(id, label) => setDeleteTarget({ type: 'history', id, label })}
              getAgencyLogo={getAgencyLogo}
              getAgencyColor={getAgencyColor}
            />
          )}
        />
      )}

      {sidePanel === 'summary' && (
        <PanelShell
          title="Ringkasan Bencana"
          onClose={() => setSidePanel('none')}
          onExportPdf={() => generateKejadianPdf({ rows: kejadianForSummaryPdf, categoryLabel: 'Semua Kategori', periodLabel: summaryFilter.periodLabel })}
          renderContent={(large) => (
            <BencanaSummaryContent
              large={large}
              theme={theme}
              isMobile={isMobile}
              filter={summaryFilter}
              canDelete={canDelete}
              onDelete={(id, label) => setDeleteTarget({ type: 'bencana', id, label })}
            />
          )}
        />
      )}

      {sidePanel === 'pemantauanSummary' && (
        <PanelShell
          title="Ringkasan Pemantauan"
          onClose={() => setSidePanel('none')}
          onExportPdf={() => generatePemantauanPdf({ rows: pemantauanFilter.filtered, periodLabel: pemantauanFilter.periodLabel })}
          renderContent={(large) => (
            <PemantauanSummaryContent
              large={large}
              theme={theme}
              isMobile={isMobile}
              filter={pemantauanFilter}
              canDelete={canDelete}
              onDelete={(id, label) => setDeleteTarget({ type: 'pemantauan', id, label })}
            />
          )}
        />
      )}

      <BencanaChoiceModal
        visible={bencanaFlowStep === 'choice'}
        onClose={resetBencanaFlow}
        onPickExisting={() => setBencanaFlowStep('existingList')}
        onPickNew={() => { setBencanaFlowStep(null); setPilihLokasiBencanaOpen(true); }}
        onPickPemantauan={() => { setBencanaFlowStep(null); setIsPlacingPemantauanPoint(true); }}
      />

      {/* "Hotspot Baharu" : choix de l'emplacement, puis le formulaire point libre s'ouvre */}
      <PilihLokasiModal
        visible={pilihLokasiBencanaOpen}
        tajuk="Pilih Lokasi Bencana"
        onClose={() => setPilihLokasiBencanaOpen(false)}
        onSimpan={(lat, lng) => {
          setPilihLokasiBencanaOpen(false);
          setPendingBencanaPlacement({ lat, lng });
          setBencanaModalVisible(true);
        }}
        onKlikPetaUtama={() => {
          setPilihLokasiBencanaOpen(false);
          setIsPlacingBencana(true);
        }}
      />

      <ExistingHotspotModal
        visible={bencanaFlowStep === 'existingList'}
        hotspotList={hotspotList}
        hotspotCategories={hotspotCategories}
        saveBencana={saveBencana}
        onNotify={onNotify}
        onBack={() => setBencanaFlowStep('choice')}
        onClose={resetBencanaFlow}
      />

      <NewBencanaModal
        visible={bencanaModalVisible}
        theme={theme}
        placement={pendingBencanaPlacement}
        hotspotCategories={hotspotCategories}
        addHotspotCategory={addHotspotCategory}
        saveBencana={saveBencana}
        onClose={resetBencanaFlow}
      />

      <PemantauanPointModal
        visible={pemantauanPointModalVisible}
        mode={pemantauanFormMode}
        point={editingPemantauanPoint}
        placement={pendingPemantauanPlacement}
        savePemantauanPoint={savePemantauanPoint}
        updatePemantauanPoint={updatePemantauanPoint}
        completePemantauanPoint={completePemantauanPoint}
        onClose={closePemantauanPoint}
      />

      <DeleteTargetModal
        target={deleteTarget}
        deleting={deletingTarget}
        onConfirm={confirmDeleteTarget}
        onCancel={() => setDeleteTarget(null)}
      />

      <BencanaCompleteModal item={completingBencana} onSave={handleCompleteSave} onClose={() => setCompletingBencana(null)} />

      <BencanaEditModal item={editingBencana} onSave={handleEditSave} onClose={() => setEditingBencana(null)} />
    </PetaContainerWrapper>
  );
}
