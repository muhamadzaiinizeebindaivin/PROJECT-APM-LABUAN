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
import { PALETTE } from '../constants/palette';

export default function OperasiScreen({ theme, userRole }) {
  const canManageOperasi = userRole === 'admin' || userRole === 'operasi';
  const [activeTab, setActiveTab] = useState('map');
  const [isEditMode, setIsEditMode] = useState(false);
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi } = useKpi('operasi');

  return (
    <View style={styles.container}>
      {/* ---- Barre d'onglets ---- */}
      {canManageOperasi && (
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
      )}

      {/* ---- KPI + AdminEdit (hors carte) ---- */}
      {activeTab !== 'map' && (
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} />
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
          {activeTab === 'report' && canManageOperasi && <Ng999ReportTab theme={theme} userRole={userRole} isEditMode={isEditMode} />}
          {activeTab === 'cemas' && canManageOperasi && <PertolonganCemasTab theme={theme} userRole={userRole} isEditMode={isEditMode} />}
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
  contentContainer: { paddingHorizontal: 16, paddingBottom: 40 },
  kpiWrapper: { marginBottom: -16 },
  mapKpiWrapper: { paddingHorizontal: 16, zIndex: 10 },
});