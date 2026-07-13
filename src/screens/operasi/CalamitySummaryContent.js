// src/screens/operasi/CalamitySummaryContent.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Download } from 'lucide-react-native';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useCalamityPoints } from '../../hooks/useCalamityPoints';
import { useCalamitySummaryPanel } from '../../hooks/useCalamitySummaryPanel';
import ModalSelectField from '../../components/ModalSelectField';
import { CALAMITY_CATEGORIES } from '../../constants/operasiConstants';
import { BULAN_MS, BULAN_OPTIONS } from '../../constants/bulan';
import { mapStyles as styles } from './mapStyles';

function CompactTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const nonZero = payload.filter(p => p.value > 0);
  if (nonZero.length === 0) return null;

  return (
    <View style={{
      backgroundColor: '#0f172a', borderRadius: 8, padding: 10,
      maxWidth: 260, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
    }}>
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

// mode: 'table' -> filtres Tahun/Bulan/Hari + tableau + export PDF
//       'chart' -> filtre Tahun + graphique de tendance mensuelle
export default function CalamitySummaryContent({ theme, large = false, mode = 'table' }) {
  const { calamityPoints } = useCalamityPoints();
  const summary = useCalamitySummaryPanel(calamityPoints);

  const [selectedChartCategories, setSelectedChartCategories] = useState(
    CALAMITY_CATEGORIES.map(cat => cat.key)
  );

  const toggleChartCategory = (key) => {
    setSelectedChartCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const toggleAllChartCategories = () => {
    setSelectedChartCategories(prev =>
      prev.length === CALAMITY_CATEGORIES.length ? [] : CALAMITY_CATEGORIES.map(cat => cat.key)
    );
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 8 }}>
      {/* Ligne de filtres avec hauteur fixe pour éviter les sauts de layout */}
      <View style={[styles.historyFilterRow, { alignItems: 'center', minHeight: 80 }]}>
        <View style={{ flex: 1 }}>
          <ModalSelectField
            theme={theme}
            label="Tahun"
            value={String(summary.summaryYear)}
            placeholder="Tahun"
            options={summary.availableSummaryYears}
            isOpen={summary.summaryYearOpen}
            onToggle={() => { summary.setSummaryYearOpen(!summary.summaryYearOpen); summary.setSummaryMonthOpen(false); summary.setSummaryDayOpen(false); }}
            onSelect={(opt) => { summary.setSummaryYear(Number(opt)); summary.setSummaryDay(null); summary.setSummaryYearOpen(false); }}
            stackIndex={3000}
          />
        </View>

        {mode === 'table' && (
          <>
            <View style={{ flex: 1 }}>
              <ModalSelectField
                theme={theme}
                label="Bulan"
                value={summary.summaryMonth === null ? 'Semua Bulan' : BULAN_MS[summary.summaryMonth]}
                placeholder="Bulan"
                options={BULAN_OPTIONS}
                isOpen={summary.summaryMonthOpen}
                onToggle={() => { summary.setSummaryMonthOpen(!summary.summaryMonthOpen); summary.setSummaryYearOpen(false); summary.setSummaryDayOpen(false); }}
                onSelect={(opt) => {
                  summary.setSummaryMonth(opt === 'Semua Bulan' ? null : BULAN_MS.indexOf(opt));
                  summary.setSummaryDay(null);
                  summary.setSummaryMonthOpen(false);
                }}
                stackIndex={2000}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ModalSelectField
                theme={theme}
                label="Hari"
                value={summary.summaryDay === null ? 'Semua Hari' : String(summary.summaryDay)}
                placeholder="Hari"
                options={summary.summaryDayOptions}
                isOpen={summary.summaryDayOpen}
                onToggle={() => { summary.setSummaryDayOpen(!summary.summaryDayOpen); summary.setSummaryYearOpen(false); summary.setSummaryMonthOpen(false); }}
                onSelect={(opt) => { summary.setSummaryDay(opt === 'Semua Hari' ? null : Number(opt)); summary.setSummaryDayOpen(false); }}
                stackIndex={1000}
              />
            </View>
            <TouchableOpacity
              onPress={summary.handleExportSummaryPdf}
              disabled={summary.exportingSummaryPdf}
              style={[
                styles.pdfExportBtn,
                summary.exportingSummaryPdf && styles.pdfExportBtnDisabled,
                { flexShrink: 0, height: 46, marginTop: 22 }
              ]}
            >
              {summary.exportingSummaryPdf ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Download size={14} color="#fff" />
                  <Text style={styles.pdfExportBtnText}>PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {mode === 'table' && (
        <View style={[styles.calamityTableWrapper, { minHeight: 400 }]}>
          <View style={styles.calamityTableHeaderRow}>
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
          {summary.calamitySummaryRows.map((row, idx) => (
            <View
              key={row.month}
              style={[
                styles.calamityTableRow,
                row.isCumulative
                  ? styles.calamityCumulativeRow
                  : { backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' },
              ]}
            >
              <View style={[styles.calamityMonthColFlex, styles.calamitySummaryCellBox]}>
                <Text style={[styles.calamityTableCell, { fontWeight: '800' }, large && { fontSize: 16 }]}>{row.month}</Text>
              </View>
              {CALAMITY_CATEGORIES.map(cat => (
                <View key={cat.key} style={[styles.calamityCatColFlex, styles.calamitySummaryCellBox]}>
                  <Text style={[styles.calamityTableCell, row.isCumulative && { fontWeight: '700' }, large && { fontSize: 16 }]}>{row.counts[cat.key] || '–'}</Text>
                </View>
              ))}
              <View style={[styles.calamityTotalColFlex, styles.calamityTotalBadge]}>
                <Text style={[styles.calamityTotalBadgeText, large && { fontSize: 18 }]}>{row.total}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {mode === 'chart' && (
        Platform.OS === 'web' ? (
          <View style={styles.summaryChartWrapper}>
            <Text style={styles.summaryChartTitle}>Trend Mengikut Bulan ({summary.summaryYear})</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              <TouchableOpacity
                onPress={toggleAllChartCategories}
                style={[styles.chartCatChip, { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' }]}
              >
                <Text style={[styles.chartCatChipText, { color: '#fff' }]}>
                  {selectedChartCategories.length === CALAMITY_CATEGORIES.length ? 'Kosongkan' : 'Semua'}
                </Text>
              </TouchableOpacity>
              {CALAMITY_CATEGORIES.map(cat => {
                const isSelected = selectedChartCategories.includes(cat.key);
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => toggleChartCategory(cat.key)}
                    style={[
                      styles.chartCatChip,
                      { borderColor: cat.color, backgroundColor: isSelected ? cat.color : '#fff' },
                    ]}
                  >
                    <Text style={[styles.chartCatChipText, { color: isSelected ? '#fff' : cat.color }]}>{cat.key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={summary.calamityMonthlyBreakdown} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip content={<CompactTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {CALAMITY_CATEGORIES.filter(cat => selectedChartCategories.includes(cat.key)).map(cat => (
                  <Line
                    key={cat.key}
                    type="monotone"
                    dataKey={(row) => row.counts[cat.key]}
                    name={cat.key}
                    stroke={cat.color}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </View>
        ) : (
          <Text style={styles.waypointEmptyText}>Carta trend hanya tersedia di versi web.</Text>
        )
      )}
    </ScrollView>
  );
}
