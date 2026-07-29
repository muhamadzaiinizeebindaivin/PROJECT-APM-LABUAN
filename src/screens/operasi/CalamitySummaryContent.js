// src/screens/operasi/CalamitySummaryContent.js
import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, TextInput } from 'react-native';
import { Download, TrendingUp, TrendingDown, Minus, Award, Calendar } from 'lucide-react-native';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { useCalamityPoints } from '../../hooks/useCalamityPoints';
import { useCalamitySummaryPanel } from '../../hooks/useCalamitySummaryPanel';
import ModalSelectField from '../../components/ModalSelectField';
import { CALAMITY_CATEGORIES } from '../../constants/operasiConstants';
import { PALETTE } from '../../constants/palette';
import { BULAN_MS, BULAN_OPTIONS } from '../../constants/bulan';
import { mapStyles as styles } from './mapStyles';
import Ng999HistoriqueModal from './Ng999HistoriqueModal';
import { useState as useHistState } from 'react';

function CompactTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const nonZero = payload.filter(p => p.value > 0);
  if (nonZero.length === 0) return null;
  return (
    <View style={{ backgroundColor: '#0f172a', borderRadius: 8, padding: 10, maxWidth: 260 }}>
      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {nonZero.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.color }} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{p.name}: {p.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BigStatCard({ icon, label, value, sub, color, bg, borderColor }) {
  return (
    <View style={{
      flex: 1, minWidth: 200,
      backgroundColor: bg,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: borderColor || 'transparent',
      padding: 20,
      gap: 8,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: 6 }}>
          {icon}
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 32, fontWeight: '900', color, letterSpacing: -1 }}>{value}</Text>
      {sub ? <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>{sub}</Text> : null}
    </View>
  );
}

function SectionCard({ title, children }) {
  return (
    <View style={{
      backgroundColor: '#fff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      padding: 20,
      marginBottom: 14,
      shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
    }}>
      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 14 }}>{title}</Text>
      {children}
    </View>
  );
}

function QuarterBar({ label, total, maxTotal, isHighest }) {
  const pct = maxTotal > 0 ? total / maxTotal : 0;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: isHighest ? '#d97706' : '#475569' }}>
          {label} {isHighest ? '⭐' : ''}
        </Text>
        <Text style={{ fontSize: 12, fontWeight: '800', color: isHighest ? '#d97706' : '#334155' }}>{total} kes</Text>
      </View>
      <View style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: isHighest ? '#d97706' : '#93c5fd', borderRadius: 4 }} />
      </View>
    </View>
  );
}

function RankRow({ rank, catKey, total, pct, color, maxTotal }) {
  const barWidth = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Text style={{ fontSize: 11, fontWeight: '900', color: '#94a3b8', width: 20 }}>#{rank}</Text>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, flexShrink: 0 }} />
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', flex: 1 }}>{catKey}</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color: PALETTE.orange }}>{total} kes</Text>
        <Text style={{ fontSize: 11, color: '#94a3b8', width: 32, textAlign: 'right' }}>{pct}%</Text>
      </View>
      <View style={{ marginLeft: 28, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ width: `${barWidth}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );
}

// mode: 'table' -> filtres Tahun/Bulan/Hari + tableau + export PDF
//       'chart' -> statistiques + graphiques
// statsOnly: true -> affiche seulement les stat cards (sans filtres ni graphiques)
export default function CalamitySummaryContent({ theme, large = false, mode = 'table', statsOnly = false, isEditMode = false }) {
  const { calamityPoints } = useCalamityPoints();
  const summary = useCalamitySummaryPanel(calamityPoints);
  const [selectedChartCategories, setSelectedChartCategories] = useState(CALAMITY_CATEGORIES.map(cat => cat.key));
  const [histModalVisible, setHistModalVisible] = useState(false);
  const [statusDraft, setStatusDraft] = useState({});
  const [savingStatus, setSavingStatus] = useState(false);
  const editingStatus = isEditMode;

  const [gridDraft, setGridDraft] = useState({});
  const [savingGrid, setSavingGrid] = useState(false);
  const [gridViolation, setGridViolation] = useState(null);
  const editingGrid = isEditMode && summary.summaryMonth === null;

  useEffect(() => {
    if (!editingGrid) return;
    const d = {};
    summary.calamitySummaryRows.forEach((row, idx) => {
      if (row.isCumulative) return;
      CALAMITY_CATEGORIES.forEach(cat => {
        d[`${idx + 1}-${cat.key}`] = String(row.counts[cat.key] || '');
      });
    });
    setGridDraft(d);
  }, [editingGrid, summary.summaryYear]);

  const liveTotals = useMemo(() => {
    if (!editingGrid) return null;
    const rowTotals = {};
    const colTotals = {};
    let grand = 0;
    CALAMITY_CATEGORIES.forEach(cat => { colTotals[cat.key] = 0; });
    Object.entries(gridDraft).forEach(([key, val]) => {
      const [b, ...catParts] = key.split('-');
      const catKey = catParts.join('-');
      const v = parseInt(val) || 0;
      rowTotals[b] = (rowTotals[b] || 0) + v;
      if (colTotals[catKey] !== undefined) colTotals[catKey] += v;
      grand += v;
    });
    return { rowTotals, colTotals, grand };
  }, [editingGrid, gridDraft]);

  useEffect(() => {
    if (editingStatus) setStatusDraft({ ...(summary.statusBreakdown || {}) });
  }, [editingStatus, summary.summaryYear]);

  const toggleChartCategory = (key) => {
    setSelectedChartCategories(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };
  const toggleAllChartCategories = () => {
    setSelectedChartCategories(prev => prev.length === CALAMITY_CATEGORIES.length ? [] : CALAMITY_CATEGORIES.map(cat => cat.key));
  };

  const analytics = useMemo(() => {
    const data = summary.calamityMonthlyBreakdown;
    if (!data || data.length === 0) return null;
    const totals = data.map(d => d.total);
    const totalYear = totals.reduce((s, v) => s + v, 0);
    const avgMonth = Math.round(totalYear / 12);
    const maxTotal = Math.max(...totals);
    const minTotal = Math.min(...totals.filter(t => t > 0));
    const peakMonth = data.find(d => d.total === maxTotal);
    const lowMonth = data.find(d => d.total === (minTotal || 0));
    const n = totals.length;
    const sumX = totals.reduce((s, _, i) => s + i, 0);
    const sumY = totals.reduce((s, v) => s + v, 0);
    const sumXY = totals.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = totals.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
    const trend = slope > 0.5 ? 'hausse' : slope < -0.5 ? 'baisse' : 'stable';
    const nonZeroMonths = data.filter(d => d.total > 0);
    const lastTwo = nonZeroMonths.slice(-2);
    const lastVariationPct = lastTwo.length === 2 && lastTwo[0].total > 0
      ? Math.round(((lastTwo[1].total - lastTwo[0].total) / lastTwo[0].total) * 100)
      : null;
    const lastVariationMonth = lastTwo[1]?.month || null;
    const lastVariationPrevMonth = lastTwo[0]?.month || null;
    const catTotals = CALAMITY_CATEGORIES.map(cat => ({
      key: cat.key, color: cat.color,
      total: data.reduce((s, d) => s + (d.counts[cat.key] || 0), 0),
    })).sort((a, b) => b.total - a.total);
    const quarters = [
      { label: 'Q1 (Jan–Mac)', total: data.slice(0, 3).reduce((s, d) => s + d.total, 0) },
      { label: 'Q2 (Apr–Jun)', total: data.slice(3, 6).reduce((s, d) => s + d.total, 0) },
      { label: 'Q3 (Jul–Sep)', total: data.slice(6, 9).reduce((s, d) => s + d.total, 0) },
      { label: 'Q4 (Okt–Dis)', total: data.slice(9, 12).reduce((s, d) => s + d.total, 0) },
    ];
    const peakQuarter = quarters.reduce((a, b) => a.total > b.total ? a : b);
    const maxQuarter = Math.max(...quarters.map(q => q.total));
    const barData = catTotals.slice(0, 8).map(c => ({ name: c.key, total: c.total, color: c.color }));
    return { totalYear, avgMonth, peakMonth, lowMonth, slope, trend, lastVariationPct, lastVariationMonth, lastVariationPrevMonth, catTotals, quarters, peakQuarter, maxQuarter, barData };
  }, [summary.calamityMonthlyBreakdown]);

  const trendColor = analytics?.trend === 'hausse' ? '#ef4444' : analytics?.trend === 'baisse' ? '#22c55e' : '#f59e0b';
  const trendLabel = analytics?.trend === 'hausse' ? '↑ Meningkat' : analytics?.trend === 'baisse' ? '↓ Menurun' : '→ Stabil';
  const trendBg = analytics?.trend === 'hausse' ? '#fef2f2' : analytics?.trend === 'baisse' ? '#f0fdf4' : '#fffbeb';
  const trendBorder = analytics?.trend === 'hausse' ? '#fecaca' : analytics?.trend === 'baisse' ? '#bbf7d0' : '#fde68a';
  const trendIcon = analytics?.trend === 'hausse' ? <TrendingUp size={16} color={trendColor} /> : analytics?.trend === 'baisse' ? <TrendingDown size={16} color={trendColor} /> : <Minus size={16} color={trendColor} />;

  const statCards = analytics ? (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      <BigStatCard
        icon={<Calendar size={16} color="#1E3A8A" />}
        label="Jumlah Tahun" value={analytics.totalYear}
        sub={`Purata ${analytics.avgMonth} kes / bulan`}
        color="#1E3A8A" bg="#eff6ff" borderColor="#bfdbfe" />
      <BigStatCard
        icon={<TrendingUp size={16} color="#ef4444" />}
        label="Puncak Tertinggi" value={analytics.peakMonth?.month || '–'}
        sub={`${analytics.peakMonth?.total || 0} kes`}
        color="#ef4444" bg="#fef2f2" borderColor="#fecaca" />
      <BigStatCard
        icon={<TrendingDown size={16} color="#22c55e" />}
        label="Bulan Terendah" value={analytics.lowMonth?.month || '–'}
        sub={`${analytics.lowMonth?.total || 0} kes`}
        color="#16a34a" bg="#f0fdf4" borderColor="#bbf7d0" />
      <BigStatCard
        icon={<Award size={16} color="#d97706" />}
        label="Suku Tertinggi" value={analytics.peakQuarter.label}
        sub={`${analytics.peakQuarter.total} kes`}
        color="#d97706" bg="#fffbeb" borderColor="#fde68a" />
      {analytics.lastVariationPct !== null && (
        <BigStatCard
          icon={analytics.lastVariationPct > 0 ? <TrendingUp size={16} color="#ef4444" /> : <TrendingDown size={16} color="#22c55e" />}
          label={`Variasi ${analytics.lastVariationMonth}`}
          value={`${analytics.lastVariationPct > 0 ? '+' : ''}${analytics.lastVariationPct}%`}
          sub={`vs ${analytics.lastVariationPrevMonth || 'bulan sebelumnya'}`}
          color={analytics.lastVariationPct > 0 ? '#ef4444' : '#16a34a'}
          bg={analytics.lastVariationPct > 0 ? '#fef2f2' : '#f0fdf4'}
          borderColor={analytics.lastVariationPct > 0 ? '#fecaca' : '#bbf7d0'} />
      )}
    </View>
  ) : null;

  // Mode statsOnly : juste les cartes, sans ScrollView ni filtres
  if (statsOnly) {
    return (
      <View style={{ paddingVertical: 8 }}>
        {statCards}
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>

      {/* Filtres */}
      <View style={[styles.historyFilterRow, { alignItems: 'flex-end', minHeight: 80, paddingBottom: 16 }]}>
        <View style={{ flex: 1 }}>
          <ModalSelectField theme={theme} label="Tahun" value={String(summary.summaryYear)} placeholder="Tahun"
            options={summary.availableSummaryYears} isOpen={summary.summaryYearOpen}
            onToggle={() => { summary.setSummaryYearOpen(!summary.summaryYearOpen); summary.setSummaryMonthOpen(false); summary.setSummaryDayOpen(false); }}
            onSelect={(opt) => { summary.setSummaryYear(Number(opt)); summary.setSummaryDay(null); summary.setSummaryYearOpen(false); }}
            stackIndex={3000} />
        </View>
        {mode === 'table' && (
          <>
            <View style={{ flex: 1 }}>
              <ModalSelectField theme={theme} label="Bulan"
                value={summary.summaryMonth === null ? 'Semua Bulan' : BULAN_MS[summary.summaryMonth]}
                placeholder="Bulan" options={BULAN_OPTIONS} isOpen={summary.summaryMonthOpen}
                onToggle={() => { summary.setSummaryMonthOpen(!summary.summaryMonthOpen); summary.setSummaryYearOpen(false); summary.setSummaryDayOpen(false); }}
                onSelect={(opt) => { summary.setSummaryMonth(opt === 'Semua Bulan' ? null : BULAN_MS.indexOf(opt)); summary.setSummaryDay(null); summary.setSummaryMonthOpen(false); }}
                stackIndex={2000} />
            </View>
            <View style={{ flex: 1, opacity: summary.hasRealDailyData ? 1 : 0.5 }}>
              <ModalSelectField theme={theme} label="Hari"
                value={summary.hasRealDailyData
                  ? (summary.summaryDay === null ? 'Semua Hari' : String(summary.summaryDay))
                  : 'Tiada rekod harian'}
                placeholder="Hari"
                options={summary.hasRealDailyData ? summary.summaryDayOptions : []}
                isOpen={summary.hasRealDailyData && summary.summaryDayOpen}
                onToggle={() => {
                  if (!summary.hasRealDailyData) return;
                  summary.setSummaryDayOpen(!summary.summaryDayOpen);
                  summary.setSummaryYearOpen(false);
                  summary.setSummaryMonthOpen(false);
                }}
                onSelect={(opt) => { summary.setSummaryDay(opt === 'Semua Hari' ? null : Number(opt)); summary.setSummaryDayOpen(false); }}
                stackIndex={1000} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'flex-end', marginBottom: 16 }}>
              <TouchableOpacity onPress={summary.handleExportLaporanPdf} disabled={summary.exportingLaporanPdf}
                style={[styles.pdfExportBtn, summary.exportingLaporanPdf && styles.pdfExportBtnDisabled, { height: 50, opacity: summary.exportingLaporanPdf ? 0.7 : 1 }]}>
                {summary.exportingLaporanPdf ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.pdfExportBtnText}>Jana PDF...</Text>
                  </View>
                ) : (
                  <><Download size={14} color="#fff" /><Text style={styles.pdfExportBtnText}>Laporan</Text></>
                )}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setHistModalVisible(true)} style={[styles.pdfExportBtn, { height: 50, backgroundColor: PALETTE.orange }]}>
                <Download size={14} color="#fff" />
                <Text style={styles.pdfExportBtnText}>Tambah Rekod Tahun Sebelum</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* MODE TABLE */}
      {mode === 'table' && (
        <View>
        {isEditMode && (
          <View style={[styles.calamityTableWrapper, { minHeight: 0, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginBottom: 10 }]}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1d4ed8', textAlign: 'center' }}>
              ℹ️ Menambah titik kecemasan pada peta akan menambah +1 secara automatik pada bulan &amp; kategori berkenaan dalam jadual ini. Jadual ini kekal boleh dikemaskini secara manual pada bila-bila masa.
            </Text>
          </View>
        )}
        {editingGrid && (
          <View style={[styles.calamityTableWrapper, { minHeight: 0, backgroundColor: 'transparent', borderWidth: 0, flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 10, padding: 0, shadowOpacity: 0, elevation: 0 }]}>
            <TouchableOpacity disabled={savingGrid}
              onPress={async () => {
                const entries = [];
                const violations = [];
                Object.entries(gridDraft).forEach(([key, val]) => {
                  const [bulan, ...catParts] = key.split('-');
                  const bulanNum = parseInt(bulan);
                  const category = catParts.join('-');
                  const jumlah = parseInt(val) || 0;
                  const min = summary.dailyMinCounts[bulanNum]?.[category] || 0;
                  if (jumlah < min) {
                    violations.push(`Bulan ${bulanNum} - ${category}: tidak boleh kurang daripada ${min} (terdapat ${min} rekod harian sedia ada).`);
                    return;
                  }
                  entries.push({ bulan: bulanNum, category, jumlah_kes: jumlah });
                });

                if (violations.length > 0) {
                  setGridViolation(violations.join('\n'));
                  return;
                }
                setGridViolation(null);

                setSavingGrid(true);
                await summary.saveHistoriqueGrid(summary.summaryYear, entries);
                setSavingGrid(false);
              }}
              style={{ backgroundColor: '#22c55e', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10 }}>
              {savingGrid ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Simpan</Text>}
            </TouchableOpacity>
          </View>
        )}
        {!!gridViolation && (
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#dc2626', marginBottom: 10, textAlign: 'right' }}>
            ⚠️ {gridViolation}
          </Text>
        )}
        <View style={[styles.calamityTableWrapper, { minHeight: 400 }]}>
          <View style={[styles.calamityTableHeaderRow, { flexDirection: 'row', alignItems: 'center' }]}>
            <View style={[styles.calamityMonthColFlex, styles.calamityHeaderCellBox]}>
              <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Bulan</Text>
            </View>
            {CALAMITY_CATEGORIES.map(cat => (
              <View key={cat.key} style={[styles.calamityCatColFlex, styles.calamityHeaderCellBox]}>
                <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>{cat.key}</Text>
              </View>
            ))}
            <View style={[styles.calamityTotalColFlex, styles.calamityHeaderCellBox]}>
              <Text style={[styles.calamityTableHeaderCell, large && { fontSize: 16 }]}>Jumlah</Text>
            </View>
          </View>
          {summary.calamitySummaryRows.map((row, idx) => {
            const bulan = idx + 1;
            return (
              <View key={row.month} style={[styles.calamityTableRow, row.isCumulative ? styles.calamityCumulativeRow : { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }]}>
                <View style={[styles.calamityMonthColFlex, styles.calamitySummaryCellBox]}>
                  <Text style={[styles.calamityTableCell, { fontWeight: '800' }, large && { fontSize: 16 }]}>{row.month}</Text>
                </View>
                {CALAMITY_CATEGORIES.map(cat => (
                  <View key={cat.key} style={[styles.calamityCatColFlex, styles.calamitySummaryCellBox]}>
                    {editingGrid && !row.isCumulative ? (
                      <TextInput
                        value={gridDraft[`${bulan}-${cat.key}`] ?? ''}
                        onChangeText={v => setGridDraft(prev => ({ ...prev, [`${bulan}-${cat.key}`]: v.replace(/[^0-9]/g, '') }))}
                        keyboardType="number-pad" maxLength={5} selectTextOnFocus
                        placeholder="–" placeholderTextColor="#94a3b8"
                        style={{ width: 44, height: 28, textAlign: 'center', fontSize: 13, borderWidth: 1, borderColor: '#fdba74', borderRadius: 6, color: PALETTE.orange, backgroundColor: '#fff', outlineStyle: 'none' }}
                      />
                    ) : (
                      <Text style={[styles.calamityTableCell, row.isCumulative && { fontWeight: '700' }, row.fromHistorique && { color: PALETTE.orange }, large && { fontSize: 16 }]}>
                        {(editingGrid && row.isCumulative ? liveTotals?.colTotals[cat.key] : row.counts[cat.key]) || '–'}
                      </Text>
                    )}
                  </View>
                ))}
                <View style={[styles.calamityTotalColFlex, styles.calamityTotalBadge]}>
                  <Text style={[styles.calamityTotalBadgeText, large && { fontSize: 18 }]}>
                    {editingGrid
                      ? (row.isCumulative ? (liveTotals?.grand || 0) : (liveTotals?.rowTotals[bulan] || 0))
                      : row.total}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
        </View>
      )}

      {/* MODE CHART */}
      {mode === 'chart' && Platform.OS === 'web' && analytics && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 24, gap: 14 }}>

          {isEditMode && (
            <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1d4ed8', textAlign: 'center' }}>
                ℹ️ Menambah titik kecemasan pada peta akan menambah +1 secara automatik pada bulan &amp; kategori berkenaan dalam statistik ini. Kekal boleh dikemaskini secara manual pada bila-bila masa.
              </Text>
            </View>
          )}

          {/* Résumé Statuts */}
          <SectionCard title="📋 Ringkasan Status">
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {[
                { key: 'active', label: 'Aktif', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
                { key: 'berjaya', label: 'Berjaya', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
                { key: 'gagal', label: 'Gagal', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
                { key: 'batal', label: 'Batal', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
                { key: 'tunda', label: 'Tunda', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
                { key: 'diambil agensi lain', label: 'Diambil Agensi Lain', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
                { key: 'diserah ke agensi lain', label: 'Diserah Agensi Lain', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' },
              ].map(s => (
                <View key={s.key} style={{
                  backgroundColor: s.bg, borderWidth: 1.5, borderColor: s.border,
                  borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                  minWidth: 140, flex: 1,
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</Text>
                  {editingStatus ? (
                    <TextInput
                      value={String(statusDraft[s.key] ?? '')}
                      onChangeText={v => setStatusDraft(prev => ({ ...prev, [s.key]: v.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad" maxLength={6}
                      style={{ fontSize: 24, fontWeight: '900', color: s.color, borderBottomWidth: 2, borderBottomColor: s.color, paddingVertical: 2, outlineStyle: 'none' }}
                    />
                  ) : (
                    <Text style={{ fontSize: 28, fontWeight: '900', color: s.color }}>{summary.statusBreakdown?.[s.key] || 0}</Text>
                  )}
                </View>
              ))}
            </View>
            {editingStatus && (
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                <TouchableOpacity disabled={savingStatus}
                  onPress={async () => {
                    setSavingStatus(true);
                    await summary.saveHistoriqueStatus(summary.summaryYear, statusDraft);
                    setSavingStatus(false);
                  }}
                  style={{ backgroundColor: '#22c55e', paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10 }}>
                  {savingStatus ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Simpan</Text>}
                </TouchableOpacity>
              </View>
            )}
          </SectionCard>

          {/* Ranking Kategori */}
          <SectionCard title="🏆 Ranking Kategori">
            {analytics.catTotals.slice(0, 8).map((cat, i) => (
              <RankRow key={cat.key} rank={i + 1} catKey={cat.key} total={cat.total}
                pct={analytics.totalYear > 0 ? Math.round((cat.total / analytics.totalYear) * 100) : 0}
                color={cat.color} maxTotal={analytics.catTotals[0]?.total || 1} />
            ))}
          </SectionCard>

          {/* Analisis Suku Tahun */}
          <SectionCard title="📅 Analisis Suku Tahun">
            {analytics.quarters.map(q => (
              <QuarterBar key={q.label} label={q.label} total={q.total}
                maxTotal={analytics.maxQuarter}
                isHighest={q.label === analytics.peakQuarter.label} />
            ))}
          </SectionCard>

          {/* Grafik Trend */}
          <View style={styles.summaryChartWrapper}>
            <Text style={styles.summaryChartTitle}>Trend Mengikut Bulan ({summary.summaryYear})</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <TouchableOpacity onPress={toggleAllChartCategories}
                style={[styles.chartCatChip, { backgroundColor: PALETTE.orange, borderColor: PALETTE.orange }]}>
                <Text style={[styles.chartCatChipText, { color: '#fff' }]}>
                  {selectedChartCategories.length === CALAMITY_CATEGORIES.length ? 'Kosongkan' : 'Semua'}
                </Text>
              </TouchableOpacity>
              {CALAMITY_CATEGORIES.map(cat => {
                const isSelected = selectedChartCategories.includes(cat.key);
                return (
                  <TouchableOpacity key={cat.key} onPress={() => toggleChartCategory(cat.key)}
                    style={[styles.chartCatChip, { borderColor: cat.color, backgroundColor: isSelected ? cat.color : '#fff' }]}>
                    <Text style={[styles.chartCatChipText, { color: isSelected ? '#fff' : cat.color }]}>{cat.key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={summary.calamityMonthlyBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CompactTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {CALAMITY_CATEGORIES.filter(cat => selectedChartCategories.includes(cat.key)).map(cat => (
                  <Line key={cat.key} type="monotone" dataKey={(row) => row.counts[cat.key]}
                    name={cat.key} stroke={cat.color} strokeWidth={2} dot={{ r: 2 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </View>

          {/* BarChart Ranking */}
          <View style={[styles.summaryChartWrapper, { marginBottom: 8 }]}>
            <Text style={styles.summaryChartTitle}>Jumlah Keseluruhan Mengikut Kategori ({summary.summaryYear})</Text>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics.barData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="total" name="Jumlah Kes" radius={[6, 6, 0, 0]}>
                  {analytics.barData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </View>

        </View>
      )}

      {mode === 'chart' && Platform.OS !== 'web' && (
        <Text style={styles.waypointEmptyText}>Carta trend hanya tersedia di versi web.</Text>
      )}
      <Ng999HistoriqueModal
        visible={histModalVisible}
        onClose={() => setHistModalVisible(false)}
        initialYear={summary.summaryYear}
        onSaved={summary.refreshHistoriqueYears}
      />
    </ScrollView>
  );
}
