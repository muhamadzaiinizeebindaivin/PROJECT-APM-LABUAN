// src/screens/sekretariat/HotspotSection.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Image, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Droplets, Waves, Mountain, MapPin, Plus, Edit, Trash2, X,
  Flame, Wind, Tornado, CloudRain, CloudLightning, CloudFog, Zap,
  Sun, Snowflake, Umbrella, TreePine, Trees, Globe, Bug,
  AlertTriangle, Biohazard, Radiation, Siren, ShieldAlert, LifeBuoy,
  Factory, Building2, Home, Tent, Warehouse, Landmark,
  Ship, Anchor, Truck, Car, Plane, Fuel, Maximize2, Camera, ClipboardList, Calendar,
} from 'lucide-react-native';
import { useHotspots } from '../../hooks/useHotspots';
import { useHotspotCategories } from '../../hooks/useHotspotCategories';
import { useHotspotKejadian } from '../../hooks/useHotspotKejadian';
import { useKejadianPhoto } from '../../hooks/useKejadianPhoto';
import { appStyles as styles } from '../../styles/appStyles';
import { PALETTE } from '../../constants/palette';

// Scrollbar toujours visible sur web
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('hotspot-scrollbar-css')) {
  const style = document.createElement('style');
  style.id = 'hotspot-scrollbar-css';
  style.textContent = `
    .hotspot-pills-scroll::-webkit-scrollbar { height: 8px; }
    .hotspot-pills-scroll::-webkit-scrollbar-track { background: #00000010; border-radius: 4px; }
    .hotspot-pills-scroll::-webkit-scrollbar-thumb { background: #F97316; border-radius: 4px; }
    .hotspot-pills-scroll { scrollbar-width: thin; scrollbar-color: #F97316 #00000010; }
  `;
  document.head.appendChild(style);
}

// Registre d'icônes sélectionnables (nom stocké en base → composant)
const ICONS = {
  MapPin, Droplets, Waves, Mountain,
  Flame, Wind, Tornado, CloudRain, CloudLightning, CloudFog, Zap,
  Sun, Snowflake, Umbrella, TreePine, Trees, Globe, Bug,
  AlertTriangle, Biohazard, Radiation, Siren, ShieldAlert, LifeBuoy,
  Factory, Building2, Home, Tent, Warehouse, Landmark,
  Ship, Anchor, Truck, Car, Plane, Fuel,
};
const resolveIcon = (cat) => ICONS[cat?.icon] || MapPin;

const COLOR_CHOICES = ['#3B82F6', '#d97706', '#EA580C', '#16A34A', '#9333EA', '#DC2626', '#0891B2'];

// Style calqué sur appStyles.input, pour le <input type="date"> HTML natif (web uniquement)
const webDateInput = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${PALETTE.cardLightBorder}`,
  borderRadius: 10,
  padding: 12,
  fontSize: 14,
  color: PALETTE.textDark,
  backgroundColor: '#fafafa',
  outline: 'none',
  fontFamily: 'inherit',
};
const PREFIX_CHOICES = ['ID', 'NO.', 'REF', 'Bil', 'Lain-lain'];

import HoverTip from '../../components/HoverTip';

function MapImage({ source, caption }) {
  const [containerWidth, setContainerWidth] = useState(1);
  const [aspect, setAspect] = useState(1197 / 673); // fallback raisonnable tant que non chargée
  const [fullscreen, setFullscreen] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  return (
    <View
      style={hotspotStyles.mapCard}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width - 20)} // moins le padding horizontal (10+10)
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => setFullscreen(true)} style={{ width: '100%' }}>
        {isMobile ? (
          <Image
            source={source}
            style={[hotspotStyles.mapImage, { height: containerWidth / aspect }]}
            resizeMode="contain"
            onLoad={(e) => {
              const { width: w, height: h } = e.nativeEvent.source || {};
              if (w && h) setAspect(w / h);
            }}
          />
        ) : (
          <Image source={source} style={[hotspotStyles.mapImage, { height: 420 }]} resizeMode="contain" />
        )}
        <View style={hotspotStyles.mapZoomHint}>
          <Maximize2 size={12} color="#fff" />
          <Text style={hotspotStyles.mapZoomHintText}>Klik untuk besarkan</Text>
        </View>
      </TouchableOpacity>
      <Text style={hotspotStyles.mapCaption}>{caption}</Text>

      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={hotspotStyles.mapFullscreenOverlay}>
          <TouchableOpacity style={hotspotStyles.mapFullscreenClose} onPress={() => setFullscreen(false)}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Image source={source} style={hotspotStyles.mapFullscreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

function KejadianPhotoCard({ photoUrl, canEdit, uploading, onUpload }) {
  const [fullscreen, setFullscreen] = useState(false);
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;

  if (!photoUrl) {
    return canEdit ? (
      <TouchableOpacity style={hotspotStyles.photoUploadEmpty} onPress={onUpload} disabled={uploading} activeOpacity={0.8}>
        {uploading ? <ActivityIndicator color={PALETTE.orange} /> : (
          <>
            <Camera size={28} color={PALETTE.orange} />
            <Text style={hotspotStyles.photoUploadEmptyText}>Muat Naik Gambar Kejadian Biasa</Text>
          </>
        )}
      </TouchableOpacity>
    ) : (
      <View style={hotspotStyles.photoEmptyReadOnly}>
        <Camera size={22} color={PALETTE.textMutedDark} />
        <Text style={hotspotStyles.photoEmptyReadOnlyText}>Belum ada gambar untuk kategori ini buat masa ini.</Text>
      </View>
    );
  }

  return (
    <View style={hotspotStyles.mapCard}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => setFullscreen(true)} style={{ width: '100%' }}>
        <Image
          source={{ uri: photoUrl }}
          style={[hotspotStyles.mapImage, { height: isMobile ? 220 : 420 }]}
          resizeMode="contain"
        />
        <View style={hotspotStyles.mapZoomHint}>
          <Maximize2 size={12} color="#fff" />
          <Text style={hotspotStyles.mapZoomHintText}>Klik untuk besarkan</Text>
        </View>
      </TouchableOpacity>
      <Text style={hotspotStyles.mapCaption}>Gambar Kejadian Biasa</Text>

      {canEdit ? (
        <TouchableOpacity style={hotspotStyles.photoReplaceBtn} onPress={onUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator size="small" color={PALETTE.orange} /> : (
            <>
              <Camera size={14} color={PALETTE.orange} />
              <Text style={hotspotStyles.photoReplaceBtnText}>Tukar Gambar</Text>
            </>
          )}
        </TouchableOpacity>
      ) : null}

      <Modal visible={fullscreen} transparent animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <View style={hotspotStyles.mapFullscreenOverlay}>
          <TouchableOpacity style={hotspotStyles.mapFullscreenClose} onPress={() => setFullscreen(false)}>
            <X size={22} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: photoUrl }} style={hotspotStyles.mapFullscreenImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
}

export default function HotspotSection({ userRole, isEditMode }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const {
    hotspotList, loadingHotspot,
    modalHotspotVisible, setModalHotspotVisible,
    formModeHotspot, formHotspot, setFormHotspot,
    openAddModal, openEditModal,
    handleSaveHotspot, confirmDeleteHotspot,
  } = useHotspots();
  const { categories, loadingCategories, addCategory, updateCategory, deleteCategory, updateCategoryPhoto } = useHotspotCategories();
  const {
    kejadianList, loadingKejadian,
    modalKejadianVisible, setModalKejadianVisible,
    formModeKejadian, formKejadian, setFormKejadian,
    openAddKejadianModal, openEditKejadianModal,
    handleSaveKejadian, confirmDeleteKejadian,
  } = useHotspotKejadian();
  const { pickAndUploadKejadianPhoto, uploadingKejadianPhoto } = useKejadianPhoto();
  const [activeSubTab, setActiveSubTab] = useState('lokasi'); // 'lokasi' | 'kejadian'
  const [showTarikhPicker, setShowTarikhPicker] = useState(false);

  // ---- Modale de gestion de catégorie ----
  const [modalCatVisible, setModalCatVisible] = useState(false);
  const [formCat, setFormCat] = useState({ label: '', sub: '', color: COLOR_CHOICES[0], prefix: 'ID', icon: 'MapPin' });
  const [editingCatId, setEditingCatId] = useState(null); // null = ajout, sinon = modification de cette catégorie
  const [isCustomPrefix, setIsCustomPrefix] = useState(false); // true = mode "Lain-lain" avec saisie libre

  // Sélectionne la 1re catégorie au chargement
  useEffect(() => {
    if (!selectedCat && categories.length > 0) setSelectedCat(categories[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const currentCat = categories.find((c) => c.key === selectedCat) || null;
  const currentColor = currentCat?.color || PALETTE.orange;
  const currentData = currentCat ? hotspotList.filter((h) => h.category === currentCat.key) : [];
  const currentKejadianData = currentCat ? kejadianList.filter((k) => k.category === currentCat.key) : [];
  const CurrentIcon = resolveIcon(currentCat);

  useEffect(() => {
    setActiveSubTab('lokasi');
  }, [selectedCat]);

  const closeCatModal = () => {
    setModalCatVisible(false);
    setEditingCatId(null);
    setFormCat({ label: '', sub: '', color: COLOR_CHOICES[0], prefix: 'ID', icon: 'MapPin' });
    setIsCustomPrefix(false);
  };

  const openEditCategoryModal = (cat) => {
    setEditingCatId(cat.id);
    const catPrefix = cat.prefix || 'ID';
    setFormCat({ label: cat.label, sub: cat.sub || '', color: cat.color, prefix: catPrefix, icon: cat.icon || 'MapPin' });
    setIsCustomPrefix(!PREFIX_CHOICES.slice(0, -1).includes(catPrefix));
    setModalCatVisible(true);
  };

  const handleSaveCategory = async () => {
    const ok = editingCatId ? await updateCategory(editingCatId, formCat) : await addCategory(formCat);
    if (ok) closeCatModal();
  };

  const [catToDelete, setCatToDelete] = useState(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);
  const displayDeleteCatRef = useRef(null);
  if (catToDelete !== null) displayDeleteCatRef.current = catToDelete;

  const handleDeleteCategory = (cat) => setCatToDelete(cat);

  const confirmDeleteCategory = async () => {
    if (!catToDelete) return;
    setIsDeletingCat(true);
    const ok = await deleteCategory(catToDelete);
    setIsDeletingCat(false);
    if (ok && selectedCat === catToDelete.key) setSelectedCat(null);
    setCatToDelete(null);
  };

  const renderHotspotItem = (item, badgeColor, prefixText) => (
    <View key={item.id} style={hotspotStyles.hotspotCard}>
      <View style={[hotspotStyles.hotspotBadge, { backgroundColor: badgeColor + '18', borderColor: badgeColor }]}>
        <Text style={[hotspotStyles.hotspotBadgeText, { color: badgeColor }]}>{prefixText} {item.ref_no || '-'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={hotspotStyles.hotspotRiver}>{item.river}</Text>
        <Text style={hotspotStyles.hotspotArea}>{item.area}</Text>
      </View>

      {userRole === 'admin' && isEditMode ? (
        <View style={hotspotStyles.itemActions}>
          <HoverTip label="Kemaskini titik ini">
            <TouchableOpacity onPress={() => openEditModal(item)} style={[hotspotStyles.itemActionBtn, { backgroundColor: PALETTE.orange + '18' }]}>
              <Edit size={15} color={PALETTE.orange} />
            </TouchableOpacity>
          </HoverTip>
          <HoverTip label="Padam titik ini">
            <TouchableOpacity onPress={() => confirmDeleteHotspot(item.id)} style={[hotspotStyles.itemActionBtn, { backgroundColor: PALETTE.danger + '18' }]}>
              <Trash2 size={15} color={PALETTE.danger} />
            </TouchableOpacity>
          </HoverTip>
        </View>
      ) : null}
    </View>
  );

  const renderKejadianItem = (item) => (
    <View key={item.id} style={hotspotStyles.kejadianCard}>
      <View style={hotspotStyles.kejadianHeader}>
        <Text style={[hotspotStyles.kejadianDate, { color: currentColor }]}>{item.tarikh || '-'}</Text>
        <Text style={hotspotStyles.kejadianJenis}>{item.jenis_bencana}</Text>
      </View>
      <Text style={hotspotStyles.kejadianLokasi}>{item.lokasi}</Text>
      <View style={hotspotStyles.kejadianStatsRow}>
        <Text style={hotspotStyles.kejadianStat}>Jumlah KIR: {item.jumlah_kir ?? '-'}</Text>
        <Text style={hotspotStyles.kejadianStat}>Mangsa: {item.jumlah_mangsa ?? '-'}</Text>
        <Text style={hotspotStyles.kejadianStat}>PPS: {item.pps || '-'}</Text>
      </View>
      {item.catatan ? <Text style={hotspotStyles.kejadianCatatan}>{item.catatan}</Text> : null}

      {userRole === 'admin' && isEditMode ? (
        <View style={hotspotStyles.itemActions}>
          <HoverTip label="Kemaskini rekod ini">
            <TouchableOpacity onPress={() => openEditKejadianModal(item)} style={[hotspotStyles.itemActionBtn, { backgroundColor: PALETTE.orange + '18' }]}>
              <Edit size={15} color={PALETTE.orange} />
            </TouchableOpacity>
          </HoverTip>
          <HoverTip label="Padam rekod ini">
            <TouchableOpacity onPress={() => confirmDeleteKejadian(item.id)} style={[hotspotStyles.itemActionBtn, { backgroundColor: PALETTE.danger + '18' }]}>
              <Trash2 size={15} color={PALETTE.danger} />
            </TouchableOpacity>
          </HoverTip>
        </View>
      ) : null}
    </View>
  );

  const isLoading = (loadingHotspot || loadingCategories) && hotspotList.length === 0 && categories.length === 0;

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
          {/* ---- Onglets de catégorie ---- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={hotspotStyles.pillsScroll}
            contentContainerStyle={hotspotStyles.pillsContent}
            {...(Platform.OS === 'web' ? { className: 'hotspot-pills-scroll' } : {})}
          >
            {categories.map((cat) => {
              const isSelected = cat.key === selectedCat;
              const count = hotspotList.filter((h) => h.category === cat.key).length;
              const IconCmp = resolveIcon(cat);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    hotspotStyles.pill,
                    { borderColor: cat.color },
                    isSelected && { backgroundColor: cat.color },
                  ]}
                  onPress={() => setSelectedCat(cat.key)}
                  activeOpacity={0.8}
                >
                  <IconCmp size={22} color={isSelected ? PALETTE.white : cat.color} />
                  <Text style={[hotspotStyles.pillLabel, { color: isSelected ? PALETTE.white : cat.color }]}>
                    {cat.label}
                  </Text>
                  <Text style={[hotspotStyles.pillCount, { color: isSelected ? PALETTE.white : PALETTE.textMutedDark }]}>
                    {count} lokasi
                  </Text>
                  {userRole === 'admin' && isEditMode ? (
                    <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); openEditCategoryModal(cat); }}
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit size={12} color={isSelected ? PALETTE.white : cat.color} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); handleDeleteCategory(cat); }}
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.12)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={12} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {/* Pill "ajouter une catégorie" (admin + édition) */}
            {userRole === 'admin' && isEditMode ? (
              <TouchableOpacity style={hotspotStyles.pillAdd} onPress={() => { setEditingCatId(null); setModalCatVisible(true); }} activeOpacity={0.8}>
                <Plus size={22} color={PALETTE.orange} />
                <Text style={hotspotStyles.pillAddText}>Kategori Baru</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          {currentCat ? (
            <>
              {/* ---- Bandeau info de la catégorie ---- */}
              <View style={[hotspotStyles.catBanner, { backgroundColor: currentColor + '14', borderColor: currentColor + '40' }]}>
                <CurrentIcon size={16} color={currentColor} />
                <Text style={[hotspotStyles.catBannerText, { color: currentColor }]}>{currentCat.sub || currentCat.label}</Text>
                <Text style={[hotspotStyles.catBannerCount, { color: currentColor }]}>{currentData.length} lokasi</Text>
              </View>

              {/* ---- Sous-onglets ---- */}
              <View style={hotspotStyles.subTabRow}>
                <TouchableOpacity
                  style={[hotspotStyles.subTabBtn, activeSubTab === 'lokasi' && { backgroundColor: currentColor }]}
                  onPress={() => setActiveSubTab('lokasi')}
                  activeOpacity={0.8}
                >
                  <MapPin size={14} color={activeSubTab === 'lokasi' ? PALETTE.white : currentColor} />
                  <Text style={[hotspotStyles.subTabText, { color: activeSubTab === 'lokasi' ? PALETTE.white : currentColor }]}>Lokasi Hotspot</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[hotspotStyles.subTabBtn, activeSubTab === 'kejadian' && { backgroundColor: currentColor }]}
                  onPress={() => setActiveSubTab('kejadian')}
                  activeOpacity={0.8}
                >
                  <ClipboardList size={14} color={activeSubTab === 'kejadian' ? PALETTE.white : currentColor} />
                  <Text style={[hotspotStyles.subTabText, { color: activeSubTab === 'kejadian' ? PALETTE.white : currentColor }]}>Rekod</Text>
                </TouchableOpacity>
              </View>

              {activeSubTab === 'lokasi' ? (
                <>
                  {/* ---- Gambar Kejadian Biasa ---- */}
                  <KejadianPhotoCard
                    photoUrl={currentCat.photo_url}
                    canEdit={userRole === 'admin' && isEditMode}
                    uploading={uploadingKejadianPhoto}
                    onUpload={async () => {
                      const url = await pickAndUploadKejadianPhoto();
                      if (url) await updateCategoryPhoto(currentCat.id, url);
                    }}
                  />

                  {/* ---- Bouton Tambah ---- */}
                  {userRole === 'admin' && isEditMode ? (
                    <TouchableOpacity style={[styles.addButton, hotspotStyles.addBtnBeforeList]} onPress={openAddModal}>
                      <Plus size={16} color={PALETTE.white} />
                      <Text style={styles.addButtonText}>Tambah</Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* ---- Liste ---- */}
                  {currentData.length === 0 ? (
                    <Text style={styles.emptyText}>Tiada rekod untuk kategori ini.</Text>
                  ) : (
                    currentData.map((item) => renderHotspotItem(item, currentColor, currentCat.prefix))
                  )}
                </>
              ) : (
                <>
                  {/* ---- Bouton Tambah Kejadian ---- */}
                  {userRole === 'admin' && isEditMode ? (
                    <TouchableOpacity style={[styles.addButton, hotspotStyles.addBtnBeforeList]} onPress={() => openAddKejadianModal(currentCat.key, currentCat.label)}>
                      <Plus size={16} color={PALETTE.white} />
                      <Text style={styles.addButtonText}>Tambah</Text>
                    </TouchableOpacity>
                  ) : null}

                  {/* ---- Liste Kejadian ---- */}
                  {loadingKejadian && currentKejadianData.length === 0 ? (
                    <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginTop: 10 }} />
                  ) : currentKejadianData.length === 0 ? (
                    <Text style={styles.emptyText}>Tiada rekod untuk kategori ini.</Text>
                  ) : (
                    currentKejadianData.map((item) => renderKejadianItem(item))
                  )}
                </>
              )}
            </>
          ) : null}
        </>
      )}

      {/* ---- Modale hotspot ---- */}
      <Modal visible={modalHotspotVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeHotspot === 'add' ? 'Tambah Hotspot' : 'Kemaskini Hotspot'}</Text>
              <TouchableOpacity onPress={() => setModalHotspotVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Kategori Hotspot</Text>
              <View style={styles.categoryWrap}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryBtn, formHotspot.category === cat.key ? styles.categoryBtnActive : null]}
                    onPress={() => setFormHotspot({ ...formHotspot, category: cat.key })}
                  >
                    <Text style={[styles.categoryBtnText, formHotspot.category === cat.key ? styles.categoryBtnTextActive : null]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>No. Rujukan / ID *</Text>
              <TextInput style={styles.input} placeholder="Cth: 1, 2, atau 17/4" value={formHotspot.ref_no} onChangeText={(t) => setFormHotspot({ ...formHotspot, ref_no: t })} />
              <Text style={styles.inputLabel}>Sungai / Koordinat / Lokasi Utama *</Text>
              <TextInput style={styles.input} placeholder="Cth: Sg. Kinabenua / 5°22'16.5N 115..." value={formHotspot.river} onChangeText={(t) => setFormHotspot({ ...formHotspot, river: t })} />
              <Text style={styles.inputLabel}>Kawasan Terjejas *</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Cth: Kg Rancha-Rancha / Slope ID 17/4" multiline value={formHotspot.area} onChangeText={(t) => setFormHotspot({ ...formHotspot, area: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveHotspot}>
                {loadingHotspot ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan Hotspot</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

{/* ---- Modale rekod kejadian ---- */}
      <Modal visible={modalKejadianVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 640 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeKejadian === 'add' ? 'Tambah Rekod' : 'Kemaskini Rekod'}</Text>
              <TouchableOpacity onPress={() => setModalKejadianVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Tarikh *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={formKejadian.tarikh}
                  onChange={(e) => setFormKejadian({ ...formKejadian, tarikh: e.target.value })}
                  style={webDateInput}
                />
              ) : (
                <>
                  <TouchableOpacity style={hotspotStyles.dateInputBtn} onPress={() => setShowTarikhPicker(true)}>
                    <Calendar size={16} color={PALETTE.textMutedDark} />
                    <Text style={[hotspotStyles.dateInputBtnText, !formKejadian.tarikh && { color: PALETTE.textMutedDark }]}>
                      {formKejadian.tarikh || 'Pilih tarikh'}
                    </Text>
                  </TouchableOpacity>
                  {showTarikhPicker ? (
                    <DateTimePicker
                      value={formKejadian.tarikh ? new Date(formKejadian.tarikh) : new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowTarikhPicker(false);
                        if (event.type === 'set' && selectedDate) {
                          const iso = selectedDate.toISOString().split('T')[0];
                          setFormKejadian({ ...formKejadian, tarikh: iso });
                        }
                      }}
                    />
                  ) : null}
                </>
              )}
              <Text style={styles.inputLabel}>Lokasi *</Text>
              <TextInput style={styles.input} placeholder="Cth: Kg Rancha-Rancha" value={formKejadian.lokasi} onChangeText={(t) => setFormKejadian({ ...formKejadian, lokasi: t })} />
              <Text style={styles.inputLabel}>Jumlah KIR</Text>
              <TextInput style={styles.input} placeholder="Cth: 12" keyboardType="numeric" value={formKejadian.jumlah_kir} onChangeText={(t) => setFormKejadian({ ...formKejadian, jumlah_kir: t.replace(/[^0-9]/g, '') })} />
              <Text style={styles.inputLabel}>Jumlah Mangsa</Text>
              <TextInput style={styles.input} placeholder="Cth: 45" keyboardType="numeric" value={formKejadian.jumlah_mangsa} onChangeText={(t) => setFormKejadian({ ...formKejadian, jumlah_mangsa: t.replace(/[^0-9]/g, '') })} />
              <Text style={styles.inputLabel}>PPS</Text>
              <TextInput style={styles.input} placeholder="Cth: Dewan Komuniti Kg X" value={formKejadian.pps} onChangeText={(t) => setFormKejadian({ ...formKejadian, pps: t })} />
              <Text style={styles.inputLabel}>Catatan</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Catatan tambahan" multiline value={formKejadian.catatan} onChangeText={(t) => setFormKejadian({ ...formKejadian, catatan: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveKejadian}>
                {loadingKejadian ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan Rekod</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

{/* ---- Confirmation suppression catégorie ---- */}
      <Modal visible={catToDelete !== null} transparent animationType="fade" onRequestClose={() => !isDeletingCat && setCatToDelete(null)}>
        <View style={hotspotStyles.confirmOverlay}>
          <View style={hotspotStyles.confirmBox}>
            <View style={hotspotStyles.confirmBanner}>
              <View style={hotspotStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={hotspotStyles.confirmTitle}>Padam Kategori</Text>
              <Text style={hotspotStyles.confirmSubtitle}>
                Padam kategori "{displayDeleteCatRef.current?.label}"? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={hotspotStyles.confirmActions}>
              <TouchableOpacity
                style={[hotspotStyles.confirmCancelBtn, isDeletingCat && { opacity: 0.5 }]}
                onPress={() => setCatToDelete(null)}
                disabled={isDeletingCat}
              >
                <Text style={hotspotStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[hotspotStyles.confirmConfirmBtn, isDeletingCat && { opacity: 0.7 }]}
                onPress={confirmDeleteCategory}
                disabled={isDeletingCat}
              >
                {isDeletingCat ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={hotspotStyles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Modale nouvelle catégorie ---- */}
      <Modal visible={modalCatVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCatId ? 'Kemaskini Kategori' : 'Tambah Kategori'}</Text>
              <TouchableOpacity onPress={closeCatModal}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Kategori *</Text>
              <TextInput style={styles.input} placeholder="Cth: HOTSPOT RIBUT" value={formCat.label} onChangeText={(t) => setFormCat({ ...formCat, label: t })} />
              <Text style={styles.inputLabel}>Keterangan</Text>
              <TextInput style={styles.input} placeholder="Cth: Kawasan berisiko ribut kencang" value={formCat.sub} onChangeText={(t) => setFormCat({ ...formCat, sub: t })} />
              <Text style={styles.inputLabel}>Prefix Rujukan</Text>
              <View style={hotspotStyles.prefixRow}>
                {PREFIX_CHOICES.map((p) => {
                  const isLain = p === 'Lain-lain';
                  const isSelected = isLain ? isCustomPrefix : (!isCustomPrefix && formCat.prefix === p);
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[hotspotStyles.prefixPill, isSelected && hotspotStyles.prefixPillSelected]}
                      onPress={() => {
                        if (isLain) {
                          setIsCustomPrefix(true);
                          setFormCat({ ...formCat, prefix: '' });
                        } else {
                          setIsCustomPrefix(false);
                          setFormCat({ ...formCat, prefix: p });
                        }
                      }}
                    >
                      <Text style={[hotspotStyles.prefixPillText, isSelected && hotspotStyles.prefixPillTextSelected]}>{p}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {isCustomPrefix ? (
                <TextInput
                  style={styles.input}
                  placeholder="Taip prefix anda sendiri"
                  value={formCat.prefix}
                  onChangeText={(t) => setFormCat({ ...formCat, prefix: t })}
                />
              ) : null}
              <Text style={styles.inputLabel}>Ikon</Text>
              <View style={hotspotStyles.iconGrid}>
                {Object.entries(ICONS).map(([name, IconCmp]) => {
                  const isSelected = formCat.icon === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[
                        hotspotStyles.iconCell,
                        isSelected && { backgroundColor: formCat.color + '18', borderColor: formCat.color },
                      ]}
                      onPress={() => setFormCat({ ...formCat, icon: name })}
                    >
                      <IconCmp size={20} color={isSelected ? formCat.color : PALETTE.textMutedDark} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Warna</Text>
              <View style={hotspotStyles.colorRow}>
                {COLOR_CHOICES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[hotspotStyles.colorSwatch, { backgroundColor: c }, formCat.color === c && hotspotStyles.colorSwatchSelected]}
                    onPress={() => setFormCat({ ...formCat, color: c })}
                  />
                ))}
              </View>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
                <Text style={styles.saveButtonText}>{editingCatId ? 'Kemaskini Kategori' : 'Simpan Kategori'}</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const hotspotStyles = StyleSheet.create({
  // Onglets
  pillsScroll: { marginBottom: 10 },
  pillsContent: { gap: 10, paddingBottom: 10, paddingHorizontal: 2 },
  pill: {
    width: 160, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: 12, backgroundColor: PALETTE.cardLight, borderWidth: 1, gap: 4,
  },
  pillLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  pillCount: { fontSize: 11, fontWeight: '600' },
  pillAdd: {
    width: 120, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.orange, gap: 4,
  },
  pillAddText: { fontSize: 12, fontWeight: '700', color: PALETTE.orange, textAlign: 'center' },

  // Sous-onglets
  subTabRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  subTabBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 8, backgroundColor: PALETTE.cardLight, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  subTabText: { fontSize: 12, fontWeight: '700' },

  // Cartes de rekod kejadian
  kejadianCard: { backgroundColor: PALETTE.cardLight, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: PALETTE.cardLightBorder, gap: 6 },
  kejadianHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kejadianDate: { fontSize: 12, fontWeight: '800' },
  kejadianJenis: { fontSize: 13, fontWeight: '700', color: PALETTE.textDark },
  kejadianLokasi: { fontSize: 13, color: PALETTE.textDark, fontWeight: '600' },
  kejadianStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kejadianStat: { fontSize: 11, color: PALETTE.textMutedDark, fontWeight: '600' },
  kejadianCatatan: { fontSize: 12, color: PALETTE.textMutedDark, fontStyle: 'italic', marginTop: 2 },

  // Upload photo kejadian
  photoUploadEmpty: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.orange, borderRadius: 12,
    paddingVertical: 30, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15,
  },
  photoUploadEmptyText: { fontSize: 13, fontWeight: '700', color: PALETTE.orange },
  photoReplaceBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: PALETTE.orange,
  },
  photoReplaceBtnText: { fontSize: 12, fontWeight: '700', color: PALETTE.orange },
  photoEmptyReadOnly: {
    borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.cardLightBorder, borderRadius: 12,
    paddingVertical: 26, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 15,
    backgroundColor: PALETTE.cardLight,
  },
  photoEmptyReadOnlyText: { fontSize: 13, fontWeight: '600', color: PALETTE.textMutedDark, textAlign: 'center' },
  dateInputBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 12, backgroundColor: PALETTE.white,
  },
  dateInputBtnText: { fontSize: 14, color: PALETTE.textDark },

  // Bandeau catégorie
  catBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  catBannerText: { flex: 1, fontSize: 13, fontWeight: '700' },
  catBannerCount: { fontSize: 12, fontWeight: '800' },
  catDeleteBtn: { marginLeft: 6, padding: 4 },

  // Cartes d'items
  hotspotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.cardLight, padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: PALETTE.cardLightBorder, gap: 12 },
  hotspotBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, width: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  hotspotBadgeText: { fontSize: 10, fontWeight: '800' },
  hotspotRiver: { fontSize: 11, color: PALETTE.textMutedDark, fontWeight: '700', textTransform: 'uppercase' },
  hotspotArea: { fontSize: 14, color: PALETTE.textDark, fontWeight: '600' },
  itemActions: { flexDirection: 'row', gap: 6 },
  addBtnBeforeList: { alignSelf: 'flex-end', marginBottom: 8 },
  itemActionBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  // Carte (Rajah)
  mapCard: { backgroundColor: PALETTE.cardLight, borderRadius: 14, marginBottom: 15, borderWidth: 1, borderColor: PALETTE.cardLightBorder, padding: 10, alignItems: 'center' },
  mapImage: { width: '100%', borderRadius: 8, backgroundColor: PALETTE.surface },
  mapCaption: { fontSize: 12, color: PALETTE.textMutedDark, marginTop: 8, fontWeight: '600' },
  mapZoomHint: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  mapZoomHintText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  mapFullscreenOverlay: { flex: 1, backgroundColor: 'rgba(11, 12, 14, 0.95)', justifyContent: 'center', alignItems: 'center' },
  mapFullscreenClose: {
    position: 'absolute', top: 40, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  mapFullscreenImage: { width: '100%', height: '90%' },

  // Modale catégorie
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  iconCell: {
    width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.cardLight,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  colorSwatch: { width: 34, height: 34, borderRadius: 17 },
  colorSwatchSelected: { borderWidth: 3, borderColor: PALETTE.textDark },
  prefixRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  prefixPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
    borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.cardLight,
  },
  prefixPillSelected: { backgroundColor: PALETTE.orange + '18', borderColor: PALETTE.orange },
  prefixPillText: { fontSize: 13, fontWeight: '700', color: PALETTE.textMutedDark },
  prefixPillTextSelected: { color: PALETTE.orange },
  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmBox: {
    width: '100%', maxWidth: 400, borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20,
  },
  confirmBanner: { backgroundColor: '#0c0c0e', padding: 24, alignItems: 'center' },
  confirmIconCircle: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  confirmTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  confirmSubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: 10, padding: 20, backgroundColor: '#fff' },
  confirmCancelBtn: {
    flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0',
    alignItems: 'center', justifyContent: 'center',
  },
  confirmCancelText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  confirmConfirmBtn: {
    flex: 1, height: 48, borderRadius: 12, backgroundColor: '#ef4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  confirmConfirmText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});