import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import AdminEditButton from '../components/AdminEditButton';
import { useKewanganSummary } from '../hooks/useKewanganSummary';
import { useKewanganBudget } from '../hooks/useKewanganBudget';
import { useKewanganQuarterly } from '../hooks/useKewanganQuarterly';
import { useUnitStaff } from '../hooks/useUnitStaff';
import { useKpi } from '../hooks/useKpi';
import { canEditSection } from '../permissions';
import KpiSection from './pentadbiran/KpiSection';
import { kewanganStyles as styles } from './kewangan/kewanganStyles';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';
import SummaryCard from './kewangan/SummaryCard';
import UnitInfoCard from './kewangan/UnitInfoCard';
import BudgetSection from './kewangan/BudgetSection';
import QuarterlySection from './kewangan/QuarterlySection';

export default function KewanganScreen({ userRole }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const canEdit = canEditSection(userRole, 'Kewangan');

  const summary = useKewanganSummary();
  const budget = useKewanganBudget();
  const quarterly = useKewanganQuarterly(summary.totalAllocation);
  const unit = useUnitStaff('kewangan');
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt } = useKpi('kewangan');

  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message }
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

  // DIKEMASKINI = le plus récent updated_at parmi toutes les tables qui composent la page
  const latestRaw = [summary.updatedAt, budget.budgetUpdatedAt, quarterly.quarterlyUpdatedAt, unit.staffUpdatedAt, kpiUpdatedAt]
    .filter(Boolean)
    .sort()
    .slice(-1)[0] || null;
  const dikemaskini = formatTimestamp(latestRaw);

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
          <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} section="Kewangan" />

          {notification && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                alignItems: 'center', paddingTop: 10, zIndex: 30,
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
                  elevation: 5,
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
        </View>
      )}

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <SummaryCard
          orgName={summary.orgName}
          title={summary.title}
          totalAllocation={summary.totalAllocation}
          loading={summary.loading}
          isEditMode={isEditMode}
          saveSummary={summary.saveSummary}
          saving={summary.saving}
          onNotify={showNotification}
        />

        <View style={{ marginBottom: 4 }}>
          <KpiSection
            kpiItems={kpiList}
            isEditing={isEditMode}
            updateKpiItem={(form, item) => saveKpiItem(form, item)}
            addKpiItem={(form) => saveKpiItem(form, null)}
            removeKpiItem={(item) => deleteKpiItem(item)}
            persistKpi={reorderKpi}
            showSubSeksyen={false}
            onNotify={showNotification}
          />
        </View>

        <BudgetSection
          budgetData={budget.budgetData}
          loading={budget.loading}
          isEditMode={isEditMode}
          saveBudgetItem={budget.saveBudgetItem}
          deleteBudgetItem={budget.deleteBudgetItem}
          deleteCategory={budget.deleteCategory}
          onNotify={showNotification}
        />

        <QuarterlySection
          processedData={quarterly.processedData}
          loading={quarterly.loading}
          isEditMode={isEditMode}
          saveQuarterlyItem={quarterly.saveQuarterlyItem}
          deleteQuarterlyItem={quarterly.deleteQuarterlyItem}
          onNotify={showNotification}
        />

        <UnitInfoCard
          staffList={unit.staffList}
          loading={unit.loading}
          isEditMode={isEditMode}
          saveStaffItem={unit.saveStaffItem}
          deleteStaffItem={unit.deleteStaffItem}
          reorderStaff={unit.reorderStaff}
          onNotify={showNotification}
        />
      </ScrollView>
    </View>
  );
}