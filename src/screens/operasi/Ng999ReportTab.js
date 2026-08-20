// src/screens/operasi/Ng999ReportTab.js
import React, { useState, useMemo, useRef, useEffect, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Alert, Platform, useWindowDimensions } from 'react-native';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, AlertTriangle, ChevronLeft, ChevronRight, LayoutGrid, ListChecks, BarChart2, Info } from 'lucide-react-native';
import ModalSelectField from '../../components/ModalSelectField';
import { useNg999Report } from '../../hooks/useNg999Report';
import { CATEGORY_OPTIONS } from '../../constants/operasiConstants';
import { BULAN_MS, BULAN_OPTIONS } from '../../constants/bulan';
import { formStyles } from '../../styles/formStyles';
import { reportStyles as styles } from './reportStyles';
import { mapStyles as tableStyles } from './mapStyles';
import CalamitySummaryContent from './CalamitySummaryContent';
import { pentadbiranStyles } from '../pentadbiran/pentadbiranStyles';
import { PALETTE } from '../../constants/palette';

const RECORDS_PER_PAGE = 10;

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
const NON_SUCCESS_STATUSES = ['gagal', 'batal', 'tunda', 'diambil agensi lain', 'diserah ke agensi lain'];

export default function Ng999ReportTab({ theme, isEditMode, onNotify }) {
  const { width: screenWidth } = useWindowDimensions();
  const isMobile = screenWidth < 768;
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
  const { ngData, loadingNg, saveRecord, deleteRecord, availableYears } = useNg999Report(filterYear, filterMonth);

  // Modale
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ id: null, category: '', tarikh: '', status: 'active', keterangan: '', description: '' });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recordPage, setRecordPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const displayDetailItemRef = useRef(null);
  if (detailItem) displayDetailItemRef.current = detailItem;

  const daysInFilterMonth = filterMonth !== null ? new Date(filterYear, filterMonth + 1, 0).getDate() : 0;
  const dayOptions = filterMonth !== null
    ? ['Semua Hari', ...Array.from({ length: daysInFilterMonth }, (_, i) => String(i + 1))]
    : ['Semua Hari'];

  const filteredNgData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ngData
      .filter(item => {
        if (filterDay !== null && new Date(item.tarikh).getDate() !== filterDay) return false;
        if (q && !(item.category || '').toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => b.tarikh.localeCompare(a.tarikh));
  }, [ngData, filterDay, searchQuery]);

  const totalRecordPages = Math.max(1, Math.ceil(filteredNgData.length / RECORDS_PER_PAGE));
  const pagedNgData = filteredNgData.slice((recordPage - 1) * RECORDS_PER_PAGE, recordPage * RECORDS_PER_PAGE);

  useEffect(() => {
    setRecordPage(1);
  }, [filterMonth, filterDay, filterYear, searchQuery, viewMode]);

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

  const handleSaveNg = async () => {
    if (!form.category || !form.tarikh) {
      onNotify?.('error', 'Sila lengkapkan semua medan.');
      return;
    }
    if (NON_SUCCESS_STATUSES.includes(form.status) && !form.keterangan.trim()) {
      onNotify?.('error', 'Sila nyatakan sebab/keterangan untuk status ini.');
      return;
    }
    setSavingRecord(true);
    const { error } = await saveRecord({ id: form.id, category: form.category, tarikh: form.tarikh, status: form.status, keterangan: form.keterangan, description: form.description });
    setSavingRecord(false);
    closeModal();
    onNotify?.(error ? 'error' : 'success', error ? 'Gagal menyimpan rekod.' : (form.id ? 'Rekod berjaya dikemaskini.' : 'Rekod berjaya ditambah.'));
  };

  const handleDeleteNg = (id) => setConfirmDeleteId(id);

  const confirmDelete = async () => {
    setIsDeleting(true);
    const result = await deleteRecord(confirmDeleteId);
    setIsDeleting(false);
    setConfirmDeleteId(null);
    onNotify?.(result === false ? 'error' : 'success', result === false ? 'Gagal memadam rekod.' : 'Rekod berjaya dipadam.');
  };

  const openEditModal = (record) => {
    setForm({ id: record.id, category: record.category, tarikh: record.tarikh, status: record.status || 'active', keterangan: record.keterangan || '', description: record.description || '' });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCategoryOpen(false);
    setStatusOpen(false);
    setForm({ id: null, category: '', tarikh: '', status: 'active', keterangan: '', description: '' });
  };

  const tableHeader = (
    <View style={tableStyles.calamityTableHeaderRow}>
      <View style={[{ flex: 2 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Kategori Kes</Text>
      </View>
      <View style={[{ flex: 1 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Tarikh</Text>
      </View>
      <View style={[{ flex: 1.2 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Status</Text>
      </View>
      {isEditMode && (
        <View style={[{ flex: 1 }, tableStyles.calamityHeaderCellBox]}>
          <Text style={tableStyles.calamityTableHeaderCell}>Aksi</Text>
        </View>
      )}
    </View>
  );

  const renderRecordRow = (item, index) => (
    <TouchableOpacity
      key={item.id}
      activeOpacity={isEditMode ? 0.6 : 1}
      onPress={() => { if (isEditMode) openEditModal(item); else setDetailItem(item); }}
      style={[tableStyles.calamityTableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}
    >
      <Text style={[tableStyles.calamityTableCell, { flex: 2, textAlign: 'left', paddingLeft: 16 }]} numberOfLines={1}>
        {item.category}
      </Text>
      <Text style={[tableStyles.calamityTableCell, { flex: 1 }]}>{item.tarikh}</Text>
      <View style={[{ flex: 1.2 }, tableStyles.calamitySummaryCellBox, { paddingVertical: 8, alignItems: 'center' }]}>
        <View style={{ backgroundColor: statusColor(item.status) + '18', borderWidth: 1, borderColor: statusColor(item.status), borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: statusColor(item.status) }}>{statusLabel(item.status)}</Text>
        </View>
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
    </TouchableOpacity>
  );

  return (
    <>
      <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>

        <View style={[styles.crudContainer, { marginBottom: 12 }]}>
          <View style={[styles.reportHeader, { marginBottom: 12 }]}>
            <Text style={styles.reportTitle}>Emergency Case Report</Text>
            <Text style={{ color: PALETTE.textMutedDark, fontWeight: '600' }}>NG 999 W.P. Labuan {now.getFullYear()}</Text>
          </View>
          <CalamitySummaryContent theme={theme} mode="chart" statsOnly onNotify={onNotify} />
        </View>

        <View style={{ height: 12 }} />

        <View style={[styles.crudContainer, { marginBottom: 12 }]}>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {[
              { key: 'ringkasan', label: 'Ringkasan Kecemasan', Icon: LayoutGrid },
              { key: 'senarai', label: 'Data Harian', Icon: ListChecks },
              { key: 'trend', label: 'Analisis & Statistik', Icon: BarChart2 },
            ].map(({ key, label, Icon }) => {
              const isActive = viewMode === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setViewMode(key)}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: isMobile ? 5 : 8,
                    paddingHorizontal: isMobile ? 10 : 16, paddingVertical: isMobile ? 8 : 11, borderRadius: 999,
                    backgroundColor: isActive ? PALETTE.orange : '#fff',
                    borderWidth: 1.5, borderColor: isActive ? PALETTE.orange : PALETTE.cardLightBorder,
                    shadowColor: isActive ? PALETTE.orange : '#000',
                    shadowOffset: { width: 0, height: isActive ? 4 : 1 },
                    shadowOpacity: isActive ? 0.3 : 0.04,
                    shadowRadius: isActive ? 8 : 3,
                    elevation: isActive ? 4 : 1,
                  }}
                >
                  <Icon size={isMobile ? 12 : 15} color={isActive ? '#fff' : PALETTE.textMutedDark} />
                  <Text style={{ fontSize: isMobile ? 11 : 13, fontWeight: '700', color: isActive ? '#fff' : PALETTE.textMutedDark }}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* --- Filtres Senarai --- */}
        {viewMode === 'senarai' && (
          <>
            <View style={{
              flexDirection: 'row', gap: 10, backgroundColor: '#fef2f2', borderWidth: 1.5, borderColor: '#fecaca',
              borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 12,
            }}>
              <Info size={20} color="#dc2626" style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: '#991b1b', lineHeight: 20 }}>
                PERINGATAN : Setiap rekod di sini (bertarikh) dikira secara automatik dalam{' '}
                <Text style={{ fontWeight: '800' }}>Ringkasan Kecemasan</Text>. Jangan masukkan semula data yang
                sama di jadual Ringkasan Kecemasan — jadual itu hanya untuk data tidak berdata harian.
              </Text>
            </View>
            <View style={[tableStyles.historyFilterRow, { marginBottom: 4 }, isMobile && { flexWrap: 'wrap', rowGap: 10 }]}>
              <View style={isMobile ? { flexBasis: '48%' } : { flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 6 }}>Tahun</Text>
                <TouchableOpacity
                  onPress={() => setFilterYearOpen(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>{filterYear}</Text>
                </TouchableOpacity>
              </View>
              <View style={isMobile ? { flexBasis: '48%' } : { flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 6 }}>Bulan</Text>
                <TouchableOpacity
                  onPress={() => setFilterMonthOpen(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>{filterMonth === null ? 'Semua Bulan' : BULAN_MS[filterMonth]}</Text>
                </TouchableOpacity>
              </View>
              <View style={isMobile ? { flexBasis: '100%' } : { flex: 1, opacity: filterMonth === null ? 0.5 : 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark, marginBottom: 6 }}>Hari</Text>
                <TouchableOpacity
                  disabled={filterMonth === null}
                  onPress={() => setFilterDayOpen(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>{filterDay === null ? 'Semua Hari' : filterDay}</Text>
                </TouchableOpacity>
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
                <TouchableOpacity style={styles.addBtn} onPress={() => { setForm({ id: null, category: '', tarikh: '', status: 'active', keterangan: '', description: '' }); setModalVisible(true); }}>
                  <Plus size={16} color="#fff" />
                  <Text style={styles.addBtnText}>Tambah Rekod</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <View style={{ paddingBottom: 16 }}>
          {loadingNg ? (
            <ActivityIndicator size="small" color={PALETTE.orange} style={{ marginVertical: 20 }} />
          ) : viewMode === 'ringkasan' ? (
            <CalamitySummaryContent theme={theme} mode="table" isEditMode={isEditMode} onNotify={onNotify} />
          ) : viewMode === 'trend' ? (
            <CalamitySummaryContent theme={theme} mode="chart" isEditMode={isEditMode} onNotify={onNotify} />
          ) : filteredNgData.length === 0 ? (
            <Text style={{ color: PALETTE.textMutedDark, textAlign: 'center', marginVertical: 10 }}>Tiada rekod dijumpai.</Text>
          ) : (
            <>
              <View style={[tableStyles.calamityTableWrapper, { borderColor: '#475569' }]}>
                {tableHeader}
                <View style={{ padding: 8 }}>
                  {pagedNgData.map((item, index) => renderRecordRow(item, index))}
                </View>
              </View>

              {totalRecordPages > 1 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 14 }}>
                  <TouchableOpacity
                    style={[{ padding: 8, backgroundColor: PALETTE.surface, borderRadius: 8 }, recordPage === 1 && { opacity: 0.5 }]}
                    onPress={() => setRecordPage(p => Math.max(1, p - 1))}
                    disabled={recordPage === 1}
                  >
                    <ChevronLeft size={16} color={recordPage === 1 ? PALETTE.cardLightBorder : PALETTE.orange} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark }}>{recordPage} / {totalRecordPages}</Text>
                  <TouchableOpacity
                    style={[{ padding: 8, backgroundColor: PALETTE.surface, borderRadius: 8 }, recordPage === totalRecordPages && { opacity: 0.5 }]}
                    onPress={() => setRecordPage(p => Math.min(totalRecordPages, p + 1))}
                    disabled={recordPage === totalRecordPages}
                  >
                    <ChevronRight size={16} color={recordPage === totalRecordPages ? PALETTE.cardLightBorder : PALETTE.orange} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>

      </ScrollView>

      {/* --- Modale ajout/modification --- */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={formStyles.modalOverlay}>
          <View style={[formStyles.modalContent, { backgroundColor: PALETTE.cardLight }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: PALETTE.textDark }}>
                {form.id ? 'Update Record' : 'Tambah Rekod Baru'}
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
              <Text style={[formStyles.inputLabel, { color: PALETTE.textMutedDark }]}>Keterangan</Text>
              <TextInput
                style={[formStyles.inputField, { backgroundColor: PALETTE.surface, color: PALETTE.textDark, borderColor: PALETTE.cardLightBorder, borderWidth: 1, minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none' }]}
                placeholder="Penerangan asal kes (jika ada)"
                placeholderTextColor={PALETTE.textMutedDark}
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
                multiline
              />
            </View>

            <ModalSelectField theme={theme} label="Status" value={statusLabel(form.status)}
              placeholder="Select Status..." options={STATUS_LIST.map(s => s.label)} isOpen={statusOpen}
              onToggle={() => { setStatusOpen(!statusOpen); setCategoryOpen(false); }}
              onSelect={(opt) => { setForm({ ...form, status: STATUS_LIST.find(s => s.label === opt)?.key || 'active' }); setStatusOpen(false); }}
              stackIndex={1500} />

            {form.status !== 'berjaya' && (
              <View style={[formStyles.inputGroup, { zIndex: 1 }]}>
                <Text style={[formStyles.inputLabel, { color: PALETTE.textMutedDark }]}>
                  Sebab {statusLabel(form.status)}{NON_SUCCESS_STATUSES.includes(form.status) ? ' *' : ''}
                </Text>
                <TextInput
                  style={[formStyles.inputField, { backgroundColor: PALETTE.surface, color: PALETTE.textDark, borderColor: PALETTE.cardLightBorder, borderWidth: 1, minHeight: 80, textAlignVertical: 'top', outlineStyle: 'none' }]}
                  placeholder="Nyatakan sebab status ini..."
                  placeholderTextColor={PALETTE.textMutedDark}
                  value={form.keterangan}
                  onChangeText={(t) => setForm({ ...form, keterangan: t })}
                  multiline
                />
              </View>
            )}

            <TouchableOpacity
              style={[formStyles.saveBtn, (savingRecord || categoryOpen) && { opacity: 0.7 }]}
              onPress={handleSaveNg} disabled={savingRecord || categoryOpen || statusOpen}
            >
              {savingRecord ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Save Record</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- Confirmation suppression --- */}
      <Modal visible={confirmDeleteId !== null} transparent animationType="fade" onRequestClose={() => !isDeleting && setConfirmDeleteId(null)}>
        <View style={pentadbiranStyles.confirmOverlay}>
          <View style={pentadbiranStyles.confirmBox}>
            <View style={pentadbiranStyles.confirmBanner}>
              <View style={pentadbiranStyles.confirmIconCircle}>
                <AlertTriangle size={26} color="#ef4444" />
              </View>
              <Text style={pentadbiranStyles.confirmTitle}>Padam Rekod</Text>
              <Text style={pentadbiranStyles.confirmSubtitle}>
                Padam rekod ini? Tindakan ini tidak boleh dibatalkan.
              </Text>
            </View>
            <View style={pentadbiranStyles.confirmActions}>
              <TouchableOpacity style={pentadbiranStyles.confirmCancelBtn} onPress={() => setConfirmDeleteId(null)} disabled={isDeleting}>
                <Text style={pentadbiranStyles.confirmCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[pentadbiranStyles.confirmConfirmBtn, isDeleting && { opacity: 0.7 }]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? <ActivityIndicator size="small" color="#fff" /> : (<><Trash2 size={16} color="#fff" /><Text style={pentadbiranStyles.confirmConfirmText}>Padam</Text></>)}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- Butiran rekod (mod bukan edit) --- */}
      <Modal visible={detailItem !== null} transparent animationType="fade" onRequestClose={() => setDetailItem(null)}>
        <View style={formStyles.modalOverlay}>
          <View style={[formStyles.modalContent, { backgroundColor: PALETTE.cardLight }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: PALETTE.textDark }}>Butiran Rekod</Text>
              <TouchableOpacity onPress={() => setDetailItem(null)}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
                Kategori Kes
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: PALETTE.textDark }}>
                {displayDetailItemRef.current?.category || '-'}
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
                Tarikh
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: PALETTE.textDark }}>
                {displayDetailItemRef.current?.tarikh || '-'}
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
                Keterangan
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>
                {displayDetailItemRef.current?.description || '-'}
              </Text>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 6 }}>
                Status
              </Text>
              <View style={{
                alignSelf: 'flex-start',
                backgroundColor: statusColor(displayDetailItemRef.current?.status) + '18',
                borderWidth: 1, borderColor: statusColor(displayDetailItemRef.current?.status),
                borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
              }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: statusColor(displayDetailItemRef.current?.status) }}>
                  {statusLabel(displayDetailItemRef.current?.status)}
                </Text>
              </View>
            </View>

            {displayDetailItemRef.current?.status !== 'berjaya' && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: PALETTE.textMutedDark, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 4 }}>
                  Sebab {statusLabel(displayDetailItemRef.current?.status)}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: PALETTE.textDark }}>
                  {displayDetailItemRef.current?.keterangan || '-'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* --- Pilih Tahun --- */}
      <Modal visible={filterYearOpen} transparent animationType="fade" onRequestClose={() => setFilterYearOpen(false)}>
        <TouchableOpacity style={formStyles.modalOverlay} activeOpacity={1} onPress={() => setFilterYearOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[formStyles.modalContent, { backgroundColor: PALETTE.cardLight, maxWidth: 440, maxHeight: '80%' }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: PALETTE.textDark }}>Pilih Tahun</Text>
              <TouchableOpacity onPress={() => setFilterYearOpen(false)}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {availableYears.map((y) => (
                <TouchableOpacity
                  key={y}
                  onPress={() => { setFilterYear(y); setFilterDay(null); setFilterYearOpen(false); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
                    borderWidth: 1.5, borderColor: filterYear === y ? PALETTE.orange : PALETTE.cardLightBorder,
                    backgroundColor: filterYear === y ? PALETTE.orange + '14' : '#fff',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: filterYear === y ? '800' : '600', color: filterYear === y ? PALETTE.orange : PALETTE.textDark }}>{y}</Text>
                  {filterYear === y && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* --- Pilih Bulan --- */}
      <Modal visible={filterMonthOpen} transparent animationType="fade" onRequestClose={() => setFilterMonthOpen(false)}>
        <TouchableOpacity style={formStyles.modalOverlay} activeOpacity={1} onPress={() => setFilterMonthOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[formStyles.modalContent, { backgroundColor: PALETTE.cardLight, maxWidth: 440, maxHeight: '85%' }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: PALETTE.textDark }}>Pilih Bulan</Text>
              <TouchableOpacity onPress={() => setFilterMonthOpen(false)}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => { setFilterMonth(null); setFilterDay(null); setFilterMonthOpen(false); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
                  borderWidth: 1.5, borderColor: filterMonth === null ? PALETTE.orange : PALETTE.cardLightBorder,
                  backgroundColor: filterMonth === null ? PALETTE.orange + '14' : '#fff',
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: filterMonth === null ? '800' : '600', color: filterMonth === null ? PALETTE.orange : PALETTE.textDark }}>Semua Bulan</Text>
                {filterMonth === null && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
              </TouchableOpacity>
              {BULAN_MS.map((m, idx) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setFilterMonth(idx); setFilterDay(null); setFilterMonthOpen(false); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
                    borderWidth: 1.5, borderColor: filterMonth === idx ? PALETTE.orange : PALETTE.cardLightBorder,
                    backgroundColor: filterMonth === idx ? PALETTE.orange + '14' : '#fff',
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: filterMonth === idx ? '800' : '600', color: filterMonth === idx ? PALETTE.orange : PALETTE.textDark }}>{m}</Text>
                  {filterMonth === idx && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* --- Pilih Hari --- */}
      <Modal visible={filterDayOpen} transparent animationType="fade" onRequestClose={() => setFilterDayOpen(false)}>
        <TouchableOpacity style={formStyles.modalOverlay} activeOpacity={1} onPress={() => setFilterDayOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[formStyles.modalContent, { backgroundColor: PALETTE.cardLight, maxWidth: 440, maxHeight: '85%' }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: PALETTE.textDark }}>Pilih Hari</Text>
              <TouchableOpacity onPress={() => setFilterDayOpen(false)}>
                <X size={24} color={PALETTE.textMutedDark} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 8 }}>
              {dayOptions.map((opt) => {
                const isSelected = opt === 'Semua Hari' ? filterDay === null : filterDay === Number(opt);
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => { setFilterDay(opt === 'Semua Hari' ? null : Number(opt)); setFilterDayOpen(false); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 18, paddingVertical: 16, borderRadius: 12,
                      borderWidth: 1.5, borderColor: isSelected ? PALETTE.orange : PALETTE.cardLightBorder,
                      backgroundColor: isSelected ? PALETTE.orange + '14' : '#fff',
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: isSelected ? '800' : '600', color: isSelected ? PALETTE.orange : PALETTE.textDark }}>{opt}</Text>
                    {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PALETTE.orange }} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      </>
  );
}
