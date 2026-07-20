import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import AdminEditButton from '../components/AdminEditButton';
import { useKewanganSummary } from '../hooks/useKewanganSummary';
import { useKewanganBudget } from '../hooks/useKewanganBudget';
import { useKewanganQuarterly } from '../hooks/useKewanganQuarterly';
import { useKewanganUnit } from '../hooks/useKewanganUnit';
import { kewanganStyles as styles } from './kewangan/kewanganStyles';
import SummaryCard from './kewangan/SummaryCard';
import UnitInfoCard from './kewangan/UnitInfoCard';
import BudgetSection from './kewangan/BudgetSection';
import QuarterlySection from './kewangan/QuarterlySection';

export default function KewanganScreen({ userRole }) {
  const [isEditMode, setIsEditMode] = useState(false);

  const summary = useKewanganSummary();
  const budget = useKewanganBudget();
  const quarterly = useKewanganQuarterly(summary.totalAllocation);
  const unit = useKewanganUnit();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} />

        <SummaryCard
          orgName={summary.orgName}
          title={summary.title}
          totalAllocation={summary.totalAllocation}
          loading={summary.loading}
          isEditMode={isEditMode}
          saveSummary={summary.saveSummary}
          saving={summary.saving}
        />

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