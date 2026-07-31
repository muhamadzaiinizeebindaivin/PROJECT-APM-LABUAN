// src/screens/operasi/Ng999HistoriqueTab.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, StyleSheet } from 'react-native';
import { Plus, Trash2, X, ChevronLeft, ChevronRight, Save, Info } from 'lucide-react-native';
import { useNg999Historique } from '../../hooks/useNg999Historique';
import { CALAMITY_CATEGORIES } from '../../constants/operasiConstants';
import { PALETTE } from '../../constants/palette';

const BULAN_MS = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogos', 'Sep', 'Okt', 'Nov', 'Dis'];
const CURRENT_YEAR = new Date().getFullYear();

export default function Ng999HistoriqueTab({ userRole }) {
  const { loadingHistorique, availableYears, saveHistoriqueRow, deleteHistoriqueYear, getGridForYear } = useNg999Historique();
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR - 1);
  const [editMode, setEditMode] = useState(false);
  const [draftGrid, setDraftGrid] = useState({});
  const [saving, setSaving] = useState(false);
  const [addYearModal, setAddYearModal] = useState(false);
  const [newYear, setNewYear] = useState(String(CURRENT_YEAR - 1));

  const isEditMode = userRole === 'admin';
  const grid = getGridForYear(selectedYear);

  const enterEdit = () => {
    // Clone la grid actuelle dans le draft
    const draft = {};
    for (let b = 1; b <= 12; b++) {
      draft[b] = {};
      CALAMITY_CATEGORIES.forEach(cat => {
        draft[b][cat.key] = String(grid[b]?.[cat.key] ?? '');
      });
    }
    setDraftGrid(draft);
    setEditMode(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const promises = [];
    for (let b = 1; b <= 12; b++) {
      CALAMITY_CATEGORIES.forEach(cat => {
        const val = parseInt(draftGrid[b]?.[cat.key] || '0') || 0;
        promises.push(saveHistoriqueRow(selectedYear, b, cat.key, val));
      });
    }
    await Promise.all(promises);
    setSaving(false);
    setEditMode(false);
  };

  const updateDraft = (bulan, catKey, val) => {
    setDraftGrid(prev => ({
      ...prev,
      [bulan]: { ...prev[bulan], [catKey]: val }
    }));
  };

  const totalForYear = () => {
    let total = 0;
    for (let b = 1; b <= 12; b++) {
      CALAMITY_CATEGORIES.forEach(cat => {
        total += grid[b]?.[cat.key] || 0;
      });
    }
    return total;
  };

  const totalForCat = (catKey) => {
    let total = 0;
    for (let b = 1; b <= 12; b++) {
      total += grid[b]?.[catKey] || 0;
    }
    return total;
  };

  const totalForBulan = (bulan) => {
    let total = 0;
    CALAMITY_CATEGORIES.forEach(cat => {
      total += grid[bulan]?.[cat.key] || 0;
    });
    return total;
  };

  if (loadingHistorique) {
    return <ActivityIndicator size="large" color={PALETTE.orange} style={{ marginTop: 40 }} />;
  }

  return (
    <View style={histStyles.container}>
      {/* ---- Header ---- */}
      <View style={histStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={histStyles.title}>Data Historik NG999</Text>
          <Text style={histStyles.sub}>Bilangan kes mengikut kategori dan bulan</Text>
        </View>
        {isEditMode && !editMode ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={histStyles.addYearBtn} onPress={() => setAddYearModal(true)}>
              <Plus size={15} color={PALETTE.orange} />
              <Text style={histStyles.addYearBtnText}>Tahun Baru</Text>
            </TouchableOpacity>
            <TouchableOpacity style={histStyles.editBtn} onPress={enterEdit}>
              <Text style={histStyles.editBtnText}>Kemaskini Data</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {editMode ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={histStyles.cancelBtn} onPress={() => setEditMode(false)}>
              <X size={15} color={PALETTE.textMutedDark} />
              <Text style={histStyles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={histStyles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : (
                <><Save size={15} color="#fff" /><Text style={histStyles.saveBtnText}>Simpan</Text></>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* ---- Nota panduan ---- */}
      <View style={histStyles.infoBox}>
        <Info size={16} color={PALETTE.orange} style={{ marginTop: 1 }} />
        <Text style={histStyles.infoBoxText}>
          Kes yang mempunyai rekod harian (bertarikh) mesti dikunci masuk melalui{' '}
          <Text style={{ fontWeight: '800' }}>Senarai Penuh Kecemasan</Text> — jangan masukkan semula di sini,
          ia akan dikira dua kali. Halaman ini hanya untuk data tidak berdata harian.
        </Text>
      </View>

      {/* ---- Sélecteur d'année ---- */}
      <View style={histStyles.yearRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {[...new Set([...availableYears, selectedYear])].sort((a, b) => b - a).map(y => (
            <TouchableOpacity key={y} style={[histStyles.yearPill, selectedYear === y && histStyles.yearPillActive]} onPress={() => { setSelectedYear(y); setEditMode(false); }}>
              <Text style={[histStyles.yearPillText, selectedYear === y && histStyles.yearPillTextActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {isEditMode && !editMode ? (
          <TouchableOpacity style={histStyles.deleteYearBtn} onPress={() => deleteHistoriqueYear(selectedYear)}>
            <Trash2 size={15} color={PALETTE.danger} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* ---- Total de l'année ---- */}
      <View style={histStyles.totalCard}>
        <Text style={histStyles.totalLabel}>JUMLAH {selectedYear}</Text>
        <Text style={histStyles.totalValue}>{totalForYear()} kes</Text>
      </View>

      {/* ---- Grille ---- */}
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header colonnes (catégories) */}
          <View style={histStyles.gridRow}>
            <View style={histStyles.gridLabelCell}><Text style={histStyles.gridHeaderText}>BULAN</Text></View>
            {CALAMITY_CATEGORIES.map(cat => (
              <View key={cat.key} style={histStyles.gridCell}>
                <Text style={[histStyles.gridHeaderText, { color: cat.color }]}>{cat.key}</Text>
              </View>
            ))}
            <View style={histStyles.gridTotalCell}><Text style={histStyles.gridHeaderText}>JUMLAH</Text></View>
          </View>

          {/* Lignes mois */}
          {BULAN_MS.map((bulan, i) => {
            const b = i + 1;
            return (
              <View key={b} style={[histStyles.gridRow, i % 2 === 0 && histStyles.gridRowAlt]}>
                <View style={histStyles.gridLabelCell}>
                  <Text style={histStyles.gridLabelText}>{bulan}</Text>
                </View>
                {CALAMITY_CATEGORIES.map(cat => (
                  <View key={cat.key} style={histStyles.gridCell}>
                    {editMode ? (
                      <TextInput
                        style={histStyles.gridInput}
                        keyboardType="number-pad"
                        value={draftGrid[b]?.[cat.key] ?? ''}
                        onChangeText={(v) => updateDraft(b, cat.key, v)}
                        placeholder="0"
                        placeholderTextColor={PALETTE.textMutedDark}
                      />
                    ) : (
                      <Text style={[histStyles.gridValueText, (grid[b]?.[cat.key] || 0) > 0 && histStyles.gridValueTextActive]}>
                        {grid[b]?.[cat.key] || 0}
                      </Text>
                    )}
                  </View>
                ))}
                <View style={histStyles.gridTotalCell}>
                  <Text style={histStyles.gridTotalText}>{totalForBulan(b)}</Text>
                </View>
              </View>
            );
          })}

          {/* Ligne total par catégorie */}
          <View style={[histStyles.gridRow, histStyles.gridTotalRow]}>
            <View style={histStyles.gridLabelCell}>
              <Text style={histStyles.gridTotalText}>JUMLAH</Text>
            </View>
            {CALAMITY_CATEGORIES.map(cat => (
              <View key={cat.key} style={histStyles.gridCell}>
                <Text style={histStyles.gridTotalText}>{totalForCat(cat.key)}</Text>
              </View>
            ))}
            <View style={histStyles.gridTotalCell}>
              <Text style={[histStyles.gridTotalText, { color: PALETTE.orange }]}>{totalForYear()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ---- Modale ajouter une année ---- */}
      <Modal visible={addYearModal} transparent animationType="fade">
        <View style={histStyles.modalOverlay}>
          <View style={histStyles.modalBox}>
            <Text style={histStyles.modalTitle}>Tambah Tahun Baru</Text>
            <TextInput
              style={histStyles.modalInput}
              keyboardType="number-pad"
              value={newYear}
              onChangeText={setNewYear}
              placeholder="Cth: 2022"
              maxLength={4}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity style={histStyles.cancelBtn} onPress={() => setAddYearModal(false)}>
                <Text style={histStyles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[histStyles.saveBtn, { flex: 1 }]} onPress={() => {
                const y = parseInt(newYear);
                if (y > 1990 && y < CURRENT_YEAR) { setSelectedYear(y); setAddYearModal(false); setEditMode(false); setTimeout(enterEdit, 100); }
                else alert('Sila masukkan tahun yang sah (1990–' + (CURRENT_YEAR - 1) + ')');
              }}>
                <Text style={histStyles.saveBtnText}>Tambah & Isi Data</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const histStyles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: '800', color: PALETTE.textDark },
  sub: { fontSize: 12, color: PALETTE.textMutedDark, marginTop: 2 },

  addYearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addYearBtnText: { fontSize: 12, fontWeight: '700', color: PALETTE.orange },
  editBtn: { backgroundColor: PALETTE.orange, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: PALETTE.success, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  saveBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: PALETTE.cardLightBorder, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  cancelBtnText: { fontSize: 12, fontWeight: '700', color: PALETTE.textMutedDark },
  deleteYearBtn: { padding: 8, borderWidth: 1, borderColor: PALETTE.danger, borderRadius: 8, marginLeft: 8 },

  yearRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  yearPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: PALETTE.surface, borderWidth: 1, borderColor: PALETTE.cardLightBorder },
  yearPillActive: { backgroundColor: PALETTE.orange, borderColor: PALETTE.orange },
  yearPillText: { fontSize: 13, fontWeight: '700', color: PALETTE.textMutedDark },
  yearPillTextActive: { color: '#fff' },

  infoBox: {
    flexDirection: 'row', gap: 8, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa',
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  infoBoxText: { flex: 1, fontSize: 12, color: '#7c4a1e', lineHeight: 18 },
  totalCard: { backgroundColor: PALETTE.softOrangeBg, borderRadius: 12, padding: 12, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#F9731630' },
  totalLabel: { fontSize: 11, fontWeight: '800', color: PALETTE.orange, letterSpacing: 0.5 },
  totalValue: { fontSize: 18, fontWeight: '900', color: PALETTE.orange },

  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: PALETTE.cardLightBorder },
  gridRowAlt: { backgroundColor: PALETTE.softOrangeBg },
  gridTotalRow: { backgroundColor: PALETTE.surface },
  gridLabelCell: { width: 60, paddingHorizontal: 8, paddingVertical: 10, justifyContent: 'center' },
  gridCell: { width: 52, paddingHorizontal: 4, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  gridTotalCell: { width: 64, paddingHorizontal: 8, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: PALETTE.cardLightBorder },
  gridHeaderText: { fontSize: 10, fontWeight: '800', color: PALETTE.textMutedDark, textAlign: 'center' },
  gridLabelText: { fontSize: 12, fontWeight: '700', color: PALETTE.textDark },
  gridValueText: { fontSize: 12, color: PALETTE.textMutedDark, textAlign: 'center' },
  gridValueTextActive: { color: PALETTE.textDark, fontWeight: '700' },
  gridTotalText: { fontSize: 12, fontWeight: '800', color: PALETTE.textDark, textAlign: 'center' },
  gridInput: { width: 44, height: 30, textAlign: 'center', fontSize: 12, borderWidth: 1, borderColor: PALETTE.orange, borderRadius: 6, color: PALETTE.textDark, paddingHorizontal: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 40 },
  modalBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: PALETTE.textDark, marginBottom: 12 },
  modalInput: { borderWidth: 1, borderColor: PALETTE.cardLightBorder, borderRadius: 10, padding: 12, fontSize: 16, color: PALETTE.textDark },
});