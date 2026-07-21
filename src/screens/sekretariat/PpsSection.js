// src/screens/sekretariat/PpsSection.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, StyleSheet, Platform, Alert } from 'react-native';
import {
  Home, Landmark, School, Building, AlertCircle, Plus, Edit, Trash2, X, ShieldCheck,
  Building2, Warehouse, Tent, Church, Hospital, Hotel, Store, MapPin,
} from 'lucide-react-native';
import { usePpsList } from '../../hooks/usePpsList';
import { usePpsCategories } from '../../hooks/usePpsCategories';
import HoverTip from '../../components/HoverTip';
import { sekretariatStyles.js as styles } from './sekretariatStyles.js';
import { PALETTE } from '../../constants/palette';

// Scrollbar toujours visible sur web
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('pps-scrollbar-css')) {
  const style = document.createElement('style');
  style.id = 'pps-scrollbar-css';
  style.textContent = `
    .pps-pills-scroll::-webkit-scrollbar { height: 8px; }
    .pps-pills-scroll::-webkit-scrollbar-track { background: #00000010; border-radius: 4px; }
    .pps-pills-scroll::-webkit-scrollbar-thumb { background: #F97316; border-radius: 4px; }
    .pps-pills-scroll { scrollbar-width: thin; scrollbar-color: #F97316 #00000010; }
  `;
  document.head.appendChild(style);
}

const ICONS = {
  Landmark, School, Home, Building, Building2, Warehouse, Tent, Church, Hospital, Hotel, Store, MapPin,
};
const resolveIcon = (cat) => ICONS[cat?.icon] || Building;
const COLOR_CHOICES = ['#EA580C', '#3B82F6', '#16A34A', '#9333EA', '#DC2626', '#0891B2', '#d97706'];

export default function PpsSection({ userRole, isEditMode }) {
  const [selectedType, setSelectedType] = useState('Dewan');
  const {
    ppsList, ppsStats, loadingPPS,
    modalPpsVisible, setModalPpsVisible,
    formModePps, formPps, setFormPps,
    openAddModal, openEditModal,
    handleSavePPS, confirmDeletePPS,
  } = usePpsList();

  const { ppsCategories, addPpsCategory, deletePpsCategory } = usePpsCategories();

  const typeOf = (pps) => (ppsCategories.some((t) => t.key === pps.type) ? pps.type : 'Lain-Lain');
  const currentType = ppsCategories.find((t) => t.key === selectedType) || null;
  const currentColor = currentType?.color || PALETTE.orange;
  const CurrentIcon = resolveIcon(currentType);
  const currentData = currentType ? ppsList.filter((p) => typeOf(p) === selectedType) : [];
  const currentCapacity = currentData.reduce((sum, p) => sum + (parseInt(p.capacity) || 0), 0);
  const totalStat = ppsStats.find((s) => s.type === 'TOTAL');

  const openAddForType = () => {
    openAddModal();
    setFormPps((f) => ({ ...f, type: selectedType }));
  };

  // ---- Modale nouvelle catégorie ----
  const [modalCatVisible, setModalCatVisible] = useState(false);
  const [formCat, setFormCat] = useState({ label: '', color: COLOR_CHOICES[0], icon: 'Building' });

  const handleSaveCategory = async () => {
    const ok = await addPpsCategory(formCat);
    if (ok) {
      setModalCatVisible(false);
      setFormCat({ label: '', color: COLOR_CHOICES[0], icon: 'Building' });
    }
  };

  const handleDeleteCategory = async (cat) => {
    const doDelete = async () => {
      const ok = await deletePpsCategory(cat);
      if (ok && selectedType === cat.key) setSelectedType('Dewan');
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Padam kategori "${cat.label}"?`)) doDelete();
    } else {
      Alert.alert('Pengesahan Padam', `Padam kategori "${cat.label}"?`, [
        { text: 'Batal', style: 'cancel' },
        { text: 'Padam', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Senarai & Status PPS</Text>
      </View>

      {totalStat ? (
        <View style={ppsStyles.totalCard}>
          <View style={ppsStyles.totalDecorCircle} />
          <View style={ppsStyles.totalIconBox}>
            <ShieldCheck size={20} color={PALETTE.orange} />
          </View>
          <Text style={ppsStyles.totalValue}>{totalStat.qty}</Text>
          <Text style={ppsStyles.totalSub}>{totalStat.capacity} pax · Jumlah PPS</Text>
        </View>
      ) : null}

      {loadingPPS && ppsList.length === 0 ? (
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
      ) : ppsList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada data PPS dijumpai.</Text>
      ) : (
        <>
          {/* ---- Onglets par catégorie ---- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={ppsStyles.pillsScroll}
            contentContainerStyle={ppsStyles.pillsContent}
            {...(Platform.OS === 'web' ? { className: 'pps-pills-scroll' } : {})}
          >
            {ppsCategories.map((t) => {
              const isSelected = t.key === selectedType;
              const count = ppsList.filter((p) => typeOf(p) === t.key).length;
              const IconCmp = resolveIcon(t);
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    ppsStyles.pill,
                    { borderColor: t.color },
                    isSelected && { backgroundColor: t.color },
                  ]}
                  onPress={() => setSelectedType(t.key)}
                  activeOpacity={0.8}
                >
                  <IconCmp size={22} color={isSelected ? PALETTE.white : t.color} />
                  <Text style={[ppsStyles.pillLabel, { color: isSelected ? PALETTE.white : t.color }]}>
                    {t.key.toUpperCase()}
                  </Text>
                  <Text style={[ppsStyles.pillCount, { color: isSelected ? PALETTE.white : PALETTE.textMutedDark }]}>
                    {count} PPS
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Pill "ajouter une catégorie" */}
            {userRole === 'admin' && isEditMode ? (
              <TouchableOpacity style={ppsStyles.pillAdd} onPress={() => setModalCatVisible(true)} activeOpacity={0.8}>
                <Plus size={22} color={PALETTE.orange} />
                <Text style={ppsStyles.pillAddText}>Kategori Baru</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>

          {/* ---- Bandeau info ---- */}
          {currentType ? (
            <View style={[ppsStyles.catBanner, { backgroundColor: currentColor + '14', borderColor: currentColor + '40' }]}>
              <CurrentIcon size={16} color={currentColor} />
              <Text style={[ppsStyles.catBannerText, { color: currentColor }]}>Pusat Pemindahan Sementara — {currentType.label}</Text>
              <Text style={[ppsStyles.catBannerCount, { color: currentColor }]}>{currentData.length} PPS · {currentCapacity} pax</Text>
              {userRole === 'admin' && isEditMode ? (
                <HoverTip label="Padam kategori ini">
                  <TouchableOpacity onPress={() => handleDeleteCategory(currentType)} style={ppsStyles.catDeleteBtn}>
                    <Trash2 size={15} color={PALETTE.danger} />
                  </TouchableOpacity>
                </HoverTip>
              ) : null}
            </View>
          ) : null}

          {/* ---- Bouton Tambah ---- */}
          {userRole === 'admin' && isEditMode ? (
            <TouchableOpacity style={[styles.addButton, ppsStyles.addBtnBeforeList]} onPress={openAddForType}>
              <Plus size={16} color={PALETTE.white} />
              <Text style={styles.addButtonText}>Tambah PPS</Text>
            </TouchableOpacity>
          ) : null}

          {/* ---- Liste ---- */}
          {currentData.length === 0 ? (
            <Text style={styles.emptyText}>Tiada PPS untuk kategori ini.</Text>
          ) : (
            currentData.map((pps) => (
              <View key={pps.id} style={ppsStyles.ppsCard}>
                <View style={ppsStyles.ppsHeader}>
                  <View style={[ppsStyles.ppsIconBox, { backgroundColor: pps.status === 'OK' ? currentColor : PALETTE.danger }]}>
                    <CurrentIcon size={18} color={PALETTE.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={ppsStyles.ppsNameRow}>
                      <Text style={ppsStyles.ppsName}>{pps.name}</Text>
                      {pps.status === 'OK' ? (
                        <View style={ppsStyles.statusOk}><Text style={ppsStyles.statusOkText}>SEDIA</Text></View>
                      ) : (
                        <View style={ppsStyles.statusIssue}><Text style={ppsStyles.statusIssueText}>ISU</Text></View>
                      )}
                    </View>
                    <View style={ppsStyles.ppsTags}>
                      <View style={ppsStyles.tagZone}><Text style={ppsStyles.tagText}>Zon {pps.zone || '-'}</Text></View>
                      <View style={ppsStyles.tagCap}><Text style={ppsStyles.tagText}>{pps.capacity} Pax</Text></View>
                    </View>
                  </View>

                  {userRole === 'admin' && isEditMode ? (
                    <View style={ppsStyles.itemActions}>
                      <HoverTip label="Kemaskini PPS ini">
                        <TouchableOpacity onPress={() => openEditModal(pps)} style={[ppsStyles.itemActionBtn, { backgroundColor: PALETTE.orange + '18' }]}>
                          <Edit size={15} color={PALETTE.orange} />
                        </TouchableOpacity>
                      </HoverTip>
                      <HoverTip label="Padam PPS ini">
                        <TouchableOpacity onPress={() => confirmDeletePPS(pps.id)} style={[ppsStyles.itemActionBtn, { backgroundColor: PALETTE.danger + '18' }]}>
                          <Trash2 size={15} color={PALETTE.danger} />
                        </TouchableOpacity>
                      </HoverTip>
                    </View>
                  ) : null}
                </View>

                {pps.status !== 'OK' ? (
                  <View style={ppsStyles.alertBox}>
                    <AlertCircle size={16} color={PALETTE.danger} />
                    <Text style={ppsStyles.alertText}>{pps.status}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </>
      )}

      <Modal visible={modalPpsVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModePps === 'add' ? 'Tambah PPS' : 'Kemaskini PPS'}</Text>
              <TouchableOpacity onPress={() => setModalPpsVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Pusat Pemindahan (PPS) *</Text>
              <TextInput style={styles.input} placeholder="Cth: Dewan Serbaguna Perbadanan" value={formPps.name} onChangeText={(t) => setFormPps({ ...formPps, name: t })} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Zon (Kawasan)</Text>
                  <TextInput style={styles.input} placeholder="Cth: 1" value={formPps.zone} onChangeText={(t) => setFormPps({ ...formPps, zone: t })} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Kapasiti (Pax) *</Text>
                  <TextInput style={styles.input} placeholder="Cth: 500" keyboardType="number-pad" value={formPps.capacity} onChangeText={(t) => setFormPps({ ...formPps, capacity: t })} />
                </View>
              </View>
              <Text style={styles.inputLabel}>Kategori PPS</Text>
              <View style={styles.categoryWrap}>
                {ppsCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryBtn, formPps.type === cat.key ? styles.categoryBtnActive : null]}
                    onPress={() => setFormPps({ ...formPps, type: cat.key })}
                  >
                    <Text style={[styles.categoryBtnText, formPps.type === cat.key ? styles.categoryBtnTextActive : null]}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Status Kesediaan</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="OK (Atau nyatakan kerosakan)" multiline value={formPps.status} onChangeText={(t) => setFormPps({ ...formPps, status: t })} />
              <TouchableOpacity style={styles.saveButton} onPress={handleSavePPS}>
                {loadingPPS ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan PPS</Text>}
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
              <Text style={styles.modalTitle}>Tambah Kategori PPS</Text>
              <TouchableOpacity onPress={() => setModalCatVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Kategori *</Text>
              <TextInput style={styles.input} placeholder="Cth: Masjid/Surau" value={formCat.label} onChangeText={(t) => setFormCat({ ...formCat, label: t })} />
              <Text style={styles.inputLabel}>Ikon</Text>
              <View style={ppsStyles.iconGrid}>
                {Object.entries(ICONS).map(([name, IconCmp]) => {
                  const isSelected = formCat.icon === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[
                        ppsStyles.iconCell,
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
              <View style={ppsStyles.colorRow}>
                {COLOR_CHOICES.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[ppsStyles.colorSwatch, { backgroundColor: c }, formCat.color === c && ppsStyles.colorSwatchSelected]}
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

const ppsStyles = StyleSheet.create({
  totalCard: {
    width: '100%', backgroundColor: '#0C0C0E', borderRadius: 14,
    padding: 16, marginBottom: 12, overflow: 'hidden', position: 'relative',
  },
  totalDecorCircle: {
    position: 'absolute', top: -45, right: -25,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#3D2413',
  },
  totalIconBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#2A1A0E', alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  totalValue: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  totalSub: { fontSize: 12, color: '#9CA3AF', fontWeight: '600', marginTop: 2 },
  
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
  catDeleteBtn: { marginLeft: 6, padding: 4 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  iconCell: {
    width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: PALETTE.cardLightBorder, backgroundColor: PALETTE.cardLight,
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  colorSwatch: { width: 34, height: 34, borderRadius: 17 },
  colorSwatchSelected: { borderWidth: 3, borderColor: PALETTE.textDark },

  // Bandeau
  catBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12,
  },
  catBannerText: { flex: 1, fontSize: 13, fontWeight: '700' },
  catBannerCount: { fontSize: 12, fontWeight: '800' },

  addBtnBeforeList: { alignSelf: 'flex-end', marginBottom: 8 },

  // Cartes PPS
  ppsCard: { backgroundColor: PALETTE.cardLight, borderRadius: 14, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: PALETTE.cardLightBorder },
  ppsHeader: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'center' },
  ppsIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  ppsName: { fontSize: 14, fontWeight: '800', color: PALETTE.textDark },
  ppsNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  statusOk: { backgroundColor: PALETTE.successSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusOkText: { fontSize: 9, fontWeight: '800', color: PALETTE.success },
  statusIssue: { backgroundColor: PALETTE.dangerSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  statusIssueText: { fontSize: 9, fontWeight: '800', color: PALETTE.danger },
  ppsTags: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tagZone: { backgroundColor: PALETTE.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagCap: { backgroundColor: PALETTE.successSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontWeight: '700', color: PALETTE.textMutedDark },
  itemActions: { flexDirection: 'row', gap: 6 },
  itemActionBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  alertBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: PALETTE.dangerSoft, padding: 10, gap: 8, borderTopWidth: 1, borderTopColor: PALETTE.cardLightBorder },
  alertText: { fontSize: 11, color: PALETTE.danger, fontWeight: '700', flex: 1 },
});