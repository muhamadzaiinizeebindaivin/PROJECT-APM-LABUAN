// src/screens/OperasiScreen.js
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { MapIcon, BarChart2, HeartPulse } from 'lucide-react-native';
import LiveMapTab from './operasi/LiveMapTab';
import Ng999ReportTab from './operasi/Ng999ReportTab';
import PertolonganCemasTab from './operasi/PertolonganCemasTab';
import AdminEditButton from '../components/AdminEditButton';
import { useKpi } from '../hooks/useKpi';
import KpiSection from './pentadbiran/KpiSection';
import { useUnitStaff } from '../hooks/useUnitStaff';
import { useOperasiMeta } from '../hooks/useOperasiMeta';
import AngkatanUnitSection from './angkatan/AngkatanUnitSection';
import { PALETTE } from '../constants/palette';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';
import { canEditSection } from '../permissions';

export default function OperasiScreen({ theme, userRole }) {
  const canEdit = canEditSection(userRole, 'Operasi');
  const [activeTab, setActiveTab] = useState('map');
  const [isEditMode, setIsEditMode] = useState(false);
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi } = useKpi('operasi');
  const unit = useUnitStaff('operasi');
  const { dikemaskiniRaw } = useOperasiMeta();

  // Convertit un timestamp ISO (colonne updated_at) au format d'affichage DD/M/YYYY HH:MM
  const formatTimestamp = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${date} ${hours}:${minutes}`;
  };
  const dikemaskini = formatTimestamp(dikemaskiniRaw);

  return (
    <View style={styles.container}>
      {canEdit && activeTab !== 'map' && (
        <View style={stickyHeaderStyles.stickyHeader}>
          <View style={stickyHeaderStyles.stickyHeaderCenter} pointerEvents="none">
            {dikemaskini ? (
              <View style={stickyHeaderStyles.stickyHeaderDikemaskiniBadge}>
                <View style={stickyHeaderStyles.stickyHeaderDikemaskiniDot} />
                <Text style={stickyHeaderStyles.stickyHeaderDikemaskini}>DIKEMASKINI {dikemaskini}</Text>
              </View>
            ) : null}
          </View>
          <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} section="Operasi" />
        </View>
      )}

      {/* ---- Barre d'onglets (visible pour tous) ---- */}
      <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'map' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('map')}
            activeOpacity={0.8}
          >
            <MapIcon size={16} color={activeTab === 'map' ? PALETTE.white : PALETTE.textMutedDark} />
            <Text style={[styles.toggleText, activeTab === 'map' ? styles.toggleTextActive : { color: PALETTE.textMutedDark }]}>Peta Kecemasan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'report' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('report')}
            activeOpacity={0.8}
          >
            <BarChart2 size={16} color={activeTab === 'report' ? PALETTE.white : PALETTE.textMutedDark} />
            <Text style={[styles.toggleText, activeTab === 'report' ? styles.toggleTextActive : { color: PALETTE.textMutedDark }]}>NG999 Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'cemas' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('cemas')}
            activeOpacity={0.8}
          >
            <HeartPulse size={16} color={activeTab === 'cemas' ? PALETTE.white : PALETTE.textMutedDark} />
            <Text style={[styles.toggleText, activeTab === 'cemas' ? styles.toggleTextActive : { color: PALETTE.textMutedDark }]}>Pertolongan Cemas</Text>
          </TouchableOpacity>
        </View>
      
      {/* ---- KPI (hors carte) ---- */}
      {activeTab !== 'map' && (
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {activeTab === 'report' && (
            <View style={styles.kpiWrapper}>
              <KpiSection
                kpiItems={kpiList}
                isEditing={isEditMode}
                updateKpiItem={(form, item) => saveKpiItem(form, item)}
                addKpiItem={(form) => saveKpiItem(form, null)}
                removeKpiItem={(item) => deleteKpiItem(item)}
                persistKpi={reorderKpi}
                showSubSeksyen={false}
              />
            </View>
          )}
          {activeTab === 'report' && <Ng999ReportTab theme={theme} userRole={userRole} isEditMode={isEditMode} />}
          {activeTab === 'cemas' && <PertolonganCemasTab theme={theme} userRole={userRole} isEditMode={isEditMode} />}

          <View style={{ paddingHorizontal: 16 }}>
            <AngkatanUnitSection
              unitList={unit.staffList}
              loadingUnit={unit.loading}
              isEditMode={isEditMode}
              saveUnitItem={unit.saveStaffItem}
              deleteUnitItem={unit.deleteStaffItem}
              reorderUnit={unit.reorderStaff}
            />
          </View>
        </ScrollView>
      )}

      {/* ---- Carte (plein écran, sans padding) ---- */}
      {activeTab === 'map' && <LiveMapTab theme={theme} userRole={userRole} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: PALETTE.softOrangeBg,
    position: 'relative', width: '100%', overflow: 'hidden', borderRadius: 24,
    paddingBottom: 16,
  },
  toggleWrapper: {
    flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16,
    backgroundColor: PALETTE.cardLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, zIndex: 20,
  },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8 },
  toggleBtnActive: { backgroundColor: PALETTE.orange },
  toggleText: { fontSize: 13, fontWeight: '700' },
  toggleTextActive: { color: PALETTE.white },
  contentContainer: { paddingBottom: 40 },
  kpiWrapper: { marginBottom: -16, paddingHorizontal: 16 },
  mapKpiWrapper: { paddingHorizontal: 16, zIndex: 10 },
});