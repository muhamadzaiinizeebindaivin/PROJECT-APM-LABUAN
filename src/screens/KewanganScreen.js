import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import AdminEditButton from '../components/AdminEditButton';
import { useKewanganSummary } from '../hooks/useKewanganSummary';
import { useKewanganBudget } from '../hooks/useKewanganBudget';
import { useKewanganQuarterly } from '../hooks/useKewanganQuarterly';
import { useUnitStaff } from '../hooks/useUnitStaff';
import { useKpi } from '../hooks/useKpi';
import KpiSection from './pentadbiran/KpiSection';
import { kewanganStyles as styles } from './kewangan/kewanganStyles';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';
import SummaryCard from './kewangan/SummaryCard';
import UnitInfoCard from './kewangan/UnitInfoCard';
import BudgetSection from './kewangan/BudgetSection';
import QuarterlySection from './kewangan/QuarterlySection';

export default function KewanganScreen({ userRole }) {
  const [isEditMode, setIsEditMode] = useState(false);

  const summary = useKewanganSummary();
  const budget = useKewanganBudget();
  const quarterly = useKewanganQuarterly(summary.totalAllocation);
  const unit = useUnitStaff('kewangan');
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt } = useKpi('kewangan');

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
      {userRole === 'admin' && (
        <View style={stickyHeaderStyles.stickyHeader}>
          <View style={stickyHeaderStyles.stickyHeaderCenter} pointerEvents="none">
            {dikemaskini ? (
              <Text style={stickyHeaderStyles.stickyHeaderDikemaskini}>DIKEMASKINI {dikemaskini}</Text>
            ) : null}
          </View>
          <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} />
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
          />
        </View>

        <BudgetSection
          budgetData={budget.budgetData}
          loading={budget.loading}
          isEditMode={isEditMode}
          saveBudgetItem={budget.saveBudgetItem}
          deleteBudgetItem={budget.deleteBudgetItem}
          deleteCategory={budget.deleteCategory}
        />

        <QuarterlySection
          processedData={quarterly.processedData}
          loading={quarterly.loading}
          isEditMode={isEditMode}
          saveQuarterlyItem={quarterly.saveQuarterlyItem}
          deleteQuarterlyItem={quarterly.deleteQuarterlyItem}
        />

        <UnitInfoCard
          staffList={unit.staffList}
          loading={unit.loading}
          isEditMode={isEditMode}
          saveStaffItem={unit.saveStaffItem}
          deleteStaffItem={unit.deleteStaffItem}
          reorderStaff={unit.reorderStaff}
        />
      </ScrollView>
    </View>
  );
}