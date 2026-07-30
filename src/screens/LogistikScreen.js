import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { ClipboardList, CheckCircle2, XCircle } from 'lucide-react-native';
import { PALETTE } from '../constants/palette';
import AdminEditButton from '../components/AdminEditButton';
import { useLogistikData } from '../hooks/useLogistikData';
import { useUnitStaff } from '../hooks/useUnitStaff';
import { useKpi } from '../hooks/useKpi';
import { canEditSection } from '../permissions';
import KpiSection from './pentadbiran/KpiSection';
import { logistikStyles as styles } from './logistik/logistikStyles';
import { stickyHeaderStyles } from '../styles/stickyHeaderStyles';
import SectionHeader from './pentadbiran/SectionHeader';
import StatsRow from './logistik/StatsRow';
import UnitInfoCard from './logistik/UnitInfoCard';
import AssetSearchFilter from './logistik/AssetSearchFilter';
import AssetCard from './logistik/AssetCard';
import HorizontalCarousel from './logistik/HorizontalCarousel';
import AssetViewModal from './logistik/AssetViewModal';
import AssetFormModal from './logistik/AssetFormModal';

export default function LogistikScreen({ userRole }) {
  const canEdit = canEditSection(userRole, 'Logistik');
  const { logistikData, loading, saveAsset, deleteAsset, logistikUpdatedAt } = useLogistikData();
  const unit = useUnitStaff('logistik');
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi, kpiUpdatedAt } = useKpi('logistik');

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
  const latestRaw = [logistikUpdatedAt, unit.staffUpdatedAt, kpiUpdatedAt].filter(Boolean).sort().slice(-1)[0] || null;
  const dikemaskini = formatTimestamp(latestRaw);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [isEditMode, setIsEditMode] = useState(false);

  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

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

  const totalAssets = logistikData.length;
  const totalActive = logistikData.filter((item) => item.status === 'Baik').length;
  const readinessPercent = totalAssets > 0 ? Math.round((totalActive / totalAssets) * 100) : 0;

  const filterOptions = ['Semua', ...new Set(logistikData.map((item) => item.type).filter(Boolean))];

  // Si le filtre actif ne correspond plus à aucun type existant (ex: tous les assets
  // de ce type ont été supprimés), on revient sur "Semua" pour éviter une liste vide
  // sans explication visible.
  useEffect(() => {
    if (!loading && !filterOptions.includes(activeFilter)) {
      setActiveFilter('Semua');
    }
  }, [filterOptions.join(','), loading]);

  const matchesSearchAndFilter = (item) => {
    const matchesSearch =
      item.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.reg && item.reg.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = activeFilter === 'Semua' || (item.type || '').includes(activeFilter);
    return matchesSearch && matchesFilter;
  };

  // Ordre fixe pour Darat/Laut, puis les catégories personnalisées par ordre alphabétique
  const KNOWN_ORDER = ['Laut', 'Darat'];
  const CATEGORY_META = {
    Laut: { label: 'Logistik Laut', color: PALETTE.blue, unit: 'Bot' },
    Darat: { label: 'Logistik Darat', color: PALETTE.orange, unit: 'Kenderaan' },
  };
  const getCategoryMeta = (cat) => CATEGORY_META[cat] || { label: `Logistik ${cat}`, color: '#7c3aed', unit: 'Aset' };

  const allCategories = [...new Set(logistikData.map((item) => item.category))];
  const orderedCategories = [
    ...KNOWN_ORDER.filter((c) => allCategories.includes(c)),
    ...allCategories.filter((c) => !KNOWN_ORDER.includes(c)).sort(),
  ];

  const groupedByCategory = orderedCategories.map((category) => ({
    category,
    meta: getCategoryMeta(category),
    items: logistikData.filter((item) => item.category === category).filter(matchesSearchAndFilter),
  }));

  const openView = (asset) => { if (!isEditMode) { setSelectedAsset(asset); setViewModalVisible(true); } };
  const openAdd = () => { setEditingAsset(null); setFormModalVisible(true); };
  const openEdit = (asset) => { setEditingAsset(asset); setFormModalVisible(true); };

  const handleSaveAsset = async (payload, asset) => {
    const ok = await saveAsset(payload, asset);
    showNotification(ok ? 'success' : 'error', ok ? 'Aset berjaya disimpan.' : 'Gagal menyimpan aset.');
    return ok;
  };

  const handleDeleteAsset = async (asset) => {
    const result = await deleteAsset(asset);
    showNotification(result?.error ? 'error' : 'success', result?.error ? 'Gagal memadam aset.' : 'Aset berjaya dipadam.');
  };

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
          <AdminEditButton isEditMode={isEditMode} setIsEditMode={setIsEditMode} userRole={userRole} section="Logistik" />
        </View>
      )}

      {notification && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute', top: canEdit ? 60 : 10, left: 0, right: 0,
            alignItems: 'center', zIndex: 30,
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

      <ScrollView contentContainerStyle={styles.contentGrid} showsVerticalScrollIndicator={false}>
        <StatsRow totalAssets={totalAssets} readinessPercent={readinessPercent} />

        <View style={{ marginBottom: -16 }}>
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

        <View style={styles.card}>
          <SectionHeader title="SENARAI LOGISTIK" Icon={ClipboardList} />

          <AssetSearchFilter
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            isEditMode={isEditMode}
            onAdd={openAdd}
            filterOptions={filterOptions}
          />

          {loading ? (
            <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
          ) : (
            <>
              {groupedByCategory.map(({ category, meta, items }) => (
                items.length > 0 && (
                  <View key={category} style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.assetGroupTitle}>{meta.label}</Text>
                      <Text style={[styles.sectionSubtitle, { color: meta.color }]}>{items.length} {meta.unit}</Text>
                    </View>
                    <HorizontalCarousel
                      items={items}
                      cardWidth={210}
                      pauseAutoScroll={isEditMode}
                      interacting={viewModalVisible || formModalVisible}
                      renderItem={(item) => (
                        <AssetCard key={item.id} item={item} isEditMode={isEditMode} onView={openView} onEdit={openEdit} onDelete={handleDeleteAsset} />
                      )}
                    />
                  </View>
                )
              ))}
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
      <AssetFormModal visible={formModalVisible} onClose={() => setFormModalVisible(false)} editingAsset={editingAsset} onSave={handleSaveAsset} />
    </View>
  );
}