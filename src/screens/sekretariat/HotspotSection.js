// src/screens/sekretariat/HotspotSection.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Image, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import {
  Droplets, Waves, Mountain, MapPin, Plus, Edit, Trash2, X,
  Flame, Wind, Tornado, CloudRain, CloudLightning, CloudFog, Zap,
  Sun, Snowflake, Umbrella, TreePine, Trees, Globe, Bug,
  AlertTriangle, Biohazard, Radiation, Siren, ShieldAlert, LifeBuoy,
  Factory, Building2, Home, Tent, Warehouse, Landmark,
  Ship, Anchor, Truck, Car, Plane, Fuel, Maximize2,
} from 'lucide-react-native';
import { useHotspots } from '../../hooks/useHotspots';
import { useHotspotCategories } from '../../hooks/useHotspotCategories';
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
const CATEGORY_MAPS = {
  banjir: { source: require('../../../assets/map_banjir.png'), caption: 'Peta Taburan Hotspot Banjir' },
  cerun: { source: require('../../../assets/map_landslide.png'), caption: 'Lokasi Cerun Kritikal (Landslide)' },
};

const COLOR_CHOICES = ['#3B82F6', '#d97706', '#EA580C', '#16A34A', '#9333EA', '#DC2626', '#0891B2'];

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

export default function HotspotSection({ userRole, isEditMode }) {
  const [selectedCat, setSelectedCat] = useState(null);
  const {
    hotspotList, loadingHotspot,
    modalHotspotVisible, setModalHotspotVisible,
    formModeHotspot, formHotspot, setFormHotspot,
    openAddModal, openEditModal,
    handleSaveHotspot, confirmDeleteHotspot,
  } = useHotspots();
  const { categories, loadingCategories, addCategory, deleteCategory } = useHotspotCategories();

  // ---- Modale de gestion de catégorie ----
  const [modalCatVisible, setModalCatVisible] = useState(false);
  const [formCat, setFormCat] = useState({ label: '', sub: '', color: COLOR_CHOICES[0], prefix: 'ID', icon: 'MapPin' });

  // Sélectionne la 1re catégorie au chargement
  useEffect(() => {
    if (!selectedCat && categories.length > 0) setSelectedCat(categories[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  const currentCat = categories.find((c) => c.key === selectedCat) || null;
  const currentColor = currentCat?.color || PALETTE.orange;
  const currentData = currentCat ? hotspotList.filter((h) => h.category === currentCat.key) : [];
  const CurrentIcon = resolveIcon(currentCat);
  const currentMap = currentCat ? CATEGORY_MAPS[currentCat.key] : null;

  const handleSaveCategory = async () => {
    const ok = await addCategory(formCat);
    if (ok) {
      setModalCatVisible(false);
      setFormCat({ label: '', sub: '', color: COLOR_CHOICES[0], prefix: 'ID', icon: 'MapPin' });
    }
  };

  const handleDeleteCategory = async (cat) => {
    const doDelete = async () => {
      const ok = await deleteCategory(cat);
      if (ok && selectedCat === cat.key) setSelectedCat(null);
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Padam kategori "${cat.label}"?`)) doDelete();
    } else {
      import('react-native').then(({ Alert }) =>
        Alert.alert('Pengesahan Padam', `Padam kategori "${cat.label}"?`, [
          { text: 'Batal', style: 'cancel' },
          { text: 'Padam', style: 'destructive', onPress: doDelete },
        ])
      );
    }
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
                </TouchableOpacity>
              );
            })}

            {/* Pill "ajouter une catégorie" (admin + édition) */}
            {userRole === 'admin' && isEditMode ? (
              <TouchableOpacity style={hotspotStyles.pillAdd} onPress={() => setModalCatVisible(true)} activeOpacity={0.8}>
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
                {userRole === 'admin' && isEditMode ? (
                  <HoverTip label="Padam kategori ini">
                    <TouchableOpacity onPress={() => handleDeleteCategory(currentCat)} style={hotspotStyles.catDeleteBtn}>
                      <Trash2 size={15} color={PALETTE.danger} />
                    </TouchableOpacity>
                  </HoverTip>
                ) : null}
              </View>

              {/* ---- Carte (Rajah) ---- */}
              {currentMap ? <MapImage source={currentMap.source} caption={currentMap.caption} /> : null}

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

      {/* ---- Modale nouvelle catégorie ---- */}
      <Modal visible={modalCatVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Kategori</Text>
              <TouchableOpacity onPress={() => setModalCatVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Kategori *</Text>
              <TextInput style={styles.input} placeholder="Cth: HOTSPOT RIBUT" value={formCat.label} onChangeText={(t) => setFormCat({ ...formCat, label: t })} />
              <Text style={styles.inputLabel}>Keterangan</Text>
              <TextInput style={styles.input} placeholder="Cth: Kawasan berisiko ribut kencang" value={formCat.sub} onChangeText={(t) => setFormCat({ ...formCat, sub: t })} />
              <Text style={styles.inputLabel}>Prefix Rujukan</Text>
              <TextInput style={styles.input} placeholder="Cth: ID atau NO." value={formCat.prefix} onChangeText={(t) => setFormCat({ ...formCat, prefix: t })} />
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
                <Text style={styles.saveButtonText}>Simpan Kategori</Text>
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
});