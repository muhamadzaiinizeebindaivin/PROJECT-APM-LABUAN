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
import SummaryCard from './kewangan/SummaryCard';
import UnitInfoCard from './kewangan/UnitInfoCard';
import BudgetSection from './kewangan/BudgetSection';
import QuarterlySection from './kewangan/QuarterlySection';

export default function KewanganScreen({ userRole }) {
  const [isEditMode, setIsEditMode] = useState(false);

  const summary = useKewanganSummary();
  const budget = useKewanganBudget(summary.touchDikemaskini);
  const quarterly = useKewanganQuarterly(summary.totalAllocation, summary.touchDikemaskini);
  const unit = useUnitStaff('kewangan', summary.touchDikemaskini);
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi } = useKpi('kewangan');

  // Enchaîne l'action KPI puis met à jour DIKEMASKINI dans l'en-tête
  const touchAfter = (fn) => async (...args) => {
    const result = await fn(...args);
    summary.touchDikemaskini();
    return result;
  };

  return (
    <View style={styles.container}>
      {userRole === 'admin' && (
        <View style={styles.stickyHeader}>
          <View style={styles.stickyHeaderCenter} pointerEvents="none">
            {summary.dikemaskini ? (
              <Text style={styles.stickyHeaderDikemaskini}>DIKEMASKINI {summary.dikemaskini}</Text>
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
            updateKpiItem={touchAfter((form, item) => saveKpiItem(form, item))}
            addKpiItem={touchAfter((form) => saveKpiItem(form, null))}
            removeKpiItem={touchAfter((item) => deleteKpiItem(item))}
            persistKpi={touchAfter(reorderKpi)}
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