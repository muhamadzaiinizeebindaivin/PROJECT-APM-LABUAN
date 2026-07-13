// src/screens/operasi/Ng999ReportTab.js
import React, { useState, useMemo, useRef, useEffect, createElement } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { AlertTriangle, Plus, Edit2, Trash2, X } from 'lucide-react-native';
import ModalSelectField from '../../components/ModalSelectField';
import { useNg999Report } from '../../hooks/useNg999Report';
import { CATEGORY_OPTIONS } from '../../constants/operasiConstants';
import { BULAN_MS, BULAN_OPTIONS } from '../../constants/bulan';
import { formStyles } from '../../styles/formStyles';
import { reportStyles as styles } from './reportStyles';
import { mapStyles as tableStyles } from './mapStyles';
import CalamitySummaryContent from './CalamitySummaryContent';

export default function Ng999ReportTab({ theme, userRole }) {
  const now = new Date();

  const { ngData, loadingNg, saveRecord, deleteRecord, categories, availableYears, totalMersCases, topCaseData, getTrend } = useNg999Report();

  // --- Filtre Tahun / Bulan / Hari + recherche ---
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterDay, setFilterDay] = useState(null);
  const [filterYearOpen, setFilterYearOpen] = useState(false);
  const [filterMonthOpen, setFilterMonthOpen] = useState(false);
  const [filterDayOpen, setFilterDayOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('ringkasan');
  const tableScrollRef = useRef(null);
  const pageScrollRef = useRef(null);

  // --- Modale ---
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ id: null, kategori_kes: '', tarikh: '', jumlah_kes: '1' });
  const [categoryOpen, setCategoryOpen] = useState(false);

  const daysInFilterMonth = filterMonth === null ? 31 : new Date(filterYear, filterMonth + 1, 0).getDate();
  const dayOptions = ['Semua Hari', ...Array.from({ length: daysInFilterMonth }, (_, i) => String(i + 1))];

  const filteredNgData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ngData.filter(item => {
      const d = new Date(item.tarikh);
      if (d.getFullYear() !== filterYear) return false;
      if (filterMonth !== null && d.getMonth() !== filterMonth) return false;
      if (filterDay !== null && d.getDate() !== filterDay) return false;
      if (q && !(item.kategori_kes || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [ngData, filterYear, filterMonth, filterDay, searchQuery]);

  const aggregatedByCategory = useMemo(() => {
    const totals = {};
    filteredNgData.forEach(item => {
      const key = item.kategori_kes || 'Lain-lain';
      totals[key] = (totals[key] || 0) + (item.jumlah_kes || 1);
    });
    return Object.entries(totals)
      .map(([kategori_kes, total]) => ({ kategori_kes, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredNgData]);

  const filteredTotalCases = useMemo(() => aggregatedByCategory.reduce((sum, row) => sum + row.total, 0), [aggregatedByCategory]);

  const groupedByMonth = useMemo(() => {
    if (filterMonth !== null) return null;
    const groups = {};
    filteredNgData.forEach(item => {
      const d = new Date(item.tarikh);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = { label: `${BULAN_MS[d.getMonth()]} ${d.getFullYear()}`, monthIndex: d.getMonth(), items: [] };
      groups[key].items.push(item);
    });
    return Object.values(groups).sort((a, b) => b.monthIndex - a.monthIndex);
  }, [filteredNgData, filterMonth]);

  const tableTitleRef = useRef(null);

  useEffect(() => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ y: 0, animated: false });
    }
    if (tableTitleRef.current && pageScrollRef.current) {
      tableTitleRef.current.measureLayout(
        pageScrollRef.current,
        (x, y) => { pageScrollRef.current.scrollTo({ y, animated: true }); },
        () => {}
      );
    }
  }, [filterMonth, filterDay, filterYear]);

  const groupItemsByDay = (items) => {
    const groups = {};
    items.forEach(item => {
      const key = item.tarikh;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const handleSaveNg = async () => {
    if (!form.kategori_kes || !form.tarikh || !form.jumlah_kes) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    const caseAmount = parseInt(form.jumlah_kes, 10);
    if (isNaN(caseAmount) || caseAmount < 1) {
      Alert.alert('Error', 'Amount of cases must be a valid number greater than 0.');
      return;
    }
    await saveRecord({ id: form.id, kategori_kes: form.kategori_kes, tarikh: form.tarikh, jumlah_kes: caseAmount });
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
    setForm({
      id: record.id,
      kategori_kes: record.kategori_kes,
      tarikh: record.tarikh,
      jumlah_kes: (record.jumlah_kes || 1).toString()
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setCategoryOpen(false);
    setForm({ id: null, kategori_kes: '', tarikh: '', jumlah_kes: '1' });
  };

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
      <View style={[{ flex: 1 }, tableStyles.calamityHeaderCellBox]}>
        <Text style={tableStyles.calamityTableHeaderCell}>Aksi</Text>
      </View>
    </View>
  );

  const renderDayGroup = (tarikh, dayItems) => (
    <View key={tarikh} style={{
      borderWidth: 2, borderColor: '#1E3A8A', borderRadius: 10,
      marginBottom: 12, overflow: 'hidden',
    }}>
      <View style={{ backgroundColor: '#1E3A8A', paddingHorizontal: 14, paddingVertical: 8 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{tarikh}</Text>
      </View>
      {dayItems.map((item, index) => (
        <View key={item.id} style={[tableStyles.calamityTableRow, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
          <Text style={[tableStyles.calamityTableCell, { flex: 2, textAlign: 'left', paddingLeft: 16 }]} numberOfLines={1}>
            {item.kategori_kes}
          </Text>
          <Text style={[tableStyles.calamityTableCell, { flex: 1 }]}>{item.tarikh}</Text>
          <Text style={[tableStyles.calamityTableCell, { flex: 1, fontWeight: '800' }]}>{item.jumlah_kes || 1}</Text>
          <View style={[{ flex: 1 }, styles.actionBtns, { justifyContent: 'center' }]}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
              <Edit2 size={16} color="#22c55e" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteNg(item.id)} style={styles.iconBtn}>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <>
      <ScrollView ref={pageScrollRef} style={styles.reportContainer} showsVerticalScrollIndicator={false}>

        <View style={styles.reportHeader}>
          <Text style={[styles.reportTitle, { color: theme.text }]}>Emergency Case Report</Text>
          <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>NG 999 W.P. Labuan {now.getFullYear()}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.card }]}>
            <Text style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 12 }}>Jumlah Keseluruhan</Text>
            <Text style={[styles.statBoxValue, { color: theme.text }]}>{totalMersCases}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Semua Rekod</Text>
          </View>
        </View>

        <View style={[styles.highlightCard, { backgroundColor: '#fff7ed', borderColor: '#f97316', borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <AlertTriangle size={24} color="#ea580c" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#9a3412', textTransform: 'uppercase' }}>Highest Case Overall</Text>
          </View>
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#ea580c' }}>{topCaseData.label}</Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#c2410c', marginTop: 4 }}>
            Contributing {topCaseData.total} out of {totalMersCases} total calls.
          </Text>
        </View>

        {/* --- Barre de navigation des tabs --- */}
        <View style={[styles.crudContainer, { backgroundColor: theme.card, marginBottom: 12 }]}>
          <View style={styles.crudHeader}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setViewMode('ringkasan')}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: viewMode === 'ringkasan' ? '#1E3A8A' : '#f1f5f9' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: viewMode === 'ringkasan' ? '#fff' : '#64748b' }}>Ringkasan Kecemasan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('senarai')}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: viewMode === 'senarai' ? '#1E3A8A' : '#f1f5f9' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: viewMode === 'senarai' ? '#fff' : '#64748b' }}>Senarai Penuh Kecemasan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('trend')}
                style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: viewMode === 'trend' ? '#1E3A8A' : '#f1f5f9' }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: viewMode === 'trend' ? '#fff' : '#64748b' }}>Trend Mengikut Bulan</Text>
              </TouchableOpacity>
            </View>
            {viewMode === 'senarai' && (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => { setForm({ id: null, kategori_kes: '', tarikh: '', jumlah_kes: '1' }); setModalVisible(true); }}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>Tambah Baru</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* --- Filtres Senarai --- */}
        {viewMode === 'senarai' && (
          <>
            <View style={[tableStyles.historyFilterRow, { marginBottom: 4 }]}>
              <View style={{ flex: 1 }}>
                <ModalSelectField
                  theme={theme} label="Tahun" value={String(filterYear)} placeholder="Tahun"
                  options={availableYears.map(String)} isOpen={filterYearOpen}
                  onToggle={() => { setFilterYearOpen(!filterYearOpen); setFilterMonthOpen(false); setFilterDayOpen(false); }}
                  onSelect={(opt) => { setFilterYear(Number(opt)); setFilterYearOpen(false); }}
                  stackIndex={3000}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ModalSelectField
                  theme={theme} label="Bulan"
                  value={filterMonth === null ? 'Semua Bulan' : BULAN_MS[filterMonth]}
                  placeholder="Bulan" options={BULAN_OPTIONS} isOpen={filterMonthOpen}
                  onToggle={() => { setFilterMonthOpen(!filterMonthOpen); setFilterYearOpen(false); setFilterDayOpen(false); }}
                  onSelect={(opt) => { setFilterMonth(opt === 'Semua Bulan' ? null : BULAN_MS.indexOf(opt)); setFilterDay(null); setFilterMonthOpen(false); }}
                  stackIndex={2000}
                />
              </View>
              <View style={{ flex: 1 }}>
                <ModalSelectField
                  theme={theme} label="Hari"
                  value={filterDay === null ? 'Semua Hari' : String(filterDay)}
                  placeholder="Hari" options={dayOptions} isOpen={filterDayOpen}
                  onToggle={() => { setFilterDayOpen(!filterDayOpen); setFilterYearOpen(false); setFilterMonthOpen(false); }}
                  onSelect={(opt) => { setFilterDay(opt === 'Semua Hari' ? null : Number(opt)); setFilterDayOpen(false); }}
                  stackIndex={1000}
                />
              </View>
            </View>
            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
              <TextInput
                style={[formStyles.inputField, { backgroundColor: theme.background, color: theme.text, borderColor: '#94a3b8', borderWidth: 2, outlineStyle: 'none' }]}
                placeholder="Cari kategori kes..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </>
        )}

        <View ref={tableTitleRef} />
        {loadingNg ? (
          <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 20 }} />
        ) : viewMode === 'ringkasan' ? (
          <CalamitySummaryContent theme={theme} mode="table" />
        ) : viewMode === 'trend' ? (
          <CalamitySummaryContent theme={theme} mode="chart" />
        ) : filteredNgData.length === 0 ? (
          <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 10 }}>No records found.</Text>
        ) : filterMonth === null ? (
          // --- Semua Bulan : encadré par mois, groupé par jour ---
          <ScrollView ref={tableScrollRef} showsVerticalScrollIndicator={true} style={{ maxHeight: 600 }}>
            {groupedByMonth.map((group) => (
              <View key={group.label} style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#1E3A8A', marginBottom: 6, textAlign: 'center' }}>{group.label}</Text>
                <View style={[tableStyles.calamityTableWrapper, { borderColor: '#475569' }]}>
                {tableHeader}
                <View style={{ padding: 8 }}>
                  {groupItemsByDay(group.items).map(([tarikh, dayItems]) => renderDayGroup(tarikh, dayItems))}
                </View>
              </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          // --- Mois précis : groupé par jour ---
          <View style={[tableStyles.calamityTableWrapper, { borderColor: '#475569' }]}>
            {tableHeader}
            <ScrollView ref={tableScrollRef} showsVerticalScrollIndicator={true}>
              <View style={{ padding: 8 }}>
                {groupItemsByDay(filteredNgData).map(([tarikh, dayItems]) => renderDayGroup(tarikh, dayItems))}
              </View>
            </ScrollView>
          </View>
        )}

      </ScrollView>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={formStyles.modalOverlay}>
          <View style={[formStyles.modalContent, { backgroundColor: theme.background }]}>
            <View style={formStyles.modalHeader}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>
                {form.id ? 'Update Record' : 'Add New Record'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ModalSelectField
              theme={theme} label="Case Category" value={form.kategori_kes}
              placeholder="Select Category..." options={CATEGORY_OPTIONS}
              isOpen={categoryOpen}
              onToggle={() => setCategoryOpen(!categoryOpen)}
              onSelect={(opt) => { setForm({ ...form, kategori_kes: opt }); setCategoryOpen(false); }}
              stackIndex={2000}
            />

            <View style={[formStyles.inputGroup, { zIndex: 1 }]}>
              <Text style={[formStyles.inputLabel, { color: theme.textSecondary }]}>Tarikh</Text>
              {Platform.OS === 'web' ? (
                createElement('input', {
                  type: 'date',
                  value: form.tarikh || '',
                  onChange: (e) => setForm({ ...form, tarikh: e.target.value }),
                  style: {
                    width: '100%', padding: 10, borderRadius: 8, border: `1px solid ${theme.border}`,
                    backgroundColor: theme.card, color: theme.text, fontSize: 14, boxSizing: 'border-box',
                  },
                })
              ) : (
                <TextInput
                  style={[formStyles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                  placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary}
                  value={form.tarikh} onChangeText={(t) => setForm({ ...form, tarikh: t })}
                />
              )}
            </View>

            <View style={[formStyles.inputGroup, { zIndex: 1 }]}>
              <Text style={[formStyles.inputLabel, { color: theme.textSecondary }]}>Amount of Cases</Text>
              <TextInput
                style={[formStyles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="E.g., 5" placeholderTextColor={theme.textSecondary}
                keyboardType="numeric" value={form.jumlah_kes.toString()}
                onChangeText={(text) => setForm({ ...form, jumlah_kes: text.replace(/[^0-9]/g, '') })}
              />
            </View>

            <TouchableOpacity
              style={[formStyles.saveBtn, (loadingNg || categoryOpen) && { opacity: 0.7 }]}
              onPress={handleSaveNg} disabled={loadingNg || categoryOpen}
            >
              {loadingNg ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Save Record</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
