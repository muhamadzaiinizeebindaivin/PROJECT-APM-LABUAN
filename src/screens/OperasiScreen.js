// src/screens/OperasiScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { MapIcon, BarChart2, HeartPulse, CheckCircle2, XCircle } from 'lucide-react-native';
import { useOperasiBudget } from '../hooks/useOperasiBudget';
import BudgetSection from './kewangan/BudgetSection';
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
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi } = useKpi('operasi');
  const unit = useUnitStaff('operasi');
  const { dikemaskiniRaw } = useOperasiMeta();
  const operasiBudget = useOperasiBudget();

  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);
  const showNotification = (type, message) => {
    setNotification({ type, message });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = setTimeout(() => setNotification(null), 3000);
  };
  useEffect(() => () => {
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
  }, []);

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
      {canEdit && (
        <View style={stickyHeaderStyles.stickyHeader}>
          <View style={[stickyHeaderStyles.stickyHeaderCenter, { pointerEvents: 'none' }]}>
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

      {notification && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', top: 64, left: 0, right: 0,
            alignItems: 'center', zIndex: 999, elevation: 30,
          }}
        >
          <View
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '92%',
              backgroundColor: notification.type === 'success' ? '#f0fdf4' : '#fef2f2',
              borderWidth: 1,
              borderColor: notification.type === 'success' ? '#bbf7d0' : '#fecaca',
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 10,
              elevation: 30,
            }}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={17} color="#16a34a" />
            ) : (
              <XCircle size={17} color="#dc2626" />
            )}
            <Text
              style={{
                color: notification.type === 'success' ? '#166534' : '#991b1b',
                fontWeight: '700', fontSize: 13, flexShrink: 1,
              }}
            >
              {notification.message}
            </Text>
          </View>
        </View>
      )}

      {/* ---- Barre d'onglets (visible pour tous) ---- */}
      <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'map' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('map')}
            activeOpacity={0.8}
          >
            {!isMobile && <MapIcon size={16} color={activeTab === 'map' ? PALETTE.white : PALETTE.textMutedDark} />}
            <Text style={[styles.toggleText, isMobile && styles.toggleTextMobile, activeTab === 'map' ? styles.toggleTextActive : { color: PALETTE.textMutedDark }]}>Peta Kecemasan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'report' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('report')}
            activeOpacity={0.8}
          >
            {!isMobile && <BarChart2 size={16} color={activeTab === 'report' ? PALETTE.white : PALETTE.textMutedDark} />}
            <Text style={[styles.toggleText, isMobile && styles.toggleTextMobile, activeTab === 'report' ? styles.toggleTextActive : { color: PALETTE.textMutedDark }]}>NG999 Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'cemas' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('cemas')}
            activeOpacity={0.8}
          >
            {!isMobile && <HeartPulse size={16} color={activeTab === 'cemas' ? PALETTE.white : PALETTE.textMutedDark} />}
            <Text style={[styles.toggleText, isMobile && styles.toggleTextMobile, activeTab === 'cemas' ? styles.toggleTextActive : { color: PALETTE.textMutedDark }]}>Pertolongan Cemas</Text>
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
          {activeTab === 'report' && (
            <View style={{ paddingHorizontal: 16 }}>
              <BudgetSection
                budgetData={operasiBudget.budgetData}
                loading={operasiBudget.loading}
                isEditMode={isEditMode}
                saveBudgetItem={operasiBudget.saveBudgetItem}
                deleteBudgetItem={operasiBudget.deleteBudgetItem}
                deleteCategory={operasiBudget.deleteCategory}
                renameCategory={operasiBudget.renameCategory}
                onNotify={showNotification}
              />
            </View>
          )}
          {activeTab === 'report' && <Ng999ReportTab theme={theme} userRole={userRole} isEditMode={isEditMode} onNotify={showNotification} />}
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
      {activeTab === 'map' && <LiveMapTab theme={theme} userRole={userRole} isEditMode={isEditMode} onNotify={showNotification} />}
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
    flexDirection: 'row', margin: 16, padding: 6, borderRadius: 16, gap: 8,
    backgroundColor: PALETTE.cardLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 3, zIndex: 20,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 8,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  toggleBtnActive: { backgroundColor: PALETTE.orange },
  toggleText: { fontSize: 13, fontWeight: '700' },
  toggleTextMobile: { fontSize: 10 },
  toggleTextActive: { color: PALETTE.white },
  contentContainer: { paddingBottom: 40 },
  kpiWrapper: { paddingHorizontal: 16 },
  mapKpiWrapper: { paddingHorizontal: 16, zIndex: 10 },
});