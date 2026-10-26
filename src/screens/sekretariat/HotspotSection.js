// src/screens/sekretariat/HotspotSection.js
//
// Orchestrateur de l'onglet Hotspot (Sekretariat) : données, catégorie
// sélectionnée, sous-onglets et filtres. Tout le rendu détaillé vit dans
// ./hotspot/ (une responsabilité par fichier).
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { MapPin, Plus, ClipboardList, BarChart2 } from 'lucide-react-native';
import { generateKejadianPdf } from '../../utils/agencyReportsPdf';
import { useHotspots } from '../../hooks/useHotspots';
import { useHotspotCategories } from '../../hooks/useHotspotCategories';
import { useHotspotKejadian } from '../../hooks/useHotspotKejadian';
import { useKejadianPhoto } from '../../hooks/useKejadianPhoto';
import { appStyles as styles } from '../../styles/appStyles';
import { PALETTE } from '../../constants/palette';
import { BULAN_MS } from '../../constants/bulan';

import { hotspotStyles } from './hotspot/hotspotStyles';
import { resolveIcon, DEFAULT_PREFIX, EMPTY_CAT_FORM } from './hotspot/hotspotConstants';
import CategoryPills from './hotspot/CategoryPills';
import KejadianPhotoCard from './hotspot/KejadianPhotoCard';
import HotspotItem from './hotspot/HotspotItem';
import KejadianFilterBar from './hotspot/KejadianFilterBar';
import KejadianTable from './hotspot/KejadianTable';
import KejadianAnalytics from './hotspot/KejadianAnalytics';
import HotspotFormModal from './hotspot/HotspotFormModal';
import HotspotDetailModal from './hotspot/HotspotDetailModal';
import KejadianFormModal from './hotspot/KejadianFormModal';
import CategoryFormModal from './hotspot/CategoryFormModal';
import CategoryDeleteModal from './hotspot/CategoryDeleteModal';

// Tri des points par No. Rujukan : numériques d'abord (ordre croissant), puis texte
const sortByRefNo = (a, b) => {
  const numA = parseFloat(a.ref_no);
  const numB = parseFloat(b.ref_no);
  const validA = !isNaN(numA);
  const validB = !isNaN(numB);
  if (validA && validB && numA !== numB) return numA - numB;
  if (validA !== validB) return validA ? -1 : 1;
  // Nombor rujukan sama atau bukan angka: susun ikut teks ref_no
  return String(a.ref_no || '').localeCompare(String(b.ref_no || ''));
};

export default function HotspotSection({ userRole, isEditMode, onNotify }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
  const canEdit = userRole === 'admin' && isEditMode;

  // ---- Données ----
  const {
    hotspotList, loadingHotspot,
    modalHotspotVisible, setModalHotspotVisible,
    formModeHotspot, formHotspot, setFormHotspot,
    openAddModal, openEditModal,
    handleSaveHotspot, confirmDeleteHotspot,
  } = useHotspots(onNotify);
  const { categories, loadingCategories, addCategory, updateCategory, deleteCategory, updateCategoryPhoto } = useHotspotCategories(onNotify);
  const {
    kejadianList, loadingKejadian,
    modalKejadianVisible, setModalKejadianVisible,
    formModeKejadian, formKejadian, setFormKejadian,
    openAddKejadianModal, openEditKejadianModal,
    handleSaveKejadian, confirmDeleteKejadian,
  } = useHotspotKejadian(onNotify);
  const { pickAndUploadKejadianPhoto, uploadingKejadianPhoto } = useKejadianPhoto();

  // ---- État d'affichage ----
  const [selectedCat, setSelectedCat] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('lokasi'); // 'lokasi' | 'kejadian' | 'analisis'
  const [detailItem, setDetailItem] = useState(null);
  const [kejadianFilterYear, setKejadianFilterYear] = useState(null); // null = tous
  const [kejadianFilterMonth, setKejadianFilterMonth] = useState(null); // null = tous, 0-11 sinon
  const [lokasiPage, setLokasiPage] = useState(0);

  // ---- Gestion des catégories ----
  const [modalCatVisible, setModalCatVisible] = useState(false);
  const [formCat, setFormCat] = useState(EMPTY_CAT_FORM);
  const [editingCatId, setEditingCatId] = useState(null); // null = ajout, sinon = modification de cette catégorie
  const [catToDelete, setCatToDelete] = useState(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  // Sélectionne la 1re catégorie au chargement
  useEffect(() => {
    if (!selectedCat && categories.length > 0) setSelectedCat(categories[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  // Changer de catégorie remet les sous-onglets et filtres à zéro
  useEffect(() => {
    setActiveSubTab('lokasi');
    setKejadianFilterYear(null);
    setKejadianFilterMonth(null);
    setLokasiPage(0);
  }, [selectedCat]);

  // ---- Données dérivées de la catégorie sélectionnée ----
  const currentCat = categories.find((c) => c.key === selectedCat) || null;
  const currentColor = currentCat?.color || PALETTE.orange;
  const CurrentIcon = resolveIcon(currentCat);

  const currentData = currentCat
    ? hotspotList.filter((h) => h.category === currentCat.key).slice().sort(sortByRefNo)
    : [];

  const currentKejadianDataAll = currentCat ? kejadianList.filter((k) => k.category === currentCat.key) : [];

  const kejadianAvailableYears = useMemo(() => {
    const years = new Set(
      currentKejadianDataAll
        .filter((k) => k.tarikh)
        .map((k) => new Date(k.tarikh).getFullYear())
    );
    return Array.from(years).sort((a, b) => b - a);
  }, [currentKejadianDataAll]);

  const currentKejadianData = currentKejadianDataAll.filter((k) => {
    if (!k.tarikh) return kejadianFilterYear === null && kejadianFilterMonth === null;
    const d = new Date(k.tarikh);
    if (kejadianFilterYear !== null && d.getFullYear() !== kejadianFilterYear) return false;
    if (kejadianFilterMonth !== null && d.getMonth() !== kejadianFilterMonth) return false;
    return true;
  });

  // ---- Handlers ----
  const handleChangeKejadianYear = (year) => {
    setKejadianFilterYear(year);
    if (year === null) setKejadianFilterMonth(null); // "Semua Tahun" remet aussi le mois à zéro
  };

  const handleExportKejadianPdf = async () => {
    const catLabel = currentCat?.label || 'Semua';
    const periodLabel = [
      kejadianFilterYear !== null ? kejadianFilterYear : null,
      kejadianFilterMonth !== null ? BULAN_MS[kejadianFilterMonth] : null,
    ].filter(Boolean).join(' ') || 'Semua Rekod';

    try {
      await generateKejadianPdf({ rows: currentKejadianData, categoryLabel: catLabel, periodLabel });
    } catch (e) {
      console.error('Ralat PDF Kejadian:', e);
      onNotify?.('error', 'Gagal menjana PDF.');
    }
  };

  const openAddCategoryModal = () => {
    setEditingCatId(null);
    setModalCatVisible(true);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCatId(cat.id);
    setFormCat({ label: cat.label, sub: cat.sub || '', color: cat.color, prefix: DEFAULT_PREFIX, icon: cat.icon || 'MapPin' });
    setModalCatVisible(true);
  };

  const closeCatModal = () => {
    setModalCatVisible(false);
    setEditingCatId(null);
    setFormCat(EMPTY_CAT_FORM);
  };

  const handleSaveCategory = async () => {
    const ok = editingCatId ? await updateCategory(editingCatId, formCat) : await addCategory(formCat);
    if (ok) closeCatModal();
  };

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    setIsDeletingCat(true);
    const ok = await deleteCategory(catToDelete);
    setIsDeletingCat(false);
    if (ok && selectedCat === catToDelete.key) setSelectedCat(null);
    setCatToDelete(null);
  };

  const isLoading = (loadingHotspot || loadingCategories) && hotspotList.length === 0 && categories.length === 0;

  const subTabs = [
    { key: 'lokasi', label: 'Lokasi Hotspot', Icon: MapPin },
    { key: 'kejadian', label: 'Rekod', Icon: ClipboardList },
    { key: 'analisis', label: 'Analisis & Statistik', Icon: BarChart2 },
  ];

  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Senarai Hotspot Bencana</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
      ) : categories.length === 0 ? (
        <Text style={styles.emptyText}>Tiada kategori dijumpai. Sila tambah kategori.</Text>
      ) : (
        <>
          <CategoryPills
            categories={categories}
            hotspotList={hotspotList}
            selectedCat={selectedCat}
            onSelect={setSelectedCat}
            canEdit={canEdit}
            onEdit={openEditCategoryModal}
            onDelete={setCatToDelete}
            onAdd={openAddCategoryModal}
          />

          {currentCat ? (
            <>
              {/* ---- Bandeau info de la catégorie ---- */}
              <View style={[hotspotStyles.catBanner, { backgroundColor: currentColor + '14', borderColor: currentColor + '40' }]}>
                <CurrentIcon size={16} color={currentColor} />
                <Text style={[hotspotStyles.catBannerText, { color: currentColor }]}>{currentCat.sub || currentCat.label}</Text>
                <Text style={[hotspotStyles.catBannerCount, { color: currentColor }]}>{currentData.length} lokasi</Text>
              </View>

              {/* ---- Sous-onglets ---- */}
              <View style={[hotspotStyles.subTabRow, { justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', rowGap: 8 }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ flexDirection: 'row', gap: 8 }}
                  style={{ maxWidth: '100%' }}
                >
                  {subTabs.map(({ key, label, Icon }) => {
                    const active = activeSubTab === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[hotspotStyles.subTabBtn, active && { backgroundColor: currentColor }]}
                        onPress={() => setActiveSubTab(key)}
                        activeOpacity={0.8}
                      >
                        <Icon size={14} color={active ? PALETTE.white : currentColor} />
                        <Text style={[hotspotStyles.subTabText, { color: active ? PALETTE.white : currentColor }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {activeSubTab === 'lokasi' ? (
                <>
                  <KejadianPhotoCard
                    photoUrl={currentCat.photo_url}
                    canEdit={canEdit}
                    uploading={uploadingKejadianPhoto}
                    onUpload={async () => {
                      const url = await pickAndUploadKejadianPhoto();
                      if (url) await updateCategoryPhoto(currentCat.id, url);
                    }}
                  />

                  {canEdit && (
                    <TouchableOpacity style={[styles.addButton, { alignSelf: 'flex-end', marginBottom: 12 }]} onPress={() => openAddModal(currentCat.key)}>
                      <Plus size={16} color={PALETTE.white} />
                      <Text style={styles.addButtonText}>Tambah</Text>
                    </TouchableOpacity>
                  )}

                  {currentData.length === 0 ? (
                    <Text style={styles.emptyText}>Tiada rekod untuk kategori ini.</Text>
                  ) : (
                    currentData.map((item) => (
                      <HotspotItem
                        key={item.id}
                        item={item}
                        badgeColor={currentColor}
                        prefixText={currentCat.prefix}
                        canEdit={canEdit}
                        onEdit={openEditModal}
                        onDelete={confirmDeleteHotspot}
                        onView={setDetailItem}
                      />
                    ))
                  )}
                </>
              ) : activeSubTab === 'kejadian' ? (
                <>
                  {currentKejadianDataAll.length > 0 && (
                    <KejadianFilterBar
                      isMobile={isMobile}
                      years={kejadianAvailableYears}
                      filterYear={kejadianFilterYear}
                      filterMonth={kejadianFilterMonth}
                      onChangeYear={handleChangeKejadianYear}
                      onChangeMonth={setKejadianFilterMonth}
                      onExportPdf={handleExportKejadianPdf}
                      canEdit={canEdit}
                      onAdd={() => openAddKejadianModal(currentCat.key, currentCat.label)}
                    />
                  )}

                  {loadingKejadian && currentKejadianData.length === 0 ? (
                    <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginTop: 10 }} />
                  ) : currentKejadianData.length === 0 ? (
                    <Text style={styles.emptyText}>Tiada rekod untuk kategori ini.</Text>
                  ) : (
                    <KejadianTable
                      rows={currentKejadianData}
                      isMobile={isMobile}
                      canEdit={canEdit}
                      onOpen={openEditKejadianModal}
                      onDelete={confirmDeleteKejadian}
                    />
                  )}
                </>
              ) : (
                <KejadianAnalytics
                  data={currentKejadianDataAll}
                  currentColor={currentColor}
                  lokasiPage={lokasiPage}
                  setLokasiPage={setLokasiPage}
                />
              )}
            </>
          ) : null}
        </>
      )}

      <HotspotFormModal
        visible={modalHotspotVisible}
        mode={formModeHotspot}
        form={formHotspot}
        setForm={setFormHotspot}
        categories={categories}
        loading={loadingHotspot}
        onSave={handleSaveHotspot}
        onClose={() => setModalHotspotVisible(false)}
      />

      <HotspotDetailModal
        item={detailItem}
        categories={categories}
        onClose={() => setDetailItem(null)}
      />

      <KejadianFormModal
        visible={modalKejadianVisible}
        mode={formModeKejadian}
        form={formKejadian}
        setForm={setFormKejadian}
        isEditMode={isEditMode}
        loading={loadingKejadian}
        onSave={handleSaveKejadian}
        onClose={() => setModalKejadianVisible(false)}
      />

      <CategoryDeleteModal
        category={catToDelete}
        deleting={isDeletingCat}
        onConfirm={confirmDeleteCategory}
        onCancel={() => setCatToDelete(null)}
      />

      <CategoryFormModal
        visible={modalCatVisible}
        isEditing={!!editingCatId}
        form={formCat}
        setForm={setFormCat}
        onSave={handleSaveCategory}
        onClose={closeCatModal}
      />
    </View>
  );
}
