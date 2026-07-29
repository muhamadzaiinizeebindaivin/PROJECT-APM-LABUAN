// src/screens/operasi/Ng999ReportTab.js
import React, { useState, useMemo, useRef, useEffect, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Alert, Platform, Image } from 'react-native';
import { Plus, Edit2, Trash2, X, Camera, Image as ImageIcon } from 'lucide-react-native';
import ModalSelectField from '../../components/ModalSelectField';
import { useNg999Report } from '../../hooks/useNg999Report';
import { CATEGORY_OPTIONS } from '../../constants/operasiConstants';
import { BULAN_MS, BULAN_OPTIONS } from '../../constants/bulan';
import { formStyles } from '../../styles/formStyles';
import { reportStyles as styles } from './reportStyles';
import { mapStyles as tableStyles } from './mapStyles';
import CalamitySummaryContent from './CalamitySummaryContent';
import { PALETTE } from '../../constants/palette';

const STATUS_LIST = [
  { key: 'active', label: 'Aktif', color: '#3b82f6' },
  { key: 'berjaya', label: 'Berjaya', color: '#16a34a' },
  { key: 'gagal', label: 'Gagal', color: '#dc2626' },
  { key: 'batal', label: 'Batal', color: '#d97706' },
  { key: 'tunda', label: 'Tunda', color: '#7c3aed' },
  { key: 'diambil agensi lain', label: 'Diambil Agensi Lain', color: '#0891b2' },
  { key: 'diserah ke agensi lain', label: 'Diserah Agensi Lain', color: '#0f766e' },
];
const statusLabel = (key) => STATUS_LIST.find(s => s.key === key)?.label || 'Aktif';
const statusColor = (key) => STATUS_LIST.find(s => s.key === key)?.color || '#3b82f6';

export default function Ng999ReportTab({ theme, userRole, isEditMode }) {
  const now = new Date();

  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(now.getMonth()); // mois courant par défaut
  const [filterDay, setFilterDay] = useState(null);
  const [filterYearOpen, setFilterYearOpen] = useState(false);
  const [filterMonthOpen, setFilterMonthOpen] = useState(false);
  const [filterDayOpen, setFilterDayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('ringkasan');
  const tableScrollRef = useRef(null);
  const pageScrollRef = useRef(null);
  const tableTitleRef = useRef(null);

  // Passer filterYear et filterMonth au hook pour fetch filtré
  const { ngData, loadingNg, saveRecord, deleteRecord, deletePhoto, addPhotosToRecord, availableYears } = useNg999Report(filterYear, filterMonth);

  // Modale
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ id: null, category: '', tarikh: '', jumlah_kes: '1', status: 'active' });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [savingRecord, setSavingRecord] = useState(false);

  // Visionneuse photo
  const [photoViewer, setPhotoViewer] = useState(null); // { photos: [], index: 0 }

  const daysInFilterMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
  const dayOptions = ['Semua Hari', ...Array.from({ length: daysInFilterMonth }, (_, i) => String(i + 1))];

  const filteredNgData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ngData.filter(item => {
      if (filterDay !== null && new Date(item.tarikh).getDate() !== filterDay) return false;
      if (q && !(item.category || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ngData, filterDay, searchQuery]);

  useEffect(() => {
    if (tableScrollRef.current) tableScrollRef.current.scrollTo({ y: 0, animated: false });
    if (tableTitleRef.current && pageScrollRef.current) {
      tableTitleRef.current.measureLayout(
        pageScrollRef.current,
        (x, y) => { pageScrollRef.current.scrollTo({ y, animated: true }); },
        () => {}
      );
    }
  }, [filterMonth, filterDay, filterYear, viewMode]);

  const groupItemsByDay = (items) => {
    const groups = {};
    items.forEach(item => {
      const key = item.tarikh;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const handlePickPhotos = () => {
    if (Platform.OS !== 'web') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.jpg,.jpeg,.png,.gif,.webp,.heic';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      const newPending = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
      setPendingFiles(prev => [...prev, ...newPending]);
    };
    input.click();
  };

  const handleRemovePendingPhoto = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingPhoto = async (photo) => {
    if (!window.confirm('Delete this photo?')) return;
    await deletePhoto(photo.id, photo.photo_url);
  };

  const handleSaveNg = async () => {
    if (!form.category || !form.tarikh || !form.jumlah_kes) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const caseAmount = parseInt(form.jumlah_kes, 10);
    if (isNaN(caseAmount) || caseAmount < 1) {
      Alert.alert('Error', 'Amount of cases must be a valid number greater than 0.');
      return;
    }
    setSavingRecord(true);
    const { error, recordId } = await saveRecord({ id: form.id, category: form.category, tarikh: form.tarikh, jumlah_kes: caseAmount, status: form.status });
    if (!error && pendingFiles.length > 0) {
      await addPhotosToRecord(recordId, pendingFiles.map(p => p.file));
    }
    setSavingRecord(false);
    closeModal();
  };

  const handleDeleteNg = async (id) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this record?')) await deleteRecord(id);
    } else {
      Alert.alert('Confirmation', 'Are you sure you want to delete this record?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRecord(id); } }
      ]);
    }
  };

  const openEditModal = (record) => {
    setForm({ id: record.id, category: record.category, tarikh: record.tarikh, jumlah_kes: (record.jumlah_kes || 1).toString(), status: record.status || 'active' });
    setPendingFiles([]);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCategoryOpen(false);
    setStatusOpen(false);
    setPendingFiles([]);
    setForm({ id: null, category: '', tarikh: '', jumlah_kes: '1', status: 'active' });
  };

  const existingPhotos = form.id ? (ngData.find(r => r.id === form.id)?.ng999_photos || []) : [];

  const tableHeader = (
    <View style={tableStyles.calamityTableHeaderRow}>
      <View style={[{ flex: 2 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Kategori Kes</Text>
      </View>
      <View style={[{ flex: 1 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Tarikh</Text>
      </View>
      <View style={[{ flex: 1 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Jumlah</Text>
      </View>
      <View style={[{ flex: 1.2 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Status</Text>
      </View>
      <View style={[{ flex: 1.2 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Foto</Text>
      </View>
      {isEditMode && (
        <View style={[{ flex: 1 }, tableStyles.calamityHeaderCellBox]}>
          <Text style={tableStyles.calamityTableHeaderCell}>Aksi</Text>
        </View>
      )}
    </View>
  );

  const renderPhotoStrip = (photos) => {
    if (!photos || photos.length === 0) {
      return <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>Tiada Foto</Text>;
    }
    return (
      <TouchableOpacity onPress={() => setPhotoViewer({ photos, index: null })}>
        <Text style={{ fontSize: 11, color: PALETTE.orange, fontWeight: '700' }}>Lihat Foto ({photos.length})</Text>
      </TouchableOpacity>
    );
  };

  const renderDayGroup = (tarikh, dayItems) => (
    <View key={tarikh} style={{ borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
      <View style={{ backgroundColor: PALETTE.orange, paddingHorizontal: 14, paddingVertical: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{tarikh}</Text>
      </View>
      {dayItems.map((item, index) => (
        <View key={item.id} style={[tableStyles.calamityTableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
          <Text style={[tableStyles.calamityTableCell, { flex: 2, textAlign: 'left', paddingLeft: 16 }]} numberOfLines={1}>
            {item.category}
          </Text>
          <Text style={[tableStyles.calamityTableCell, { flex: 1 }]}>{item.tarikh}</Text>
          <Text style={[tableStyles.calamityTableCell, { flex: 1, fontWeight: '800' }]}>{item.jumlah_kes || 1}</Text>
          <View style={[{ flex: 1.2 }, tableStyles.calamitySummaryCellBox, { paddingVertical: 8, alignItems: 'center' }]}>
            <View style={{ backgroundColor: statusColor(item.status) + '18', borderWidth: 1, borderColor: statusColor(item.status), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: statusColor(item.status) }}>{statusLabel(item.status)}</Text>
            </View>
          </View>
          <View style={[{ flex: 1.2 }, tableStyles.calamitySummaryCellBox, { paddingVertical: 8 }]}>
            {renderPhotoStrip(item.ng999_photos)}
          </View>
          {isEditMode && (
            <View style={[{ flex: 1 }, styles.actionBtns, { justifyContent: 'center' }]}>
              <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                <Edit2 size={16} color="#22c55e" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteNg(item.id)} style={styles.iconBtn}>
                <Trash2 size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <>
      <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>

        <View style={[styles.crudContainer, { marginBottom: 12 }]}>
          <View style={[styles.reportHeader, { marginBottom: 12 }]}>
            <Text style={styles.reportTitle}>Emergency Case Report</Text>
            <Text style={{ color: PALETTE.textMutedDark, fontWeight: '600' }}>NG 999 W.P. Labuan {now.getFullYear()}</Text>
          </View>
          <CalamitySummaryContent theme={theme} mode="chart" statsOnly />
        </View>

        <View style={{ height: 12 }} />

        <View style={[styles.crudContainer, { marginBottom: 12 }]}>
          <View style={[styles.crudHeader, { flexWrap: 'wrap', gap: 8 }]}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 }}>
              <TouchableOpacity onPress={() => setViewMode('ringkasan')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: viewMode === 'ringkasan' ? PALETTE.orange : PALETTE.surface }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: viewMode === 'ringkasan' ? PALETTE.white : PALETTE.textMutedDark }}>Ringkasan Kecemasan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode('senarai')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: viewMode === 'senarai' ? PALETTE.orange : PALETTE.surface }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: viewMode === 'senarai' ? PALETTE.white : PALETTE.textMutedDark }}>Senarai Penuh Kecemasan</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode('trend')} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: viewMode === 'trend' ? PALETTE.orange : PALETTE.surface }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: viewMode === 'trend' ? PALETTE.white : PALETTE.textMutedDark }}>Analisis & Statistik</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>

        {/* --- Filtres Senarai --- */}
        {viewMode === 'senarai' && (
          <>
            {isEditMode && (
              <View style={{ paddingHorizontal: 16, marginBottom: 8, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={styles.addBtn} onPress={() => { setForm({ id: null, category: '', tarikh: '', jumlah_kes: '1', status: 'active' }); setPendingFiles([]); setModalVisible(true); }}>
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Tambah Rekod</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={[tableStyles.historyFilterRow, { marginBottom: 4 }]}>
              <View style={{ flex: 1 }}>
                <ModalSelectField theme={theme} label="Tahun" value={String(filterYear)} placeholder="Tahun"
                  options={availableYears.map(String)} isOpen={filterYearOpen}
                  onToggle={() => { setFilterYearOpen(!filterYearOpen); setFilterMonthOpen(false); setFilterDayOpen(false); }}
                  onSelect={(opt) => { setFilterYear(Number(opt)); setFilterDay(null); setFilterYearOpen(false); }}
                  stackIndex={3000} />
              </View>
              <View style={{ flex: 1 }}>
                <ModalSelectField theme={theme} label="Bulan" value={BULAN_MS[filterMonth]}
                  placeholder="Bulan" options={BULAN_MS} isOpen={filterMonthOpen}
                  onToggle={() => { setFilterMonthOpen(!filterMonthOpen); setFilterYearOpen(false); setFilterDayOpen(false); }}
                  onSelect={(opt) => { setFilterMonth(BULAN_MS.indexOf(opt)); setFilterDay(null); setFilterMonthOpen(false); }}
                  stackIndex={2000} />
              </View>
              <View style={{ flex: 1 }}>
                <ModalSelectField theme={theme} label="Hari" value={filterDay === null ? 'Semua Hari' : String(filterDay)}
                  placeholder="Hari" options={dayOptions} isOpen={filterDayOpen}
                  onToggle={() => { setFilterDayOpen(!filterDayOpen); setFilterYearOpen(false); setFilterMonthOpen(false); }}
                  onSelect={(opt) => { setFilterDay(opt === 'Semua Hari' ? null : Number(opt)); setFilterDayOpen(false); }}
                  stackIndex={1000} />
              </View>
            </View>
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <TextInput
                style={[formStyles.inputField, { backgroundColor: PALETTE.surface, color: PALETTE.textDark, borderColor: PALETTE.cardLightBorder, borderWidth: 1, outlineStyle: 'none' }]}
                placeholder="Cari kategori kes..." placeholderTextColor={PALETTE.textMutedDark}
                value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            {isEditMode && (
              <View style={{ paddingHorizontal: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity style={styles.addBtn} onPress={() => { setForm({ id: null, category: '', tarikh: '', jumlah_kes: '1', status: 'active' }); setPendingFiles([]); setModalVisible(true); }}>
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Tambah Rekod</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={{ minHeight: 500, paddingBottom: 16 }}>
          {loadingNg ? (
            <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginVertical: 20 }} />
          ) : viewMode === 'ringkasan' ? (
            <CalamitySummaryContent theme={theme} mode="table" isEditMode={isEditMode} />
          ) : viewMode === 'trend' ? (
            <CalamitySummaryContent theme={theme} mode="chart" isEditMode={isEditMode} />
          ) : filteredNgData.length === 0 ? (
            <Text style={{ color: PALETTE.textMutedDark, textAlign: 'center', marginVertical: 10 }}>Tiada rekod dijumpai.</Text>
          ) : (
            <View style={[tableStyles.calamityTableWrapper, { borderColor: '#475569' }]}>
              {tableHeader}
              <ScrollView ref={tableScrollRef} showsVerticalScrollIndicator={true}>
                <View style={{ padding: 8 }}>
                  {groupItemsByDay(filteredNgData).map(([tarikh, dayItems]) => renderDayGroup(tarikh, dayItems))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

      </ScrollView>

      {/* --- Modale ajout/modification --- */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={formStyles.modalOverlay}>
          <View style={[formStyles.modalContent, { backgroundColor: PALETTE.cardLight }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: PALETTE.textDark }}>
                {form.id ? 'Update Record' : 'Add New Record'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>

            <ModalSelectField theme={theme} label="Case Category" value={form.category}
              placeholder="Select Category..." options={CATEGORY_OPTIONS.map(o => o.split(' - ')[0])} isOpen={categoryOpen}
              onToggle={() => setCategoryOpen(!categoryOpen)}
              onSelect={(opt) => { setForm({ ...form, category: opt }); setCategoryOpen(false); }}
              stackIndex={2000} />

            <View style={[formStyles.inputGroup, { zIndex: 1 }]}>
              <Text style={[formStyles.inputLabel, { color: PALETTE.textMutedDark }]}>Tarikh</Text>
              {Platform.OS === 'web' ? (
                createElement('input', {
                  type: 'date', value: form.tarikh || '',
                  onChange: (e) => setForm({ ...form, tarikh: e.target.value }),
                  style: { width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${PALETTE.cardLightBorder}`, backgroundColor: PALETTE.surface, color: PALETTE.textDark, fontSize: 14, boxSizing: 'border-box' },
                })
              ) : (
                <TextInput style={[formStyles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary}
                  value={form.tarikh} onChangeText={(t) => setForm({ ...form, tarikh: t })} />
              )}
            </View>

            <View style={[formStyles.inputGroup, { zIndex: 1 }]}>
              <Text style={[formStyles.inputLabel, { color: PALETTE.textMutedDark }]}>Amount of Cases</Text>
              <TextInput style={[formStyles.inputField, { backgroundColor: PALETTE.surface, color: PALETTE.textDark, borderColor: PALETTE.cardLightBorder }]}
                placeholder="E.g., 5" placeholderTextColor={PALETTE.textMutedDark}
                keyboardType="numeric" value={form.jumlah_kes.toString()}
                onChangeText={(text) => setForm({ ...form, jumlah_kes: text.replace(/[^0-9]/g, '') })} />
            </View>

            <ModalSelectField theme={theme} label="Status" value={statusLabel(form.status)}
              placeholder="Select Status..." options={STATUS_LIST.map(s => s.label)} isOpen={statusOpen}
              onToggle={() => { setStatusOpen(!statusOpen); setCategoryOpen(false); }}
              onSelect={(opt) => { setForm({ ...form, status: STATUS_LIST.find(s => s.label === opt)?.key || 'active' }); setStatusOpen(false); }}
              stackIndex={1500} />

            {/* --- Section photos --- */}
            <View style={[formStyles.inputGroup, { zIndex: 1 }]}>
              <Text style={[formStyles.inputLabel, { color: PALETTE.textMutedDark }]}>Foto</Text>

              {existingPhotos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {existingPhotos.map((photo) => (
                      <View key={photo.id} style={{ position: 'relative' }}>
                        <TouchableOpacity onPress={() => setPhotoViewer({ photos: existingPhotos, index: null })}>
                          <Image source={{ uri: photo.photo_url }} style={{ width: 80, height: 80, borderRadius: 8 }} resizeMode="cover" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteExistingPhoto(photo)}
                          style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}
                        >
                          <X size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              {pendingFiles.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {pendingFiles.map((p, index) => (
                      <View key={index} style={{ position: 'relative' }}>
                        <Image source={{ uri: p.preview }} style={{ width: 80, height: 80, borderRadius: 8, opacity: 0.8 }} resizeMode="cover" />
                        <TouchableOpacity
                          onPress={() => handleRemovePendingPhoto(index)}
                          style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#64748b', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}
                        >
                          <X size={12} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              <TouchableOpacity
                onPress={handlePickPhotos}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10 }}
              >
                <Camera size={18} color="#64748b" />
                <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 13 }}>
                  {existingPhotos.length + pendingFiles.length > 0 ? 'Tambah Foto Lagi' : 'Pilih Foto'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[formStyles.saveBtn, (savingRecord || categoryOpen) && { opacity: 0.7 }]}
              onPress={handleSaveNg} disabled={savingRecord || categoryOpen || statusOpen}
            >
              {savingRecord ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Save Record</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

{/* Visionneuse photo plein écran avec navigation */}
      {photoViewer && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' }}>
            {/* Bouton fermer / retour */}
            <TouchableOpacity
              onPress={() => {
                if (photoViewer.index !== null) {
                  setPhotoViewer(prev => ({ ...prev, index: null }));
                } else {
                  setPhotoViewer(null);
                }
              }}
              style={{ position: 'absolute', top: 40, right: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}
            >
              <X size={20} color="#fff" />
            </TouchableOpacity>

            {/* Compteur */}
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', marginBottom: 12, opacity: 0.8 }}>
              {photoViewer.index === null ? `${photoViewer.photos.length} foto` : `${photoViewer.index + 1} / ${photoViewer.photos.length}`}
            </Text>

            {/* Galerie */}
            {photoViewer.index === null ? (
              // Vue grille
              <View style={{ width: '90%' }}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {photoViewer.photos.map((photo, i) => (
                      <TouchableOpacity
                        key={photo.id}
                        onPress={() => setPhotoViewer(prev => ({ ...prev, index: i }))}
                        style={{
                          borderRadius: 12, overflow: 'hidden',
                          shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8,
                        }}
                      >
                        <Image
                          source={{ uri: photo.photo_url }}
                          style={{ width: 160, height: 160 }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ) : (
              // Vue plein écran
              <>
                <Image
                  source={{ uri: photoViewer.photos[photoViewer.index].photo_url }}
                  style={{ width: '90%', height: '65%', borderRadius: 12 }}
                  resizeMode="contain"
                />
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 20 }}>
                  <TouchableOpacity
                    onPress={() => setPhotoViewer(prev => ({ ...prev, index: prev.index - 1 }))}
                    disabled={photoViewer.index === 0}
                    style={{
                      backgroundColor: photoViewer.index === 0 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                      paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: photoViewer.index === 0 ? 'rgba(255,255,255,0.3)' : '#fff', fontWeight: '700' }}>← Sebelum</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setPhotoViewer(prev => ({ ...prev, index: prev.index + 1 }))}
                    disabled={photoViewer.index === photoViewer.photos.length - 1}
                    style={{
                      backgroundColor: photoViewer.index === photoViewer.photos.length - 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.25)',
                      paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: photoViewer.index === photoViewer.photos.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff', fontWeight: '700' }}>Selepas →</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </Modal>
      )}
    </>
  );
}
