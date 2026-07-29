// src/screens/operasi/Ng999HistoriqueModal.js
import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal, ActivityIndicator, Platform, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { CALAMITY_CATEGORIES } from '../../constants/operasiConstants';
import { useNg999Historique } from '../../hooks/useNg999Historique';
import { useCalamityPoints } from '../../hooks/useCalamityPoints';
import { useCalamitySummaryPanel } from '../../hooks/useCalamitySummaryPanel';
import { supabaseSandbox } from '../../supabaseSandboxClient';
import { PALETTE } from '../../constants/palette';

const BULAN_MS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const CURRENT_YEAR = new Date().getFullYear();
const yearOptions = Array.from({ length: CURRENT_YEAR - 1951 }, (_, i) => CURRENT_YEAR - i);

export default function Ng999HistoriqueModal({ visible, onClose, initialYear, onSaved }) {
  const { getGridForYear, saveHistoriqueRow, historiqueData } = useNg999Historique();
  const { calamityPoints } = useCalamityPoints();
  const summary = useCalamitySummaryPanel(calamityPoints);
  const yearsWithData = new Set(historiqueData.map(d => d.tahun));

  const [year, setYear] = useState(String(CURRENT_YEAR - 1));
  const [draft, setDraft] = useState({});
  const [initial, setInitial] = useState({});
  const [saving, setSaving] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [infoMsg, setInfoMsg] = useState(false);
  const [violationMsg, setViolationMsg] = useState(null); // texte explicatif si blocage
  // minCounts[bulan][category] = nombre de vrais rekod harian (laporan_ng999) déjà enregistrés
  // pour ce mois/cette catégorie cette année-là — on ne peut jamais descendre en dessous.
  const [minCounts, setMinCounts] = useState({});

  const loadYear = async (y) => {
    const parsed = parseInt(y);
    setYear(y);
    setViolationMsg(null);
    if (!parsed || parsed > CURRENT_YEAR) return;

    // Récupère le détail des vrais rekod harian de cette année, pour calculer le minimum par mois/catégorie
    const { data: dailyRows } = await supabaseSandbox
      .from('laporan_ng999')
      .select('tarikh, category')
      .gte('tarikh', `${parsed}-01-01`)
      .lte('tarikh', `${parsed}-12-31`);

    const mins = {};
    (dailyRows || []).forEach((r) => {
      const b = new Date(r.tarikh).getMonth() + 1;
      if (!mins[b]) mins[b] = {};
      mins[b][r.category] = (mins[b][r.category] || 0) + 1;
    });
    setMinCounts(mins);

    let grid;
    if (parsed === CURRENT_YEAR) {
      // Année en cours : même source que le tableau du Report Tab
      grid = {};
      (summary.calamityMonthlyBreakdown || []).forEach((row, i) => {
        grid[i + 1] = {};
        CALAMITY_CATEGORIES.forEach(cat => {
          grid[i + 1][cat.key] = row.counts?.[cat.key] || 0;
        });
      });
    } else {
      grid = getGridForYear(parsed);
    }

    const d = {};
    for (let b = 1; b <= 12; b++) {
      d[b] = {};
      CALAMITY_CATEGORIES.forEach(cat => {
        d[b][cat.key] = String(grid[b]?.[cat.key] ?? '');
      });
    }
    setDraft(d);
    setInitial(JSON.parse(JSON.stringify(d)));
  };

  const handleOpen = () => { loadYear(String(initialYear || CURRENT_YEAR - 1)); };

  const handleSave = async () => {
    const y = parseInt(year);
    if (!y || y > CURRENT_YEAR) return;

    const changes = [];
    const violations = [];
    for (let b = 1; b <= 12; b++) {
      CALAMITY_CATEGORIES.forEach(cat => {
        const newVal = parseInt(draft[b]?.[cat.key] || '0') || 0;
        const oldVal = parseInt(initial[b]?.[cat.key] || '0') || 0;
        const min = minCounts[b]?.[cat.key] || 0;
        if (newVal < min) {
          violations.push(`${BULAN_MS[b - 1]} - ${cat.key}: tidak boleh kurang daripada ${min} (terdapat ${min} rekod harian sedia ada bulan ini).`);
          return;
        }
        if (newVal !== oldVal) {
          changes.push([b, cat.key, newVal]);
        }
      });
    }

    if (violations.length > 0) {
      setViolationMsg(violations.join('\n'));
      return;
    }
    setViolationMsg(null);

    if (changes.length === 0) {
      setInfoMsg(true);
      setTimeout(() => setInfoMsg(false), 2000);
      return;
    }

    setSaving(true);
    await Promise.all(changes.map(([b, key, val]) => saveHistoriqueRow(y, b, key, val)));
    setSaving(false);
    setInitial(JSON.parse(JSON.stringify(draft)));
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 2000);
    onSaved?.();
  };

  const rowTotals = useMemo(() => {
    const totals = {};
    for (let b = 1; b <= 12; b++) {
      totals[b] = CALAMITY_CATEGORIES.reduce((sum, cat) => sum + (parseInt(draft[b]?.[cat.key] || '0') || 0), 0);
    }
    return totals;
  }, [draft]);

  const colTotals = useMemo(() => {
    const totals = {};
    CALAMITY_CATEGORIES.forEach(cat => {
      totals[cat.key] = 0;
      for (let b = 1; b <= 12; b++) {
        totals[cat.key] += parseInt(draft[b]?.[cat.key] || '0') || 0;
      }
    });
    return totals;
  }, [draft]);

  const grandTotal = useMemo(() => Object.values(rowTotals).reduce((a, b) => a + b, 0), [rowTotals]);

  if (Platform.OS === 'web' && typeof document !== 'undefined' && !document.getElementById('hist-modal-css')) {
    const style = document.createElement('style');
    style.id = 'hist-modal-css';
    style.textContent = `
      /* Scrollbars fines et arrondies */
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
      ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      * { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }

      /* Scroll fluide dans les listes */
      div[style*="overflow"] { scroll-behavior: smooth; }

      /* Pas d'outline de focus au clic */
      div[tabindex]:focus, input:focus { outline: none !important; }
    `;
    document.head.appendChild(style);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onShow={handleOpen}>
      <View style={s.overlay}>
        <View style={s.container}>
          {successMsg && (
            <View style={s.successBanner}>
              <Text style={s.successBannerText}>✓ Data berjaya disimpan!</Text>
            </View>
          )}
          {infoMsg && (
            <View style={s.infoBanner}>
              <Text style={s.infoBannerText}>Tiada perubahan untuk disimpan.</Text>
            </View>
          )}
          {violationMsg && (
            <View style={s.lockedBanner}>
              <Text style={s.lockedBannerText}>⚠️ Tidak dapat disimpan:{'\n'}{violationMsg}</Text>
            </View>
          )}
          {false && (
            <View style={s.lockedBanner}>
              <Text style={s.lockedBannerText}>🔒 Tahun {year} mempunyai rekod harian — data tidak boleh diubah di sini. Sila rujuk senarai penuh kecemasan.</Text>
            </View>
          )}
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}
            showsVerticalScrollIndicator={true}
          >

          {/* Header */}
          <View style={s.header}>
            <View>
              <Text style={s.headerTitle}>Rekod Tahun Sebelum</Text>
              <Text style={s.headerSub}>Isi jumlah kes mengikut kategori dan bulan</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Sélecteur d'année */}
          <View style={s.yearSection}>
            <Text style={s.yearLabel}>TAHUN</Text>
            <View style={s.yearSelectWrapper}>
              {Platform.OS === 'web' ? (
                <View style={{ position: 'relative', zIndex: 100 }}>
                  <TouchableOpacity
                    onPress={() => setYearOpen(o => !o)}
                    style={s.yearTrigger}
                  >
                    <Text style={s.yearTriggerText}>
                      {year}{yearsWithData.has(parseInt(year)) ? '  ✓ ada data' : ''}
                    </Text>
                    <Text style={s.yearTriggerArrow}>{yearOpen ? '▲' : '▼'}</Text>
                  </TouchableOpacity>

                  {yearOpen && (
                    <View style={s.yearDropdown}>
                      <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={true}>
                        {yearOptions.map(y => {
                          const hasData = yearsWithData.has(y);
                          const isSelected = parseInt(year) === y;
                          const isCurrent = y >= CURRENT_YEAR;
                          return (
                            <TouchableOpacity
                              key={y}
                              onPress={() => {
                                loadYear(String(y));
                                setYearOpen(false);
                                if (isCurrent) {
                                  setLockedMsg(true);
                                  setTimeout(() => setLockedMsg(false), 3000);
                                }
                              }}
                              style={[s.yearOption, isSelected && s.yearOptionSelected]}
                            >
                              <Text style={[s.yearOptionText, isSelected && s.yearOptionTextSelected]}>
                                {y}{isCurrent ? ' 🔒' : ''}
                              </Text>
                              {hasData && !isCurrent ? <Text style={s.yearHasData}>✓ ada data</Text> : null}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              ) : (
                <ScrollView style={{ maxHeight: 160 }}>
                  {yearOptions.map(y => {
                    const hasData = yearsWithData.has(y);
                    const isSelected = parseInt(year) === y;
                    const isCurrent = y >= CURRENT_YEAR;
                    return (
                      <TouchableOpacity key={y}
                        onPress={() => {
                          loadYear(String(y));
                          if (isCurrent) {
                            setLockedMsg(true);
                            setTimeout(() => setLockedMsg(false), 3000);
                          }
                        }}
                        style={[s.yearOption, isSelected && s.yearOptionSelected]}>
                        <Text style={[s.yearOptionText, isSelected && s.yearOptionTextSelected]}>
                          {y}{isCurrent ? ' 🔒' : ''}
                        </Text>
                        {hasData && !isCurrent ? <Text style={s.yearHasData}>✓ ada data</Text> : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Grille */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            style={{ marginBottom: 0, zIndex: 1 }}
            contentContainerStyle={{ minWidth: '100%' }}
          >
            <View style={[s.tableWrapper, { minWidth: '100%' }]}>

              {/* Header */}
              <View style={s.tableHeaderRow}>
                <View style={s.monthCol}>
                  <Text style={s.headerCell}>Bulan</Text>
                </View>
                {CALAMITY_CATEGORIES.map(cat => (
                  <View key={cat.key} style={s.catCol}>
                    <Text style={s.headerCell}>{cat.key}</Text>
                  </View>
                ))}
                <View style={s.totalCol}>
                  <Text style={s.headerCell}>Jumlah</Text>
                </View>
              </View>

              {/* Lignes mois */}
              {BULAN_MS.map((bulan, i) => {
                const b = i + 1;
                const rowTotal = rowTotals[b] || 0;
                return (
                  <View key={b} style={[s.tableRow, { backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                    <View style={s.monthCol}>
                      <Text style={s.monthCell}>{bulan}</Text>
                    </View>
                    {CALAMITY_CATEGORIES.map(cat => (
                      <View key={cat.key} style={[s.catCol, s.cellCenter]}>
                        <TextInput
                          style={[
                            s.input,
                            (parseInt(draft[b]?.[cat.key] || '0') || 0) < (minCounts[b]?.[cat.key] || 0) && s.inputViolation,
                          ]}
                          keyboardType="number-pad"
                          maxLength={5}
                          value={draft[b]?.[cat.key] ?? ''}
                          onChangeText={v => {
                            const clean = v.replace(/[^0-9]/g, '');
                            setDraft(prev => ({ ...prev, [b]: { ...prev[b], [cat.key]: clean } }));
                          }}
                          placeholder="–"
                          placeholderTextColor="#94a3b8"
                          selectTextOnFocus
                        />
                      </View>
                    ))}
                    <View style={[s.totalCol, s.cellCenter]}>
                      <Text style={[s.rowTotal, rowTotal === 0 && s.zeroText]}>
                        {rowTotal > 0 ? rowTotal : '–'}
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Ligne Kumulatif */}
              <View style={s.kumulatifRow}>
                <View style={s.monthCol}>
                  <Text style={s.kumulatifLabel}>Kumulatif</Text>
                </View>
                {CALAMITY_CATEGORIES.map(cat => (
                  <View key={cat.key} style={[s.catCol, s.cellCenter]}>
                    <Text style={s.kumulatifCell}>
                      {colTotals[cat.key] > 0 ? colTotals[cat.key] : '–'}
                    </Text>
                  </View>
                ))}
                <View style={[s.totalCol, s.cellCenter]}>
                  <Text style={s.grandTotal}>{grandTotal > 0 ? grandTotal : '–'}</Text>
                </View>
              </View>

            </View>
          </ScrollView>

          </ScrollView>

          {/* Footer */}
          <View style={s.footer}>
            <TouchableOpacity onPress={onClose} style={s.cancelBtn}>
              <Text style={s.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={s.saveBtn}>
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.saveBtnText}>Simpan</Text>}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { backgroundColor: '#fff', borderRadius: 20, width: '95%', maxWidth: 1400, maxHeight: '92%', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 10 }, elevation: 10 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  headerSub: { fontSize: 12, color: '#94a3b8', marginTop: 3 },
  closeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  yearSection: { marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', zIndex: 100 },
  yearLabel: { fontSize: 11, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  yearSelectWrapper: { borderRadius: 10 },
  yearTrigger: { width: 220, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, backgroundColor: '#fff' },
  yearTriggerText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  yearTriggerArrow: { fontSize: 10, color: '#64748b' },
  yearDropdown: { position: 'absolute', top: '110%', left: 0, width: 220, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8, overflow: 'hidden' },
  yearOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', justifyContent: 'space-between' },
  yearOptionSelected: { backgroundColor: '#fff7ed' },
  yearOptionText: { fontSize: 14, color: '#334155' },
  yearOptionTextSelected: { fontWeight: '700', color: '#f97316' },
  yearHasData: { fontSize: 12, color: '#16a34a', fontWeight: '700' },

  tableWrapper: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, overflow: 'hidden' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#1E3A8A' },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  kumulatifRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', borderTopWidth: 2, borderTopColor: '#e2e8f0' },

  monthCol: { minWidth: 100, flex: 1.5, paddingHorizontal: 14, paddingVertical: 5, justifyContent: 'center' },
  catCol: { minWidth: 56, flex: 1, paddingHorizontal: 4, paddingVertical: 3 },
  totalCol: { minWidth: 68, flex: 1.2, paddingHorizontal: 8, paddingVertical: 3, borderLeftWidth: 1, borderLeftColor: '#e2e8f0' },
  cellCenter: { alignItems: 'center', justifyContent: 'center' },

  headerCell: { fontSize: 13, fontWeight: '800', color: '#fff', textAlign: 'center' },
  monthCell: { fontSize: 14, fontWeight: '600', color: '#334155' },
  rowTotal: { fontSize: 15, fontWeight: '900', color: '#1E3A8A', textAlign: 'center' },
  zeroText: { color: '#94a3b8', fontWeight: '400' },
  kumulatifLabel: { fontSize: 14, fontWeight: '800', color: '#92400e' },
  kumulatifCell: { fontSize: 14, fontWeight: '700', color: '#334155', textAlign: 'center' },
  grandTotal: { fontSize: 15, fontWeight: '900', color: '#1E3A8A', textAlign: 'center' },

  input: {
    width: '100%', maxWidth: 52, height: 28, textAlign: 'center', fontSize: 13,
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 6,
    color: '#334155', backgroundColor: '#fff',
    outlineStyle: 'none',
  },

  footer: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', paddingVertical: 10, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', backgroundColor: '#fff' },
  successBanner: { backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderBottomColor: '#bbf7d0', paddingVertical: 10, paddingHorizontal: 20 },
  successBannerText: { fontSize: 13, fontWeight: '700', color: '#16a34a', textAlign: 'center' },
  infoBanner: { backgroundColor: '#eff6ff', borderBottomWidth: 1, borderBottomColor: '#bfdbfe', paddingVertical: 10, paddingHorizontal: 20 },
  infoBannerText: { fontSize: 13, fontWeight: '700', color: '#2563eb', textAlign: 'center' },
  lockedBanner: { backgroundColor: '#fffbeb', borderBottomWidth: 1, borderBottomColor: '#fde68a', paddingVertical: 10, paddingHorizontal: 20 },
  lockedBannerText: { fontSize: 13, fontWeight: '700', color: '#b45309', textAlign: 'center' },
  inputLocked: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9', color: '#64748b' },
  inputViolation: { borderColor: '#dc2626', borderWidth: 1.5, backgroundColor: '#fef2f2' },
  saveBtnDisabled: { backgroundColor: '#cbd5e1', shadowOpacity: 0 },
  cancelBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10, backgroundColor: '#fff' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  saveBtn: { backgroundColor: '#22c55e', paddingHorizontal: 24, paddingVertical: 9, borderRadius: 10, alignItems: 'center', justifyContent: 'center', minWidth: 100, shadowColor: '#22c55e', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  saveBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
