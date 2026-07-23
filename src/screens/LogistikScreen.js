import React, { useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { ClipboardList } from 'lucide-react-native';
import { PALETTE } from '../constants/palette';
import AdminEditButton from '../components/AdminEditButton';
import { useLogistikData } from '../hooks/useLogistikData';
import { useLogistikMeta } from '../hooks/useLogistikMeta';
import { useUnitStaff } from '../hooks/useUnitStaff';
import { useKpi } from '../hooks/useKpi';
import KpiSection from './pentadbiran/KpiSection';
import { logistikStyles as styles } from './logistik/logistikStyles';
import SectionHeader from './pentadbiran/SectionHeader';
import StatsRow from './logistik/StatsRow';
import UnitInfoCard from './logistik/UnitInfoCard';
import AssetSearchFilter from './logistik/AssetSearchFilter';
import AssetCard from './logistik/AssetCard';
import HorizontalCarousel from './logistik/HorizontalCarousel';
import AssetViewModal from './logistik/AssetViewModal';
import AssetFormModal from './logistik/AssetFormModal';

export default function LogistikScreen({ userRole }) {
  const meta = useLogistikMeta();
  const { logistikData, loading, saveAsset, deleteAsset } = useLogistikData(meta.touchDikemaskini);
  const unit = useUnitStaff('logistik', meta.touchDikemaskini);
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi } = useKpi('logistik');

  // Enchaîne l'action KPI puis met à jour DIKEMASKINI dans l'en-tête
  const touchAfter = (fn) => async (...args) => {
    const result = await fn(...args);
    meta.touchDikemaskini();
    return result;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [isEditMode, setIsEditMode] = useState(false);

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  const seaLogistics = logistikData.filter((item) => item.category === 'Laut');
  const landLogistics = logistikData.filter((item) => item.category === 'Darat');

  const totalSea = seaLogistics.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  const totalLand = landLogistics.length;
  const totalAssets = totalSea + totalLand;

  const activeSea = seaLogistics.reduce((sum, item) => (item.status === 'Baik' ? sum + (Number(item.qty) || 1) : sum), 0);
  const activeLand = landLogistics.filter((item) => item.status === 'Baik').length;
  const totalActive = activeSea + activeLand;
  const readinessPercent = totalAssets > 0 ? Math.round((totalActive / totalAssets) * 100) : 0;

  const filteredSea = seaLogistics.filter((item) => {
    const matchesSearch = item.model.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'Semua' || activeFilter === 'Bot';
    return matchesSearch && matchesFilter;
  });

  const filteredLand = landLogistics.filter((item) => {
    const matchesSearch =
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reg && item.reg.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === 'Semua' || item.type.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  const openView = (asset) => { if (!isEditMode) { setSelectedAsset(asset); setViewModalVisible(true); } };
  const openAdd = () => { setEditingAsset(null); setFormModalVisible(true); };
  const openEdit = (asset) => { setEditingAsset(asset); setFormModalVisible(true); };

  return (
    <View style={styles.container}>
      {userRole === 'admin' && (
        <View style={styles.stickyHeader}>
          <View style={styles.stickyHeaderCenter} pointerEvents="none">
            {meta.dikemaskini ? (
              <Text style={styles.stickyHeaderDikemaskini}>DIKEMASKINI {meta.dikemaskini}</Text>
            ) : null}
          </View>
          <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.contentGrid} showsVerticalScrollIndicator={false}>
        <StatsRow totalAssets={totalAssets} readinessPercent={readinessPercent} />

        <View style={{ marginBottom: -16 }}>
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

        <View style={styles.card}>
          <SectionHeader title="SENARAI LOGISTIK" Icon={ClipboardList} />

          <AssetSearchFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            isEditMode={isEditMode}
            onAdd={openAdd}
          />

          {loading ? (
            <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
          ) : (
            <>
              {filteredSea.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.assetGroupTitle}>Logistik Laut</Text>
                    <Text style={[styles.sectionSubtitle, { color: PALETTE.blue }]}>{totalSea} Aset</Text>
                  </View>
                  <HorizontalCarousel
                    items={filteredSea}
                    cardWidth={210}
                    pauseAutoScroll={isEditMode}
                    interacting={viewModalVisible || formModalVisible}
                    renderItem={(item) => (
                      <AssetCard key={item.id} item={item} isSea isEditMode={isEditMode} onView={openView} onEdit={openEdit} onDelete={deleteAsset} />
                    )}
                  />
                </View>
              )}

              {filteredLand.length > 0 && (
                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.assetGroupTitle}>Logistik Darat</Text>
                    <Text style={[styles.sectionSubtitle, { color: PALETTE.orange }]}>{filteredLand.length} Kenderaan</Text>
                  </View>
                  <HorizontalCarousel
                    items={filteredLand}
                    cardWidth={210}
                    pauseAutoScroll={isEditMode}
                    interacting={viewModalVisible || formModalVisible}
                    renderItem={(item) => (
                      <AssetCard key={item.id} item={item} isSea={false} isEditMode={isEditMode} onView={openView} onEdit={openEdit} onDelete={deleteAsset} />
                    )}
                  />
                </View>
              )}
            </>
          )}
        </View>

        <UnitInfoCard
          staffList={unit.staffList}
          loading={unit.loading}
          isEditMode={isEditMode}
          saveStaffItem={unit.saveStaffItem}
          deleteStaffItem={unit.deleteStaffItem}
          reorderStaff={unit.reorderStaff}
        />
      </ScrollView>

      <AssetViewModal visible={viewModalVisible} onClose={() => setViewModalVisible(false)} asset={selectedAsset} />
      <AssetFormModal visible={formModalVisible} onClose={() => setFormModalVisible(false)} editingAsset={editingAsset} onSave={saveAsset} />
    </View>
  );
}