// src/screens/sekretariat/JpbdSection.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, StyleSheet, Image, Platform } from 'react-native';
import { Briefcase, Plus, Edit, Trash2, X, ImagePlus } from 'lucide-react-native';
import { useJpbdDirectory } from '../../hooks/useJpbdDirectory';
import { useAgencyLogo } from '../../hooks/useAgencyLogo';
import { useKpi } from '../../hooks/useKpi';
import KpiSection from '../pentadbiran/KpiSection';
import { useSekretariatDocuments } from '../../hooks/useSekretariatDocuments';
import SekretariatDocumentsSection from './SekretariatDocumentsSection';
import { useSekretariatAssets } from '../../hooks/useSekretariatAssets';
import { useSekretariatLogistik } from '../../hooks/useSekretariatLogistik';
import { useSekretariatPetugas } from '../../hooks/useSekretariatPetugas';
import SekretariatAssetsSection from './SekretariatAssetsSection';
import { appStyles as styles } from '../../styles/appStyles';
import { PALETTE } from '../../constants/palette';

// Scrollbar toujours visible sur web (pas seulement au survol)
if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('jpbd-scrollbar-css')) {
  const style = document.createElement('style');
  style.id = 'jpbd-scrollbar-css';
  style.textContent = `
    .jpbd-pills-scroll::-webkit-scrollbar { height: 8px; }
    .jpbd-pills-scroll::-webkit-scrollbar-track { background: ${'#00000010'}; border-radius: 4px; }
    .jpbd-pills-scroll::-webkit-scrollbar-thumb { background: #F97316; border-radius: 4px; }
    .jpbd-pills-scroll { scrollbar-width: thin; scrollbar-color: #F97316 #00000010; }
  `;
  document.head.appendChild(style);
}

export default function JpbdSection({ userRole, isEditMode }) {
  const [selectedId, setSelectedId] = useState(null);
  const {
    jpbdList, loadingJPBD,
    modalJpbdVisible, setModalJpbdVisible,
    formModeJpbd, formJpbd, setFormJpbd,
    openAddModal, openEditModal, loadIntoForm,
    handleSaveJPBD, confirmDeleteJPBD,
  } = useJpbdDirectory();
  const { pickAndUploadLogo, uploadingLogo } = useAgencyLogo();
  const { kpiList, saveKpiItem, deleteKpiItem, reorderKpi } = useKpi('sekretariat');
  const { documents, loading: loadingDocuments, uploading: uploadingDocument, uploadDocument, deleteDocument } = useSekretariatDocuments();
  const { assetList, saveAssetItem, deleteAssetItem } = useSekretariatAssets();
  const { logistikList, saveLogistikItem, deleteLogistikItem } = useSekretariatLogistik();
  const { petugasList, savePetugasItem, deletePetugasItem } = useSekretariatPetugas();

  // Sélectionne automatiquement la 1re agence au chargement
  useEffect(() => {
    if (!selectedId && jpbdList.length > 0) setSelectedId(jpbdList[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jpbdList]);

  const selected = jpbdList.find((i) => i.id === selectedId) || null;

  const handlePickLogo = async () => {
    const url = await pickAndUploadLogo();
    if (url) setFormJpbd({ ...formJpbd, logo_url: url });
  };

  // ---- Liste dynamique d'assets ----
  const [assetRows, setAssetRows] = useState([]);

  useEffect(() => {
    if (modalJpbdVisible) {
      const rows = (formJpbd.logistics_assets || '')
        .split('\n')
        .filter((l) => l.trim())
        .map((line) => {
          const idx = line.lastIndexOf(':');
          if (idx > -1) {
            return { name: line.slice(0, idx).trim(), qty: line.slice(idx + 1).trim() };
          }
          return { name: line.trim(), qty: '' };
        });
      setAssetRows(rows.length > 0 ? rows : [{ name: '', qty: '' }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalJpbdVisible]);

  const syncAssets = (rows) => {
    setAssetRows(rows);
    const text = rows
      .filter((r) => r.name.trim())
      .map((r) => `${r.name.trim()} : ${r.qty.trim() || '1'}`)
      .join('\n');
    setFormJpbd((prev) => ({ ...prev, logistics_assets: text }));
  };

  const updateAssetRow = (i, field, value) => {
    const rows = assetRows.map((r, idx) => (idx === i ? { ...r, [field]: value } : r));
    syncAssets(rows);
  };
  const addAssetRow = () => syncAssets([...assetRows, { name: '', qty: '' }]);
  const removeAssetRow = (i) => syncAssets(assetRows.filter((_, idx) => idx !== i));

  return (
    <View>
      {/* ---- Dokumen & Imej ---- */}
      <SekretariatDocumentsSection
        documents={documents}
        loading={loadingDocuments}
        isEditing={isEditMode}
        uploading={uploadingDocument}
        uploadDocument={uploadDocument}
        deleteDocument={deleteDocument}
        onNotify={(type, message) => console.log(type, message) /* remplace par le toast réel si JpbdSection en a un */}
      />

      <SekretariatAssetsSection
        assetList={petugasList}
        isEditing={isEditMode}
        saveAssetItem={savePetugasItem}
        deleteAssetItem={deletePetugasItem}
        title="Jumlah Petugas"
        itemNoun="Petugas"
        itemNounLower="petugas"
        namePlaceholder="Cth: Pasukan"
        fixedItems
        onNotify={(type, message) => console.log(type, message) /* remplace par le toast réel si JpbdSection en a un */}
      />

      <SekretariatAssetsSection
        assetList={assetList}
        isEditing={isEditMode}
        saveAssetItem={saveAssetItem}
        deleteAssetItem={deleteAssetItem}
        onNotify={(type, message) => console.log(type, message) /* remplace par le toast réel si JpbdSection en a un */}
      />

      <SekretariatAssetsSection
        assetList={logistikList}
        isEditing={isEditMode}
        saveAssetItem={saveLogistikItem}
        deleteAssetItem={deleteLogistikItem}
        title="Jumlah Logistik"
        itemNoun="Logistik"
        itemNounLower="logistik"
        namePlaceholder="Cth: Khemah 6x6"
        onNotify={(type, message) => console.log(type, message) /* remplace par le toast réel si JpbdSection en a un */}
      />

      {/* ---- KPI ---- */}
      <KpiSection
        kpiItems={kpiList}
        isEditing={isEditMode}
        updateKpiItem={(form, item) => saveKpiItem(form, item)}
        addKpiItem={(form) => saveKpiItem(form, null)}
        removeKpiItem={(item) => deleteKpiItem(item)}
        persistKpi={reorderKpi}
        showSubSeksyen={false}
      />

      <View style={{ height: 16 }} />
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeaderTitle}>Direktori Agensi (JPBD)</Text>
        {userRole === 'admin' && isEditMode ? (
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={16} color={PALETTE.white} />
            <Text style={styles.addButtonText}>Tambah</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loadingJPBD && jpbdList.length === 0 ? (
        <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 20 }} />
      ) : jpbdList.length === 0 ? (
        <Text style={styles.emptyText}>Tiada rekod dijumpai. Sila tambah agensi.</Text>
      ) : (
        <>
          {/* ---- Pills horizontales ---- */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={jpbdStyles.pillsScroll}
            contentContainerStyle={jpbdStyles.pillsContent}
            {...(Platform.OS === 'web' ? { className: 'jpbd-pills-scroll' } : {})}
          >
            {jpbdList.map((item) => {
              const isSelected = item.id === selectedId;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[jpbdStyles.pill, isSelected && jpbdStyles.pillSelected]}
                  onPress={() => setSelectedId(item.id)}
                  activeOpacity={0.8}
                >
                  {item.logo_url ? (
                    <Image source={{ uri: item.logo_url }} style={jpbdStyles.pillLogo} resizeMode="contain" />
                  ) : (
                    <View style={jpbdStyles.pillLogoPlaceholder}>
                      <Briefcase size={22} color={isSelected ? PALETTE.white : PALETTE.orange} />
                    </View>
                  )}
                  <Text
                    style={[jpbdStyles.pillName, isSelected && jpbdStyles.pillNameSelected]}
                    numberOfLines={1}
                  >
                    {item.agency}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ---- Panneau de détails ---- */}
          {selected ? (
            <View style={jpbdStyles.detailPanel}>
              <View style={jpbdStyles.detailHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={jpbdStyles.detailAgency}>{selected.agency}</Text>
                  {selected.officer ? <Text style={jpbdStyles.detailOfficer}>{selected.officer}</Text> : null}
                </View>
                {userRole === 'admin' && isEditMode ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(selected)}>
                      <Edit size={14} color={PALETTE.white} />
                      <Text style={styles.actionText}>Kemaskini</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDeleteJPBD(selected.id)}>
                      <Trash2 size={14} color={PALETTE.danger} />
                      <Text style={[styles.actionText, { color: PALETTE.danger }]}>Padam</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              <View style={jpbdStyles.infoGrid}>
                <View style={jpbdStyles.infoBox}>
                  <Text style={jpbdStyles.infoLabel}>JAWATAN</Text>
                  <Text style={jpbdStyles.infoValue}>{selected.position || '-'}</Text>
                </View>
                <View style={jpbdStyles.infoBox}>
                  <Text style={jpbdStyles.infoLabel}>GRED</Text>
                  <Text style={jpbdStyles.infoValue}>{selected.grade || '-'}</Text>
                </View>
                <View style={jpbdStyles.infoBox}>
                  <Text style={jpbdStyles.infoLabel}>E-MEL</Text>
                  <Text style={jpbdStyles.infoValue}>{selected.email || '-'}</Text>
                </View>
              </View>

              <Text style={jpbdStyles.groupTitle}>Hubungan & Logistik</Text>
              <View style={jpbdStyles.infoBoxFull}>
                <Text style={jpbdStyles.infoLabel}>ALAMAT</Text>
                <Text style={jpbdStyles.infoValue}>{selected.address || '-'}</Text>
              </View>
              <View style={jpbdStyles.infoGrid}>
                <View style={jpbdStyles.infoBox}>
                  <Text style={jpbdStyles.infoLabel}>TEL (PEJABAT)</Text>
                  <Text style={jpbdStyles.infoValue}>{selected.office_phone || '-'}</Text>
                </View>
                <View style={jpbdStyles.infoBox}>
                  <Text style={jpbdStyles.infoLabel}>TEL (BIMBIT)</Text>
                  <Text style={jpbdStyles.infoValue}>{selected.mobile_phone || '-'}</Text>
                </View>
                <View style={jpbdStyles.infoBox}>
                  <Text style={jpbdStyles.infoLabel}>FAX</Text>
                  <Text style={jpbdStyles.infoValue}>{selected.fax || '-'}</Text>
                </View>
              </View>

              {(selected.officers_count || selected.members_count) ? (
                <>
                  <Text style={jpbdStyles.groupTitle}>Kekuatan Anggota</Text>
                  <View style={jpbdStyles.statsRow}>
                    <View style={jpbdStyles.statCard}>
                      <Text style={jpbdStyles.statNumber}>{selected.officers_count || '0'}</Text>
                      <Text style={jpbdStyles.statCaption}>Pegawai</Text>
                    </View>
                    <View style={jpbdStyles.statCard}>
                      <Text style={jpbdStyles.statNumber}>{selected.members_count || '0'}</Text>
                      <Text style={jpbdStyles.statCaption}>Anggota</Text>
                    </View>
                  </View>
                </>
              ) : null}

              {selected.logistics_assets ? (
                <>
                  <Text style={jpbdStyles.groupTitle}>Logistik & Aset</Text>
                  <View style={jpbdStyles.chipsWrap}>
                    {selected.logistics_assets.split('\n').filter((l) => l.trim()).map((line, i) => (
                      <View key={i} style={jpbdStyles.chip}>
                        <Text style={jpbdStyles.chipText}>{line.trim()}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}
            </View>
          ) : null}
        </>
      )}

      <Modal visible={modalJpbdVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 720, width: '100%', maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{formModeJpbd === 'add' ? 'Tambah Agensi' : 'Kemaskini Agensi'}</Text>
              <TouchableOpacity onPress={() => setModalJpbdVisible(false)}><X size={24} color={PALETTE.textMutedDark} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalForm}>
              <JpbdFormFields
                formJpbd={formJpbd}
                setFormJpbd={setFormJpbd}
                assetRows={assetRows}
                updateAssetRow={updateAssetRow}
                addAssetRow={addAssetRow}
                removeAssetRow={removeAssetRow}
                handlePickLogo={handlePickLogo}
                uploadingLogo={uploadingLogo}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveJPBD}>
                {loadingJPBD ? <ActivityIndicator color={PALETTE.white} /> : <Text style={styles.saveButtonText}>Simpan Rekod</Text>}
              </TouchableOpacity>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Champs de formulaire partagés entre le modal "Tambah Agensi" et l'édition
// inline dans le panneau de détails — évite de dupliquer les mêmes 60 lignes.
function JpbdFormFields({ formJpbd, setFormJpbd, assetRows, updateAssetRow, addAssetRow, removeAssetRow, handlePickLogo, uploadingLogo }) {
  return (
    <>
      <Text style={styles.inputLabel}>Logo Agensi</Text>
      <TouchableOpacity style={jpbdStyles.logoPicker} onPress={handlePickLogo} disabled={uploadingLogo}>
        {uploadingLogo ? (
          <ActivityIndicator color={PALETTE.orange} />
        ) : formJpbd.logo_url ? (
          <Image source={{ uri: formJpbd.logo_url }} style={jpbdStyles.logoPreview} resizeMode="contain" />
        ) : (
          <>
            <ImagePlus size={22} color={PALETTE.textMutedDark} />
            <Text style={jpbdStyles.logoPickerText}>Pilih logo</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Nama Agensi *</Text>
      <TextInput style={styles.input} placeholder="Contoh: PDRM" value={formJpbd.agency} onChangeText={(t) => setFormJpbd({ ...formJpbd, agency: t })} />
      <Text style={styles.inputLabel}>Nama Pegawai</Text>
      <TextInput style={styles.input} placeholder="Nama penuh pegawai" value={formJpbd.officer} onChangeText={(t) => setFormJpbd({ ...formJpbd, officer: t })} />
      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Text style={styles.inputLabel}>Jawatan</Text>
          <TextInput style={styles.input} placeholder="Cth: Pengarah" value={formJpbd.position} onChangeText={(t) => setFormJpbd({ ...formJpbd, position: t })} />
        </View>
        <View style={styles.halfCol}>
          <Text style={styles.inputLabel}>Gred</Text>
          <TextInput style={styles.input} placeholder="Cth: KB 9" value={formJpbd.grade} onChangeText={(t) => setFormJpbd({ ...formJpbd, grade: t })} />
        </View>
      </View>
      <Text style={styles.inputLabel}>E-mel</Text>
      <TextInput style={styles.input} placeholder="emel@domain.com" keyboardType="email-address" value={formJpbd.email} onChangeText={(t) => setFormJpbd({ ...formJpbd, email: t })} />
      <Text style={styles.inputLabel}>Alamat</Text>
      <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Alamat penuh" multiline value={formJpbd.address} onChangeText={(t) => setFormJpbd({ ...formJpbd, address: t })} />
      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Text style={styles.inputLabel}>Tel Pejabat</Text>
          <TextInput style={styles.input} placeholder="087-XXXXXX" keyboardType="phone-pad" value={formJpbd.office_phone} onChangeText={(t) => setFormJpbd({ ...formJpbd, office_phone: t })} />
        </View>
        <View style={styles.halfCol}>
          <Text style={styles.inputLabel}>Tel Bimbit</Text>
          <TextInput style={styles.input} placeholder="01X-XXXXXXX" keyboardType="phone-pad" value={formJpbd.mobile_phone} onChangeText={(t) => setFormJpbd({ ...formJpbd, mobile_phone: t })} />
        </View>
      </View>
      <Text style={styles.inputLabel}>No. Fax</Text>
      <TextInput style={styles.input} placeholder="087-XXXXXX" keyboardType="phone-pad" value={formJpbd.fax} onChangeText={(t) => setFormJpbd({ ...formJpbd, fax: t })} />
      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Text style={styles.inputLabel}>Bil. Pegawai</Text>
          <TextInput style={styles.input} placeholder="Cth: 5" keyboardType="number-pad" value={formJpbd.officers_count} onChangeText={(t) => setFormJpbd({ ...formJpbd, officers_count: t })} />
        </View>
        <View style={styles.halfCol}>
          <Text style={styles.inputLabel}>Bil. Anggota</Text>
          <TextInput style={styles.input} placeholder="Cth: 30" keyboardType="number-pad" value={formJpbd.members_count} onChangeText={(t) => setFormJpbd({ ...formJpbd, members_count: t })} />
        </View>
      </View>
      <Text style={styles.inputLabel}>Logistik & Aset</Text>
      {assetRows.map((row, i) => (
        <View key={i} style={jpbdStyles.assetRow}>
          <TextInput
            style={[styles.input, jpbdStyles.assetNameInput]}
            placeholder="Cth: Bot Aluminium"
            value={row.name}
            onChangeText={(t) => updateAssetRow(i, 'name', t)}
          />
          <TextInput
            style={[styles.input, jpbdStyles.assetQtyInput]}
            placeholder="Bil."
            keyboardType="number-pad"
            value={row.qty}
            onChangeText={(t) => updateAssetRow(i, 'qty', t)}
          />
          <TouchableOpacity style={jpbdStyles.assetRemoveBtn} onPress={() => removeAssetRow(i)}>
            <Trash2 size={16} color={PALETTE.danger} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={jpbdStyles.assetAddBtn} onPress={addAssetRow}>
        <Plus size={14} color={PALETTE.orange} />
        <Text style={jpbdStyles.assetAddText}>Tambah Aset</Text>
      </TouchableOpacity>
    </>
  );
}

const jpbdStyles = StyleSheet.create({
  // Pills
  pillsScroll: { marginBottom: 12 },
  pillsContent: { gap: 10, paddingBottom: 10, paddingHorizontal: 2 },
  pill: {
    width: 150, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 10,
    borderRadius: 12, backgroundColor: PALETTE.white,
    borderWidth: 1, borderColor: PALETTE.orange,
  },
  pillSelected: { backgroundColor: PALETTE.orange },
  pillLogo: { width: 64, height: 64, marginBottom: 8, borderRadius: 10, backgroundColor: PALETTE.white },
  pillLogoPlaceholder: { width: 64, height: 64, marginBottom: 8, alignItems: 'center', justifyContent: 'center' },
  pillName: { fontSize: 13, fontWeight: '700', color: PALETTE.textDark, textAlign: 'center' },
  pillNameSelected: { color: PALETTE.white },

  // Panneau de détails
  detailPanel: {
    backgroundColor: PALETTE.white, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  detailHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 8 },
  detailAgency: { fontSize: 18, fontWeight: '800', color: PALETTE.textDark },
  detailOfficer: { fontSize: 13, color: PALETTE.textMutedDark, marginTop: 2 },

  groupTitle: {
    fontSize: 13, fontWeight: '800', color: PALETTE.orange,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: 14, marginBottom: 8,
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoBox: {
    flexGrow: 1, flexBasis: '30%', minWidth: 150,
    backgroundColor: PALETTE.softOrangeBg || '#FFF4EC',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10,
  },
  infoBoxFull: {
    backgroundColor: PALETTE.softOrangeBg || '#FFF4EC',
    borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10, marginBottom: 8,
  },
  infoLabel: { fontSize: 10, fontWeight: '700', color: PALETTE.textMutedDark, letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600', color: PALETTE.textDark },

  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: PALETTE.softOrangeBg || '#FFF4EC',
    borderRadius: 10, borderWidth: 1, borderColor: PALETTE.cardLightBorder,
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: PALETTE.orange },
  statCaption: { fontSize: 12, fontWeight: '600', color: PALETTE.textMutedDark, marginTop: 2 },

  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: PALETTE.softOrangeBg || '#FFF4EC',
    borderRadius: 14, paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, borderColor: '#F9731640',
  },
  chipText: { fontSize: 12, color: PALETTE.textDark },

  // Liste dynamique d'assets (modale)
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  assetNameInput: { flex: 1, marginBottom: 0 },
  assetQtyInput: { width: 70, marginBottom: 0, textAlign: 'center' },
  assetRemoveBtn: { padding: 6 },
  assetAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.orange,
    borderRadius: 8, paddingVertical: 8, marginTop: 2, marginBottom: 4,
  },
  assetAddText: { fontSize: 13, fontWeight: '700', color: PALETTE.orange },

  // Modale logo
  logoPicker: {
    height: 90, borderWidth: 1, borderStyle: 'dashed', borderColor: PALETTE.textMutedDark,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 8, gap: 4,
  },
  logoPreview: { width: 80, height: 80 },
  logoPickerText: { fontSize: 12, color: PALETTE.textMutedDark },
});
