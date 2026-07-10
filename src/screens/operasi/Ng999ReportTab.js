// src/screens/operasi/Ng999ReportTab.js
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform, Alert } from 'react-native';
import { BarChart2, AlertTriangle, TrendingDown, TrendingUp, Calendar, ChevronDown, ChevronUp, Plus, Edit2, Trash2, X } from 'lucide-react-native';

import AdminEditButton from '../../components/AdminEditButton';
import ModalSelectField from '../../components/ModalSelectField';
import { CATEGORY_OPTIONS, MONTH_OPTIONS } from '../../constants/operasiConstants';
import { useNg999Report } from '../../hooks/useNg999Report';
import { formStyles } from '../../styles/formStyles';
import { reportStyles as styles } from './reportStyles';

const EMPTY_FORM = { id: null, kategori_kes: '', month: '', jumlah_kes: '1' };

/**
 * Onglet "NG999 Report" : stats, tendance, highlight, breakdown par mois,
 * et CRUD (mode édition) des enregistrements. Extrait de OperasiScreen.js.
 */
export default function Ng999ReportTab({ theme, userRole }) {
  const { ngData, loadingNg, saveRecord, deleteRecord, stats } = useNg999Report();
  const { dynamicMonthlyTrend, dynamicCaseBreakdown, topCaseData, totalMersCases } = stats;

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);

  const getTrendData = () => {
    if (dynamicMonthlyTrend.length >= 2) {
      const current = dynamicMonthlyTrend[dynamicMonthlyTrend.length - 1];
      const prev = dynamicMonthlyTrend[dynamicMonthlyTrend.length - 2];
      const diff = current.total - prev.total;

      if (diff > 0) return { text: `+${diff} Cases`, color: '#b91c1c', bg: '#fef2f2', border: '#ef4444', icon: <TrendingUp size={16} color="#b91c1c" />, sub: `Compared to ${prev.month}` };
      if (diff < 0) return { text: `${diff} Cases`, color: '#15803d', bg: '#f0fdf4', border: '#22c55e', icon: <TrendingDown size={16} color="#15803d" />, sub: `Compared to ${prev.month}` };
      return { text: 'No Change', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: <BarChart2 size={16} color="#64748b" />, sub: `Compared to ${prev.month}` };
    }
    return { text: 'N/A', color: '#64748b', bg: '#f8fafc', border: '#cbd5e1', icon: <BarChart2 size={16} color="#64748b" />, sub: 'Need 2 months of data' };
  };
  const trendData = getTrendData();

  const closeModal = () => {
    setModalVisible(false);
    setCategoryOpen(false);
    setMonthOpen(false);
    setForm(EMPTY_FORM);
  };

  const openEditModal = (record) => {
    setForm({
      id: record.id,
      kategori_kes: record.kategori_kes,
      month: record.month,
      jumlah_kes: (record.jumlah_kes || 1).toString(),
    });
    setModalVisible(true);
  };

  const handleSaveNg = async () => {
    if (!form.kategori_kes || !form.month || !form.jumlah_kes) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const caseAmount = parseInt(form.jumlah_kes, 10);
    if (isNaN(caseAmount) || caseAmount < 1) {
      Alert.alert('Error', 'Amount of cases must be a valid number greater than 0.');
      return;
    }

    await saveRecord({ id: form.id, kategori_kes: form.kategori_kes, month: form.month, jumlah_kes: caseAmount });
    closeModal();
  };

  const handleDeleteNg = async (id) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to delete this record?');
      if (confirmed) {
        await deleteRecord(id);
      }
    } else {
      Alert.alert('Confirmation', 'Are you sure you want to delete this record?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteRecord(id);
          },
        },
      ]);
    }
  };

  return (
    <>
      <ScrollView style={styles.reportContainer} showsVerticalScrollIndicator={false}>

        <AdminEditButton
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
          userRole={userRole}
        />

        <View style={styles.reportHeader}>
          <Text style={[styles.reportTitle, { color: theme.text }]}>Emergency Case Report</Text>
          <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>NG 999 W.P. Labuan {new Date().getFullYear()}</Text>
        </View>

        <View style={styles.statsRow}>
          {dynamicMonthlyTrend.length === 0 ? (
            <View style={[styles.statBox, { backgroundColor: theme.card }]}>
              <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>No Monthly Data</Text>
            </View>
          ) : (
            dynamicMonthlyTrend.slice(-2).map((item, index) => (
              <View key={index} style={[styles.statBox, { backgroundColor: theme.card }]}>
                <View style={styles.statBoxTop}>
                  <Calendar size={16} color={theme.accent} />
                  <Text style={{ color: theme.textSecondary, fontWeight: '700' }}>{item.month}</Text>
                </View>
                <Text style={[styles.statBoxValue, { color: theme.text }]}>{item.total}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Total Cases</Text>
              </View>
            ))
          )}

          <View style={[styles.statBox, { backgroundColor: trendData.bg, borderColor: trendData.border, borderWidth: 1 }]}>
            <View style={styles.statBoxTop}>
              {trendData.icon}
              <Text style={{ color: trendData.color, fontWeight: '700' }}>Trend</Text>
            </View>
            <Text style={[styles.statBoxValue, { color: trendData.color, fontSize: 20 }]}>{trendData.text}</Text>
            <Text style={{ color: trendData.color, fontSize: 10 }}>{trendData.sub}</Text>
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

        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={[styles.dropdownHeaderBtn, { backgroundColor: theme.card, borderColor: '#e2e8f0' }]}
            onPress={() => setDropdownOpen(!dropdownOpen)}
            activeOpacity={0.7}
          >
            <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>
              {selectedMonth ? `Category Breakdown: ${selectedMonth}` : 'Select Month For Category Breakdown'}
            </Text>
            {dropdownOpen ? <ChevronUp size={20} color={theme.textSecondary} /> : <ChevronDown size={20} color={theme.textSecondary} />}
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: '#e2e8f0' }]}>
              {dynamicMonthlyTrend.map((m, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.dropdownItem, index < dynamicMonthlyTrend.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }]}
                  onPress={() => { setSelectedMonth(m.month); setDropdownOpen(false); }}
                >
                  <Text style={{ color: selectedMonth === m.month ? '#3b82f6' : theme.text, fontWeight: selectedMonth === m.month ? '800' : '500' }}>
                    {m.month}
                  </Text>
                </TouchableOpacity>
              ))}
              {dynamicMonthlyTrend.length === 0 && (
                <View style={styles.dropdownItem}><Text style={{ color: theme.textSecondary }}>No data available</Text></View>
              )}
            </View>
          )}
        </View>

        {selectedMonth && (
          <View style={[styles.breakdownContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.breakdownTitle, { color: theme.text }]}>Case Breakdown ({selectedMonth})</Text>

            {dynamicCaseBreakdown.map((item, index) => {
              const monthVal = item[selectedMonth];
              if (!monthVal || monthVal === 0) return null;

              const monthTotal = dynamicMonthlyTrend.find(m => m.month === selectedMonth)?.total || 1;
              const percent = Math.round((monthVal / monthTotal) * 100);

              return (
                <View key={index} style={styles.breakdownRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 13 }}>[{item.id}] {item.label}</Text>
                    <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>
                      {monthVal} <Text style={{ fontSize: 10, color: theme.textSecondary, fontWeight: '600' }}>({percent}%)</Text>
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { backgroundColor: item.color, width: `${percent}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {isEditMode && (
          <View style={[styles.crudContainer, { backgroundColor: theme.card }]}>
            <View style={styles.crudHeader}>
              <Text style={[styles.breakdownTitle, { color: theme.text, marginBottom: 0 }]}>NG999 Data Management</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => { setForm(EMPTY_FORM); setModalVisible(true); }}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {loadingNg ? (
              <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 20 }} />
            ) : ngData.length === 0 ? (
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginVertical: 10 }}>No records found.</Text>
            ) : (
              ngData.map((item) => (
                <View key={item.id} style={[styles.crudItem, { borderBottomColor: theme.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{item.kategori_kes}</Text>
                    <Text style={{ color: theme.textSecondary, fontSize: 12 }}>
                      Month: {item.month} | Total: <Text style={{ fontWeight: '800', color: theme.text }}>{item.jumlah_kes || 1}</Text> cases
                    </Text>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                      <Edit2 size={18} color="#22c55e" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteNg(item.id)} style={styles.iconBtn}>
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

      </ScrollView>

      {/* --- CRUD MODAL --- */}
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
              theme={theme}
              label="Case Category"
              value={form.kategori_kes}
              placeholder="Select Category..."
              options={CATEGORY_OPTIONS}
              isOpen={categoryOpen}
              onToggle={() => { setCategoryOpen(!categoryOpen); setMonthOpen(false); }}
              onSelect={(opt) => { setForm({ ...form, kategori_kes: opt }); setCategoryOpen(false); }}
              stackIndex={2000}
            />

            <ModalSelectField
              theme={theme}
              label="Month"
              value={form.month}
              placeholder="Select Month..."
              options={MONTH_OPTIONS}
              isOpen={monthOpen}
              onToggle={() => { setMonthOpen(!monthOpen); setCategoryOpen(false); }}
              onSelect={(opt) => { setForm({ ...form, month: opt }); setMonthOpen(false); }}
              stackIndex={1000}
            />

            <View style={[formStyles.inputGroup, { zIndex: 1 }]}>
              <Text style={[formStyles.inputLabel, { color: theme.textSecondary }]}>Amount of Cases</Text>
              <TextInput
                style={[formStyles.inputField, { backgroundColor: theme.card, color: theme.text, borderColor: theme.border }]}
                placeholder="E.g., 5"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={form.jumlah_kes.toString()}
                onChangeText={(text) => setForm({ ...form, jumlah_kes: text.replace(/[^0-9]/g, '') })}
              />
            </View>

            <TouchableOpacity
              style={[formStyles.saveBtn, (loadingNg || categoryOpen || monthOpen) && { opacity: 0.7 }]}
              onPress={handleSaveNg}
              disabled={loadingNg || categoryOpen || monthOpen}
            >
              {loadingNg ? <ActivityIndicator color="#fff" /> : <Text style={formStyles.saveBtnText}>Save Record</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
