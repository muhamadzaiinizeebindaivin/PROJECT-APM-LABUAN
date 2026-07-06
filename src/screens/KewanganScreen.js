import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { KEWANGAN_SUMMARY, KEWANGAN_BUDGET } from '../../data';
import { supabase } from '../supabaseClient';
import AdminEditButton from '../components/AdminEditButton';

const SCREEN_WIDTH = Dimensions.get('window').width;

const parseCurrency = (str) => {
  if (!str) return 0;
  return parseFloat(str.toString().replace(/,/g, ''));
};

const formatCurrency = (num) => {
  if (isNaN(num)) return '0.00';
  return num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

// TEMPORAIRE : pointe vers "sandbox" pour tester avant de migrer vers "public".
// Une fois validé, remplacer .schema('sandbox') par .schema('public') (ou l'enlever, public étant le défaut).
const KEWANGAN_SUMMARY_SCHEMA = 'sandbox';

const KewanganScreen = ({ theme, userRole }) => {
  // 1. State Management for Quarterly
  const [dataList, setDataList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formQ, setFormQ] = useState('');
  const [formMonths, setFormMonths] = useState('');
  const [formSpend, setFormSpend] = useState('');

  // 2. State Management for Budget (Agihan vs Belanja)
  const [budgetData, setBudgetData] = useState([]);
  const [isBudgetLoading, setIsBudgetLoading] = useState(true);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editBudgetItem, setEditBudgetItem] = useState(null);

  // State for Toggle Dropdown Categories
  const [expandedCategories, setExpandedCategories] = useState({});

  const [formKategori, setFormKategori] = useState('');
  const [formPerihal, setFormPerihal] = useState('');
  const [formAgihan, setFormAgihan] = useState('');
  const [formBelanjaBudget, setFormBelanjaBudget] = useState('');

  // 3. State Management for Kewangan Summary (Peruntukan Tahunan) — éditable
  const [summaryData, setSummaryData] = useState(null); // { id, title, year, total_allocation }
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [formSummaryTitle, setFormSummaryTitle] = useState('');
  const [formSummaryYear, setFormSummaryYear] = useState('');
  const [formSummaryTotal, setFormSummaryTotal] = useState('');
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  // Fallback sur data.js tant qu'aucune ligne n'existe en base
  const totalAllocation = summaryData
    ? parseCurrency(summaryData.total_allocation)
    : parseCurrency(KEWANGAN_SUMMARY.totalAllocation);
  const displayTitle = summaryData?.title || KEWANGAN_SUMMARY.title;
  const displayYear = summaryData?.year || KEWANGAN_SUMMARY.year;
  const quarterLimit = totalAllocation * 0.25;

  useEffect(() => {
    fetchKewanganData();
    fetchBudgetData();
    fetchSummaryData();
  }, []);

  // Fetch Peruntukan Tahunan (Summary)
  const fetchSummaryData = async () => {
    setIsSummaryLoading(true);
    try {
      const { data, error } = await supabase
        .schema(KEWANGAN_SUMMARY_SCHEMA)
        .from('kewangan_summary')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

      if (error) throw error;
      setSummaryData(data || null);
    } catch (error) {
      console.error('Error fetching kewangan_summary:', error);
      setSummaryData(null);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const openSummaryModal = () => {
    setFormSummaryTitle(displayTitle);
    setFormSummaryYear(displayYear);
    setFormSummaryTotal(String(totalAllocation));
    setSummaryModalVisible(true);
  };

  const handleSaveSummary = async () => {
    if (!formSummaryTotal) {
      Alert.alert('Ralat', 'Sila masukkan Jumlah Peruntukan.');
      return;
    }
    setIsSavingSummary(true);
    try {
      const payload = {
        id: 1,
        title: formSummaryTitle,
        year: formSummaryYear,
        total_allocation: parseCurrency(formSummaryTotal),
      };
      const { error } = await supabase
        .schema(KEWANGAN_SUMMARY_SCHEMA)
        .from('kewangan_summary')
        .upsert(payload);

      if (error) throw error;
      setSummaryData(payload);
      setSummaryModalVisible(false);
      Alert.alert('Berjaya', 'Peruntukan tahunan telah dikemaskini.');
    } catch (error) {
      Alert.alert('Ralat', 'Gagal menyimpan peruntukan: ' + error.message);
    } finally {
      setIsSavingSummary(false);
    }
  };

  // Fetch Quarterly Data
  const fetchKewanganData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kewangan_breakdown')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      if (data) setDataList(data);
    } catch (error) {
      Alert.alert("Ralat", "Gagal mengambil data dari pangkalan data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Budget Data
  const fetchBudgetData = async () => {
    setIsBudgetLoading(true);
    try {
      const { data, error } = await supabase
        .from('kewangan_budget')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setBudgetData(data);
      } else {
        setBudgetData(KEWANGAN_BUDGET);
      }
    } catch (error) {
      setBudgetData(KEWANGAN_BUDGET);
    } finally {
      setIsBudgetLoading(false);
    }
  };

  // --- QUARTERLY CRUD ---
  const openAddModal = () => {
    setFormQ(''); setFormMonths(''); setFormSpend(''); setEditItem(null); setModalVisible(true);
  };

  const openEditModal = (item) => {
    setFormQ(item.q); setFormMonths(item.months); setFormSpend(item.spend.toString()); setEditItem(item); setModalVisible(true);
  };

  const handleSaveQuarterly = async () => {
    if (!formQ || !formSpend) {
      Alert.alert("Ralat", "Sila isikan nama Sukuan dan jumlah Belanja."); return;
    }
    const payload = { q: formQ, months: formMonths, spend: formSpend, color: '#3b82f6' };
    setIsLoading(true);
    try {
      if (editItem) {
        const { error } = await supabase.from('kewangan_breakdown').update(payload).eq('id', editItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kewangan_breakdown').insert([payload]);
        if (error) throw error;
      }
      await fetchKewanganData();
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Ralat", "Gagal menyimpan data: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuarterly = (item) => {
    if (!item || item.id === undefined) return;
    const executeDelete = async () => {
      setIsLoading(true);
      try {
        const { error } = await supabase.from('kewangan_breakdown').delete().eq('id', item.id);
        if (error) throw error;
        await fetchKewanganData();
      } catch (error) {
        Platform.OS === 'web' ? window.alert(error.message) : Alert.alert("Ralat", error.message);
      } finally { setIsLoading(false); }
    };
    Platform.OS === 'web' && window.confirm("Padam rekod ini?") ? executeDelete() : Alert.alert("Pengesahan", "Padam rekod ini?", [{ text: "Batal", style: "cancel" }, { text: "Padam", style: "destructive", onPress: executeDelete }]);
  };

  // --- BUDGET CRUD ---
  const openAddBudgetModal = () => {
    setFormKategori(''); setFormPerihal(''); setFormAgihan(''); setFormBelanjaBudget(''); setEditBudgetItem(null); setBudgetModalVisible(true);
  };

  const openEditBudgetModal = (item) => {
    setFormKategori(item.kategori); setFormPerihal(item.perihal); setFormAgihan(item.agihan.toString()); setFormBelanjaBudget(item.belanja.toString()); setEditBudgetItem(item); setBudgetModalVisible(true);
  };

  const handleSaveBudget = async () => {
    if (!formKategori || !formPerihal || !formAgihan) {
      Alert.alert("Ralat", "Sila isikan Kategori, Perihal dan jumlah Agihan."); return;
    }
    const payload = { kategori: formKategori, perihal: formPerihal, agihan: formAgihan, belanja: formBelanjaBudget || '0' };
    setIsBudgetLoading(true);
    try {
      if (editBudgetItem && editBudgetItem.id) {
        const { error } = await supabase.from('kewangan_budget').update(payload).eq('id', editBudgetItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kewangan_budget').insert([payload]);
        if (error) throw error;
      }
      await fetchBudgetData();
      setBudgetModalVisible(false);
    } catch (error) {
      Alert.alert("Makluman", "Gagal menyimpan ke Supabase. Sila pastikan table 'kewangan_budget' telah wujud. Ralat: " + error.message);
    } finally {
      setIsBudgetLoading(false);
    }
  };

  const handleDeleteBudget = (item) => {
    if (!item || item.id === undefined) return;
    const executeDelete = async () => {
      setIsBudgetLoading(true);
      try {
        const { error } = await supabase.from('kewangan_budget').delete().eq('id', item.id);
        if (error) throw error;
        await fetchBudgetData();
      } catch (error) {
        Alert.alert("Ralat", error.message);
      } finally { setIsBudgetLoading(false); }
    };
    Platform.OS === 'web' && window.confirm("Padam bajet ini?") ? executeDelete() : Alert.alert("Pengesahan", "Padam bajet ini?", [{ text: "Batal", style: "cancel" }, { text: "Padam", style: "destructive", onPress: executeDelete }]);
  };

  // Processing Quarterly Data
  const processedData = dataList.map((item, index) => {
    const currentCumulative = parseCurrency(item.spend);
    const prevCumulative = index > 0 ? parseCurrency(dataList[index - 1].spend) : 0;
    const discreteSpend = currentCumulative - prevCumulative;
    const percentOfTotal = totalAllocation > 0 ? (discreteSpend / totalAllocation) * 100 : 0;

    let barColor = '#eab308'; let statusText = 'Underspend';
    if (percentOfTotal > 25) { barColor = '#ef4444'; statusText = 'Melebihi Had'; }
    else if (percentOfTotal >= (25 * 0.85)) { barColor = '#22c55e'; statusText = 'Optimum'; }

    return { ...item, discreteSpend, percentOfTotal, barColor, statusText };
  });

  // Processing Budget Data
  const totalAgihanBudget = budgetData.reduce((sum, item) => sum + parseCurrency(item.agihan), 0);
  const totalBelanjaBudget = budgetData.reduce((sum, item) => sum + parseCurrency(item.belanja), 0);
  const bakiSemasaBudget = totalAgihanBudget - totalBelanjaBudget;

  const groupedBudget = budgetData.reduce((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.contentContainer}>

        {/* UNIVERSAL ADMIN EDIT BUTTON */}
        <AdminEditButton
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          userRole={userRole}
        />

        {/* Header Section — Peruntukan Tahunan (éditable) */}
        <View style={styles.headerCard}>
          {isSummaryLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.headerTitle}>{displayTitle}</Text>
              <Text style={styles.headerYear}>Tahun Kewangan {displayYear}</Text>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Jumlah Peruntukan</Text>
                <Text style={styles.totalAmount}>RM {formatCurrency(totalAllocation)}</Text>
              </View>
              {isEditMode ? (
                <TouchableOpacity style={styles.editSummaryButton} onPress={openSummaryModal}>
                  <Text style={styles.editSummaryButtonText}>Kemaskini Peruntukan</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>

        {/* MAKLUMAT UNIT PENTADBIRAN */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>UNIT PENTADBIRAN</Text>
          <View style={styles.unitContainer}>
            <View style={styles.unitBox}>
              <Text style={styles.boxTitle}>SEKTOR KEWANGAN</Text>
              <Text style={styles.listItem}>1. En. Ahmad Bin Sangka (Gred W2)</Text>
            </View>
          </View>
        </View>

        {/* ======================================= */}
        {/* BUDGET ALLOCATION SECTION */}
        {/* ======================================= */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Status Agihan & Perbelanjaan Semasa</Text>
          <View style={styles.headerActionGroup}>
            {isEditMode ? (
              <TouchableOpacity style={styles.addButton} onPress={openAddBudgetModal}>
                <Text style={styles.addButtonText}>+ Tambah</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Budget KPIs */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Jumlah Agihan</Text>
            <Text style={[styles.kpiValue, {color: '#1e40af'}]}>RM {formatCurrency(totalAgihanBudget)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Jumlah Belanja</Text>
            <Text style={[styles.kpiValue, {color: '#ea580c'}]}>RM {formatCurrency(totalBelanjaBudget)}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>Baki Semasa</Text>
            <Text style={[styles.kpiValue, {color: '#16a34a'}]}>RM {formatCurrency(bakiSemasaBudget)}</Text>
          </View>
        </View>

        {isBudgetLoading ? <ActivityIndicator size="large" color="#1e40af" style={{ marginVertical: 20 }} /> : null}


        {!isBudgetLoading ? Object.keys(groupedBudget).map(kategori => {

          const isExpanded = expandedCategories[kategori] == true;

          return (
            <View key={kategori} style={styles.card}>
              <TouchableOpacity
                style={[styles.kategoriHeader, !isExpanded && { marginBottom: 0 }]}
                onPress={() => setExpandedCategories(prev => ({ ...prev, [kategori]: !isExpanded }))}
                activeOpacity={0.7}
              >
                <Text style={styles.kategoriTitle}>{kategori}</Text>
                <Text style={styles.toggleIcon}>{isExpanded ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {isExpanded ? groupedBudget[kategori].map((item, index) => {
                const agihan = parseCurrency(item.agihan);
                const belanja = parseCurrency(item.belanja);
                const baki = agihan - belanja;

                return (
                  <View key={item.id || index} style={styles.budgetItemRow}>
                    <View style={styles.budgetMainInfo}>
                      <Text style={styles.budgetPerihal}>{item.perihal}</Text>
                      {isEditMode ? (
                        <View style={styles.budgetActionButtons}>
                          <TouchableOpacity onPress={() => openEditBudgetModal(item)}><Text style={styles.btnSmallEdit}>Edit</Text></TouchableOpacity>
                          <TouchableOpacity onPress={() => handleDeleteBudget(item)}><Text style={styles.btnSmallDelete}>Padam</Text></TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.budgetNumbersRow}>
                      <View style={styles.budgetStat}>
                        <Text style={styles.budgetStatLabel}>Agihan</Text>
                        <Text style={styles.budgetStatValue}>{formatCurrency(agihan)}</Text>
                      </View>
                      <View style={styles.budgetStat}>
                        <Text style={styles.budgetStatLabel}>Belanja</Text>
                        <Text style={[styles.budgetStatValue, {color: belanja > 0 ? '#ea580c' : '#475569'}]}>{formatCurrency(belanja)}</Text>
                      </View>
                      <View style={styles.budgetStat}>
                        <Text style={styles.budgetStatLabel}>Baki</Text>
                        <Text style={[styles.budgetStatValue, {color: '#16a34a'}]}>{formatCurrency(baki)}</Text>
                      </View>
                    </View>
                  </View>
                );
              }) : null}
            </View>
          );
        }) : null}

        {/* ======================================= */}
        {/* QUARTERLY BREAKDOWN SECTION */}
        {/* ======================================= */}
        <View style={[styles.sectionHeaderRow, {marginTop: 20}]}>
          <Text style={styles.sectionTitle}>Prestasi Mengikut Sukuan</Text>
          <View style={styles.headerActionGroup}>
            {isEditMode ? (
              <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
                <Text style={styles.addButtonText}>+ Tambah Sukuan</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {isLoading ? <ActivityIndicator size="large" color="#1e40af" style={{ marginVertical: 20 }} /> : null}

        {!isLoading ? processedData.map((item, index) => (
          <View key={item.id || index} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.quarterTitle}>{item.q}</Text>
                <Text style={styles.quarterMonths}>{item.months}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: item.barColor + '20' }]}>
                <Text style={[styles.statusText, { color: item.barColor }]}>{item.statusText}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statsLabel}>Belanja (Kumulatif)</Text>
                <Text style={styles.statsValue}>RM {formatCurrency(parseCurrency(item.spend))}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statsLabel}>% drp Peruntukan</Text>
                <Text style={[styles.statsValue, { color: item.barColor }]}>
                  {item.percentOfTotal.toFixed(2)}%
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: `${Math.min((item.percentOfTotal / 25) * 100, 100)}%`, backgroundColor: item.barColor }]} />
              <View style={styles.limitLine} />
            </View>
            <Text style={styles.limitLabel}>Had Sukuan (25%)</Text>

            {isEditMode ? (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                  <Text style={styles.editButtonText}>Kemaskini</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteQuarterly(item)}>
                  <Text style={styles.deleteButtonText}>Padam</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )) : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>* Bar kemajuan menunjukkan penggunaan dengan had 25% sukuan.</Text>
        </View>
      </ScrollView>

      {/* --- MODAL FOR PERUNTUKAN TAHUNAN (SUMMARY) --- */}
      <Modal animationType="slide" transparent={true} visible={summaryModalVisible} onRequestClose={() => setSummaryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kemaskini Peruntukan Tahunan</Text>
            <Text style={styles.inputLabel}>Tajuk</Text>
            <TextInput style={styles.input} value={formSummaryTitle} onChangeText={setFormSummaryTitle} placeholder="Cth: Angkatan Pertahanan Awam Malaysia WP Labuan" />
            <Text style={styles.inputLabel}>Tahun</Text>
            <TextInput style={styles.input} value={formSummaryYear} onChangeText={setFormSummaryYear} placeholder="Cth: 2026" />
            <Text style={styles.inputLabel}>Jumlah Peruntukan (RM)</Text>
            <TextInput style={styles.input} value={formSummaryTotal} onChangeText={setFormSummaryTotal} placeholder="Cth: 333552.48" keyboardType="numeric" />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setSummaryModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveButton, isSavingSummary && { opacity: 0.7 }]} onPress={handleSaveSummary} disabled={isSavingSummary}>
                <Text style={styles.modalSaveText}>{isSavingSummary ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL FOR QUARTERLY --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editItem ? 'Kemaskini Sukuan' : 'Tambah Sukuan Baru'}</Text>
            <Text style={styles.inputLabel}>Sukuan (Contoh: SUKUAN 5)</Text>
            <TextInput style={styles.input} value={formQ} onChangeText={setFormQ} placeholder="Masukkan Suku Tahun" />
            <Text style={styles.inputLabel}>Bulan (Contoh: JAN - MAC)</Text>
            <TextInput style={styles.input} value={formMonths} onChangeText={setFormMonths} placeholder="Masukkan Bulan" />
            <Text style={styles.inputLabel}>Jumlah Belanja Kumulatif (RM)</Text>
            <TextInput style={styles.input} value={formSpend} onChangeText={setFormSpend} placeholder="Contoh: 1500000.00" keyboardType="numeric" />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveButton, isLoading && { opacity: 0.7 }]} onPress={handleSaveQuarterly} disabled={isLoading}>
                <Text style={styles.modalSaveText}>{isLoading ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL FOR BUDGET (AGIHAN VS BELANJA) --- */}
      <Modal animationType="slide" transparent={true} visible={budgetModalVisible} onRequestClose={() => setBudgetModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editBudgetItem ? 'Kemaskini Bajet' : 'Tambah Bajet Baru'}</Text>

            <Text style={styles.inputLabel}>Kategori (Kod Objek) (Contoh: 27000)</Text>
            <TextInput style={styles.input} value={formKategori} onChangeText={setFormKategori} placeholder="Masukkan Kategori" />

            <Text style={styles.inputLabel}>Perihal (Contoh: E. Kasut)</Text>
            <TextInput style={styles.input} value={formPerihal} onChangeText={setFormPerihal} placeholder="Masukkan Perihal" />

            <Text style={styles.inputLabel}>Agihan (RM)</Text>
            <TextInput style={styles.input} value={formAgihan} onChangeText={setFormAgihan} placeholder="Contoh: 20000.00" keyboardType="numeric" />

            <Text style={styles.inputLabel}>Belanja (RM)</Text>
            <TextInput style={styles.input} value={formBelanjaBudget} onChangeText={setFormBelanjaBudget} placeholder="Contoh: 150.00" keyboardType="numeric" />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setBudgetModalVisible(false)}>
                <Text style={styles.modalCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveButton, isBudgetLoading && { opacity: 0.7 }]} onPress={handleSaveBudget} disabled={isBudgetLoading}>
                <Text style={styles.modalSaveText}>{isBudgetLoading ? 'Menyimpan...' : 'Simpan'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  headerCard: { backgroundColor: '#1e40af', borderRadius: 12, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerTitle: { fontSize: 14, color: '#93c5fd', fontWeight: '600', marginBottom: 4 },
  headerYear: { fontSize: 24, color: '#ffffff', fontWeight: 'bold', marginBottom: 16 },
  totalContainer: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12 },
  totalLabel: { color: '#e0f2fe', fontSize: 12, marginBottom: 4 },
  totalAmount: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' },
  editSummaryButton: { marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  editSummaryButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#334155', flex: 1 },
  headerActionGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addButton: { backgroundColor: '#1e40af', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  unitContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  unitBox: { flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  boxTitle: { fontWeight: 'bold', marginBottom: 8, color: '#334155', fontSize: 14 },
  listItem: { fontSize: 14, color: '#475569' },

  kpiRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, gap: 8 },
  kpiCard: { flex: 1, backgroundColor: '#ffffff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', elevation: 1 },
  kpiTitle: { fontSize: 10, color: '#64748b', fontWeight: '600', marginBottom: 4, textAlign: 'center' },
  kpiValue: { fontSize: 14, fontWeight: 'bold' },

  kategoriHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: 10, borderRadius: 6, marginBottom: 12 },
  kategoriTitle: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  toggleIcon: { fontSize: 12, color: '#64748b', fontWeight: 'bold' },
  budgetItemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  budgetMainInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  budgetPerihal: { fontSize: 14, fontWeight: '600', color: '#334155' },
  budgetNumbersRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 8, borderRadius: 6 },
  budgetStat: { flex: 1, alignItems: 'center' },
  budgetStatLabel: { fontSize: 10, color: '#94a3b8', marginBottom: 2 },
  budgetStatValue: { fontSize: 12, fontWeight: '600', color: '#334155' },
  budgetActionButtons: { flexDirection: 'row', gap: 10 },
  btnSmallEdit: { fontSize: 12, color: '#22c55e', fontWeight: '600' },
  btnSmallDelete: { fontSize: 12, color: '#ef4444', fontWeight: '600' },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  quarterTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  quarterMonths: { fontSize: 12, color: '#64748b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statsLabel: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  statsValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  progressContainer: { height: 12, backgroundColor: '#e2e8f0', borderRadius: 6, overflow: 'hidden', position: 'relative' },
  progressBar: { height: '100%', borderRadius: 6 },
  limitLine: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.1)' },
  limitLabel: { fontSize: 10, color: '#94a3b8', textAlign: 'right', marginTop: 4 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  editButton: { backgroundColor: '#22c55e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  editButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  deleteButton: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  deleteButtonText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },
  footer: { marginTop: 8, alignItems: 'center' },
  footerText: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  inputLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, padding: 12, fontSize: 14, color: '#334155', marginBottom: 16, backgroundColor: '#f8fafc' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  modalCancelButton: { padding: 12, marginRight: 8 },
  modalCancelText: { color: '#64748b', fontWeight: '600' },
  modalSaveButton: { backgroundColor: '#1e40af', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  modalSaveText: { color: '#fff', fontWeight: 'bold' }
});

export default KewanganScreen;
