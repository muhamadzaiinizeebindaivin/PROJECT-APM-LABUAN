// src/screens/sekretariat/PpsSection.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import {
  Home, Landmark, School, Building, AlertCircle, Plus, Edit, Trash2, X, ShieldCheck,
  Building2, Warehouse, Tent, Church, Hospital, Hotel, Store, MapPin,
} from 'lucide-react-native';
import { usePpsList } from '../../hooks/usePpsList';
import { usePpsCategories } from '../../hooks/usePpsCategories';
import HoverTip from '../../components/HoverTip';
import { appStyles as styles } from '../../styles/appStyles';
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

export default function PpsSection({ userRole, isEditMode, onNotify }) {
  const [selectedType, setSelectedType] = useState('Dewan');
  const canEditPps = userRole === 'admin' && isEditMode;
  const {
    ppsList, ppsStats, loadingPPS,
    modalPpsVisible, setModalPpsVisible,
    formModePps, formPps, setFormPps,
    openAddModal, openEditModal,
    handleSavePPS,
    pendingDeletePps, requestDeletePps, cancelDeletePps, executeDeletePps,
  } = usePpsList(onNotify);

  const { ppsCategories, addPpsCategory, updatePpsCategory, deletePpsCategory } = usePpsCategories();

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

  // ---- Modale nouvelle/kemaskini catégorie ----
  const [modalCatVisible, setModalCatVisible] = useState(false);
  const [formCat, setFormCat] = useState({ label: '', color: COLOR_CHOICES[0], icon: 'Building' });
  const [editingCatId, setEditingCatId] = useState(null); // null = ajout, sinon = modification

  const openEditCategoryModal = (cat) => {
    setEditingCatId(cat.id);
    setFormCat({ label: cat.label || cat.key, color: cat.color, icon: cat.icon || 'Building' });
    setModalCatVisible(true);
  };

  const handleSaveCategory = async () => {
    const ok = editingCatId
      ? await updatePpsCategory(editingCatId, formCat)
      : await addPpsCategory(formCat);
    if (ok) {
      onNotify?.('success', editingCatId ? 'Kategori PPS dikemaskini.' : 'Kategori PPS ditambah.');
      setModalCatVisible(false);
      setEditingCatId(null);
      setFormCat({ label: '', color: COLOR_CHOICES[0], icon: 'Building' });
    } else {
      onNotify?.('error', editingCatId ? 'Gagal mengemaskini kategori.' : 'Gagal menambah kategori.');
    }
  };

  // ---- Confirmation de suppression de catégorie (popup stylé) ----
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState(null);

  // Garde la dernière valeur affichée pendant l'animation de fermeture (évite le texte qui change juste avant que le popup disparaisse)
  const displayPendingDeletePpsRef = React.useRef(null);
  if (pendingDeletePps) displayPendingDeletePpsRef.current = pendingDeletePps;
  const displayPendingDeleteCategoryRef = React.useRef(null);
  if (pendingDeleteCategory) displayPendingDeleteCategoryRef.current = pendingDeleteCategory;

  const requestDeleteCategory = (cat) => setPendingDeleteCategory(cat);
  const cancelDeleteCategory = () => setPendingDeleteCategory(null);

  const executeDeleteCategory = async () => {
    if (!pendingDeleteCategory) return;
    const cat = pendingDeleteCategory;
    const ok = await deletePpsCategory(cat);
    if (ok) {
      onNotify?.('success', 'Kategori PPS dipadam.');
      if (selectedType === cat.key) setSelectedType('Dewan');
    } else {
      onNotify?.('error', 'Gagal memadam kategori.');
    }
    setPendingDeleteCategory(null);
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
                  {userRole === 'admin' && isEditMode ? (
                    <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); openEditCategoryModal(t); }}
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Edit size={12} color={isSelected ? PALETTE.white : t.color} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); requestDeleteCategory(t); }}
                        style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(220,38,38,0.15)', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={12} color="#dc2626" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {/* Pill "ajouter une catégorie" */}
            {userRole === 'admin' && isEditMode ? (
              <TouchableOpacity style={ppsStyles.pillAdd} onPress={() => { setEditingCatId(null); setFormCat({ label: '', color: COLOR_CHOICES[0], icon: 'Building' }); setModalCatVisible(true); }} activeOpacity={0.8}>
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
                  <TouchableOpacity onPress={() => requestDeleteCategory(currentType)} style={ppsStyles.catDeleteBtn}>
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
              <TouchableOpacity
                key={pps.id}
                activeOpacity={0.7}
                onPress={() => openEditModal(pps)}
                style={ppsStyles.ppsCard}
              >
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
                        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); openEditModal(pps); }} style={[ppsStyles.itemActionBtn, { backgroundColor: PALETTE.orange + '18' }]}>
                          <Edit size={15} color={PALETTE.orange} />
                        </TouchableOpacity>
                      </HoverTip>
                      <HoverTip label="Padam PPS ini">
                        <TouchableOpacity onPress={(e) => { e.stopPropagation?.(); requestDeletePps(pps); }} style={[ppsStyles.itemActionBtn, { backgroundColor: PALETTE.danger + '18' }]}>
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
              </TouchableOpacity>
            ))
          )}
        </>
      )}

      <Modal visible={modalPpsVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{!canEditPps ? 'Butiran PPS' : (formModePps === 'add' ? 'Tambah PPS' : 'Kemaskini PPS')}</Text>
              <TouchableOpacity onPress={() => setModalPpsVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Pusat Pemindahan (PPS)</Text>
              <TextInput style={[styles.input, !canEditPps && { color: PALETTE.textMutedDark, outlineStyle: 'none' }]} placeholder="Cth: Dewan Serbaguna Perbadanan" value={formPps.name} onChangeText={(t) => setFormPps({ ...formPps, name: t })} editable={canEditPps} pointerEvents={canEditPps ? 'auto' : 'none'} />
              <View style={styles.row}>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Zon (Kawasan)</Text>
                  <TextInput style={[styles.input, !canEditPps && { color: PALETTE.textMutedDark, outlineStyle: 'none' }]} placeholder="Cth: 1" value={formPps.zone} onChangeText={(t) => setFormPps({ ...formPps, zone: t })} editable={canEditPps} pointerEvents={canEditPps ? 'auto' : 'none'} />
                </View>
                <View style={styles.halfCol}>
                  <Text style={styles.inputLabel}>Kapasiti (Pax)</Text>
                  <TextInput style={[styles.input, !canEditPps && { color: PALETTE.textMutedDark, outlineStyle: 'none' }]} placeholder="Cth: 500" keyboardType="number-pad" value={formPps.capacity} onChangeText={(t) => setFormPps({ ...formPps, capacity: t })} editable={canEditPps} pointerEvents={canEditPps ? 'auto' : 'none'} />
                </View>
              </View>
              <Text style={styles.inputLabel}>Kategori PPS</Text>
              <View style={styles.categoryWrap}>
                {canEditPps ? (
                  ppsCategories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryBtn, formPps.type === cat.key ? styles.categoryBtnActive : null]}
                      onPress={() => setFormPps({ ...formPps, type: cat.key })}
                    >
                      <Text style={[styles.categoryBtnText, formPps.type === cat.key ? styles.categoryBtnTextActive : null]}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={[styles.categoryBtn, styles.categoryBtnActive]}>
                    <Text style={[styles.categoryBtnText, styles.categoryBtnTextActive]}>
                      {ppsCategories.find(c => c.key === formPps.type)?.label || formPps.type}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.inputLabel}>Status Kesediaan</Text>
              <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }, !canEditPps && { color: PALETTE.textMutedDark, outlineStyle: 'none' }]} placeholder="OK (Atau nyatakan kerosakan)" multiline value={formPps.status} onChangeText={(t) => setFormPps({ ...formPps, status: t })} editable={canEditPps} pointerEvents={canEditPps ? 'auto' : 'none'} />
              {canEditPps && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSavePPS}>
                  {loadingPPS ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan PPS</Text>}
                </TouchableOpacity>
              )}
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
              <Text style={styles.modalTitle}>{editingCatId ? 'Kemaskini Kategori PPS' : 'Tambah Kategori PPS'}</Text>
              <TouchableOpacity onPress={() => setModalCatVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.inputLabel}>Nama Kategori</Text>
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
                <Text style={styles.saveButtonText}>{editingCatId ? 'Kemaskini Kategori' : 'Simpan Kategori'}</Text>
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ---- Popup confirmation : padam PPS ---- */}
      <Modal visible={!!pendingDeletePps} transparent animationType="fade" onRequestClose={cancelDeletePps}>
        <View style={ppsStyles.confirmOverlay}>
          <View style={ppsStyles.confirmBox}>
            <View style={ppsStyles.confirmBanner}>
              <View style={ppsStyles.confirmIconCircle}>
                <AlertCircle size={26} color="#ef4444" />
              </View>
              <Text style={ppsStyles.confirmTitle}>Padam PPS?</Text>
              <Text style={ppsStyles.confirmSubtitle}>
                {displayPendingDeletePpsRef.current ? `"${displayPendingDeletePpsRef.current.name}" akan dipadam secara kekal.` : ''}
              </Text>
            </View>
            <View style={ppsStyles.confirmActions}>
              <TouchableOpacity style={ppsStyles.confirmCancelBtn} onPress={cancelDeletePps}>
                <Text style={ppsStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ppsStyles.confirmConfirmBtn} onPress={executeDeletePps}>
                {loadingPPS ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Trash2 size={16} color="#fff" />
                    <Text style={ppsStyles.confirmConfirmText}>Padam</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ---- Popup confirmation : padam kategori ---- */}
      <Modal visible={!!pendingDeleteCategory} transparent animationType="fade" onRequestClose={cancelDeleteCategory}>
        <View style={ppsStyles.confirmOverlay}>
          <View style={ppsStyles.confirmBox}>
            <View style={ppsStyles.confirmBanner}>
              <View style={ppsStyles.confirmIconCircle}>
                <AlertCircle size={26} color="#ef4444" />
              </View>
              <Text style={ppsStyles.confirmTitle}>Padam Kategori?</Text>
              <Text style={ppsStyles.confirmSubtitle}>
                {displayPendingDeleteCategoryRef.current ? `Kategori "${displayPendingDeleteCategoryRef.current.label}" akan dipadam secara kekal.` : ''}
              </Text>
            </View>
            <View style={ppsStyles.confirmActions}>
              <TouchableOpacity style={ppsStyles.confirmCancelBtn} onPress={cancelDeleteCategory}>
                <Text style={ppsStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ppsStyles.confirmConfirmBtn} onPress={executeDeleteCategory}>
                <Trash2 size={16} color="#fff" />
                <Text style={ppsStyles.confirmConfirmText}>Padam</Text>
              </TouchableOpacity>
            </View>
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
    position: 'relative',
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

  // Popup confirmation suppression
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